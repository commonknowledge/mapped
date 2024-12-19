from django.conf import settings
from django.contrib.gis.geos import Point

import httpx


async def get_postcode_from_coords_ftp(point: Point):
    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(settings.ASYNC_CLIENT_TIMEOUT_SECONDS)
        ) as client:
            lng = point.x
            lat = point.y
            response = await client.get(
                f"https://findthatpostcode.uk/points/{lat},{lng}.json"
            )
        if response.status_code != httpx.codes.OK:
            raise Exception(f"Failed to geocode point, {point.json}.")
        response = response.json()
        return response["data"]["relationships"]["nearest_postcode"]["data"]["id"]
    except KeyError:
        return None


async def get_example_postcode_from_area_gss(gss: str):
    try:
        # https://findthatpostcode.uk/areas/E14000639.json
        # return data.relationships.example_postcodes.data[0].id
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(settings.ASYNC_CLIENT_TIMEOUT_SECONDS)
        ) as client:
            response = await client.get(f"https://findthatpostcode.uk/areas/{gss}.json")
        if response.status_code != httpx.codes.OK:
            raise Exception(f"Failed to geocode area, {gss}.")
        response = response.json()
        return response["data"]["relationships"]["example_postcodes"]["data"][0]["id"]
    except KeyError:
        return None
