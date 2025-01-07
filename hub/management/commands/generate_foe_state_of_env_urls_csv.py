from time import sleep

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils.text import slugify

import pandas as pd
import requests
from tqdm import tqdm

from hub.models import AreaData

RED = "\033[31m"
NOBOLD = "\033[0m"


class Command(BaseCommand):
    help = "Generate CSV of URLs of Friends of the Earth State of the Environment constituency urls."

    out_file = settings.BASE_DIR / "data" / "foe_cons_report_links.csv"

    exceptions = {
        "isle-of-wight-east": "isle-wight-east",
        "isle-of-wight-west": "isle-wight-west",
        "forest-of-dean": "forest-dean",
        "doncaster-east-and-the-isle-of-axholme": "doncaster-east-and-isle-axholme",
        "city-of-durham": "city-durham",
        "cities-of-london-and-westminster": "cities-london-and-westminster",
        "bridlington-and-the-wolds": "bridlington-and-wolds",
        "south-holland-and-the-deepings": "south-holland-and-deepings",
        "stoke-on-trent-central": "stoke-trent-central",
        "stoke-on-trent-north": "stoke-trent-north",
        "stoke-on-trent-south": "stoke-trent-south",
        "stratford-on-avon": "stratford-avon",
        "the-wrekin": "wrekin",
        "vale-of-glamorgan": "vale-glamorgan",
        "weald-of-kent": "weald-kent",
    }

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        df = self.build_dataframe()
        df.to_csv(self.out_file, index=False)

    def build_dataframe(self):
        area_datas = AreaData.objects.filter(
            area__area_type__code="WMC23",
            data_type__data_set__name="country",
            data__in=["England", "Wales"],
        ).select_related("area")

        df_data = []

        total_areas = area_datas.count()
        bad_urls = []
        all_good = True
        for data in tqdm(area_datas, disable=self._quiet, total=total_areas):
            slug = slugify(data.area.name)
            slug = self.exceptions.get(slug, slug)
            url = f"https://groups.friendsoftheearth.uk/near-you/constituency/{slug}"

            check = requests.get(url)
            if check.status_code == 200:
                df_data.append([data.area.gss, data.area.name, data.area.gss, url, url])
            else:
                all_good = False
                bad_urls.append(slug)

            # be kind
            sleep(1)

        if not all_good:
            print(f"{RED}Bad Urls{NOBOLD}")
            print("\n".join(bad_urls))

        df = pd.DataFrame(
            df_data,
            columns=[
                "pcon23",
                "area_name",
                "FileName",
                "pcon23_filename",
                "url",
            ],
        )

        return df
