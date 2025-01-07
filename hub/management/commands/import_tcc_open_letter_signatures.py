from datetime import date

from django.conf import settings

import pandas as pd

from hub.models import DataSet

from .base_importers import BaseConstituencyGroupListImportCommand


class Command(BaseConstituencyGroupListImportCommand):
    help = "Import data about signatories to TCC open letter"
    message = "Importing signatories to TCC open letter"

    data_file = settings.BASE_DIR / "data" / "tcc_open_letter_signatures.csv"
    defaults = {
        "label": "Community groups supporting climate action",
        "description": "These community groups signed The Climate Coalition’s 2024 open letter calling for greater action on climate and nature from UK political parties.",
        "data_type": "json",
        "category": "movement",
        "subcategory": "groups",
        "release_date": str(date.today()),
        "source_label": "Data from The Climate Coalition.",
        "source": "https://www.theclimatecoalition.org/community-open-letter",
        "source_type": "csv",
        "data_url": "https://www.theclimatecoalition.org/community-open-letter",
        "table": "areadata",
        "default_value": {},
        "is_filterable": False,
        "is_shadable": False,
        "comparators": DataSet.comparators_default(),
        "unit_type": "point",
        "unit_distribution": "point",
    }

    count_defaults = {
        "label": "Number of community groups supporting climate action",
        "description": "These community groups signed The Climate Coalition’s 2024 open letter calling for greater action on climate and nature from UK political parties.",
        "data_type": "integer",
        "category": "movement",
        "release_date": str(date.today()),
        "source_label": "Data from The Climate Coalition.",
        "source": "https://www.theclimatecoalition.org/community-open-letter",
        "source_type": "csv",
        "table": "areadata",
        "data_url": "https://www.theclimatecoalition.org/community-open-letter",
        "default_value": 0,
        "is_filterable": True,
        "is_shadable": True,
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "raw",
        "unit_distribution": "physical_area",
    }

    data_sets = {
        "tcc_open_letter_signatories": {
            "defaults": defaults,
        },
        "tcc_open_letter_signatories_count": {
            "defaults": count_defaults,
        },
    }

    group_data_type = "tcc_open_letter_signatories"
    count_data_type = "tcc_open_letter_signatories_count"

    def get_df(self):

        if self.data_file.exists() is False:
            return None

        df = pd.read_csv(self.data_file, names=["group_name", "constituency"])
        df = df.dropna(subset=["constituency"])
        df["constituency"] = df["constituency"].str.strip()

        return df

    def get_group_json(self, row):
        return row[["group_name"]].dropna().to_dict()
