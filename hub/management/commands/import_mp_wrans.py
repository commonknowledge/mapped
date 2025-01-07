from collections import defaultdict
from datetime import date, timedelta
from functools import cache

from django.core.management.base import BaseCommand

import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

from hub.models import AreaType, DataSet, DataType, Person, PersonData


class Command(BaseCommand):
    help = "Import relevant MP written questions, be default fetches data from previous day."

    departments = [
        "Department for Environment, Food and Rural Affairs",
        "Department for Energy Security and Net Zero",
    ]

    wrans_api_url = (
        "https://www.theyworkforyou.com/pwdata/scrapedxml/wrans/answers{date}.xml"
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

        parser.add_argument(
            "--start_date",
            action="store",
            help="Fetch all wrans from this date onwards",
        )

    def create_data_types(self):
        data_types = {}
        ds, created = DataSet.objects.update_or_create(
            name="mp_wrans",
            defaults={
                "data_type": "json",
                "description": "Recent relevant Written Questions in Parliament",
                "label": "MP written questions",
                "release_date": date.today(),
                "source_label": "Data from UK Parliament.",
                "source": "https://parliament.uk/",
                "table": "people__persondata",
                "subcategory": "",
                "comparators": DataSet.in_comparators(),
            },
        )

        ds.areas_available.add(AreaType.objects.get(code="WMC23"))

        data_type, created = DataType.objects.update_or_create(
            data_set=ds,
            name="mp_wrans",
            label="MP written questions",
            defaults={"data_type": "json"},
        )
        data_types["mp_wrans"] = data_type

        return data_types

    @cache
    def get_existing_data(self):
        lookup = {}

        for data in PersonData.objects.filter(
            data_type__name="mp_wrans"
        ).select_related("person"):
            lookup[data.person.external_id] = data.value()

        return lookup

    def get_wrans_from_date(self, start_date):
        fetch_date = date.fromisoformat(start_date)
        today = date.today()
        one_day = timedelta(1)

        wrans = defaultdict(list)
        while fetch_date < today:
            wrans = self.get_wrans_for_date(wrans, fetch_date)
            fetch_date = fetch_date + one_day

        return wrans

    def get_wrans_for_date(self, wrans, date):
        api_url = self.wrans_api_url.format(date=date.isoformat())
        response = requests.get(api_url)
        if response.status_code == 200:
            pw = response.text
            soup = BeautifulSoup(pw, "xml")
            mp = None
            question = {}
            department = None
            for tag in soup.publicwhip.children:
                if tag.name == "major-heading":
                    department = tag.text.strip()
                if tag.name == "minor-heading":
                    if question.get("department") in self.departments:
                        wrans[mp].append(question)
                    id = tag["id"].replace("uk.org.publicwhip/wrans/", "")
                    question = {
                        "department": department,
                        "area": tag.text.strip(),
                        "date": date.isoformat(),
                        "link": f"https://www.theyworkforyou.com/wrans/?id={id}",
                        "id": id,
                    }
                    mp = None
                if tag.name == "ques":
                    mp = tag["person_id"]
                    mp = mp.replace("uk.org.publicwhip/person/", "")
                    question["name"] = tag["speakername"]

            return wrans

        else:
            print(
                f"API didn't work for {date.isoformat()} - returned code: {str(response.status_code)}"
            )
            return wrans

    def import_results(self, wrans):
        if not self._quiet:
            print("Adding MP data on Written Answers")

        data = self.get_existing_data()

        for mp_id, questions in tqdm(wrans.items(), disable=self._quiet):
            mp = Person.objects.get(external_id=mp_id, person_type="MP")
            q_to_add = []
            if data.get(mp_id):
                questions.extend(data[mp_id])
                for question in questions:
                    if question["id"] not in [q["id"] for q in q_to_add]:
                        q_to_add.append(question)
            else:
                q_to_add = questions

            q_to_add = sorted(q_to_add, key=lambda q: q["date"], reverse=True)[:3]
            person_data, created = PersonData.objects.update_or_create(
                person=mp,
                data_type=self.data_types["mp_wrans"],
                defaults={
                    "json": q_to_add,
                },
            )

    def handle(self, quiet=False, start_date=None, *args, **options):
        self._quiet = quiet
        if not quiet:
            print("Getting recent relevant wrans from parliament")

        if start_date is None:
            yesterday = date.today() - timedelta(1)
            wrans = defaultdict(list)
            wrans = self.get_wrans_for_date(wrans, yesterday)
        else:
            wrans = self.get_wrans_from_date(start_date)

        self.data_types = self.create_data_types()
        self.import_results(wrans)
