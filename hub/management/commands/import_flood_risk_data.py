from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet, DataType


class Command(BaseCommand):
    help = "Import flood risk data"

    data_file = settings.BASE_DIR / "data" / "risk_of_flooding.csv"
    message = "Importing constituency flood risk data"
    area_type = "WMC"

    defaults = {
        "label": "Flood risk from rivers or sea",
        "description": "Proportion of this constituency at High, Medium, Low, or Very Low risk of flooding.",
        "release_date": "2018",
        "data_type": "percent",
        "category": "place",
        "source_label": "Data from Defra.",
        "is_range": True,
        "source": "https://www.data.gov.uk/dataset/bad20199-6d39-4aad-8564-26a46778fd94/risk-of-flooding-from-rivers-and-sea",
        "source_type": "csv",
        "table": "areadata",
        "exclude_countries": ["Northern Ireland", "Scotland", "Wales"],
        "comparators": DataSet.numerical_comparators(),
        "default_value": 10,
        "is_shadable": True,
        "unit_type": "percentage",
        "unit_distribution": "physical_area",
    }

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        df = self.get_dataframe()
        if df is None:
            if not self._quiet:
                self.stdout.write(
                    f"Data file {self.data_file} not found or contains no data"
                )
            return
        self.data_types = self.create_data_types(df)
        self.delete_data()
        self.import_data(df)

    def create_data_types(self, df):
        if not self._quiet:
            self.stdout.write("Creating dataset + types")
        data_set, created = DataSet.objects.update_or_create(
            name="constituency_flood_risk", defaults=self.defaults
        )
        data_types = []
        for col in tqdm(df.columns, disable=self._quiet):
            data_type, created = DataType.objects.update_or_create(
                data_set=data_set,
                name=f"flood_risk_{col.lower().replace(' ', '_')}",
                defaults={
                    "data_type": "percent",
                    "label": col,
                    "description": f"Percentage of the constituency marked as '{col}' risk of flooding from rivers or the sea",
                },
            )
            data_types.append(data_type)

        return data_types

    def import_data(self, df):
        if not self._quiet:
            self.stdout.write("Importing flood risk data")
        for gss, row in tqdm(df.iterrows(), disable=self._quiet):
            area = Area.get_by_gss(gss, area_type=self.area_type)
            if area is None:
                self.stdout.write(
                    f"Failed to find area with code {gss} and area type {self.area_type}"
                )
                continue
            for data_type in self.data_types:
                AreaData.objects.create(
                    data_type=data_type,
                    area=area,
                    data=row[data_type.label],
                )
        for col in df.columns:
            average = df[col].mean()
            data_type = DataType.objects.get(
                name=f"flood_risk_{col.lower().replace(' ', '_')}"
            )
            data_type.average = average
            data_type.save()

    def delete_data(self):
        AreaData.objects.filter(data_type__in=self.data_types).delete()

    def get_dataframe(self):
        if self.data_file.exists() is False:
            return None
        df = pd.read_csv(self.data_file)
        if df.empty:
            return None
        totals = (
            df.dropna()[["gss", "prob_4band"]]
            .groupby("gss")
            .count()
            .prob_4band.to_dict()
        )
        df["total"] = df.gss.apply(lambda x: totals.get(x, None))
        df = (
            df.dropna()[["gss", "prob_4band", "total"]]
            .groupby("gss")
            .value_counts()
            .reset_index()
            .rename(columns={0: "value"})
        )
        df["percentage"] = df.value / df.total * 100
        df = df.pivot(columns="prob_4band", values="percentage", index="gss").fillna(0)
        if df.empty:
            return None
        return df
