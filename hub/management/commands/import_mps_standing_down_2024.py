from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import AreaType, DataSet, DataType, Person, PersonData


class Command(BaseCommand):
    help = "Import MPs standing down in 2024"
    data_file = settings.BASE_DIR / "data" / "mps_standing_down_2024.xlsx"
    data_url = (
        "https://researchbriefings.files.parliament.uk/documents/CBP-9808/CBP-9808.xlsx"
    )

    name_map = {
        "John Cruddas": "Jon Cruddas",
        "Matt Hancock": "Matthew Hancock",
        "William Cash": "Bill Cash",
        "Robert Neill": "Bob Neill",
        "Dan Poulter": "Daniel Poulter",
        "Jeffrey Donaldson": "Jeffrey M. Donaldson",
        "David Evenett": "David Evennett",
    }

    def get_area_type(self):
        return AreaType.objects.get(code="WMC")

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        df = self.get_df()

        if df is None:
            if not self.data_file.exists():
                self.stderr.write(f"Data file {self.data_file} does not exist")
            return
        self.data_types = self.create_data_types()
        self.import_results(df)

    def get_person_from_name(self, name):
        name = self.name_map.get(name, name)
        try:
            person = Person.objects.get(name=name, person_type="MP")
            return person
        except Person.DoesNotExist:
            self.stderr.write(f"could not find a person for {name}")
            return None

    def get_df(self):

        if not self.data_file.exists():
            self.stderr.write(f"Data file {self.data_file} does not exist")
            return None

        df = pd.read_excel(self.data_file, header=1, sheet_name="MPs standing down")
        df = df.dropna(subset=["Name"])
        df.Name = df.Name.str.strip()
        df.Name = df.Name.str.replace("Sir |Dame |Dr ", "", regex=True)
        df["mp"] = df.Name.apply(lambda name: self.get_person_from_name(name))
        return df[["mp", "Date announced"]]

    def create_data_types(self):
        options = [{"title": "Standing Down", "shader": "purple-500"}]
        data_types = {}

        ds, created = DataSet.objects.update_or_create(
            name="mp_standing_down_2024",
            defaults={
                "data_type": "string",
                "label": "MP standing down at the 2024 election",
                "source_label": "Data from the House of Commons Library.",
                "release_date": "April 2024",
                "source": "https://commonslibrary.parliament.uk/research-briefings/cbp-9808/",
                "data_url": "https://researchbriefings.files.parliament.uk/documents/CBP-9808/CBP-9808.xlsx",
                "table": "people__persondata",
                "options": options,
                "subcategory": "",
                "comparators": DataSet.comparators_default(),
                "is_public": True,
            },
        )
        ds.areas_available.add(self.get_area_type())
        data_type, created = DataType.objects.update_or_create(
            data_set=ds,
            name="mp_standing_down_2024",
            area_type=self.get_area_type(),
            defaults={"data_type": "text"},
        )

        data_types["mp_standing_down_2024"] = data_type

        return data_types

    def import_results(self, df):
        self.stdout.write("Importing MPs standing down")
        for index, row in tqdm(df.iterrows(), disable=self._quiet):
            if not pd.isna(row.mp):
                data, created = PersonData.objects.update_or_create(
                    person=row.mp,
                    data_type=self.data_types["mp_standing_down_2024"],
                    data="Standing Down",
                )
