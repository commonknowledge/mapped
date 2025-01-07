from django.conf import settings

import pandas as pd

from hub.models import AreaData, DataSet

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import data about area fuel poverty from End Fuel Poverty Coalition"

    source_url = "https://www.endfuelpoverty.org.uk/price-cap-methodology/"
    data_file = settings.BASE_DIR / "data" / "efpc_fuel_poverty.xlsx"
    cons_row = "Parliamentary Constituency Code"
    uses_gss = True

    message = "Importing EFPC constituency fuel poverty data"
    data_sets = {
        "efpc_constituency_fuel_poverty": {
            "defaults": {
                "label": "Estimated households in fuel poverty",
                "description": "Percentage of households in fuel poverty, including adjustment for Energy Price Guarantee, using National Energy Action base number of households in fuel poverty.",
                "data_type": "percent",
                "release_date": "July 2023",
                "category": "place",
                "source_label": "Data from End Fuel Poverty Coalition.",
                "source": source_url,
                "source_type": "xlxs",
                "data_url": "",
                "table": "areadata",
                "exclude_countries": ["Northern Ireland", "Scotland", "Wales"],
                "comparators": DataSet.numerical_comparators(),
                "default_value": 10,
                "unit_type": "percentage",
                "unit_distribution": "people_in_area",
            },
            "col": "% of area in FP from 1 Jul 2023",
        }
    }

    def delete_data(self):
        AreaData.objects.filter(
            data_type=self.data_types["efpc_constituency_fuel_poverty"]
        ).delete()

    def get_dataframe(self):

        if self.data_file.exists() is False:
            return None

        data_col = self.data_sets["efpc_constituency_fuel_poverty"]["col"]

        df = pd.read_excel(self.data_file, sheet_name="Constituency", skiprows=2)
        df = df.dropna(axis="index", how="any")
        # we want the percentage out of 100 not as as n/100
        df[data_col] = df[data_col].apply(lambda x: x * 100)

        return df
