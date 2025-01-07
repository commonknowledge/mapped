from datetime import date

from django.core.management.base import BaseCommand

import pandas as pd
import requests
from tqdm import tqdm

from hub.models import AreaType, DataSet, DataType, PersonData

COMMITTEE_REQUEST_URL = "https://committees-api.parliament.uk/api/Committees"


class Command(BaseCommand):
    help = "Import select committee memberships for UK Members of Parliament"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.import_results()

    def get_df(self):
        if not self._quiet:
            self.stdout.write("Fetching all current Select Committee memberships")

        mps = PersonData.objects.filter(
            data_type__name="parlid", person__person_type="MP"
        ).select_related("person")
        mp_ids = list(mps.values_list("data", flat=True))

        select_committees_json = []
        for mp in tqdm(mp_ids, disable=self._quiet):
            response = requests.get(
                f"https://committees-api.parliament.uk/api/Members?Members={str(mp)}&MembershipStatus=Current&CommitteeCategory=Select"
            )
            if response.status_code == 200:
                response_json = response.json()
                if response_json != []:
                    select_committees_json.extend(response_json)
            else:
                self.stdout.write(f"Request failed for MP with ID: {str(mp)}")
        if len(select_committees_json) == 0:
            # if say, there's an election
            self.stdout.write("No current Select Committee memberships found")
            return None
        df = pd.DataFrame.from_records(select_committees_json)[["committees", "id"]]
        df = df.explode("committees")
        df["committee_name"] = df.committees.str["name"]
        df["mp"] = df.id.apply(lambda mp_id: mps.get(data=mp_id))
        return df

    def create_data_types(self):
        if not self._quiet:
            self.stdout.write("Creating data set and type")
        select_committee_membership_ds, created = DataSet.objects.update_or_create(
            name="select_committee_membership",
            defaults={
                "data_type": "text",
                "description": "Membership in Select Committees as published on the parliament website",
                "label": "MP Select Committee memberships",
                "source_label": "Data from UK Parliament.",
                "release_date": str(date.today()),
                "source": "https://parliament.uk/",
                "table": "people__persondata",
                "is_shadable": False,
                "comparators": DataSet.in_comparators(),
            },
        )

        for at in AreaType.objects.filter(code__in=["WMC", "WMC23"]):
            select_committee_membership_ds.areas_available.add(at)

        select_committee_membership, created = DataType.objects.update_or_create(
            data_set=select_committee_membership_ds,
            name="select_committee_membership",
            defaults={"data_type": "text"},
        )

        return select_committee_membership

    def add_results(self, results: pd.DataFrame, data_type):
        if not self._quiet:
            self.stdout.write("Adding Select Committee Membership")
        for index, result in tqdm(results.iterrows(), disable=self._quiet):
            committee_membership, created = PersonData.objects.update_or_create(
                person=result.mp.person,
                data_type=data_type,
                defaults={"data": result.committee_name},
            )

    def import_results(self):
        data_type = self.create_data_types()
        df = self.get_df()
        if not df.empty:
            self.add_results(df, data_type)
