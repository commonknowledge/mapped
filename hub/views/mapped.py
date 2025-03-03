import json
from logging import getLogger

from django.conf import settings
from django.http import HttpRequest, JsonResponse
from django.views.generic import View

from hub import models
from hub.tasks import setup_webhooks
from utils.procrastinate import ProcrastinateQueuePriority

logger = getLogger(__name__)


class ExternalDataSourceWebhook(View):
    """
    Handles auto-update and auto-import. Base path not changed
    so previous webhooks were not broken.
    """

    base_path = "webhook/auto_update"

    def get(self, request: HttpRequest, *args, **kwargs):
        external_data_source_id = self.kwargs["external_data_source_id"]
        data = request.GET.dict()
        return self.handle(request, external_data_source_id, data)

    def post(self, request: HttpRequest, *args, **kwargs):
        external_data_source_id = self.kwargs["external_data_source_id"]

        data = None
        try:
            data = json.loads(request.body)
        except json.decoder.JSONDecodeError:
            data = request.POST.dict()

        if not data:
            return JsonResponse({"status": "Could not read the webhook payload"})

        return self.handle(request, external_data_source_id, data)

    def handle(self, request, external_data_source_id: str, data: dict):
        logger.info(f"Webhook received {self.kwargs} {data}")
        # Match the payload to a ExternalDataSource
        external_data_source: models.ExternalDataSource = (
            models.ExternalDataSource.objects.filter(id=external_data_source_id).first()
        )
        if not external_data_source:
            logger.info("Webhook ignored: Data source not found.")
            return JsonResponse({"status": "Data source not found."})
        if (
            not external_data_source.auto_update_enabled
            and not external_data_source.auto_import_enabled
        ):
            logger.info("Webhook ignored: Webhook is not enabled.")
            return JsonResponse({"status": "Webhook is not enabled."})
        # Get member_ids once here, instead of in the handle_ functions
        member_ids = external_data_source.get_member_ids_from_webhook(data)
        if member_ids:
            logger.info(f"Received member ids {member_ids} for {external_data_source}")
        else:
            logger.warning(
                f"Found no member ids in webhook payload for {external_data_source}: {data}"
            )
        if external_data_source.auto_update_enabled:
            external_data_source.handle_update_webhook_view(member_ids)
        if external_data_source.auto_import_enabled:
            external_data_source.handle_import_webhook_view(member_ids)
        return JsonResponse({"status": "ok"})


class ExternalDataSourceCreateWebhook(View):
    """
    Creates webhooks for an external data source. Required for Google Sheets,
    which have a two-step process for webhook creation:
    1. A webhook that fires when data is added/removed
    2. A webhook that fires when data is changed
    This second webhook has to be set up for every row.
    """

    def get(self, request: HttpRequest, *args, **kwargs):
        external_data_source_id = self.kwargs["external_data_source_id"]
        data = request.GET.dict()
        return self.handle(request, external_data_source_id, data)

    def post(self, request: HttpRequest, *args, **kwargs):
        external_data_source_id = self.kwargs["external_data_source_id"]

        data = None
        try:
            data = json.loads(request.body)
        except json.decoder.JSONDecodeError:
            data = request.POST.dict()

        if not data:
            return JsonResponse({"status": "Could not read the webhook payload"})

        return self.handle(request, external_data_source_id, data)

    def handle(self, request, external_data_source_id: str, data: dict):
        logger.info(f"Create webhook received {self.kwargs} {data}")
        # Match the payload to a ExternalDataSource
        external_data_source: models.ExternalDataSource = (
            models.ExternalDataSource.objects.filter(id=external_data_source_id).first()
        )
        if not external_data_source:
            logger.info("Webhook ignored: Data source not found.")
            return JsonResponse({"status": "Data source not found."})
        if (
            not external_data_source.auto_update_enabled
            and not external_data_source.auto_import_enabled
        ):
            logger.info("Webhook ignored: Webhook is not enabled.")
            return JsonResponse({"status": "Webhook is not enabled."})

        setup_webhooks.configure(
            priority=ProcrastinateQueuePriority.BEFORE_ANY_MORE_IMPORT_EXPORT,
            queueing_lock=f"setup_webhooks_{str(external_data_source.id)}",
            schedule_in={"seconds": settings.SCHEDULED_UPDATE_SECONDS_DELAY},
        ).defer(
            external_data_source_id=str(external_data_source.id),
            refresh=False,
        )

        return JsonResponse({"status": "ok"})


async def test_retry_strategy(request):
    from hub.tasks import test_retry_strategy

    await test_retry_strategy.defer_async()
    return JsonResponse({"status": "ok"})
