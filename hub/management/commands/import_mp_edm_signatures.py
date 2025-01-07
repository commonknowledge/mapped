from functools import cache

from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd
import requests
from tqdm import tqdm

from hub.models import AreaType, DataSet, DataType, Person, PersonData


class Command(BaseCommand):
    help = "Import relevant MP EDM signatures"

    edm_list = settings.BASE_DIR / "data" / "relevant_edms.csv"
    early_day_motion_ids = []
    edm_data = {}

    edm_api_url = "https://oralquestionsandmotions-api.parliament.uk/EarlyDayMotion/"

    def get_edm_list(self):
        df = pd.read_csv(self.edm_list)

        for _, row in df.iterrows():
            self.early_day_motion_ids.append(row["edm_id"])
            self.edm_data[row["edm_id"]] = {
                "description": row["description"],
                "release_date": row["release_date"],
            }

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        if not quiet:
            print("Getting relevant data on EDMs from Parliament API")
        self.get_edm_list()
        edms = self.get_all_edms()

        self.data_types = self.create_data_types(edms)
        self.delete_data()
        self.import_results(edms)

    @cache
    def get_parlid_lookup(self):
        lookup = {}

        for parlid in PersonData.objects.filter(data_type__name="parlid"):
            lookup[parlid.person_id] = parlid.value()

        return lookup

    def get_edm(self, edm_id):
        api_url = self.edm_api_url + str(edm_id)
        response = requests.get(api_url)
        if response.status_code == 200:
            data = response.json()["Response"]
            edm_name = data["Title"]
            date = data["DateTabled"]
            supporters = [str(member["MemberId"]) for member in data["Sponsors"]]

            parlid_lookup = self.get_parlid_lookup()

            not_in_office = [
                str(parlid_lookup[person_data.person_id])
                for person_data in PersonData.objects.filter(
                    person__person_type="MP",
                    data_type__name="mp_first_elected",
                    date__gt=date,
                ).select_related("person")
            ]
            all_members = [
                str(parlid_lookup[person.id])
                for person in Person.objects.filter(
                    person_type="MP", end_date__isnull=True
                ).order_by("external_id")
            ]
            did_not_support = [
                person_id
                for person_id in all_members
                if person_id not in supporters and person_id not in not_in_office
            ]
            edm_dict = {
                "id": edm_id,
                "edm_name": edm_name,
                "date": date,
            }
            for member in supporters:
                edm_dict[member] = "Supporter"
            for member in did_not_support:
                edm_dict[member] = "Did not support"
            for member in not_in_office:
                edm_dict[member] = "Not in office"

            return edm_dict
        else:
            print(
                f"Parliament API didn't work - returned code: {str(response.status_code)}"
            )
            return None

    def get_all_edms(self):
        edms = []
        for edm_id in self.early_day_motion_ids:
            new_edm_data = self.get_edm(edm_id)
            if new_edm_data:
                edms.append(new_edm_data)
        return edms

    def get_machine_name(self, item):
        item_id = str(item["id"])
        if "edm_name" in item:
            return f"{item_id}_edm"

    def create_data_types(self, edms):
        data_types = {}
        edm_options = [
            {"title": "Supporter", "shader": "blue-500"},
            {"title": "Did not support", "shader": "gray-500"},
            {"title": "Not in office", "shader": "gray-300"},
        ]

        for edm in edms:
            edm_machine_name = self.get_machine_name(edm)
            ds, created = DataSet.objects.update_or_create(
                name=edm_machine_name,
                defaults={
                    "data_type": "string",
                    "description": self.edm_data[edm["id"]]["description"],
                    "label": f"MP support for {edm['edm_name']}",
                    "release_date": self.edm_data[edm["id"]]["release_date"],
                    "source_label": "Data from UK Parliament.",
                    "source": "https://parliament.uk/",
                    "table": "people__persondata",
                    "options": edm_options,
                    "subcategory": "supporter",
                    "comparators": DataSet.comparators_default(),
                },
            )

            for at in AreaType.objects.filter(code__in=["WMC23"]):
                ds.areas_available.add(at)

            data_type, created = DataType.objects.update_or_create(
                data_set=ds,
                name=edm_machine_name,
                defaults={"data_type": "text"},
            )
            data_types[edm_machine_name] = data_type
        return data_types

    def import_results(self, edms):
        if not self._quiet:
            print("Adding MP data on EDMS to database")

        parlid_lookup = self.get_parlid_lookup()

        for mp in tqdm(Person.objects.filter(person_type="MP"), disable=self._quiet):
            mp_id = parlid_lookup[mp.id]

            for edm in edms:
                if mp_id in edm:
                    edm_machine_name = self.get_machine_name(edm)
                    person_data, created = PersonData.objects.update_or_create(
                        person=mp,
                        data_type=self.data_types[edm_machine_name],
                        data=edm[mp_id],
                    )

    def delete_data(self):
        PersonData.objects.filter(data_type__in=self.data_types.values()).delete()
