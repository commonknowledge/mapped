from django.conf import settings

import pandas as pd

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import FoE Constituency report links"

    cons_row = "constituency"
    message = "Importing Friends of the Earth constituency report links"
    area_type = "WMC23"
    data_file = settings.BASE_DIR / "data" / "foe_cons_report_links.csv"
    uses_gss = False
    data_sets = {
        "foe_cons_report_links": {
            "defaults": {
                "label": "Friends of the Earth ‘State of the Environment’ report",
                "description": "These reports highlight key environmental issues impacting people in this constituency, as well as proposed solutions.",
                "data_type": "url",
                "category": "place",
                "source_label": "From Friends of the Earth.",
                "source": "https://policy.friendsoftheearth.uk/constituency-reports/state-of-the-environment?utm_medium=referral&utm_source=partner&utm_campaign=climate-coalition&utm_content=local-intelligence-hub",
                "release_date": "August 2023",
                "source_type": "csv",
                "table": "areadata",
                "is_filterable": False,
                "no_comparators": True,
                "is_public": True,
            },
            "col": "url",
        }
    }

    def get_row_data(self, row, conf):
        return {
            "url": row["url"],
            "link_text": f"The state of the environment in {row['constituency']}",
        }

    def get_dataframe(self):

        if self.data_file.exists() is False:
            return None

        df = pd.read_csv(
            self.data_file,
            usecols=[1, 4],
            skiprows=1,
            names=["constituency", "url"],
        )
        # fix some accented character differences
        df.constituency = df.constituency.str.replace("Ynys Mon", "Ynys Môn")
        df.constituency = df.constituency.str.replace(
            "Montgomeryshire and Glyndwr", "Montgomeryshire and Glyndŵr"
        )
        return df
