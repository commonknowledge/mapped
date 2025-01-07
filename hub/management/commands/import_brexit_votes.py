from django.conf import settings

import pandas as pd

from hub.models import DataSet

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import Brexit voting data"

    cons_row = "constituency"
    message = "Importing constituency Brexit voting data"
    uses_gss = False
    data_file = settings.BASE_DIR / "data" / "brexit.xlsx"
    do_not_convert = True

    data_sets = {
        "brexit_votes": {
            "defaults": {
                "label": "EU (Brexit) leave vote percentage",
                "description": "Percentage of constituents who voted to leave the EU in the 2016 referendum",
                "data_type": "percent",
                "release_date": "February 2017",
                "category": "opinion",
                "source_label": "Data from the House of Commons Library.",
                "source": "https://commonslibrary.parliament.uk/brexit-votes-by-constituency/",
                "source_type": "xlxs",
                "table": "areadata",
                "is_filterable": True,
                "is_shadable": True,
                "comparators": DataSet.numerical_comparators(),
                "unit_type": "percentage",
                "unit_distribution": "people_in_area",
            },
            "col": "leave_percent",
        }
    }

    def get_dataframe(self):

        if not self.data_file.exists():
            return None

        df = pd.read_excel(
            self.data_file,
            sheet_name=1,
            usecols=[2, 6],
            names=["constituency", "leave_percent"],
            skiprows=7,
            converters={"leave_percent": lambda x: round(x * 100)},
        )
        df.constituency = df.constituency.str.replace("Ynys Mon", "Ynys Môn")
        return df
