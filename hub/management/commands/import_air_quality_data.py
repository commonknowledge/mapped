from functools import reduce

from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet, DataType


class Command(BaseCommand):
    help = "Import air-pollution data"

    source_url = "https://uk-air.defra.gov.uk/data/modelling-data"

    gridcode_lookup_file = (
        settings.BASE_DIR / "data" / "gridcode_constituency_lookup.csv"
    )
    message = "Importing constituency air-pollution data"
    area_type = "WMC"
    defaults = {
        "label": "Air pollution",
        "description": "Metrics of pollutants associated with air pollution, aggregated per constituency, recorded automatically across the UK.",
        "data_type": "float",
        "category": "place",
        "source_label": "Data from Defra.",
        "release_date": "2021",
        "is_range": True,
        "source": source_url,
        "source_type": "csv",
        "table": "areadata",
        "comparators": DataSet.numerical_comparators(),
        "default_value": 10,
        "is_filterable": True,
        "is_shadable": True,
        "unit_type": "percentage",
        "unit_distribution": "physical_area",
    }

    in_files = {
        "pm_10": {
            "pollutant": "PM10",
            "metric": "Annual mean",
            "header_label": "pm102021g",
            "comments": "Gravimetric units",
            "csv_link": "https://uk-air.defra.gov.uk/datastore/pcm/mappm102021g.csv",
        },
        "pm_2_5": {
            "pollutant": "PM2.5",
            "metric": "Annual mean",
            "header_label": "pm252021g",
            "csv_link": "https://uk-air.defra.gov.uk/datastore/pcm/mappm252021g.csv",
        },
        "no_2": {
            "pollutant": "NO2",
            "metric": "Annual mean",
            "header_label": "no22021",
            "csv_link": "https://uk-air.defra.gov.uk/datastore/pcm/mapno22021.csv",
        },
        "no_x": {
            "pollutant": "NOx",
            "metric": "Annual mean",
            "header_label": "nox2021",
            "comments": "µg m\u207B\u00B3 (NO\u2093 as NO\u2082)",
            "csv_link": "https://uk-air.defra.gov.uk/datastore/pcm/mapnox2021.csv",
        },
        "so_2": {
            "pollutant": "SO2",
            "metric": "Annual mean",
            "header_label": "so22021",
            "csv_link": "https://uk-air.defra.gov.uk/datastore/pcm/mapso22021.csv",
        },
        "ozone": {
            "pollutant": "Ozone",
            "metric": "DGT120",
            "header_label": "dgt12021",
            "comments": "number of days on which the daily max 8-hr concentration is greater than 120 µg m\u207B\u00B3",
            "csv_link": "https://uk-air.defra.gov.uk/datastore/pcm/mapdgt12021.csv",
        },
        "benzene": {
            "pollutant": "Benzene",
            "metric": "Annual mean",
            "header_label": "bz2021",
            "csv_link": "https://uk-air.defra.gov.uk/datastore/pcm/mapbz2021.csv",
        },
    }

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        df = self.get_dataframe()
        if df is None:
            self.stdout.write(
                "Failed to import air quality data. Please ensure that the gridcode_lookup file is available."
            )
            return
        self.data_types = self.create_data_types(df)
        self.delete_data()
        self.import_data(df)

    def create_data_types(self, df):
        if not self._quiet:
            self.stdout.write("Creating dataset + types")
        data_set, created = DataSet.objects.update_or_create(
            name="constituency_air_quality", defaults=self.defaults
        )
        data_types = []
        for col in tqdm(df.columns, disable=self._quiet):
            label = self.in_files[col]["pollutant"]
            metric = self.in_files[col]["metric"]
            if "comments" in self.in_files[col]:
                metric += f" ({self.in_files[col]['comments']})"

            data_type, created = DataType.objects.update_or_create(
                data_set=data_set,
                name=f"air_quality_{col}",
                defaults={
                    "data_type": "float",
                    "label": label,
                    "description": metric,
                },
            )
            data_types.append(data_type)

        return data_types

    def import_data(self, df):
        if not self._quiet:
            self.stdout.write("Importing air quality data")
        for gss, row in tqdm(df.iterrows(), disable=self._quiet):
            area = Area.get_by_gss(gss, area_type=self.area_type)
            if area is None:
                self.stdout.write(
                    f"Failed to find area with code {gss} and area_type {self.area_type}"
                )
                continue
            for data_type in self.data_types:
                AreaData.objects.create(
                    data_type=data_type,
                    area=area,
                    data=row[data_type.name[12:]],
                )
        for col in df.columns:
            average = df[col].mean()
            data_type = DataType.objects.get(name=f"air_quality_{col}")
            data_type.average = average
            data_type.save()

    def delete_data(self):
        AreaData.objects.filter(data_type__in=self.data_types).delete()

    def get_dataframe(self):

        if not self.gridcode_lookup_file.exists():
            return None

        dfs = []
        print("Importing separate csvs")
        for label, metadata in tqdm(self.in_files.items(), disable=self._quiet):
            dfs.append(
                pd.read_csv(
                    metadata["csv_link"],
                    usecols=["gridcode", metadata["header_label"]],
                    skiprows=5,
                    na_values="MISSING",
                    dtype={"gridcode": "int", metadata["header_label"]: "float"},
                ).rename(columns={metadata["header_label"]: label})
            )

        print("Transforming data")
        # Merge all of the dataframes on the common 'gridcode' column
        df = reduce(lambda df1, df2: pd.merge(df1, df2, on="gridcode"), dfs)

        # Use external lookup file to append GSS codes
        gridcode_lookup = (
            pd.read_csv(self.gridcode_lookup_file, usecols=["gss", "gridcode"])
            .set_index("gridcode")["gss"]
            .to_dict()
        )
        df["gss"] = df["gridcode"].apply(
            lambda gridcode: gridcode_lookup.get(gridcode, None)
        )

        # Drop None values (which occur when a code lays outside a constituency
        # - in the sea)
        df = df.dropna(subset="gss")

        # Prepare the df for useful importing
        df = df.drop(columns=["gridcode"]).groupby("gss").mean()
        if df.empty:
            return None
        return df
