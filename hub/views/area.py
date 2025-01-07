from collections import defaultdict

from django.conf import settings
from django.db.models import Count, Q
from django.http import Http404, HttpResponsePermanentRedirect, JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.utils.text import slugify
from django.views.generic import DetailView, TemplateView, View

from hub.mixins import TitleMixin
from hub.models import (
    Area,
    AreaData,
    AreaType,
    DataSet,
    DataType,
    Person,
    PersonData,
    UserDataSets,
)
from utils import is_valid_postcode
from utils.mapit import (
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException,
    MapIt,
    NotFoundException,
)

RUC_COLOURS = {
    "Rural": "green-400",
    "Urban": "gray-400",
    "Sparse and rural": "green-200",
    "Urban with rural areas": "gray-300",
}


class BaseAreaView(TitleMixin, DetailView):
    model = Area
    context_object_name = "area"

    def get_object(self):
        area_type_code = self.kwargs.get("area_type", "")
        bad_case = False

        if area_type_code not in AreaType.VALID_AREA_TYPES:
            area_type_code = area_type_code.upper()
            if area_type_code in AreaType.VALID_AREA_TYPES:
                bad_case = True

        try:
            area = Area.objects.get(
                area_type__code=area_type_code,
                name=self.kwargs.get("name"),
            )
        except Area.DoesNotExist:
            try:
                area = Area.objects.get(
                    area_type__code=area_type_code,
                    name__iexact=self.kwargs.get("name"),
                )
                bad_case = True
            except Area.DoesNotExist:
                raise Http404("Area not found")

        if bad_case:
            return redirect(area, permanent=True)

        return area

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        if isinstance(self.object, HttpResponsePermanentRedirect):
            return self.object

        context = self.get_context_data(object=self.object)
        return self.render_to_response(context)

    def get_page_title(self):
        return self.object.name

    def get_user_favourite_datasets(self):
        if self.request.user.is_anonymous:
            return {}

        favs = (
            UserDataSets.objects.filter(
                user=self.request.user,
            )
            .annotate(is_favourite=Count("id"))
            .values("data_set_id", "is_favourite")
        )

        fav_map = {}
        for fav in favs:
            fav_map[fav["data_set_id"]] = fav["is_favourite"]

        return fav_map

    def get_auto_convered_datasets(self):
        auto_converted = {}

        for ds in DataType.objects.filter(area_type=self.object.area_type):
            auto_converted[ds.data_set_id] = ds.auto_conversion_disclaimer

        return auto_converted

    def process_dataset(self, data_set, favs, auto_converted):
        base_qs = AreaData.objects.filter(
            area=self.object,
            data_type__data_set=data_set,
            data_type__area_type=self.object.area_type,
        )
        data = {
            "name": str(data_set),
            "db_name": data_set.name,
            "label": data_set.label,
            "description": data_set.description,
            "source_name": data_set.source_name,
            "subcategory": data_set.subcategory,
            "source_url": data_set.source_url,
            "category": data_set.category,
            "pk": data_set.pk,
            "data_type": data_set.data_type,
            "featured": data_set.featured,
            "excluded_countries": data_set.exclude_countries,
            "release_date": data_set.release_date,
            "auto_conversion_disclaimer": auto_converted.get(data_set.id, None),
            "is_favourite": favs.get(data_set.id, False),
            "is_public": data_set.is_public,
        }
        if data_set.is_range:
            data["is_range"] = True
            data_range = base_qs.select_related("data_type").order_by(
                "data_type__order", "data_type__name"
            )

            d = data_range.all()
            if len(d) == 0:
                d = None

            data["data"] = d
        elif data_set.category == "opinion":
            data_range = base_qs.select_related("data_type").order_by(
                "data_type__order", "data_type__label"
            )

            data["data"] = data_range.all()
        else:
            area_data = base_qs.select_related("data_type")
            if area_data:
                data["data"] = area_data[0]

        return data


