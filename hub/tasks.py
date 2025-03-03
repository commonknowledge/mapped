from __future__ import annotations

import datetime
import functools
import logging
import os

from django.conf import settings
from django.db.models import Count, Q
from procrastinate.contrib.django import app as procrastinate
from procrastinate.contrib.django.models import ProcrastinateJob
from sentry_sdk import metrics

logger = logging.getLogger(__name__)


def telemetry_task(func):
    return func
    task_name = func.__name__
    user_cpu_time_metric = f"task.{task_name}.user_cpu_time"
    system_cpu_time_metric = f"task.{task_name}.system_cpu_time"
    elapsed_time_metric = f"task.{task_name}.elapsed_time"
    percentage_failed_metric = f"task.{task_name}.percentage_failed"

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        # Get times before task execution
        start_time = datetime.datetime.now(datetime.timezone.utc)
        cpu_start = os.times()

        try:
            result = await func(*args, **kwargs)

            # Get CPU time after task execution
            end_time = datetime.datetime.now(datetime.timezone.utc)
            cpu_end = os.times()

            # Calculate the CPU time used during the task
            user_cpu_time_used = cpu_end.user - cpu_start.user
            system_cpu_time_used = cpu_end.system - cpu_start.system
            elapsed_time = end_time - start_time

            metrics.distribution(key=user_cpu_time_metric, value=user_cpu_time_used)
            metrics.distribution(key=system_cpu_time_metric, value=system_cpu_time_used)
            metrics.distribution(
                key=elapsed_time_metric,
                value=elapsed_time.total_seconds(),
                unit="seconds",
            )

            return result
        finally:
            counts = await ProcrastinateJob.objects.aaggregate(
                total=Count("id"), failed=Count("id", filter=Q(status="failed"))
            )
            percentage_failed = (
                counts["failed"] * 100 / counts["total"] if counts["total"] else 0
            )
            metrics.gauge(
                key=percentage_failed_metric, value=round(percentage_failed, 2)
            )

    return wrapper


@procrastinate.task(queue="external_data_sources")
@telemetry_task
async def refresh_one(external_data_source_id: str, member):
    from hub.models import ExternalDataSource

    await ExternalDataSource.deferred_refresh_one(
        external_data_source_id=external_data_source_id, member=member
    )


@procrastinate.task(
    queue="external_data_sources", retry=settings.IMPORT_UPDATE_MANY_RETRY_COUNT
)
@telemetry_task
async def refresh_many(
    external_data_source_id: str, members: list, request_id: str = None
):
    from hub.models import ExternalDataSource

    await ExternalDataSource.deferred_refresh_many(
        external_data_source_id=external_data_source_id,
        members=members,
        request_id=request_id,
    )


@procrastinate.task(
    queue="external_data_sources", retry=settings.IMPORT_UPDATE_MANY_RETRY_COUNT
)
@telemetry_task
async def refresh_pages(
    external_data_source_id: str, current_page: int, request_id: str = None
):
    from hub.models import ExternalDataSource

    error = None
    try:
        has_more_data = await ExternalDataSource.deferred_refresh_page(
            external_data_source_id=external_data_source_id,
            page=current_page,
            request_id=request_id,
        )
    except Exception as e:
        logger.error(f"refresh_pages failed: {e}")
        error = e
        has_more_data = False

    # Create task to refresh next page
    if has_more_data:
        return await ExternalDataSource.schedule_refresh_pages(
            external_data_source_id=external_data_source_id,
            current_page=current_page + 1,
            request_id=request_id,
        )

    # Always queue signal_request_complete job, to mark this batch of jobs as terminated
    enqueue_result = await signal_request_complete.configure(
        # Dedupe `refresh_pages` jobs for the same config
        # https://procrastinate.readthedocs.io/en/stable/howto/queueing_locks.html
        queueing_lock=f"request_complete_{request_id}"
    ).defer_async(
        request_id=request_id,
        success=not error,
        external_data_source_id=external_data_source_id,
    )

    # If an error happened, raise it, to mark this job as failed
    if error:
        raise error

    return enqueue_result


@procrastinate.task(queue="external_data_sources")
@telemetry_task
async def refresh_all(external_data_source_id: str, request_id: str = None):
    from hub.models import ExternalDataSource

    source = await ExternalDataSource.objects.aget(id=external_data_source_id)
    SourceClass = source.get_real_instance_class()

    await SourceClass.deferred_refresh_all(
        external_data_source_id=external_data_source_id, request_id=request_id
    )


# Refresh webhooks once a day
@procrastinate.periodic(cron="0 3 * * *")
@procrastinate.task(queue="external_data_sources")
async def refresh_webhooks(external_data_source_id: str, timestamp=None):
    from hub.models import ExternalDataSource

    source = await ExternalDataSource.objects.aget(id=external_data_source_id)
    SourceClass = source.get_real_instance_class()

    await SourceClass.deferred_refresh_webhooks(
        external_data_source_id=external_data_source_id
    )


