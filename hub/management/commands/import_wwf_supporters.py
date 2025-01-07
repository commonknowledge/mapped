from django.conf import settings

import pandas as pd

from hub.models import AreaData, DataSet

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import data about number of WWF supporters per constituency"

    data_file = settings.BASE_DIR / "data" / "wwf_supporters.csv"
    cons_row = "constituency"
    message = "Importing WWF supporters data"
    uses_gss = False

    defaults = {
        "data_type": "integer",
        "category": "movement",
        "subcategory": "supporters_and_activists",
        "release_date": "February 2023",
        "source_label": "Data from WWF.",
        "source": "https://www.wwf.org.uk/",
        "source_type": "google sheet",
        "table": "areadata",
        "default_value": 1000,
        "data_url": "",
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
    }

    data_sets = {
        "constituency_wwf_supporters_count": {
            "defaults": defaults,
            "col": "supporters",
        },
    }

    def get_dataframe(self):

        if self.data_file.exists() is False:
            return None

        df = pd.read_csv(
            self.data_file,
            usecols=["Constituency", "Number of Supporters"],
            thousands=",",  # CSV uses commas inside numbers over 999
        )

        # CSV has lots of junk whitespace around constituency names
        df["Constituency"] = df["Constituency"].str.strip()

        # CSV includes rows for three things that aren’t constituencies
        df = self.filter_rows_by_values(
            df,
            "Constituency",
            [
                "NULL",
                "(pseudo) Channel Islands",
                "(pseudo) Isle of Man",
            ],
        )

        df = df.dropna()
        df.columns = ["constituency", "supporters"]
        df = df.astype({"supporters": int})

        return df

    def get_label(self, defaults):
        return "Number of WWF supporters"

    def delete_data(self):
        AreaData.objects.filter(data_type__in=self.data_types.values()).delete()

    def filter_rows_by_values(self, df, col, values):
        return df[~df[col].isin(values)]