class AreaView(BaseAreaView):
    model = Area
    template_name = "hub/area.html"
    context_object_name = "area"

    def get_overlap_info(self, **kwargs):
        if self.object.area_type.code == "WMC":
            overlaps = self.object.old_overlaps.all()
        elif self.object.area_type.code == "WMC23":
            overlaps = self.object.new_overlaps.all()
        else:
            return None

        overlap_constituencies = [
            {
                "new_area": overlap.area_new,
                "old_area": overlap.area_old,
                "pop_overlap": overlap.population_overlap,
                "area_overlap": overlap.area_overlap,
            }
            for overlap in overlaps
        ]
        if (
            len(overlap_constituencies) == 1
            and overlap_constituencies[0]["new_area"].gss
            == overlap_constituencies[0]["old_area"].gss
        ):
            overlap_constituencies[0]["unchanged"] = True
        return overlap_constituencies

    def get_area_country(self, indexed_categories):
        country = None
        if indexed_categories.get("country", None) is not None:
            try:
                country = indexed_categories["country"]["data"].value()
            except (ValueError, KeyError):
                country = None
        elif indexed_categories.get("council_country", None) is not None:
            try:
                country = indexed_categories["council_country"]["data"].value()
            except (ValueError, KeyError):
                country = None

        return country

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        is_non_member = self.request.user.is_anonymous

        context["overlap_constituencies"] = self.get_overlap_info()
        if (
            context["overlap_constituencies"] is not None
            and len(context["overlap_constituencies"]) == 1
        ):
            if context["overlap_constituencies"][0].get("unchanged", False):
                context["overlap_unchanged"] = True
        area_type = self.object.area_type
        context["area_type"] = area_type.code
        context["is_westminster_cons"] = True
        if area_type.area_type != "Westminster Constituency":
            context["is_westminster_cons"] = False

        context["slug"] = slugify(self.object.name)

        if context["area_type"] == "WMC23":
            context["PPCs"] = Person.objects.filter(
                areas=self.object, person_type="PPC"
            )
        try:
            context["mp"] = {
                "person": Person.objects.get(
                    areas=self.object,
                    personarea__person_type="MP",
                    personarea__end_date__isnull=True,
                )
            }

            context["no_mp"] = False
            data = PersonData.objects.filter(
                data_type__data_set__visible=True, person=context["mp"]["person"]
            ).select_related("data_type")

            area_type_q = Q(data_type__area_type=area_type) | Q(
                data_type__area_type__isnull=True
            )

            data = data.filter(area_type_q)
            if is_non_member:
                data = data.exclude(data_type__data_set__is_public=False)
            for item in data.all():
                if (
                    item.data_type.name == "select_committee_membership"
                    and "select_committee_memberships" not in context["mp"]
                ):
                    context["mp"]["select_committee_memberships"] = [
                        datum["data"]
                        for datum in PersonData.objects.filter(
                            person=context["mp"]["person"]
                        )
                        .filter(data_type__name="select_committee_membership")
                        .values()
                    ]
                else:
                    context["mp"][item.data_type.name] = item.value()
            context["mp"]["appg_memberships"] = [
                item.value()
                for item in data.filter(data_type__name="mp_appg_memberships")
            ]

            bill_map = {
                "1372": "2022-10-19b.799.3",
                "1116": "2021-10-20c.869.2",
            }

            votes = data.filter(data_type__data_set__subcategory="vote")
            if is_non_member:
                votes = votes.exclude(data_type__data_set__is_public=False)
            context["mp"]["votes"] = [
                {
                    "name": item.data_type.data_set.label,
                    "vote": item.value(),
                    "url": f"https://www.theyworkforyou.com/debates/?id={bill_map[item.data_type.name.split('_')[0]]}",
                }
                for item in votes
            ]

            support = data.filter(data_type__data_set__subcategory="supporter")
            if is_non_member:
                support = support.exclude(data_type__data_set__is_public=False)
            context["mp"]["support"] = [
                {
                    "name": item.data_type.data_set.label,
                    "position": item.value(),
                    "url": f"https://edm.parliament.uk/early-day-motion/{item.data_type.name.split('_')[0]}",
                }
                for item in support
            ]
            wrans = data.filter(data_type__name="mp_wrans")
            if wrans.count() > 0:
                context["mp"]["wrans"] = wrans.first().value()

        except Person.DoesNotExist:
            context["no_mp"] = True
            context["mp"] = {
                "person": Person.objects.filter(
                    areas=self.object,
                    personarea__person_type="MP",
                    personarea__end_date__isnull=False,
                )
                .order_by("-end_date")
                .first()
            }
            data = PersonData.objects.filter(
                person=context["mp"]["person"],
                data_type__name__in=[
                    "party",
                    "last_election",
                    "second_party",
                    "mp_last_elected",
                    "mp_first_elected",
                    "mp_election_majority",
                    "parlid",
                    "twfyid",
                    "wikipedia",
                ],
            ).select_related("data_type")

            if is_non_member:
                data = data.exclude(data_type__data_set__is_public=False)
            for item in data.all():
                context["mp"][item.data_type.name] = item.value()

        categories = defaultdict(list)
        indexed_categories = defaultdict(dict)
        favs = self.get_user_favourite_datasets()
        auto_converted = self.get_auto_convered_datasets()
        data_sets = DataSet.objects.order_by("order", "label").filter(
            areas_available=self.object.area_type, visible=True
        )

        if is_non_member:
            data_sets = data_sets.exclude(is_public=False)

        for data_set in data_sets:
            data = self.process_dataset(data_set, favs, auto_converted)

            if data.get("data", None) is not None and data["data"]:
                if data_set.category is not None:
                    if not isinstance(data["data"], AreaData):
                        if len(data["data"]) == 1:
                            data["data"] = data["data"][0]
                    categories[data_set.category].append(data)
                else:
                    categories["place"].append(data)

                indexed_categories[data["db_name"]] = data

        context["related_categories"] = {
            "constituency_christian_aid_group_count": "constituency_christian_aid_groups",
            "constituency_foe_groups_count": "constituency_foe_groups",
            "constituency_nt_properties_count": "constituency_nt_properties",
            "constituency_wi_group_count": "constituency_wi_groups",
            "constituency_foe_group_count": "constituency_foe_groups",
            "power_postcodes_count": "power_postcodes",
            "tcc_open_letter_signatories_count": "tcc_open_letter_signatories",
            "wildlife_trusts_reserves_count": "wildlife_trusts_reserves",
            "rspb_reserves_count": "rspb_reserves",
            "council_net_zero_date": "council_net_zero_details",
            "council_action_scorecard_total": "council_action_scorecard_sections",
        }

        context["is_related_category"] = context["related_categories"].values()

        categories_to_remove = defaultdict(list)

        area_country = self.get_area_country(indexed_categories)

        for category, items in categories.items():
            for data_set in items:
                if (
                    context["related_categories"].get(data_set["db_name"], None)
                    is not None
                ):
                    data_item = indexed_categories[
                        context["related_categories"][data_set["db_name"]]
                    ]
                    if len(data_item) > 0:
                        data_set["related_category"] = data_item
                        categories_to_remove[data_set["category"]].append(data_item)

                if (
                    area_country is not None
                    and area_country in data_set["excluded_countries"]
                ):
                    categories_to_remove[category].append(data_set)

        for category_name, items in categories_to_remove.items():
            for item in items:
                if item in categories[category_name]:
                    categories[category_name].remove(item)

        context["categories"] = categories
        context["indexed_categories"] = indexed_categories
        context["user_is_member"] = not is_non_member

        return context


