from django.conf import settings

import pandas as pd

from hub.models import AreaData, DataSet

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import Onward polling data on attitudes to net zero and climate change"

    data_file = settings.BASE_DIR / "data" / "onward_mrp_polling_data.csv"
    cons_row = "constituency"
    message = "Importing Onward polling data"
    uses_gss = False

    defaults = {
        "data_type": "integer",
        "category": "opinion",
        "source_label": "Public First MRP Polling, commissioned by Onward UK.",
        "release_date": "July 2022",
        "source": "https://www.publicfirst.co.uk/new-public-first-polling-for-onward.html",
        "source_type": "google sheet",
        "subcategory": "net_zero_support",
        "table": "areadata",
        "default_value": 10,
        "data_url": "",
        "exclude_countries": ["Northern Ireland"],
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    }

    data_sets = {
        "constituency_nz_support": {
            "defaults": defaults,
            "col": "support net zero",
        },
        "constituency_nz_neutral": {
            "defaults": defaults,
            "col": "neither support nor oppose net zero",
        },
        "constituency_nz_oppose": {
            "defaults": defaults,
            "col": "oppose net zero",
        },
        "constituency_cc_high": {
            "defaults": defaults,
            "col": "consider climate change a high priority",
        },
    }
    del data_sets["constituency_cc_high"]["defaults"]["subcategory"]

    def get_dataframe(self):

        if not self.data_file.exists():
            return None

        converters_dict = {
            col: lambda x: int(x[:-1])
            for col in ["Q02_Support", "Q02_Neutral", "Q02_Oppose", "Q07_High"]
        }
        df = pd.read_csv(
            self.data_file,
            usecols=["Seat", "Q02_Support", "Q02_Neutral", "Q02_Oppose", "Q07_High"],
            converters=converters_dict,
        )
        df.columns = [
            "constituency",
            "support net zero",
            "neither support nor oppose net zero",
            "oppose net zero",
            "consider climate change a high priority",
        ]

        # Build a constituency lookup from TWFY data, and apply it to the constituency column, so that the names are all in a form that LIH recognises
        constituency_lookup = self.build_constituency_name_lookup(old_cons=True)
        df.constituency = df.constituency.apply(
            lambda x: constituency_lookup.get(x.replace(",", ""), x)
        )
        return df

    def get_label(self, defaults):
        return defaults["col"].capitalize()

    def delete_data(self):
        AreaData.objects.filter(data_type__in=self.data_types.values()).delete()
