import hashlib
import logging
from dataclasses import dataclass
from typing import List, Optional

from django.conf import settings
from django.core.cache import caches

import country_converter as coco
import googlemaps
from benedict import benedict

from utils.py import ensure_list

logger = logging.getLogger(__name__)

db_cache = caches["db"]

gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)

# docs: https://docs.google.com/api/search/geocoding/


# for use by dataloaders which need to give a single arg
@dataclass
class GeocodingQuery:
    query: str = None
    country: str | list[str] = "GB"


def ensure_cctld(country_strings: str | list[str]):
    return ensure_list(coco.convert(names=ensure_list(country_strings), to="ccTLD"))


def ensure_alpha2(country_strings: str | list[str]):
    return ensure_list(coco.convert(names=ensure_list(country_strings), to="ISO2"))


def google_forward_geocode_payload(query: GeocodingQuery):
    if query.country:
        country_cctld = ensure_cctld(query.country)[0]
        country_alpha2 = ensure_alpha2(query.country)[0]
        return {
            "address": query.query,
            "region": country_cctld,
            "components": {
                "country": country_alpha2,
            },
        }
    else:
        return {"address": query.query}


def google_geocode_cache_key(query: GeocodingQuery):
    hash = hashlib.md5(query.query.encode("utf-8")).hexdigest()
    return f"google:geocode:{hash}:{query.country}"


def geocode_address(query: GeocodingQuery):
    cached = db_cache.get(google_geocode_cache_key(query), None)
    if cached is not None:
        if isinstance(cached, dict):
            queryable: GoogleGeocodingResponse = benedict(cached)
            return queryable
        return None

    get_query_args = google_forward_geocode_payload(query)

    response: list[GoogleGeocodingResponse] = gmaps.geocode(**get_query_args)
    if response and len(response) > 0:
        res = response[0]
        db_cache.set(google_geocode_cache_key(query), res, None)
        if isinstance(res, dict):
            queryable: GoogleGeocodingResponse = benedict(res)
            return queryable


def batch_geocode_address(queries: list[GeocodingQuery]):
    data: list[GoogleGeocodingResponse] = []

    for query in queries:
        new_val = geocode_address(query)
        data.append(new_val)

    return data


# Generated


@dataclass
class AddressComponent:
    long_name: Optional[str] = None
    short_name: Optional[str] = None
    types: Optional[List[str]] = None


@dataclass
class Location:
    lat: Optional[float] = None
    lng: Optional[float] = None


@dataclass
class Viewport:
    northeast: Optional[Location] = None
    southwest: Optional[Location] = None


@dataclass
class Geometry:
    location: Optional[Location] = None
    location_type: Optional[str] = None
    viewport: Optional[Viewport] = None


@dataclass
class PlusCode:
    compound_code: Optional[str] = None
    global_code: Optional[str] = None


@dataclass
class GoogleGeocodingResponse:
    address_components: Optional[List[AddressComponent]] = None
    formatted_address: Optional[str] = None
    geometry: Optional[Geometry] = None
    place_id: Optional[str] = None
    plus_code: Optional[PlusCode] = None
    types: Optional[List[str]] = None
