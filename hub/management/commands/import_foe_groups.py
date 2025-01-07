from django.conf import settings

import pandas as pd

from hub.models import DataSet

from .base_importers import BaseConstituencyGroupListImportCommand


class Command(BaseConstituencyGroupListImportCommand):
    help = "Import data about FOE groups by constituency"

    data_file = settings.BASE_DIR / "data" / "foe_groups_wmc.csv"
    message = "Importing FOE groups data"
    uses_gss = False

    defaults = {
        "data_type": "json",
        "category": "movement",
        "subcategory": "groups",
        "label": "Friends of the Earth local action groups",
        "description": "",
        "source_label": "Data from Friends of the Earth.",
        "release_date": "January 2024",
        "source": "https://friendsoftheearth.uk/about/what-are-local-action-groups",
        "source_type": "google sheet",
        "table": "areadata",
        "default_value": {},
        "data_url": "",
        "exclude_countries": ["Scotland"],
        "is_filterable": True,
        "is_shadable": False,
        "is_public": True,
        "comparators": DataSet.string_comparators(),
        "unit_type": "point",
        "unit_distribution": "point",
    }

    count_defaults = {
        **defaults,
        "data_type": "integer",
        "is_shadable": True,
        "label": "Number of Friends of the Earth local action groups",
        "comparators": DataSet.numerical_comparators(),
    }

    data_sets = {
        "constituency_foe_groups": {
            "defaults": defaults,
        },
        "constituency_foe_groups_count": {
            "defaults": count_defaults,
        },
    }

    group_data_type = "constituency_foe_groups"
    count_data_type = "constituency_foe_groups_count"

    def get_df(self):
        if not self.data_file.exists():
            return None
        df = pd.read_csv(self.data_file)
        df.columns = ["group_name", "postcode", "constituency", "source", "type"]
        return df

    def get_group_json(self, row):
        return row[["group_name"]].dropna().to_dict()
