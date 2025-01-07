from functools import cache

from django.core.management.base import BaseCommand

import requests
from tqdm import tqdm

from hub.models import AreaType, DataSet, DataType, Person, PersonData


class Command(BaseCommand):
    help = "Import relevant MP votes + support on amendments, etc"

    vote_division_ids = [1116, 1372]
    early_day_motion_ids = [58953, 60083]

    vote_api_url = "https://commonsvotes-api.parliament.uk/data/division/"
    edm_api_url = "https://oralquestionsandmotions-api.parliament.uk/EarlyDayMotion/"

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        # Relevant votes
        if not quiet:
            print("Getting relevant votes from Parliament API")
        votes = self.get_all_relevant_votes()

        if not quiet:
            print("Getting relevant data on EDMs from Parliament API")
        edms = self.get_all_edms()

        self.data_types = self.create_data_types(votes, edms)
        self.delete_data()
        self.import_results(votes, edms)

    @cache
    def get_parlid_lookup(self):
        lookup = {}

        for parlid in PersonData.objects.filter(data_type__name="parlid"):
            lookup[parlid.person_id] = parlid.value()

        return lookup

    def get_votes(self, division_id):
        api_url = self.vote_api_url + str(division_id) + ".json"
        response = requests.get(api_url)
        if response.status_code == 200:
            data = response.json()
            date = data["Date"]
            vote_name = data["Title"].split(":")[0]
            vote_dict = {
                "id": division_id,
                "vote_name": vote_name,
                "date": date,
            }

            for member in data["AyeTellers"] + data["NoTellers"]:
                vote_dict[str(member["MemberId"])] = "Did not vote (teller)"
            for member in data["Ayes"]:
                vote_dict[str(member["MemberId"])] = "Aye"
            for member in data["Noes"]:
                vote_dict[str(member["MemberId"])] = "No"
            for member in data["NoVoteRecorded"]:
                vote_dict[str(member["MemberId"])] = "Did not vote"

            parlid_lookup = self.get_parlid_lookup()

            not_in_office_members = [
                str(parlid_lookup[person_data.person_id])
                for person_data in PersonData.objects.filter(
                    data_type__name="mp_first_elected"
                ).filter(data__gt=date)
            ]
            for member in not_in_office_members:
                vote_dict[member] = "Not in office"
            return vote_dict

        else:
            print(
                f"Parliament API didn't work - returned code: {str(response.status_code)}"
            )
            return None

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

    def get_all_relevant_votes(self):
        votes = []
        for division_id in self.vote_division_ids:
            new_vote_data = self.get_votes(division_id)
            if new_vote_data:
                votes.append(new_vote_data)
        return votes

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
        else:
            return f"{item_id}_vote"

    def create_data_types(self, votes, edms):
        data_types = {}
        vote_options = [
            {"title": "Aye", "shader": "blue-500"},
            {"title": "No", "shader": "orange-500"},
            {"title": "Did not vote", "shader": "gray-500"},
            {"title": "Did not vote (teller)", "shader": "gray-500"},
            {"title": "Not in office", "shader": "gray-300"},
        ]
        edm_options = [
            {"title": "Supporter", "shader": "blue-500"},
            {"title": "Did not support", "shader": "gray-500"},
            {"title": "Not in office", "shader": "gray-300"},
        ]
        descriptions = {
            "1116_vote": "The final vote on what became the Environment Act 2021, establishing the UK’s new legal framework for environmental protection, post-Brexit.",
            "1372_vote": "A Conservative majority saw this ban rejected, but a handful of Conservative MPs refused to vote on this topic.",
            "58953_edm": "MPs who supported this Early Day Motion are likely to support other pro-climate and international climate justice policies.",
            "60083_edm": "MPs who supported this Early Day Motion are likely to support other pro-climate and international climate justice policies.",
        }

        release_dates = {
            "1116_vote": "October 2021",
            "1372_vote": "October 2022",
            "58953_edm": "September 2021",
            "60083_edm": "September 2022",
        }
        for vote in votes:
            vote_machine_name = self.get_machine_name(vote)
            ds, created = DataSet.objects.update_or_create(
                name=vote_machine_name,
                defaults={
                    "data_type": "string",
                    "description": descriptions[vote_machine_name],
                    "label": f"MP vote on {vote['vote_name']}",
                    "release_date": release_dates[vote_machine_name],
                    "source_label": "Data from UK Parliament.",
                    "source": "https://parliament.uk/",
                    "table": "people__persondata",
                    "options": vote_options,
                    "subcategory": "vote",
                    "comparators": DataSet.in_comparators(),
                },
            )

            for at in AreaType.objects.filter(code__in=["WMC", "WMC23"]):
                ds.areas_available.add(at)

            data_type, created = DataType.objects.update_or_create(
                data_set=ds,
                name=vote_machine_name,
                defaults={"data_type": "text"},
            )
            data_types[vote_machine_name] = data_type

            for edm in edms:
                edm_machine_name = self.get_machine_name(edm)
                ds, created = DataSet.objects.update_or_create(
                    name=edm_machine_name,
                    defaults={
                        "data_type": "string",
                        "description": descriptions[edm_machine_name],
                        "label": f"MP support for {edm['edm_name']}",
                        "release_date": release_dates[edm_machine_name],
                        "source_label": "Data from UK Parliament.",
                        "source": "https://parliament.uk/",
                        "table": "people__persondata",
                        "options": edm_options,
                        "subcategory": "supporter",
                        "comparators": DataSet.comparators_default(),
                    },
                )

                for at in AreaType.objects.filter(code__in=["WMC", "WMC23"]):
                    ds.areas_available.add(at)

                data_type, created = DataType.objects.update_or_create(
                    data_set=ds,
                    name=edm_machine_name,
                    defaults={"data_type": "text"},
                )
                data_types[edm_machine_name] = data_type
        return data_types

    def import_results(self, votes, edms):
        if not self._quiet:
            print("Adding MP data on relevant votes + EDMS to database")

        parlid_lookup = self.get_parlid_lookup()

        for mp in tqdm(Person.objects.filter(person_type="MP"), disable=self._quiet):
            mp_id = parlid_lookup[mp.id]

            for vote in votes:
                if mp_id in vote:
                    vote_machine_name = self.get_machine_name(vote)
                    person_data, created = PersonData.objects.update_or_create(
                        person=mp,
                        data_type=self.data_types[vote_machine_name],
                        data=vote[mp_id],
                    )
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
