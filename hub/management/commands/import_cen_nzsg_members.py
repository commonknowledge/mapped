from pathlib import Path

from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import AreaType, DataSet, DataType, Person, PersonData


class Command(BaseCommand):
    help = "Import CEN and NZSG Members"

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.import_results()

    def get_df(self):

        file_loc = Path("data", "cen_nzsg_members.csv")
        if not file_loc.exists():
            return None

        df = pd.read_csv(file_loc, true_values=["CEN", "NZSG"])
        df.columns = ["mp_name", "cen", "nzsg"]

        return df

    def create_data_types(self):
        options = [
            {"title": "True", "shader": "blue-500"},
            {"title": "False", "shader": "orange-500"},
        ]
        cen_ds, created = DataSet.objects.update_or_create(
            name="cen_member",
            defaults={
                "data_type": "bool",
                "description": "MPs in the CEN’s parliamentary caucus are united around conservative environmentalist principles and championing greater environmental action in Parliament.",
                "label": "MP membership of Conservative Environment Network (CEN)",
                "source_label": "Data from CEN, collated by mySociety.",
                "release_date": "January 2023",
                "source": "https://www.cen.uk.com/our-caucus",
                "table": "people__persondata",
                "options": options,
                "comparators": DataSet.comparators_default(),
            },
        )
        nzsg_ds, created = DataSet.objects.update_or_create(
            name="nzsg_member",
            defaults={
                "data_type": "bool",
                "description": "MPs in the Net Zero Scrutiny Group generally oppose the government’s net zero policies.",
                "label": "MP supporter of Net Zero Scrutiny Group (NZSG)",
                "source_label": "Data from public sources, collated by DeSmog.",
                "release_date": "January 2023",
                "source": "https://www.desmog.com/net-zero-scrutiny-group/",
                "table": "people__persondata",
                "options": options,
                "comparators": DataSet.comparators_default(),
            },
        )

        for at in AreaType.objects.filter(code__in=["WMC", "WMC23"]):
            nzsg_ds.areas_available.add(at)
            cen_ds.areas_available.add(at)

        cen, created = DataType.objects.update_or_create(
            data_set=cen_ds,
            name="cen_member",
            defaults={"data_type": "bool"},
        )
        nzsg, created = DataType.objects.update_or_create(
            data_set=nzsg_ds,
            name="nzsg_member",
            defaults={"data_type": "bool"},
        )

        return {"cen": cen, "nzsg": nzsg}

    def get_results(self):
        mps = Person.objects.filter(person_type="MP")
        df = self.get_df()
        if df is None or df.empty:
            return {}
        results = {}
        print("Name matching MPs")
        for index, row in df.iterrows():
            try:
                mp = mps.get(name__iexact=row.mp_name)

                results[mp] = row[["cen", "nzsg"]].dropna().index.to_list()
            except Person.DoesNotExist:
                print(f"MP: {row.mp_name} not found.")
        return results

    def add_results(self, results, data_types):
        print("Adding MP CEN and NZSG memberships to Django database")
        for mp, result in tqdm(results.items(), disable=self._quiet):
            for data_type in result:
                data, created = PersonData.objects.update_or_create(
                    person=mp,
                    data_type=data_types[data_type],
                    defaults={"data": True},
                )

    def import_results(self):
        data_types = self.create_data_types()
        results = self.get_results()
        self.add_results(results, data_types)
