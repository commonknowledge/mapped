from datetime import datetime
from math import ceil

from django.core.management.base import BaseCommand

import pytz
from asgiref.sync import async_to_sync

from hub.models import ExternalDataSource, GenericData
from utils.statistics import merge_column_types, parse_and_type_json

BATCH_SIZE = 10000
DB_BATCH_SIZE = 100


class Command(BaseCommand):
    help = """
    Process already-imported ExternalDataSources, populating processed_json on the GenericData and
    updating the source field definitions.
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "-i",
            "--id",
            help="""
            The ID of a specific ExternalDataSource to process.
            """,
        )

    def handle(self, id, *args, **options):
        sources = ExternalDataSource.objects.order_by("created_at")
        if id:
            sources = sources.filter(id=id)

        source_count = len(sources)
        for i, source in enumerate(sources):
            print(
                f"Processing source {i + 1} of {source_count}: {source} ({source.id})"
            )
            source: ExternalDataSource
            qs: list[GenericData] = source.get_import_data().order_by("id")
            source_column_types = {}

            data_count = qs.count()

            print(f"--> Processing {data_count} data points...")

            batches = ceil(data_count / BATCH_SIZE)
            offset = 0
            for batch in range(0, batches):
                data = qs[offset : offset + BATCH_SIZE]
                for d in data:
                    parsed_json, column_types = parse_and_type_json(d.json)
                    merge_column_types(source_column_types, column_types)
                    d.parsed_json = parsed_json
                offset = offset + BATCH_SIZE

                print(f"--> Saving processed data batch {batch + 1} of {batches}...")

                GenericData.objects.bulk_update(
                    data, fields=["parsed_json"], batch_size=DB_BATCH_SIZE
                )

            async_to_sync(source.update_field_definition_types)(source_column_types)
            source.last_import = datetime.now(tz=pytz.UTC)
            source.save()

            print("--> Done\n")
