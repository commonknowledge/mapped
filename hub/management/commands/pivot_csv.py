from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument(
            "--infile",
            action="store",
            help="File to process",
        )

        parser.add_argument(
            "--outfile",
            action="store",
            help="File to output to",
        )

        parser.add_argument(
            "--column",
            action="store",
            help="Column to pivot on",
        )

        parser.add_argument(
            "--value_column",
            action="store",
            help="Column with values",
        )

        parser.add_argument(
            "--index",
            action="store",
            help="Column with index",
        )

    def handle(self, *args, **kwargs):
        df = pd.read_csv(settings.BASE_DIR / "data" / kwargs["infile"])
        df = df.pivot(
            columns=kwargs["column"],
            values=kwargs["value_column"],
            index=kwargs["index"],
        )
        df.to_csv(settings.BASE_DIR / "data" / kwargs["outfile"])
