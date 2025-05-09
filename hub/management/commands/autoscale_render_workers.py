import logging
import math
from enum import Enum

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connection

from utils.render import get_render_client

logger = logging.getLogger(__name__)


# Enum for strategies
class ScalingStrategy(Enum):
    row_count = "row_count"
    simple_data_source_count = "simple_data_source_count"
    sources_and_row_count = "sources_and_row_count"


class Command(BaseCommand):
    help = "Manage Render workers"

    # Allow selecting a strategy
    def add_arguments(self, parser):
        parser.add_argument(
            "--strategy",
            type=lambda x: ScalingStrategy(x),  # Convert string to enum
            choices=list(ScalingStrategy),  # Pass enum values directly
            default=ScalingStrategy(settings.RENDER_WORKER_SCALING_STRATEGY),
        )

        parser.add_argument(
            "--min-worker-count", type=int, default=settings.RENDER_MIN_WORKER_COUNT
        )

        parser.add_argument(
            "--max-worker-count", type=int, default=settings.RENDER_MAX_WORKER_COUNT
        )

        parser.add_argument(
            "--row-count-per-worker", type=int, default=settings.ROW_COUNT_PER_WORKER
        )

    def handle(self, *args, **options):
        requested_worker_count = self.autoscale_render_workers(
            strategy=options["strategy"],
            min_worker_count=options["min_worker_count"],
            max_worker_count=options["max_worker_count"],
            row_count_per_worker=options["row_count_per_worker"],
        )
        self.render_worker_count_monitoring(requested_worker_count)
        self.procrastinate_job_monitoring()

    def autoscale_render_workers(
        self,
        strategy: ScalingStrategy,
        min_worker_count: int,
        max_worker_count: int,
        row_count_per_worker: int,
    ):
        if not settings.ROW_COUNT_PER_WORKER:
            raise ValueError("settings.ROW_COUNT_PER_WORKER is required")

        requested_worker_count = 0

        # Find out how many rows of data need importing, updating, so on, so forth
        if strategy == ScalingStrategy.row_count:
            requested_worker_count = self.row_count_strategy(
                min_worker_count=min_worker_count,
                max_worker_count=max_worker_count,
                row_count_per_worker=row_count_per_worker,
            )
        elif strategy == ScalingStrategy.simple_data_source_count:
            requested_worker_count = self.simple_data_source_count_strategy(
                min_worker_count=min_worker_count,
                max_worker_count=max_worker_count,
            )
        elif strategy == ScalingStrategy.sources_and_row_count:
            requested_worker_count = self.sources_and_row_count_strategy(
                min_worker_count=min_worker_count,
                max_worker_count=max_worker_count,
                row_count_per_worker=row_count_per_worker,
            )
        else:
            raise ValueError(f"Unknown strategy: {strategy}")

        logger.info(f"Requested worker count: {requested_worker_count}.")

        if not settings.RENDER_API_TOKEN:
            raise ValueError("settings.RENDER_API_TOKEN is required")
        if not settings.RENDER_WORKER_SERVICE_ID:
            raise ValueError("settings.RENDER_WORKER_SERVICE_ID is required")

        # Tell render
        render = get_render_client()
        res = render.post(
            f"/v1/services/{settings.RENDER_WORKER_SERVICE_ID}/scale",
            json={"numInstances": requested_worker_count},
        )

        logger.info(
            f"Render response: {res.status_code}, {render_response_dict[res.status_code]}"
        )

        return requested_worker_count

    def row_count_strategy(
        self, min_worker_count, max_worker_count, row_count_per_worker
    ):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                    SELECT
                        multi + single as count_of_rows_to_process
                    FROM (
                        SELECT sum(jsonb_array_length(job.args->'members')) as multi, count(job.args->>'member') as single
                        FROM procrastinate_jobs job
                        WHERE status in ('doing', 'todo')
                    ) as subquery
                """
            )
            count_of_rows_to_process = cursor.fetchone()[0] or 0
            if count_of_rows_to_process == 0 or count_of_rows_to_process is None:
                count_of_rows_to_process = 1

            # Decide how many workers we need based on the number of rows of data
            requested_worker_count = min(
                max_worker_count,
                max(
                    min_worker_count,
                    math.ceil(count_of_rows_to_process / row_count_per_worker),
                ),
            )

            return requested_worker_count

    # New strategy: count of sources in jobs
    # 1 worker per source
    def simple_data_source_count_strategy(self, min_worker_count, max_worker_count):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                    SELECT count(distinct job.args->>'external_data_source_id') as count_of_data_sources_with_jobs
                    FROM procrastinate_jobs job
                    WHERE status in ('doing', 'todo')
                """
            )
            count_of_data_sources_with_jobs = cursor.fetchone()[0] or 0

            requested_worker_count = min(
                max_worker_count, max(min_worker_count, count_of_data_sources_with_jobs)
            )

            logger.info(
                f"Strategy: Consistent global throughput.\n- Sources to process: {count_of_data_sources_with_jobs}."
            )

            return requested_worker_count

    def sources_and_row_count_strategy(
        self, min_worker_count, max_worker_count, row_count_per_worker
    ):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                    SELECT count(distinct job.args->>'external_data_source_id') as count_of_data_sources_with_jobs, sum(jsonb_array_length(job.args->'members')) as count_of_rows_to_process
                    FROM procrastinate_jobs job
                    WHERE status in ('doing', 'todo')
                """
            )
            count_of_data_sources_with_jobs, count_of_rows_to_process = (
                cursor.fetchone()
            )
            if count_of_rows_to_process == 0 or count_of_rows_to_process is None:
                count_of_rows_to_process = 1
            if (
                count_of_data_sources_with_jobs == 0
                or count_of_data_sources_with_jobs is None
            ):
                count_of_data_sources_with_jobs = 1

            # At the least, we need one worker per source
            # But we also want to make sure we have enough workers to process the rows
            # So we take the max of the two
            requested_worker_count = min(
                max_worker_count,
                max(
                    min_worker_count,
                    count_of_data_sources_with_jobs,
                    math.ceil(count_of_rows_to_process / row_count_per_worker),
                ),
            )

            logger.info(
                f"Strategy: Consistent global throughput + 1 source per worker.\n- Sources to process: {count_of_data_sources_with_jobs}."
            )

            return requested_worker_count

    def render_worker_count_monitoring(self, requested_worker_count: int = None):
        # report new instance count to posthog
        try:
            if settings.POSTHOG_API_KEY:
                logger.info("Reporting to posthog")

                import posthog

                render = get_render_client()
                count_res = render.get(
                    "/v1/metrics/instance-count",
                    params={"resource": settings.RENDER_WORKER_SERVICE_ID},
                )

                count_res_json = count_res.json()
                logger.info(f"Instance count response: {count_res_json}")
                actual_worker_count = count_res_json[0]["values"][-1]["value"]

                event_properties = {
                    "requested_worker_count": requested_worker_count,
                    "actual_worker_count": actual_worker_count,
                }

                posthog.identify("commonknowledge-server-worker")
                res = posthog.capture(
                    "commonknowledge-server-worker",
                    event="render_worker_count_changed",
                    properties=event_properties,
                )
                logger.info(f"Posthog response: {res}")
                logger.info(f"Reported to posthog: {event_properties}")
            else:
                logger.info("No POSTHOG_API_KEY, skipping reporting to posthog")
        except Exception as e:
            logger.error(f"Error reporting to posthog: {e}")

    def procrastinate_job_monitoring(self):
        try:
            if settings.POSTHOG_API_KEY:
                import posthog

                query = """
                    SELECT
                        count(job.id) as total_job_backlog,
                        count(distinct job.args->>'external_data_source_id') as total_external_data_source_backlog,
                        (
                          count(distinct job.args->>'member') +
                          COALESCE(sum(jsonb_array_length(job.args->'members')), 0)
                        ) as total_record_backlog
                    FROM procrastinate_jobs job
                    WHERE status in ('doing', 'todo')
                """

                with connection.cursor() as cursor:
                    cursor.execute(query)
                    (
                        total_job_backlog,
                        total_external_data_source_backlog,
                        total_record_backlog,
                    ) = cursor.fetchone()

                    posthog.identify("commonknowledge-server-worker")
                    posthog.capture(
                        "commonknowledge-server-worker",
                        event="procrastinate_job_monitoring",
                        properties={
                            "total_job_backlog": total_job_backlog,
                            "total_external_data_source_backlog": total_external_data_source_backlog,
                            "total_record_backlog": total_record_backlog,
                        },
                    )
        except Exception as e:
            logger.error(f"Error reporting to posthog: {e}")


render_response_dict = {
    202: "Service scaled successfully",
    400: "The request could not be understood by the server.",
    401: "Authorization information is missing or invalid.",
    403: "You do not have permissions for the requested resource.",
    404: "Unable to find the requested resource.",
    406: "Unable to generate preferred media types as specified by Accept request header.",
    410: "The requested resource is no longer available.",
    429: "Rate limit has been surpassed.",
    500: "An unexpected server error has occurred.",
    503: "Server currently unavailable.",
}
