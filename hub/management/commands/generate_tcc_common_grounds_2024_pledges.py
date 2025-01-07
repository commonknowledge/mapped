from django.conf import settings

import pandas as pd

from .base_generators import BaseLatLonGeneratorCommand


class Command(BaseLatLonGeneratorCommand):
    help = "Generate CSV file of pledges to take part in TCC’s 2024 Common Grounds Day of Action"
    message = "Generating a CSV of pledges to take part in TCC’s 2024 Common Grounds Day of Action"

    data_file = settings.BASE_DIR / "data" / "tcc_common_grounds_2024_pledges.csv"
    out_file = (
        settings.BASE_DIR / "data" / "tcc_common_grounds_2024_pledges_processed.csv"
    )

    row_name = "postcode"
    uses_gss = True
    uses_postcodes = True

    def get_dataframe(self):
        df = pd.read_csv(self.data_file, usecols=["POSTCODE"])
        df.columns = ["postcode"]
        return df

    def get_location_from_row(self, row):
        return {"postcode": row.postcode}
