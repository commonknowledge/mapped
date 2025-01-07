from django.conf import settings

import pandas as pd

from hub.models import AreaData, DataSet

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = (
        "Import data about number of Christian Aid campaign organisers per constituency"
    )

    data_file = (
        settings.BASE_DIR
        / "data"
        / "Christian Aid climate campaign organisers - Data.csv"
    )
    cons_row = "Constituency"
    message = "Importing Christian Aid climate campaign organisers data"
    uses_gss = False

    defaults = {
        "data_type": "integer",
        "category": "movement",
        "subcategory": "supporters_and_activists",
        "release_date": "February 2023",
        "source_label": "Data from Christian Aid.",
        "source": "https://www.christianaid.org.uk/",
        "source_type": "google sheet",
        "table": "areadata",
        "default_value": 1,
        "data_url": "",
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
        "comparators": DataSet.numerical_comparators(),
    }

    data_sets = {
        "constituency_christian_aid_campaign_organisers_count": {
            "defaults": defaults,
            "col": "organisers",
        },
    }

    def get_dataframe(self):

        if self.data_file.exists() is False:
            return None

        df = pd.read_csv(self.data_file)
        df = (
            df.groupby("Constituency")
            .count()
            .reset_index()
            .rename(columns={"Postcode": "organisers"})
        )
        return df

    def get_label(self, defaults):
        return "Number of Christian Aid climate campaign organisers"

    def delete_data(self):
        AreaData.objects.filter(data_type__in=self.data_types.values()).delete()
