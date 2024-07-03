import logging
import re
from asyncio import CancelledError, sleep

from django.conf import settings
from django.db import connection
from django.db.utils import OperationalError
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.views.generic import FormView, TemplateView

import mailchimp_marketing as MailChimp
from mailchimp_marketing.api_client import ApiClientError

from hub.forms import MailingListSignupForm
from hub.mixins import TitleMixin
from hub.models import Area, DataSet

logger = logging.getLogger(__name__)


async def async_healthcheck(request: HttpRequest):
    try:
        if not request.GET.get("sleep"):
            return HttpResponse("Hello, async Django!")
        logger.info("async healthcheck start")
        await sleep(5)
        logger.info("async healthcheck done")
        return HttpResponse("Hello, sleepy async Django!")
    except CancelledError:
        logger.error("async healthcheck cancelled")
        return


class NotFoundPageView(TitleMixin, TemplateView):
    page_title = "Page not found"
    template_name = "404.html"

    def render_to_response(self, context, **response_kwargs):
        response_kwargs.setdefault("content_type", self.content_type)
        return self.response_class(
            request=self.request,
            template=self.get_template_names(),
            context=context,
            using=self.template_engine,
            status=404,
            **response_kwargs,
        )


class HomePageView(TitleMixin, TemplateView):
    page_title = ""
    template_name = "hub/home.html"


class SourcesView(TitleMixin, TemplateView):
    page_title = "Datasets and data sources"
    template_name = "hub/sources.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        categories = {
            "mp": {
                "label": "MP",
                "datasets": [],
            },
            "opinion": {
                "label": "Public opinion",
                "datasets": [],
            },
            "place": {
                "label": "Place",
                "datasets": [],
            },
            "movement": {
                "label": "Movement",
                "datasets": [],
            },
        }

        for dataset in DataSet.objects.all().order_by("label"):
            categories[dataset.category or "mp"]["datasets"].append(
                {
                    "name": dataset.name,
                    "label": dataset.label,
                    "description": dataset.description,
                    "category": dataset.category or "mp",
                    "source": dataset.source,
                    "source_label": dataset.source_label,
                    "release_date": dataset.release_date,
                    "is_public": dataset.is_public,
                }
            )

        context["categories"] = categories

        return context


class FutureConstituenciesView(TitleMixin, TemplateView):
    page_title = "Data for future constituencies"
    template_name = "hub/future-constituencies.html"


class PrivacyView(TitleMixin, TemplateView):
    page_title = "Privacy policy"
    template_name = "hub/privacy.html"


class TermsView(TitleMixin, TemplateView):
    page_title = "Terms of use"
    template_name = "hub/terms.html"


class AboutView(TitleMixin, TemplateView):
    page_title = "About"
    template_name = "hub/about.html"


class ContactView(TitleMixin, TemplateView):
    page_title = "Contact us"
    template_name = "hub/contact.html"


class MailChimpSuccessView(TitleMixin, TemplateView):
    page_title = "Contact us"
    template_name = "hub/sign_up_success.html"


class MailChimpSignupView(TitleMixin, FormView):
    form_class = MailingListSignupForm
    page_title = "Signup to our mailing list"
    template_name = "hub/sign_up.html"
    success_url = "/mailing-list-success/"

    def form_invalid(self, form):
        response = super().form_invalid(form)
        if self.request.accepts("text/html"):
            return response
        else:
            return JsonResponse({"errors": form.errors}, status=400)

    def form_valid(self, form):
        mysoc_client = MailChimp.Client()
        tcc_client = MailChimp.Client()

        mysoc_climate_signup = form.cleaned_data.get("mysoc_signup", False)
        tcc_signup = form.cleaned_data.get("tcc_signup", False)

        name = form.cleaned_data.get("full_name")
        merge_fields = None
        if name is not None:
            name = name.strip()
            name = re.sub(r"\s+", " ", name)
            parts = name.split(" ", maxsplit=1)

            if len(parts) >= 1:
                merge_fields = {"FNAME": parts[0]}
            if len(parts) == 2:
                merge_fields["LNAME"] = parts[1]

        mysoc_client.set_config(
            {
                "api_key": settings.MAILCHIMP_MYSOC_KEY,
                "server": settings.MAILCHIMP_MYSOC_SERVER_PREFIX,
            }
        )

        tcc_client.set_config(
            {
                "api_key": settings.MAILCHIMP_TCC_KEY,
                "server": settings.MAILCHIMP_TCC_SERVER_PREFIX,
            }
        )

        content = {
            "email_address": form.cleaned_data.get("email"),
            "status": "subscribed",
        }

        if merge_fields is not None:
            content["merge_fields"] = merge_fields

        mysoc_content = {**content, "tags": [settings.MAILCHIMP_MYSOC_DATA_UPDATE_TAG]}

        if mysoc_climate_signup:
            mysoc_content["interests"] = {}
            mysoc_content["interests"][settings.MAILCHIMP_MYSOC_CLIMATE_INTEREST] = True

        if tcc_signup:
            tcc_content = content

        http_status = 200
        response_data = {"data": content}

        try:
            response = mysoc_client.lists.batch_list_members(
                settings.MAILCHIMP_MYSOC_LIST_ID,
                {"members": [mysoc_content], "update_existing": True},
            )

            response_data = {"response": "ok", "data": content}

            if (
                tcc_signup
                and hasattr(settings, "MAILCHIMP_TCC_LIST_ID")
                and settings.MAILCHIMP_TCC_LIST_ID != ""
            ):
                response = tcc_client.lists.batch_list_members(
                    settings.MAILCHIMP_TCC_LIST_ID,
                    {"members": [tcc_content], "update_existing": True},
                )
                print("posting to TCC API", tcc_content)

        except ApiClientError as error:
            http_status = 500
            response_data = {
                "errors": {
                    "mailchmip": [
                        error.text,
                    ]
                }
            }

        response = super().form_valid(form)
        if self.request.accepts("text/html"):
            return response
        else:
            return JsonResponse(response_data, status=http_status)


class StyleView(TitleMixin, TemplateView):
    page_title = "Style preview"
    template_name = "hub/style.html"

    def get_context_data(self, **kwargs):  # pragma: no cover
        context = super().get_context_data(**kwargs)
        context["shades"] = [(i * 100) for i in range(1, 10)]
        context["colors"] = [
            "blue",
            "indigo",
            "purple",
            "pink",
            "red",
            "orange",
            "yellow",
            "green",
            "teal",
            "cyan",
            "gray",
        ]
        context["theme_colors"] = [
            "primary",
            "secondary",
            "success",
            "info",
            "warning",
            "danger",
            "light",
            "dark",
        ]
        context["button_styles"] = ["", "outline-"]
        context["heading_levels"] = range(1, 7)
        context["display_levels"] = range(1, 7)
        context["sizes"] = [
            "-sm",
            "",
            "-lg",
        ]

        return context


class StatusView(TemplateView):
    def render_to_response(self, context, **response_kwargs):
        try:
            with connection.cursor() as cursor:
                # will raise OperationalError if db unavailable
                cursor.execute("select 1")

            return JsonResponse(
                {
                    "database": "ok",
                    "areas": Area.objects.count(),
                    "datasets": DataSet.objects.count(),
                }
            )
        except OperationalError:
            return JsonResponse(
                {
                    "database": "error",
                },
                status=500,
            )
