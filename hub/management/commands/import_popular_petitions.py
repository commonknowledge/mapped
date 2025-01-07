import json
from datetime import date

from django.conf import settings

from hub.models import Area, AreaData

from .base_importers import BaseAreaImportCommand


class Command(BaseAreaImportCommand):
    help = "Import popular petition data"

    data_file = settings.BASE_DIR / "data" / "petitions.json"
    message = "Importing petition data"
    area_type = "WMC"
    data_sets = {
        "constituency_popular_petitions": {
            "defaults": {
                "source": "https://petition.parliament.uk/",
                "source_label": "Data from UK Government and Parliament Petitions.",
                "release_date": str(date.today()),
                "name": "constituency_popular_petitions",
                "label": "Popular petitions",
                "data_type": "json",
                "category": "place",
                "source_type": "json",
                "table": "areadata",
                "is_shadable": False,
                "is_filterable": False,
                "unit_type": "percentage",
                "unit_distribution": "people_in_area",
            },
        }
    }

    def process_data(self):
        if not self._quiet:
            self.stdout.write(self.message)

        data_type = self.data_types["constituency_popular_petitions"]

        with open(self.data_file) as input:
            data = json.load(input)

            for gss, petitions in data.items():
                area = Area.get_by_gss(gss, area_type=self.area_type)
                if area is None:
                    self.stdout.write(
                        f"Failed to find area with code {gss} and area type {self.area_type}"
                    )
                    continue

                data, created = AreaData.objects.update_or_create(
                    data_type=data_type,
                    area=area,
                    defaults={"json": petitions},
                )

    def handle(self, quiet=False, *args, **kwargs):
        self._quiet = quiet
        if not self.data_file.exists():
            if not self._quiet:
                self.stdout.write(f"Data file {self.data_file} not found")
            return
        self.add_data_sets()
        self.delete_data()
        self.process_data()
