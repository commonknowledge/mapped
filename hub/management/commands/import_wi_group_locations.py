from datetime import date

from django.conf import settings

import pandas as pd

from hub.models import DataSet

from .base_importers import (
    BaseConstituencyGroupListImportCommand,
    MultipleAreaTypesMixin,
)


class Command(MultipleAreaTypesMixin, BaseConstituencyGroupListImportCommand):
    help = "Import data about WI groups per constituency"
    message = "Importing Women's Institute group data"

    data_file = settings.BASE_DIR / "data" / "wi_groups.csv"
    source_url = "https://www.thewi.org.uk/wis-a-z"

    uses_gss = True
    area_types = ["WMC", "WMC23", "STC", "DIS"]
    cons_col_map = {
        "WMC": "WMC",
        "WMC23": "WMC23",
        "STC": "STC",
        "DIS": "DIS",
    }
    defaults = {
        "label": "Women’s Institute groups",
        "data_type": "json",
        "category": "movement",
        "subcategory": "groups",
        "release_date": str(date.today()),
        "source_label": "Data from the WI.",
        "source": "https://www.thewi.org.uk/",
        "source_type": "api",
        "data_url": "https://wi-search.squiz.cloud/s/search.json?collection=nfwi-federations&profile=_default&query=!null&sort=prox&sort=prox&start_rank=1&origin=54.093409,-2.89479&maxdist=9999&num_ranks=9999",
        "table": "areadata",
        "default_value": {},
        "exclude_countries": ["Scotland"],
        "is_filterable": False,
        "is_shadable": False,
        "comparators": DataSet.comparators_default(),
        "unit_type": "point",
        "unit_distribution": "point",
    }

    count_defaults = {
        "label": "Number of Women’s Institute groups",
        "data_type": "integer",
        "category": "movement",
        "release_date": str(date.today()),
        "source_label": "Data from the WI.",
        "source": "https://www.thewi.org.uk/",
        "source_type": "api",
        "data_url": "https://wi-search.squiz.cloud/s/search.json?collection=nfwi-federations&profile=_default&query=!null&sort=prox&sort=prox&start_rank=1&origin=54.093409,-2.89479&maxdist=9999&num_ranks=9999",
        "table": "areadata",
        "default_value": 0,
        "exclude_countries": ["Scotland"],
        "is_filterable": True,
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "point",
        "unit_distribution": "point",
    }

    data_sets = {
        "constituency_wi_groups": {
            "defaults": defaults,
        },
        "constituency_wi_group_count": {
            "defaults": count_defaults,
        },
    }

    group_data_type = "constituency_wi_groups"
    count_data_type = "constituency_wi_group_count"

    def get_df(self):

        if self.data_file.exists() is False:
            return None

        df = pd.read_csv(self.data_file)
        df.group_name = df.group_name.apply(
            lambda x: x.split(" | ")[0] if isinstance(x, str) else x
        )
        df.columns = ["group_name", "url", "lat_lon", "constituency", *self.area_types]
        return df

    def get_group_json(self, row):
        return row[["group_name", "url"]].dropna().to_dict()
