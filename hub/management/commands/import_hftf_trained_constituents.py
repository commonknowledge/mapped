from django.conf import settings

import pandas as pd

from hub.models import AreaData, DataSet

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import data about number of active HFTF constituents per constituency"

    data_file = (
        settings.BASE_DIR
        / "data"
        / "HFTF_ Project Groundgame data 07_02_2023.xlsx - Main Sheet.csv"
    )
    cons_row = "Constituency"
    message = "Importing HFTF trained constituents data"
    uses_gss = False

    defaults = {
        "data_type": "integer",
        "category": "movement",
        "subcategory": "supporters_and_activists",
        "description": "These constituents have been trained by Hope For The Future, to have more frequent and more powerful conversations about climate and nature, with their elected representatives.",
        "release_date": "February 2023",
        "source_label": "Data from Hope For The Future.",
        "source": "https://www.hftf.org.uk/",
        "source_type": "google sheet",
        "table": "areadata",
        "default_value": 1,
        "data_url": "",
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
        "comparators": DataSet.numerical_comparators(),
    }

    data_sets = {
        "hftf_constituents_count": {
            "defaults": defaults,
            "col": "constituents_count",
        },
    }

    def get_dataframe(self):

        if self.data_file.exists() is False:
            return None

        df = pd.read_csv(
            self.data_file,
            usecols=["Constituency", "Group / Individual"],
        )
        df = (
            df.dropna(subset="Constituency")
            .groupby("Constituency")
            .count()["Group / Individual"]
            .reset_index()
            .rename(columns={"Group / Individual": "constituents_count"})
        )
        df.constituents_count = df.constituents_count.astype(int)
        return df

    def get_label(self, defaults):
        return "Number of Hope For The Future trained constituents"

    def delete_data(self):
        AreaData.objects.filter(data_type__in=self.data_types.values()).delete()
