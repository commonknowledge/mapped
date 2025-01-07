from django.conf import settings

import pandas as pd

from hub.models import DataSet

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import Sussex Wildlife Trust member counts for post 2024 constituencies"

    message = "importing sussex wildlife trust member counts"
    cons_row = "constituency"
    cons_col = "constituency"
    data_file = settings.BASE_DIR / "data" / "sussex_wt_member_counts.csv"
    uses_gss = False

    area_type = "WMC23"

    data_sets = {
        "sussex_wt_members": {
            "defaults": {
                "label": "Sussex Wildlife Trust members",
                "data_type": "integer",
                "category": "movement",
                "subcategory": "places_and_spaces",
                "release_date": "May 2024",
                "source_label": "Data from Sussex Wildlife Trust.",
                "source": "",
                "source_type": "csv",
                "data_url": "",
                "table": "areadata",
                "default_value": 10,
                "exclude_countries": ["Scotland", "Northern Ireland"],
                "comparators": DataSet.numerical_comparators(),
                "unit_type": "raw",
                "unit_distribution": "people_in_area",
                "fill_blanks": False,
            },
            "col": "sussex_wt_members_may_2024",
        }
    }

    def get_dataframe(self):
        df = pd.read_csv(self.data_file)
        df = df.astype({self.get_cons_col(): "str"})
        return df
