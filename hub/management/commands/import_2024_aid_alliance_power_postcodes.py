import re

from django.conf import settings

import pandas as pd

from hub.models import Area, DataSet

from .base_importers import (
    BaseConstituencyGroupListImportCommand,
    MultipleAreaTypesMixin,
)


class Command(MultipleAreaTypesMixin, BaseConstituencyGroupListImportCommand):
    help = "Import Aid Alliance 'Power Postcode' data"

    do_not_convert = True

    message = "importing Aid Alliance 'power postcode' data"
    uses_gss = False
    cons_col = "gss"
    data_file = settings.BASE_DIR / "data" / "power_postcodes_march_2024.csv"

    area_types = ["WMC", "WMC23"]
    cons_col_map = {
        "WMC": "WMC",
        "WMC23": "WMC23",
    }

    power_postcodes = {
        "label": "Power Postcodes",
        "description": "Aid Alliance’s Power Postcodes are activist groups building a stronger connection between communities and MPs in key constituencies, on international development and the UK aid budget.",
        "data_type": "json",
        "category": "movement",
        "subcategory": "groups",
        "release_date": "March 2024",
        "source_label": "Data from Aid Alliance.",
        "source": "https://aidalliance.org.uk/",
        "source_type": "api",
        "data_url": "https://www.google.com/maps/d/u/0/viewer?mid=15b_tQI0t58rLcBTgFytu2e73jyKrrxFr",
        "table": "areadata",
        "default_value": {},
        "exclude_countries": ["Northern Ireland", "Scotland", "Wales"],
        "comparators": DataSet.comparators_default(),
        "is_filterable": False,
        "is_shadable": False,
        "unit_type": "point",
        "unit_distribution": "point",
    }

    power_postcode_counts = {
        "label": "Number of Power Postcodes",
        "description": "Aid Alliance’s Power Postcodes are activist groups building a stronger connection between communities and MPs in key constituencies, on international development and the UK aid budget.",
        "data_type": "integer",
        "category": "movement",
        "release_date": "March 2024",
        "source_label": "Data from Aid Alliance.",
        "source": "https://aidalliance.org.uk/",
        "source_type": "api",
        "data_url": "https://www.google.com/maps/d/u/0/viewer?mid=15b_tQI0t58rLcBTgFytu2e73jyKrrxFr",
        "table": "areadata",
        "default_value": 0,
        "exclude_countries": ["Northern Ireland", "Scotland", "Wales"],
        "comparators": DataSet.numerical_comparators(),
        "is_shadable": True,
        "is_filterable": True,
        "unit_type": "raw",
        "unit_distribution": "physical_area",
    }

    data_sets = {
        "power_postcodes": {
            "defaults": power_postcodes,
        },
        "power_postcodes_count": {
            "defaults": power_postcode_counts,
        },
    }

    group_data_type = "power_postcodes"
    count_data_type = "power_postcodes_count"

    def add_area(self, gss):
        if isinstance(gss, str):
            areas = Area.objects.filter(gss__in=gss.split(","))
            if len(areas) != 0:
                return areas[0].name
        return None

    def get_df(self):

        if self.data_file.exists() is False:
            return None

        df = pd.read_csv(self.data_file)
        df.columns = [
            "WMC",
            "WMC23",
            "group_name",
            "url",
        ]

        areas = []
        for _, row in df.iterrows():
            row["WMC"] = re.sub("&", "and", row["WMC"])
            for wmc in row["WMC"].splitlines():
                areas.append([wmc.strip(), "", row["group_name"], row["url"]])
            if pd.isna(row["WMC23"]):
                row["WMC23"] = row["WMC"]
            row["WMC23"] = re.sub(r" [BC]C", "", row["WMC23"])
            row["WMC23"] = re.sub("&", "and", row["WMC23"])
            for wmc23 in row["WMC23"].splitlines():
                areas.append(["", wmc23.strip(), row["group_name"], row["url"]])

        df = pd.DataFrame(areas)
        df.columns = [
            "WMC",
            "WMC23",
            "group_name",
            "url",
        ]
        return df

    def get_group_json(self, row):
        return row[["group_name", "url"]].dropna().to_dict()

    def xhandle(self, quiet=False, *args, **kwargs):
        self.get_df()
