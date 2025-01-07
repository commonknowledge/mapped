from django.conf import settings

import pandas as pd

from hub.models import AreaData, DataSet

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = (
        "Import data about the number of Save the Children supporters per constituency"
    )

    message = "importing Save the Children shop count"
    uses_gss = False
    cons_row = "CONSTITUENCY"
    data_file = (
        settings.BASE_DIR / "data" / "2022_Campaigning_Actions_By_Constituency 1.csv"
    )

    defaults = {
        "label": "Number of Save the Children supporters",
        "data_type": "integer",
        "category": "movement",
        "subcategory": "supporters_and_activists",
        "source_label": "Data from Save the Children.",
        "release_date": "2022",
        "source": "https://www.savethechildren.org.uk/",
        "source_type": "csv",
        "data_url": "",
        "table": "areadata",
        "default_value": 10,
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
    }

    data_sets = {
        "save_the_children_supporter_count": {
            "defaults": defaults,
            "col": "NUMBER_OF_SUPPORTERS",
        },
    }

    def get_dataframe(self):
        if self.data_file.exists() is False:
            return None
        return pd.read_csv(self.data_file)

    def delete_data(self):
        for data_type in self.data_types.values():
            AreaData.objects.filter(data_type=data_type).delete()
