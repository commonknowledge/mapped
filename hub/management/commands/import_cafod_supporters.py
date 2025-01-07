from functools import reduce

from django.conf import settings

import pandas as pd

from hub.models import AreaData, DataSet

from .base_importers import BaseImportFromDataFrameCommand


def extend(dict1, dict2):
    merged = dict1.copy()
    merged.update(dict2)
    return merged


class Command(BaseImportFromDataFrameCommand):
    help = "Import data about CAFOD parishes, schools, and individual activists per constituency"

    # data_file = None # see below!
    cons_row = "constituency"
    message = "Importing CAFOD supporters data"
    uses_gss = False

    defaults = {
        "data_type": "integer",
        "category": "movement",
        "source_label": "Data from CAFOD.",
        "source": "https://cafod.org.uk",
        "release_date": "February 2023",
        "source_type": "google sheet",
        "table": "areadata",
        "exclude_countries": ["Northern Ireland", "Scotland"],
        "data_url": "",
        "is_filterable": True,
        "is_shadable": True,
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
    }

    data_sets = {
        "constituency_cafod_activists_count": {
            "defaults": extend(
                defaults,
                {
                    "subcategory": "supporters_and_activists",
                    "default_value": 10,
                },
            ),
            "col": "activists",
        },
        "constituency_cafod_parishes_count": {
            "defaults": extend(
                defaults,
                {
                    "subcategory": "places_and_spaces",
                    "default_value": 5,
                },
            ),
            "col": "parishes",
        },
        "constituency_cafod_schools_count": {
            "defaults": extend(
                defaults,
                {
                    "subcategory": "places_and_spaces",
                    "default_value": 5,
                },
            ),
            "col": "schools",
        },
    }

    def get_dataframe(self):
        try:
            df_activists = pd.read_csv(
                settings.BASE_DIR / "data" / "cafod_activists.csv", thousands=","
            )
            df_parishes = pd.read_csv(
                settings.BASE_DIR / "data" / "cafod_parishes.csv", thousands=","
            )
            df_schools = pd.read_csv(
                settings.BASE_DIR / "data" / "cafod_schools.csv", thousands=","
            )
        except FileNotFoundError:
            return None

        # combine the three dataframes into one, matched on the Constituency column
        df = reduce(
            lambda left, right: pd.merge(left, right, on=["Constituency"], how="outer"),
            [
                df_activists,
                df_parishes,
                df_schools,
            ],
        )

        # remove "total" rows
        df = self.filter_rows_by_values(
            df,
            "Constituency",
            [
                "Grand Total",
                "Total",
            ],
        )

        # source CSVs might not contain a row for each constituency,
        # so replace any empty values (NaN) with 0
        df = df.fillna(value=0)

        df.columns = ["constituency", "activists", "parishes", "schools"]
        df = df.astype(
            {
                "activists": int,
                "parishes": int,
                "schools": int,
            }
        )

        return df

    def get_label(self, defaults):
        return f"Number of CAFOD {defaults['col']}"

    def delete_data(self):
        AreaData.objects.filter(data_type__in=self.data_types.values()).delete()

    def filter_rows_by_values(self, df, col, values):
        return df[~df[col].isin(values)]
