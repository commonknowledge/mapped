from django.conf import settings

import pandas as pd

from hub.models import DataSet

from .base_importers import BaseConstituencyGroupListImportCommand


class Command(BaseConstituencyGroupListImportCommand):
    help = "Import Wildlife trust reserves"

    data_file = (
        settings.BASE_DIR / "data" / "wildlife_trust_regions_in_constituencies.csv"
    )
    cons_row = "PCON19NM"
    uses_gss = False
    message = "Importing constituency Wildlife Trust regions data"

    data_sets = {
        "wildlife_trusts_regions": {
            "defaults": {
                "label": "Wildlife Trust Regions",
                "description": "The Wildlife Trust Region(s) that a constituency falls under.",
                "data_type": "json",
                "category": "movement",
                "subcategory": "groups",
                "source_label": "Data from The Widlife Trusts.",
                "source": "https://www.wildlifetrusts.org/",
                "source_type": "csv",
                "table": "areadata",
                "is_filterable": True,
                "is_shadable": False,
                "comparators": DataSet.in_comparators(),
            },
            "col": "Trust",
        }
    }
    group_data_type = "wildlife_trusts_regions"

    def get_df(self):

        if not self.data_file.exists():
            return None

        return pd.read_csv(self.data_file, usecols=["Trust", "PCON19NM"]).rename(
            columns={"PCON19NM": "constituency"}
        )

    def get_group_json(self, row):
        return row[["Trust"]].dropna().rename({"Trust": "group_name"}).to_dict()

    def update_averages(self):
        pass

    def update_max_min(self):
        pass
