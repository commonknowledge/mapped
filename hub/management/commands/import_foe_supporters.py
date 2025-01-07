from django.conf import settings

import pandas as pd

from hub.models import DataSet

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import data about number of FOE supporters per constituency"

    data_file = settings.BASE_DIR / "data" / "foe_supporters_and_activists_wmc23.csv"
    cons_row = "constituency"
    message = "Importing FOE supporters and activists data"
    uses_gss = False
    area_type = "WMC23"
    do_not_convert = True

    defaults = {
        "data_type": "integer",
        "category": "movement",
        "subcategory": "supporters_and_activists",
        "release_date": "January 2024",
        "source_label": "Data from Friends of the Earth.",
        "source": "https://friendsoftheearth.uk/",
        "source_type": "google sheet",
        "table": "areadata",
        "default_value": 10,
        "data_url": "",
        "exclude_countries": ["Northern Ireland", "Scotland"],
        "comparators": DataSet.numerical_comparators(),
        "is_filterable": True,
        "is_public": True,
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
    }

    data_sets = {
        "constituency_foe_activists_count": {
            "defaults": {
                **defaults,
                "label": "Friends of the Earth activists",
                "description": "Activists have taken at least one online action for Friends of the Earth in the last 12 months.",
            },
            "col": "activists",
        },
        "constituency_foe_supporters_count": {
            "defaults": {
                **defaults,
                "label": "Friends of the Earth financial supporters",
                "description": "Financial supporters have donated to Friends of the Earth in the last 12 months.",
            },
            "col": "supporters",
        },
    }

    def get_dataframe(self):

        if self.data_file.exists() is False:
            return None

        df = pd.read_csv(self.data_file, thousands=",")
        df = df.dropna(axis="columns", how="all")
        df = df.dropna(axis="rows", how="any")
        df.columns = ["constituency", "supporters", "activists"]
        df.constituency = df.constituency.str.replace("Ynys Mon", "Ynys Môn")
        df.constituency = df.constituency.str.replace(
            "Montgomeryshire and Glyndwr", "Montgomeryshire and Glyndŵr"
        )
        df = df.astype({"supporters": int, "activists": int})

        return df
