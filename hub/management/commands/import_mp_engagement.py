from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import DataSet, DataType, Person, PersonData


class Command(BaseCommand):
    help = "Import MP engagement (open letters)"
    data_file = settings.BASE_DIR / "data" / "open_letters.csv"

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.data_types = self.create_data_types()
        df = self.get_df()
        self.import_results(df)

    def get_person_from_id(self, id):
        try:
            return Person.objects.get(external_id=id)
        except Person.DoesNotExist:
            return None

    def get_df(self):
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
                "description": "MP signed The Climate Coalition’s 2019 Net Zero Target joint letter",
                "label": "MP signed The Climate Coalition’s 2019 Net Zero Target joint letter",
                "source_label": "The Climate Coalition",
                "source": "https://www.theclimatecoalition.org/joint-letter-2019",
                "table": "person__persondata",
                "options": options,
                "subcategory": "sector_engagement",
                "comparators": DataSet.comparators_default(),
            },
        )
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
                "description": "MP signed Possible’s Onshore Wind Energy open letter",
                "label": "MP signed Possible’s 2019 Onshore Wind Energy open letter",
                "source_label": "Possible",
                "source": "https://www.wearepossible.org/onshore-wind/latest/open-letter-from-mps-to-the-prime-minister",
                "table": "person__persondata",
                "options": options,
                "subcategory": "sector_engagement",
                "comparators": DataSet.comparators_default(),
            },
        )
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
