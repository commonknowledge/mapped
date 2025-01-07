import re

from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import AreaType, DataSet, DataType, Person, PersonData


class Command(BaseCommand):
    help = "Import MP Job titles"
    data_file = settings.BASE_DIR / "data" / "mp_positions_jul_2024.csv"

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.import_results()

    def get_area_type(self):
        return AreaType.objects.get(code="WMC23")

    def get_df(self):

        if not self.data_file.exists():
            self.stderr.write(f"Data file {self.data_file} does not exist")
            return None

        df = pd.read_csv(
            self.data_file,
            usecols=["mp", "position"],
        )
        return df

    def create_data_type(self):
        mp_job_titles_ds, created = DataSet.objects.update_or_create(
            name="job_titles",
            defaults={
                "data_type": "text",
                "description": "Positions such as cabinet and shadow minister roles, spokespeople, and whips.",
                "release_date": "July 2024",
                "label": "MP positions (job titles)",
                "source_label": "Data compiled by mySociety from Gov.uk and Parliament.",
                "source": "https://www.mysociety.org",
                "table": "people__persondata",
                "comparators": DataSet.string_comparators(),
            },
        )
        mp_job_titles_ds.areas_available.add(self.get_area_type())

        mp_job_titles, created = DataType.objects.update_or_create(
            data_set=mp_job_titles_ds,
            name="job_titles",
            area_type=self.get_area_type(),
            defaults={"data_type": "text"},
        )

        return mp_job_titles

    def get_results(self, df: pd.DataFrame):
        results = {}
        if not self._quiet:
            print("Matching MPs with titles")
        for index, row in df.iterrows():
            if pd.isna(row.mp):
                continue
            try:
                person = Person.objects.get(name=row.mp, person_type="MP")
                results[person] = row.position
            except Person.DoesNotExist:
                print(f"MP: {row.mp} not found.")
        return results

    def add_results(self, results, data_type):
        mp_list = []
        for mp, job_title in tqdm(results.items(), disable=self._quiet):
            job_title = re.sub("<br/?>", "\n", job_title)
            data, created = PersonData.objects.update_or_create(
                person=mp,
                data_type=data_type,
                data=job_title,
            )
            mp_list.append(data.id)

        # clear out old job titles, which we assume to be anyone without a current job
        PersonData.objects.filter(data_type=data_type).exclude(pk__in=mp_list).delete()

    def import_results(self):

        df = self.get_df()

        if df is None or df.empty:
            return

        data_type = self.create_data_type()
        results = self.get_results(df)
        self.add_results(results, data_type)
