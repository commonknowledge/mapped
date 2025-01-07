from datetime import date

import pandas as pd

from hub.models import DataSet
from utils.mapit import MapIt

from .base_importers import BaseImportFromDataFrameCommand, MultipleAreaTypesMixin


class Command(MultipleAreaTypesMixin, BaseImportFromDataFrameCommand):
    help = "Import countries of areas from MapIt"
    message = "Importing constituency countries"
    cons_row = "gss-code"
    uses_gss = True
    do_not_convert = True

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    area_types = ["WMC", "WMC23"]

    mapit_types = {
        "WMC": {
            "mapit_types": ["WMC"],
            "mapit_generation": 54,
        },
        "WMC23": {
            "mapit_types": ["WMC"],
            "mapit_generation": None,
        },
    }

    options = [
        {"title": "England", "shader": "#f8f9fa"},
        {"title": "Wales", "shader": "#cc3517"},
        {"title": "Scotland", "shader": "#202448"},
        {"title": "Northern Ireland", "shader": "#458945"},
    ]

    defaults = {
        "data_type": "text",
        "category": "place",
        "description": "",
        "release_date": str(date.today()),
        "label": "Country of the UK",
        "source_label": "Data from mySociety.",
        "source": "https://mapit.mysociety.org/",
        "table": "areadata",
        "options": options,
        "comparators": DataSet.in_comparators(),
        "unit_type": "raw",
        "unit_distribution": "",
        "is_shadable": True,
        "is_filterable": True,
        "is_public": True,
    }

    data_sets = {"country": {"defaults": defaults, "col": "country"}}

    def get_dataframe(self):
        mapit_client = MapIt()
        areas = mapit_client.areas_of_type(
            self.mapit_types[self.area_type]["mapit_types"],
            generation=self.mapit_types[self.area_type]["mapit_generation"],
        )
        types = []
        for area in areas:
            types.append(
                {
                    "gss-code": area["codes"]["gss"],
                    "country": area["country_name"],
                }
            )

        df = pd.DataFrame(types)

        return df
