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
    uses_gss = True
    cons_col = "gss"
    data_file = settings.BASE_DIR / "data" / "aid_alliance_power_postcodes.csv"

    area_types = ["WMC", "WMC23", "STC", "DIS"]
    cons_col_map = {
        "WMC": "WMC",
        "WMC23": "WMC23",
        "STC": "STC",
        "DIS": "DIS",
    }

    power_postcodes = {
        "label": "Power Postcodes",
        "description": "Aid Alliance’s Power Postcodes are activist groups building a stronger connection between communities and MPs in key constituencies, on international development and the UK aid budget.",
        "data_type": "json",
        "category": "movement",
        "subcategory": "groups",
        "release_date": "July 2023",
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
        "release_date": "July 2023",
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
        if not self.data_file.exists():
            return None
        df = pd.read_csv(self.data_file)
        df.columns = [
            "group_name",
            "postcode",
            "community_organiser",
            "contact",
            "url",
            "gss",
            "WMC",
            "WMC23",
            "STC",
            "DIS",
        ]
        # Add Areas to df
        df["constituency"] = df.gss.apply(self.add_area)

        return df

    def get_group_json(self, row):
        return (
            row[["group_name", "community_organiser", "contact", "url"]]
            .dropna()
            .to_dict()
        )
