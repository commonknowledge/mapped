from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import AreaType, DataSet, DataType, PersonData


class Command(BaseCommand):
    help = "Import MP engagement (open letters)"
    data_file = settings.BASE_DIR / "data" / "open_letters.csv"

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.data_types = self.create_data_types()
        df = self.get_df()
        if df is None or df.empty:
            if not self._quiet:
                self.stdout.write(
                    f"Data file {self.data_file} not found or contains no data"
                )
            return
        self.import_results(df)

    def get_person_from_id(self, id):
        try:
            data = PersonData.objects.get(data_type__name="parlid", data=id)
            return data.person
        except PersonData.DoesNotExist:
            return None

    def get_df(self):
        if not self.data_file.exists():
            return None
        df = pd.read_csv(self.data_file)
        df["mp"] = df.id_parlid.apply(lambda parlid: self.get_person_from_id(parlid))
        return df[["mp", "letter"]]

    def create_data_types(self):
        options = [{"title": "Signed", "shader": "blue-500"}]
        data_types = {}

        ds, created = DataSet.objects.update_or_create(
            name="net_zero_target",
            defaults={
                "data_type": "string",
                "label": "MP signed The Climate Coalition’s 2019 Net Zero Target joint letter",
                "source_label": "Data from The Climate Coalition.",
                "release_date": "June 2019",
                "source": "https://www.theclimatecoalition.org/joint-letter-2019",
                "table": "people__persondata",
                "options": options,
                "subcategory": "sector_engagement",
                "comparators": DataSet.comparators_default(),
            },
        )

        for at in AreaType.objects.filter(code__in=["WMC", "WMC23"]):
            ds.areas_available.add(at)

        data_type, created = DataType.objects.update_or_create(
            data_set=ds,
            name="net_zero_target",
            defaults={"data_type": "text"},
        )

        data_types["net_zero_target"] = data_type
        ds, created = DataSet.objects.update_or_create(
            name="onshore_wind_energy",
            defaults={
                "data_type": "string",
                "label": "MP signed Possible’s 2019 Onshore Wind Energy open letter",
                "source_label": "Data from Possible.",
                "release_date": "October 2019",
                "source": "https://www.wearepossible.org/onshore-wind/latest/open-letter-from-mps-to-the-prime-minister",
                "table": "people__persondata",
                "options": options,
                "subcategory": "sector_engagement",
                "comparators": DataSet.comparators_default(),
            },
        )

        for at in AreaType.objects.filter(code__in=["WMC", "WMC23"]):
            ds.areas_available.add(at)

        data_type, created = DataType.objects.update_or_create(
            data_set=ds,
            name="onshore_wind_energy",
            defaults={"data_type": "text"},
        )
        data_types["onshore_wind_energy"] = data_type

        return data_types

    def import_results(self, df):
        print("Adding MP Engagement data to the database")
        for index, row in tqdm(df.iterrows(), disable=self._quiet):
            if row.mp:
                data, created = PersonData.objects.update_or_create(
                    person=row.mp,
                    data_type=self.data_types[row.letter],
                    data="Signed",
                )