class AreaSearchView(TemplateView):
    template_name = "hub/area_search.html"

    def render_to_response(self, context):
        areas = context.get("areas")
        if areas and len(areas) == 1:
            return redirect(areas[0])

        return super().render_to_response(context)

    def get_areas_from_mapit(self, **kwargs):
        areas = None
        err = None

        try:
            mapit = MapIt()
            if kwargs.get("lon") and kwargs.get("lat"):
                gss_codes = mapit.wgs84_point_to_gss_codes(kwargs["lon"], kwargs["lat"])
            elif kwargs.get("pc"):
                gss_codes = mapit.postcode_point_to_gss_codes(kwargs["pc"])

            areas = Area.objects.filter(
                gss__in=gss_codes, area_type__code__in=settings.AREA_SEARCH_AREA_CODES
            )
            areas = list(areas)
        except (
            NotFoundException,
            BadRequestException,
            InternalServerErrorException,
            ForbiddenException,
        ) as error:
            err = error

        return (areas, err)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        search = self.request.GET.get("search")
        lon = self.request.GET.get("lon")
        lat = self.request.GET.get("lat")

        if search is None and lat is None and lon is None:
            return context

        if search is not None:
            search = search.strip()

        context["search"] = search

        if lon and lat:
            areas, error = self.get_areas_from_mapit(lon=lon, lat=lat)
            context["areas"] = areas
            context["error"] = error
        elif is_valid_postcode(search):
            areas, error = self.get_areas_from_mapit(pc=search)
            context["areas"] = areas
            context["error"] = error
        elif search == "":
            context["error"] = (
                "Please enter a postcode, or the name of a constituency, MP, or local authority"
            )
        else:
            areas_raw = Area.objects.filter(
                name__icontains=search,
                area_type__code__in=settings.AREA_SEARCH_AREA_CODES,
            )
            people_raw = Person.objects.filter(name__icontains=search)

            context["areas"] = list(areas_raw)
            for person in people_raw:
                # XXX
                context["areas"].extend(
                    [a for a in person.areas.filter(personarea__person_type="MP")]
                )

            if len(context["areas"]) == 0:
                context["error"] = (
                    f"Sorry, we can’t find any matches for “{search}”. Try a nearby town or city?"
                )

        if context.get("error") is not None:
            return context

        if context["areas"] is not None and len(context["areas"]):
            # Add MPs and PPCs to areas
            for area in context["areas"]:
                try:
                    area.mp = Person.objects.get(
                        areas=area,
                        end_date__isnull=True,
                        personarea__person_type="MP",
                        personarea__end_date__isnull=True,
                    )
                except Person.DoesNotExist:
                    pass

                try:
                    area.ppcs = Person.objects.filter(
                        areas=area, end_date__isnull=True, person_type="PPC"
                    )
                except Person.DoesNotExist:
                    pass

            # Sort then split by area_type
            context["areas"].sort(key=lambda area: area.name)
            context["areas_by_type"] = [
                {
                    "type": "WMC23",
                    "areas": [],
                },
                {
                    "type": "LA",
                    "areas": [],
                },
            ]
            for area in context["areas"]:
                if area.area_type.code == "WMC23":
                    context["areas_by_type"][0]["areas"].append(area)
                elif area.area_type.code != "WMC":
                    context["areas_by_type"][1]["areas"].append(area)

        return context


class FavouriteDataSetView(View):
    def post(self, request, data_set):
        ds = get_object_or_404(DataSet, pk=data_set)
        user = request.user

        fav, created = UserDataSets.objects.get_or_create(data_set=ds, user=user)

        if self.request.accepts("text/html"):
            return redirect(self.request.META["HTTP_REFERER"])
        else:
            data = {
                "pk": fav.pk,
            }
            return JsonResponse(data)


class UnFavouriteDataSetView(View):
    def post(self, request, data_set):
        fav = get_object_or_404(UserDataSets, data_set=data_set, user=request.user)
        fav.delete()

        if self.request.accepts("text/html"):
            return redirect(self.request.META["HTTP_REFERER"])
        else:
            data = {
                "deleted": True,
            }
            return JsonResponse(data)
