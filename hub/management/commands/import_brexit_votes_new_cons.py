from django.conf import settings

import pandas as pd

from hub.models import AreaData, DataSet

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import Brexit voting data"

    cons_row = "constituency"
    message = "Importing constituency Brexit voting data"
    uses_gss = True
    area_type = "WMC23"
    data_file = settings.BASE_DIR / "data" / "brexit_new_cons.csv"
    data_sets = {
        "brexit_votes": {
            "defaults": {
                "label": "EU (Brexit) leave vote percentage",
                "description": "Percentage of constituents who voted to leave the EU in the 2016 referendum",
                "data_type": "percent",
                "category": "opinion",
                "source_label": "Data from UK Parliament.",
                "source": "https://commonslibrary.parliament.uk/brexit-votes-by-constituency/",
                "source_type": "xlxs",
                "table": "areadata",
                "is_filterable": True,
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

        df = pd.read_csv(
            self.data_file,
            usecols=[1, 4],
            skiprows=1,
            names=["constituency", "leave_percent"],
        )
        df = pd.read_csv(
            self.data_file,
            usecols=[1, 4],
            skiprows=1,
            names=["constituency", "leave_percent"],
            converters={"leave_percent": lambda x: round(float(x) * 100)},
        )
        df.constituency = df.constituency.str.replace("Ynys Mon", "Ynys Môn")
        return df

    def delete_data(self):
        AreaData.objects.filter(
            data_type__name="brexit_votes", area__area_type__code=self.area_type
        ).delete()
