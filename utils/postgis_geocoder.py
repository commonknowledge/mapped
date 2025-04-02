import dataclasses
import logging

from django.conf import settings
from django.contrib.gis.geos import Point
from django.db import connection

from asgiref.sync import sync_to_async

from utils.postcodesIO import Codes, PostcodesIOResult

logger = logging.getLogger(__name__)


CURRENT_MAPIT_GENERATION = settings.CURRENT_MAPIT_GENERATION


async def get_bulk_postcode_geo_from_coords(coordinates: list[Point]):
    """
    Async wrapper for sync function, required to plug into a DataLoader() instance.
    """
    results = await sync_to_async(_get_bulk_postcode_geo_from_coords)(coordinates)
    return [dataclasses.asdict(r) for r in results]


def _get_bulk_postcode_geo_from_coords(
    coordinates: list[Point],
) -> list[PostcodesIOResult]:
    logger.info(
        f"PostGIS geocoding {len(coordinates)}, first item: {coordinates[0] if coordinates else None}"
    )

    with connection.cursor() as cursor:
        # Create a temporary values table to JOIN to the area table (multiple times)
        parameters = []
        values = []
        for i, coordinate in enumerate(coordinates):
            values.append("(%s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))")
            parameters.append(i)
            parameters.append(coordinate.x)
            parameters.append(coordinate.y)
            parameters.append(coordinate.x)
            parameters.append(coordinate.y)

        values = f"VALUES {', '.join(values)}"

        # For each area type, add a SELECT and a LEFT JOIN
        area_selects = []
        area_joins = []

        # Area type format is:
        # (alias, LIH code/MapIt codes, MapIt generation)
        area_types = [
            ("postcode", "PC", None),
            ("postcode_sector", "PCS", None),
            ("postcode_district", "PCD", None),
            ("postcode_area", "PCA", None),
            ("output_area", "OA21", None),
            ("lsoa", "LSOA", None),
            ("msoa", "MSOA", None),
            ("wmc", "WMC23", CURRENT_MAPIT_GENERATION),
            ("ward", "WD23", CURRENT_MAPIT_GENERATION),
            (
                "county",
                ["CTY"],
                CURRENT_MAPIT_GENERATION,
            ),  # Array is interpreted as MapIt code instead of AreaType code
            (
                "district",
                ["LBO", "UTA", "COI", "LGD", "MTD", "DIS", "NMD"],
                CURRENT_MAPIT_GENERATION,
            ),
            ("eer", "EER", None),
        ]
        for alias, code, mapit_gen in area_types:
            area_selects.append(
                f"{alias}.gss AS {alias}_code, {alias}.name AS {alias}_name"
            )

            if isinstance(code, str):
                area_filter = f"area_type_id = (SELECT id FROM hub_areatype WHERE code = '{code}')"
            else:
                codes = [f"'{c}'" for c in code]
                area_filter = f"mapit_type IN ({', '.join(codes)})"

            if mapit_gen:
                area_filter += f" AND mapit_generation_high = {mapit_gen}"

            gis_query = f"""
            SELECT id FROM hub_area WHERE {area_filter} AND ST_Contains(polygon, temp.point) LIMIT 1
            """
            join = f"LEFT JOIN hub_area AS {alias} ON {alias}.id = ({gis_query})"
            area_joins.append(join)

        area_selects = ",\n".join(area_selects)
        area_joins = "\n".join(area_joins)

        query = f"""
        SELECT
          temp.i,
          temp.y AS latitude,
          temp.x AS longitude,
          {area_selects}
        FROM
          (
            SELECT * FROM ({values}) AS temp (i, x, y, point)
          ) AS temp
          {area_joins}
        """

        cursor.execute(query, parameters)
        rows = cursor.fetchall()
        columns: list[str] = [col[0] for col in cursor.description]

    # Combine the results by input index, keeping the areas with the highest MapIt generation
    # (not sure how to do this in the database query)
    result_map = {}
    for row in rows:
        result = dict(zip(columns, row))
        index = result["i"]
        previous_result = result_map.get(index)
        if previous_result:
            logger.warning(f"Multiple PostGIS geocode results for {coordinates[index]}")
        result_map[index] = result

    # Return results in the same order as the input list
    results = []
    for index in range(len(coordinates)):
        result = result_map[index]
        incode = None
        outcode = None
        if result["postcode_name"]:
            postcode_parts = result["postcode_name"].split(" ")
            if len(postcode_parts) == 2:
                incode = postcode_parts[0]
                outcode = postcode_parts[1]
            else:
                logger.warning(
                    f"Bad geocoded postcode for {coordinates[index]}: {result['postcode_name']}"
                )
        results.append(
            PostcodesIOResult(
                longitude=float(result["longitude"]),
                latitude=float(result["latitude"]),
                incode=incode,
                outcode=outcode,
                postcode=result["postcode_name"],
                postcode_sector=result["postcode_sector_name"],
                postcode_district=result["postcode_district_name"],
                postcode_area=result["postcode_area_name"],
                european_electoral_region=result["eer_name"],
                lsoa=result["lsoa_name"],
                msoa=result["msoa_name"],
                output_area=result["output_area_name"],
                parliamentary_constituency=result["wmc_name"],
                parliamentary_constituency_2024=result["wmc_name"],
                admin_district=result["district_name"],
                admin_county=result["county_name"],
                admin_ward=result["ward_name"],
                quality=None,
                eastings=None,
                northings=None,
                country=None,
                nhs_ha=None,
                primary_care_trust=None,
                region=None,
                parish=None,
                date_of_introduction=None,
                ccg=None,
                nuts=None,
                pfa=None,
                codes=Codes(
                    postcode_sector=result["postcode_sector_code"],
                    postcode_district=result["postcode_district_code"],
                    postcode_area=result["postcode_area_code"],
                    european_electoral_region=result["eer_code"],
                    lsoa=result["lsoa_code"],
                    msoa=result["msoa_code"],
                    output_area=result["output_area_code"],
                    parliamentary_constituency=result["wmc_code"],
                    parliamentary_constituency_2024=result["wmc_code"],
                    admin_district=result["district_code"],
                    admin_county=result["county_code"],
                    admin_ward=result["ward_code"],
                    parish=None,
                    ccg=None,
                    ccg_id=None,
                    ced=None,
                    nuts=None,
                    lau2=None,
                    pfa=None,
                ),
            )
        )

    logger.info(
        f"PostGIS geocoding done, first item: {coordinates[0] if coordinates else None}"
    )

    return results
