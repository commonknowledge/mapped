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
            "--index",
            action="store",
            help="Column with index",
        )

    def handle(self, *args, **kwargs):
        df = pd.read_csv(settings.BASE_DIR / "data" / kwargs["infile"])
        new_vals = []
        for index, row in df.iterrows():
            total = 0
            for col in df.columns:
                if col == kwargs["index"]:
                    continue
                total += row[col]
            for col in df.columns:
                if col == kwargs["index"]:
                    continue
                row[col] = row[col] / total
            new_vals.append(row)

        new_df = pd.DataFrame(columns=df.columns, data=new_vals)
        new_df.to_csv(settings.BASE_DIR / "data" / kwargs["outfile"])
