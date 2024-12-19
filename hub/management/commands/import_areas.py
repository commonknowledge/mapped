import json
import logging
from time import sleep

# from django postgis
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon
from django.core.management.base import BaseCommand

from tqdm import tqdm

from hub.models import Area, AreaType
from utils import mapit, mapit_types

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Import basic area information from Mapit"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )
        parser.add_argument(
            "-a",
            "--all-names",
            action="store_true",
            help="Fetch alternative names from MapIt",
        )

    def handle(self, quiet: bool = False, all_names: bool = False, *args, **options):
        self.mapit_client = mapit.MapIt()
        for b_type in mapit_types.boundary_types:
            areas = self.mapit_client.areas_of_type(
                b_type["mapit_type"],
                {
                    "min_generation": 1,
                },
            )
            area_type, created = AreaType.objects.get_or_create(
                name=b_type["name"],
                code=b_type["code"],
                area_type=b_type["area_type"],
                description=b_type["description"],
            )

            if not quiet:
                print(f"Importing {b_type['name']} Areas")
            for area in tqdm(areas, disable=quiet):
                try:
                    self.import_area(area, area_type, all_names)
                except mapit.RateLimitException:
                    print("Rate limited, sleeping for 3 minutes then retrying...")
                    sleep(180)
                    self.import_area(area, area_type)

    def import_area(self, area, area_type, all_names):
        area_details = self.mapit_client.area_details(area["id"]) if all_names else {}

        if "gss" not in area["codes"]:
            # logger.debug(f"no gss code for {area['id']}")
            return

        geom = None
        try:
            geom_already_loaded = Area.objects.filter(
                gss=area["codes"]["gss"], polygon__isnull=False
            ).exists()
            if geom_already_loaded:
                # Only fetch geometry data if required, to speed things up
                # logger.debug(f"skipping geometry for {area['name']}")
                pass
            else:
                geom = self.mapit_client.area_geometry(area["id"])

                geom = {
                    "type": "Feature",
                    "geometry": geom,
                    "properties": {
                        "PCON13CD": area["codes"]["gss"],
                        "name": area["name"],
                        "type": area_type.code,
                        "mapit_type": area["type"],
                    },
                }
                geom_str = json.dumps(geom)
        except mapit.NotFoundException:  # pragma: no cover
            print(f"could not find mapit area for {area['name']}")
            geom = None

        a, created = Area.objects.update_or_create(
            gss=area["codes"]["gss"],
            area_type=area_type,
            defaults={
                "mapit_id": area["id"],
                "name": area["name"],
                "mapit_type": area["type"],
                "mapit_generation_low": area["generation_low"],
                "mapit_generation_high": area["generation_high"],
                "mapit_all_names": area_details.get("all_names"),
            },
        )

        if geom is not None:
            geos = json.dumps(geom["geometry"])
            geom = GEOSGeometry(geos)
            if isinstance(geom, Polygon):
                geom = MultiPolygon([geom])

            a.geometry = geom_str
            a.polygon = geom
            a.point = a.polygon.centroid
            a.save()
