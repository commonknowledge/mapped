from typing import Optional

from django.conf import settings

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet

from .base_importers import BaseAreaImportCommand, MultipleAreaTypesMixin


class Command(MultipleAreaTypesMixin, BaseAreaImportCommand):
    help = "Import data about NT properties per constituency"
    data_file = settings.BASE_DIR / "data" / "national_trust_properties.csv"
    source_url = "https://www.nationaltrust.org.uk/search"
    do_not_convert = True

    area_types = ["WMC", "WMC23", "STC", "DIS"]
    cons_col_map = {
        "WMC": "WMC",
        "WMC23": "WMC23",
        "STC": "STC",
        "DIS": "DIS",
    }

    defaults = {
        "label": "National Trust properties",
        "data_type": "json",
        "category": "movement",
        "release_date": "March 2023",
        "subcategory": "locations",
        "source_label": "Data from National Trust.",
        "source": "https://www.nationaltrust.org.uk/",
        "source_type": "json",
        "data_url": "",
        "table": "areadata",
        "default_value": {},
        "is_filterable": False,
        "is_shadable": False,
        "comparators": DataSet.comparators_default(),
        "unit_type": "point",
        "unit_distribution": "point",
    }

    count_defaults = {
        "label": "Number of National Trust properties",
        "data_type": "integer",
        "release_date": "March 2023",
        "category": "movement",
        "source_label": "Data from National Trust.",
        "source": "https://www.nationaltrust.org.uk/",
        "source_type": "json",
        "data_url": "",
        "table": "areadata",
        "default_value": 0,
        "is_filterable": True,
        "exclude_countries": ["Scotland"],
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "raw",
        "unit_distribution": "physical_area",
    }

    data_sets = {
        "constituency_nt_properties": {
            "defaults": defaults,
        },
        "constituency_nt_properties_count": {
            "defaults": count_defaults,
        },
    }

    def delete_data(self):
        for data_type in self.data_types.values():
            AreaData.objects.filter(data_type=data_type).delete()

    def get_df(self) -> Optional[pd.DataFrame]:
        if not self.data_file.exists():
            return None

        return pd.read_csv(self.data_file)

    def process_data(self, df: pd.DataFrame):

        # df.group_name = df.group_name.apply(
        # lambda x: x.split(" | ")[0] if type(x) == str else x
        # )

        if not self._quiet:
            self.stdout.write("Importing National Trust property data")

        # Group by the area, and add the data from there
        area_type = self.get_area_type()
        for area_name, data in tqdm(df.groupby(self.cons_col_map[area_type.code])):
            try:
                area = Area.objects.get(name=area_name, area_type=area_type)
            except Area.DoesNotExist:
                continue

            json = []
            for index, row in data.iterrows():
                p_data = row[["name"]].dropna().to_dict()
                p_data["url"] = (
                    f"https://www.nationaltrust.org.uk/site-search#gsc.q={row['name']}"
                )
                json.append(p_data)

            json_data, created = AreaData.objects.update_or_create(
                data_type=self.data_types["constituency_nt_properties"],
                area=area,
                json=json,
            )

            count_data, creared = AreaData.objects.update_or_create(
                data_type=self.data_types["constituency_nt_properties_count"],
                area=area,
                data=len(data),
            )

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )
