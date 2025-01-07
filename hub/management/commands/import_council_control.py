from datetime import date

from django.conf import settings

import pandas as pd

from hub.import_utils import filter_authority_type
from hub.models import DataSet

from .base_importers import (
    BaseImportFromDataFrameCommand,
    MultipleAreaTypesMixin,
    party_shades,
)

party_map = {
    "CON": "Conservative Party",
    "LAB": "Labour Party",
    "LD": "Liberal Democrats",
    "PC": "Plaid Cymru",
    "SNP": "Scottish National Party",
    "GRN": "Green Party",
    "IND": "Independents",
    "NOC": "No overall control",
}


class Command(MultipleAreaTypesMixin, BaseImportFromDataFrameCommand):
    cons_row = "lua code"
    message = "Importing council control"
    uses_gss = True
    do_not_convert = True

    area_types = ["STC", "DIS"]

    defaults = {
        "data_type": "text",
        "category": "place",
        "subcategory": "",
        "release_date": str(date.today()),
        "label": "Council Control",
        "source_label": "Data from Open Council Data UK.",
        "source": "http://opencouncildata.co.uk/",
        "source_type": "api",
        "table": "areadata",
        "default_value": "",
        "data_url": "",
        "comparators": DataSet.in_comparators(),
        "unit_type": "raw",
        "unit_distribution": "",
        "is_shadable": True,
        "is_filterable": True,
        "options": [
            {"title": party, "shader": shade} for party, shade in party_shades.items()
        ],
        "is_public": True,
    }

    data_sets = {
        "council_control": {
            "defaults": defaults,
            "col": "majority",
        },
    }

    def get_row_data(self, row, conf):
        party = party_map.get(row[conf["col"]])

        if party is None:
            party = row[conf["col"]]
            self.stderr.write(f"No party map for {conf['col']}")

        return party

    def get_dataframe(self):
        if settings.PARTY_CONTROL_URL == "":
            return None

        df = pd.read_csv(settings.PARTY_CONTROL_URL)
        df = filter_authority_type(df, self.area_type, "lua code")
        return df
