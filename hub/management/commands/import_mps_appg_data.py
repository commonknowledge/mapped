from datetime import date
from pathlib import Path

from django.core.management.base import BaseCommand

from mysoc_dataset import get_dataset_df, get_dataset_url
from tqdm import tqdm

from hub.models import AreaType, DataSet, DataType, Person, PersonData

party_lookup = {
    "Conservative": "Conservative Party",
    "Labour": "Labour Party",
    "Liberal Democrat": "Liberal Democrats",
    "Labour (Co-op)": "Labour Co-operative",
    "Independent": "independent politician",
    "Alliance": "Alliance Party of Northern Ireland",
    "Green Party": "Green Party",
    "Speaker": "Speaker of the House of Commons",
    "Social Democratic & Labour Party": "Social Democratic and Labour Party",
}


class Command(BaseCommand):
    help = "Import data on what APPGs an MP is part of"

    source_url = "https://www.parliament.uk/mps-lords-and-offices/standards-and-financial-interests/parliamentary-commissioner-for-standards/registers-of-interests/register-of-all-party-party-parliamentary-groups/"
    data_url = get_dataset_url(
        repo_name="mp-appg-membership-data",
        package_name="mp_appg_membership_data",
        version_name="latest",
        file_name="appg_officers.csv",
        done_survey=True,
    )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.import_results()

    def add_mps(self, df):
        # Adds the MPs as Person objects to the df - note that this sill not add all
        # of the officers in the df, because some of them are in the house of Lords,
        # rather than are MPs.
        twfy_ids = PersonData.objects.filter(data_type__data_set__name="twfyid")
        df.twfy_id = df.twfy_id.str[25:].astype(int)
        df["mp"] = df.twfy_id.dropna().apply(
            lambda x: (
                twfy_ids.filter(data=x).first().person
                if twfy_ids.filter(data=x)
                else None
            )
        )
        df = df.dropna(subset="mp")
        return df

    def get_climate_appgs(self):

        climate_appgs_list = Path("data", "climate_APPGs.txt")

        if not climate_appgs_list.exists():
            print("Climate APPGs list not found")
            return []

        with climate_appgs_list.open("r") as fh:
            climate_appgs = [line.replace("\n", "") for line in fh.readlines()]
        return climate_appgs

    def get_df(self):
        df = get_dataset_df(
            repo_name="mp-appg-membership-data",
            package_name="mp_appg_membership_data",
            version_name="latest",
            file_name="appg_officers.csv",
            done_survey=True,
        )
        # Limit the df to only the APPGs relating to climate
        # (Currently, this is done by reading from a list produced
        # by searching for various keywords related to climate in the
        # title and purposes of the APPGs)
        climate_appgs = self.get_climate_appgs()
        df = df[df.appg_name.isin(climate_appgs)]
        df = self.add_mps(df)
        return df

    def create_data_type(self):
        climate_appgs = self.get_climate_appgs()
        climate_appgs.sort(key=lambda x: x.replace("'", ""))
        options = [dict(title=appg, shader="#DCDCDC") for appg in climate_appgs]

        appg_membership_ds, created = DataSet.objects.update_or_create(
            name="mp_appg_memberships",
            defaults={
                "data_type": "text",
                "description": "Membership in APPGs as published on the parliament website.",
                "release_date": str(date.today()),
                "label": "MP APPG memberships",
                "source_label": "Data from UK Parliament.",
                "source": "https://parliament.uk/",
                "table": "people__persondata",
                "options": options,
                "is_shadable": False,
                "comparators": DataSet.in_comparators(),
            },
        )

        for at in AreaType.objects.filter(code__in=["WMC", "WMC23"]):
            appg_membership_ds.areas_available.add(at)

        appg_membership, created = DataType.objects.update_or_create(
            data_set=appg_membership_ds,
            name="mp_appg_memberships",
            defaults={"data_type": "text"},
        )

        return appg_membership

    def get_results(self):
        mps = Person.objects.filter(person_type="MP")
        df = self.get_df()
        results = {}
        for mp in mps.all():
            mp_df = df[df.mp == mp]
            if len(mp_df) != 0:
                results[mp] = list(mp_df.appg_name)
        return results

    def add_results(self, results, data_type):
        print("Adding APPG data to Django database")
        for mp, result_list in tqdm(results.items(), disable=self._quiet):
            for result in result_list:
                data, created = PersonData.objects.update_or_create(
                    person=mp,
                    data_type=data_type,
                    data=result,
                )

    def import_results(self):
        data_type = self.create_data_type()
        results = self.get_results()
        self.add_results(results, data_type)
