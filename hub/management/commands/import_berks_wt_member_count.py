from django.conf import settings

import pandas as pd

from hub.models import DataSet

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import Berkshire, Buckinghamshire and Oxfordshire Wildlife Trust member counts for post 2024 constituencies"

    message = "importing Berkshire, Buckinghamshire and Oxfordshire wildlife trust member counts"
    cons_row = "Constituency"
    cons_col = "Constituency"
    data_file = (
        settings.BASE_DIR
        / "data"
        / "berks_bucks_oxon_wildlife_trust_member_counts.xlsx"
    )
    uses_gss = False

    area_type = "WMC23"

    data_sets = {
        "bbox_wt_members": {
            "defaults": {
                "label": "Berkshire, Buckinghamshire and Oxfordshire Wildlife Trust members",
                "data_type": "integer",
                "category": "movement",
                "subcategory": "places_and_spaces",
                "release_date": "August 2024",
                "source_label": "Data from Berkshire, Buckinghamshire and Oxfordshire Wildlife Trust.",
                "source": "",
                "source_type": "xlsx",
                "data_url": "",
                "table": "areadata",
                "default_value": 10,
                "exclude_countries": ["Scotland", "Northern Ireland"],
                "comparators": DataSet.numerical_comparators(),
                "unit_type": "raw",
                "unit_distribution": "people_in_area",
                "fill_blanks": False,
            },
            "col": "Total_Members",
        }
    }

    def get_dataframe(self):
        df = pd.read_excel(self.data_file)
        df = df.astype({self.get_cons_col(): "str"})
        return df
