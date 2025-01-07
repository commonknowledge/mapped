from django.conf import settings

import pandas as pd

from hub.models import DataSet

from .base_importers import (
    BaseConstituencyGroupListImportCommand,
    MultipleAreaTypesMixin,
)


class Command(MultipleAreaTypesMixin, BaseConstituencyGroupListImportCommand):
    help = "Import data about RSPB reserves in each constituency"
    data_file = settings.BASE_DIR / "data" / "rspb_reserves.csv"
    message = "Importing RSPB reserves data"

    uses_gss = True
    area_types = ["WMC", "WMC23", "STC", "DIS"]
    cons_col_map = {
        "WMC": "WMC",
        "WMC23": "WMC23",
        "STC": "STC",
        "DIS": "DIS",
    }

    defaults = {
        "label": "RSPB Reserves",
        "data_type": "json",
        "category": "movement",
        "subcategory": "groups",
        "release_date": "September 2023",
        "source_label": "Data from the RSPB.",
        "source": "https://opendata-rspb.opendata.arcgis.com/datasets/6076715cb76d4c388fa38b87db7d9d24/explore",
        "source_type": "csv",
        "table": "areadata",
        "default_value": {},
        "is_filterable": False,
        "is_shadable": False,
        "comparators": DataSet.comparators_default(),
        "unit_type": "raw",
        "unit_distribution": "physical_area",
    }

    count_defaults = {
        "label": "Number of RSPB Reserves",
        "data_type": "integer",
        "category": "movement",
        "release_date": "September 2023",
        "source_label": "Data from the RSPB.",
        "source": "https://opendata-rspb.opendata.arcgis.com/datasets/6076715cb76d4c388fa38b87db7d9d24/explore",
        "source_type": "csv",
        "table": "areadata",
        "default_value": 0,
        "is_filterable": True,
        "is_shadable": True,
        "comparators": DataSet.numerical_comparators(),
    }

    data_sets = {
        "rspb_reserves": {
            "defaults": defaults,
        },
        "rspb_reserves_count": {
            "defaults": count_defaults,
        },
    }

    group_data_type = "rspb_reserves"
    count_data_type = "rspb_reserves_count"

    def get_df(self):

        if self.data_file.exists() is False:
            return None

        return pd.read_csv(self.data_file)

    def get_group_json(self, row):
        return {"group_name": row["name"]}