@procrastinate.task(queue="external_data_sources")
async def setup_webhooks(external_data_source_id: str, refresh: bool = True):
    from hub.models import ExternalDataSource

    logger.info("Setting up webhooks")

    source = await ExternalDataSource.objects.aget(id=external_data_source_id)
    SourceClass = source.get_real_instance_class()

    await SourceClass.deferred_setup_webhooks(
        external_data_source_id=external_data_source_id, refresh=refresh
    )


@procrastinate.task(
    queue="external_data_sources", retry=settings.IMPORT_UPDATE_MANY_RETRY_COUNT
)
@telemetry_task
async def import_many(
    external_data_source_id: str, members: list, request_id: str = None
):
    from hub.models import ExternalDataSource

    await ExternalDataSource.deferred_import_many(
        external_data_source_id=external_data_source_id,
        members=members,
        request_id=request_id,
    )


@procrastinate.task(
    queue="external_data_sources", retry=settings.IMPORT_UPDATE_MANY_RETRY_COUNT
)
@telemetry_task
async def import_pages(
    external_data_source_id: str, current_page=1, request_id: str = None
):
    from hub.models import ExternalDataSource

    error = None
    try:
        has_more_data = await ExternalDataSource.deferred_import_page(
            external_data_source_id=external_data_source_id,
            page=current_page,
            request_id=request_id,
        )
    except Exception as e:
        logger.error(f"refresh_pages failed: {e}")
        error = e
        has_more_data = False

    # Create task to import next page
    if has_more_data:
        return await ExternalDataSource.schedule_import_pages(
            external_data_source_id=external_data_source_id,
            current_page=current_page + 1,
            request_id=request_id,
        )

    # mark batch of jobs as completed
    enqueue_result = await signal_request_complete.configure(
        # Dedupe `refresh_pages` jobs for the same config
        # https://procrastinate.readthedocs.io/en/stable/howto/queueing_locks.html
        queueing_lock=f"request_complete_{request_id}"
    ).defer_async(
        request_id=request_id,
        success=not error,
        external_data_source_id=external_data_source_id,
    )

    # raise any error to mark this job as failed
    if error:
        raise error

    return enqueue_result


@procrastinate.task(queue="external_data_sources")
@telemetry_task
async def import_all(
    external_data_source_id: str, requested_at: str = None, request_id: str = None
):
    # Todo: track task waiting duration with requested_at ISO date
    from hub.models import ExternalDataSource

    source = await ExternalDataSource.objects.aget(id=external_data_source_id)
    SourceClass = source.get_real_instance_class()

    await SourceClass.deferred_import_all(
        external_data_source_id=external_data_source_id, request_id=request_id
    )


@procrastinate.task(queue="external_data_sources")
async def signal_request_complete(request_id: str, success: bool, *args, **kwargs):
    """
    Empty task which is used to query the status of the batch tasks.
    """
    pass


@procrastinate.periodic(cron="*/10 * * * *")
@procrastinate.task(queueing_lock="retry_stalled_jobs", pass_context=True)
async def retry_stalled_jobs(context, timestamp):
    stalled_jobs = await procrastinate.job_manager.get_stalled_jobs(
        nb_seconds=settings.RUNNING_JOBS_MAX_SECONDS
    )
    for job in stalled_jobs:
        await procrastinate.job_manager.retry_job(job)


# cron that sends batch job emails every hour
# @procrastinate.periodic(cron="0 * * * *")
# @procrastinate.task(queue="emails")
# def send_batch_job_emails(timestamp=None):
#     from django.core.mail import EmailMessage
#     from hub.models import BatchRequest

#     batch_requests = BatchRequest.objects.filter(
#         Q(send_email=True, sent_email=False) & ~Q(user=None)
#     )
#     for batch_request in batch_requests:
#         status = batch_request.status
#         user = batch_request.user
#         if status == "succeeded":
#             user_email = user.email
#             email_subject = "Mapped Job Progress Notification"
#             email_body = "Your job has been successfully completed."
#             try:
#                 email = EmailMessage(
#                     subject=email_subject,
#                     body=email_body,
#                     from_email="noreply@example.com",
#                     to=[user_email],
#                 )
#                 email.send()

#             except Exception as e:
#                 logger.error(f"Failed to send email: {e}")

#         elif status == "failed":
#             user_email = user.email
#             email_subject = "Mapped Job Progress Notification"
#             email_body = "Your job has failed. Please check the details."
#             try:
#                 email = EmailMessage(
#                     subject=email_subject,
#                     body=email_body,
#                     from_email="noreply@example.com",
#                     to=[user_email],
#                 )
#                 email.send()

#             except Exception as e:
#                 logger.error(f"Failed to send email to {user_email}: {e}")

#         batch_request.sent_email = True
#         batch_request.save()
