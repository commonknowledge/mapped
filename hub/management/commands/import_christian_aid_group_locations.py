from django.conf import settings

import pandas as pd

from hub.models import DataSet

from .base_importers import BaseConstituencyGroupListImportCommand


class Command(BaseConstituencyGroupListImportCommand):
    help = "Import data about Christian Aid groups per constituency"
    message = "Importing Christian Aid group data"

    data_file = settings.BASE_DIR / "data" / "christian_aid_groups.csv"
    defaults = {
        "label": "Christian Aid groups",
        "data_type": "json",
        "category": "movement",
        "subcategory": "groups",
        "release_date": "April 2023",
        "source_label": "Data from Christian Aid.",
        "source": "",
        "source_type": "api",
        "data_url": "",
        "table": "areadata",
        "default_value": {},
        "is_filterable": False,
        "comparators": DataSet.comparators_default(),
    }

    count_defaults = {
        "label": "Number of Christian Aid groups",
        "data_type": "integer",
        "release_date": "April 2023",
        "category": "movement",
        "source_label": "Data from Christian Aid.",
        "source": "",
        "source_type": "api",
        "data_url": "",
        "table": "areadata",
        "default_value": 0,
        "is_filterable": True,
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "point",
        "unit_distribution": "point",
    }

    data_sets = {
        "constituency_christian_aid_groups": {
            "defaults": defaults,
        },
        "constituency_christian_aid_group_count": {
            "defaults": count_defaults,
        },
    }

    group_data_type = "constituency_christian_aid_groups"
    count_data_type = "constituency_christian_aid_group_count"

    def get_df(self):

        if self.data_file.exists() is False:
            return None

        df = pd.read_csv(
            self.data_file,
            usecols=[
                "Account Name",
                "Westminster Parliamentary Constituency (Postcode District) (Postcode District)",
            ],
        )

        df.columns = [
            "group_name",
            "constituency",
        ]

        # Build a constituency lookup from TWFY data, and apply it to the constituency column, so that the names are all in a form that LIH recognises
        constituency_lookup = self.build_constituency_name_lookup(old_cons=True)
        df.constituency = df.constituency.apply(
            lambda x: (
                constituency_lookup.get(x.replace(",", ""), x) if not pd.isna(x) else ""
            )
        )
        return df

    def get_group_json(self, row):
        return row[["group_name"]].dropna().to_dict()
