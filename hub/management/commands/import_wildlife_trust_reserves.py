from datetime import date

from django.conf import settings

import pandas as pd

from hub.models import DataSet

from .base_importers import (
    BaseConstituencyGroupListImportCommand,
    MultipleAreaTypesMixin,
)


class Command(MultipleAreaTypesMixin, BaseConstituencyGroupListImportCommand):
    help = "Import data about wildlife trust reserves in each constituency"
    message = "Importing wildlife trusts reserves data"

    data_file = settings.BASE_DIR / "data" / "wildlife_trust_reserves.csv"
    defaults = {
        "label": "Wildlife Trusts Reserves",
        "data_type": "json",
        "category": "movement",
        "subcategory": "groups",
        "release_date": str(date.today()),
        "source_label": "Data from the Wildlife Trusts.",
        "source": "https://www.wildlifetrusts.org/",
        "source_type": "api",
        "data_url": "https://www.wildlifetrusts.org/jsonapi/node/reserve",
        "table": "areadata",
        "default_value": {},
        "is_filterable": False,
        "is_shadable": False,
        "comparators": DataSet.comparators_default(),
        "unit_type": "point",
        "unit_distribution": "point",
    }

    count_defaults = {
        "label": "Number of Wildlife Trusts Reserves",
        "data_type": "integer",
        "category": "movement",
        "release_date": str(date.today()),
        "source_label": "Data from the Wildlife Trusts.",
        "source": "https://www.wildlifetrusts.org/",
        "source_type": "api",
        "table": "areadata",
        "data_url": "https://www.wildlifetrusts.org/jsonapi/node/reserve",
        "default_value": 0,
        "is_filterable": True,
        "is_shadable": True,
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "raw",
        "unit_distribution": "physical_area",
    }

    data_sets = {
        "wildlife_trusts_reserves": {
            "defaults": defaults,
        },
        "wildlife_trusts_reserves_count": {
            "defaults": count_defaults,
        },
    }

    group_data_type = "wildlife_trusts_reserves"
    count_data_type = "wildlife_trusts_reserves_count"

    uses_gss = True
    area_types = ["WMC", "WMC23", "STC", "DIS"]
    cons_col_map = {
        "WMC": "WMC",
        "WMC23": "WMC23",
        "STC": "STC",
        "DIS": "DIS",
    }

    def get_df(self):

        if self.data_file.exists() is False:
            return None

        return pd.read_csv(
            self.data_file,
            names=["group_name", "trust", "url", "postcode", "gss", *self.area_types],
            header=0,
        )

    def get_group_json(self, row):
        return row[["group_name", "url"]].dropna().to_dict()
