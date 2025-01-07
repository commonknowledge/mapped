import logging
import urllib.request
from collections import Counter

from django.core.files import File
from django.core.management.base import BaseCommand

import magic
import pandas as pd
from tqdm import tqdm

from hub.models import Area, DataSet, DataType, Person, PersonData

from .base_importers import party_shades


class Command(BaseCommand):
    help = "Import Parliamentary Prospective Candidates for 2024 election"

    area_type = "WMC23"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet: bool = False, *args, **options):
        self.stderr.write("No longer in use after 2024 election date")
        return
        self._quiet = quiet
        # self.import_ppcs()

    def get_ppc_data(self):
        csv = "https://candidates.democracyclub.org.uk/data/export_csv/?election_date=&ballot_paper_id=&election_id=parl.2024-07-04&party_id=&cancelled=&extra_fields=gss&format=csv"
        df = pd.read_csv(csv)
        # make sure this is an int as sometimes it thinks it's a float and you
        # end up with duplicates
        df["person_id"] = df["person_id"].astype(int)

        return df

    def import_ppcs(self):
        df = self.get_ppc_data()

        party_dt = DataType.objects.get(name="party")

        ds, created = DataSet.objects.get_or_create(name="email")
        email_dt, created = DataType.objects.get_or_create(data_set=ds, name="email")

        if not self._quiet:
            print("Importing PPCs")

        imported_ids = []
        for _, ppc in tqdm(df.iterrows(), disable=self._quiet, total=df.shape[0]):
            area = Area.get_by_gss(ppc["gss"], area_type=self.area_type)
            if area is None:  # pragma: no cover
                area = Area.get_by_name(ppc["post_label"], area_type=self.area_type)
                if area is None:  # pragma: no cover
                    print(
                        f"Failed to add PPC {ppc['person_name']} as area {ppc['gss']}/{ppc['post_label']} does not exist"
                    )
                    continue

            if area and "person_id" in ppc:
                person, created = Person.objects.update_or_create(
                    person_type="PPC",
                    external_id=ppc["person_id"],
                    id_type="dc_candidate_id",
                    defaults={
                        "name": ppc["person_name"],
                        "area": area,
                    },
                )
                if not person.photo:
                    self.import_ppc_image(person, ppc["image"])

            if person:
                imported_ids.append(person.external_id)
                if not pd.isna(ppc["party_name"]):
                    try:
                        PersonData.objects.get_or_create(
                            person=person,
                            data_type=party_dt,
                            defaults={"data": ppc["party_name"]},
                        )
                    except PersonData.MultipleObjectsReturned:  # pragma: no cover
                        PersonData.objects.filter(
                            person=person, person__person_type="PPC", data_type=party_dt
                        ).delete()
                        PersonData.objects.create(
                            person=person, data_type=party_dt, data=ppc["party_name"]
                        )
                email = ppc["email"]
                if not pd.isna(email):
                    # Is currently importing wrapped in " so remove them
                    email = email.replace('"', "")
                    try:
                        PersonData.objects.get_or_create(
                            person=person,
                            data_type=email_dt,
                            defaults={"data": email},
                        )
                    except PersonData.MultipleObjectsReturned:  # pragma: no cover
                        PersonData.objects.filter(
                            person=person, person__person_type="PPC", data_type=email_dt
                        ).delete()
                        PersonData.objects.create(
                            person=person, data_type=email_dt, data=email
                        )

        # with merging etc the DC ids sometimes change so delete persons in the DB
        # that aren't in the list from DC
        ids = Person.objects.filter(person_type="PPC").values_list(
            "external_id", flat=True
        )

        extra_ids = set(ids) - set(imported_ids)

        Person.objects.filter(external_id__in=extra_ids).delete()

        dataset = DataSet.objects.filter(name="party", options=list())
        if dataset:
            parties = list()
            all_parties = list(
                PersonData.objects.filter(
                    data_type__data_set__name="party"
                ).values_list("data")
            )

            for party, count in Counter(all_parties).most_common():
                shade = party_shades.get(party[0], "#DCDCDC")
                parties.append(dict(title=party[0], shader=shade))

            dataset.update(options=parties)

    def import_ppc_image(self, ppc, image_url: str):
        try:
            logger.debug(f"Getting image for {ppc} from {image_url}")
            file, headers = urllib.request.urlretrieve(image_url)
            if not file:
                return
            mime_type = magic.from_file(file, mime=True)
            extension = mime_type.split("/")[1]
            image = File(open(file, "rb"))
            ppc.photo.save(f"ppc_dc_{ppc.external_id}.{extension}", image)
            ppc.save()
        except Exception as e:
            logger.debug(f"Error getting image for {ppc} from {image_url}: {e}")
