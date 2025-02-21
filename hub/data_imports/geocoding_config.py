import logging
import re
import traceback
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from django.conf import settings
from django.contrib.gis.geos import Point
from django.db.models import Q

from asgiref.sync import sync_to_async

from hub.data_imports.utils import get_update_data
from hub.graphql.dataloaders import FieldDataLoaderFactory
from utils import google_maps, mapit_types
from utils.findthatpostcode import (
    get_example_postcode_from_area_gss,
    get_postcode_from_coords_ftp,
)
from utils.py import are_dicts_equal, ensure_list, find
from utils.statistics import StatisticalDataType

logger = logging.getLogger(__name__)
if TYPE_CHECKING:
    from hub.models import Area, DataType, ExternalDataSource, Loaders


def find_config_item(source: "ExternalDataSource", key: str, value, default=None):
    return find(
        source.geocoding_config.get("components", []),
        lambda item: item.get(key, None) == value,
        default,
    )


class GeocoderContext:
    """
    Context class to support DataLoader creation and re-use
    (existing dataloaders are stored here, so each record can
    re-use a previously created loader. This is a necessary
    component for dataloader batching to work).
    """

    def __init__(self):
        self.dataloaders = {}


@dataclass
class GeocodeResult:
    """
    Returned by the geocode_record method, ready
    to be bulk saved to the database.
    """

    data_type: "DataType"
    data: str
    json: dict
    parsed_json: dict
    column_types: dict[str, StatisticalDataType]
    geocoder: str = None
    geocode_data: dict = None
    postcode_data: dict = None
    area: "Area" = None
    point: Point = None
    # and all the other columns of GenericData:
    postcode: str = None
    # models.CharField(max_length=1000, blank=True, null=True)
    first_name: str = None
    # models.CharField(max_length=300, blank=True, null=True)
    last_name: str = None
    # models.CharField(max_length=300, blank=True, null=True)
    full_name: str = None
    # models.CharField(max_length=300, blank=True, null=True)
    email: str = None
    # models.EmailField(max_length=300, blank=True, null=True)
    phone: str = None
    # models.CharField(max_length=100, blank=True, null=True)
    start_time: datetime = None
    # models.DateTimeField(blank=True, null=True)
    end_time: datetime = None
    # models.DateTimeField(blank=True, null=True)
    public_url: str = None
    # models.URLField(max_length=2000, blank=True, null=True)
    social_url: str = None
    # models.URLField(max_length=2000, blank=True, null=True)
    geocode_data: dict = None
    # models.JSONField(blank=True, null=True)
    geocoder: str = None
    # models.CharField(max_length=1000, blank=True, null=True)
    address: str = None
    # models.CharField(max_length=1000, blank=True, null=True)
    title: str = None
    # models.CharField(max_length=1000, blank=True, null=True)
    description: str = None
    # models.TextField(max_length=3000, blank=True, null=True)
    image: str = None
    # models.ImageField(null=True, max_length=1000, upload_to="generic_data")
    can_display_point: bool = None
    # models.BooleanField(default=True)

    def __str__(self):
        return f"{self.data_type.name}: {self.data}"


# enum of geocoders: postcodes_io, mapbox, google
class Geocoder(Enum):
    POSTCODES_IO = "postcodes_io"
    POSTGIS = "postgis"
    FINDTHATPOSTCODE = "findthatpostcode"
    MAPBOX = "mapbox"
    GOOGLE = "google"
    AREA_GEOCODER_V2 = "AREA_GEOCODER_V2"
    AREA_CODE_GEOCODER_V2 = "AREA_CODE_GEOCODER_V2"
    ADDRESS_GEOCODER_V2 = "ADDRESS_GEOCODER_V2"
    COORDINATE_GEOCODER_V1 = "COORDINATE_GEOCODER_V1"


LATEST_AREA_GEOCODER = Geocoder.AREA_GEOCODER_V2
LATEST_AREA_CODE_GEOCODER = Geocoder.AREA_CODE_GEOCODER_V2
LATEST_ADDRESS_GEOCODER = Geocoder.ADDRESS_GEOCODER_V2
LATEST_COORDINATE_GEOCODER = Geocoder.COORDINATE_GEOCODER_V1


def get_config_item_value(
    source: "ExternalDataSource", config_item, record, default=None
):
    if config_item is None:
        return default
    if config_item.get("field", None):
        # Data comes from the member record
        field = config_item.get("field", None)
        value = source.get_record_field(record, field)
    elif config_item.get("value", None):
        # Data has been manually defined by the organiser
        # (e.g. "all these venues are in Glasgow")
        value = config_item.get("value", None)
    return value or default


def get_config_item_field_value(
    source: "ExternalDataSource", config_item, record, default=None
):
    if config_item is None:
        return default
    if config_item.get("field", None):
        # Data comes from the member record
        field = config_item.get("field", None)
        value = source.get_record_field(record, field)
    return value or default


async def geocode_record(
    record,
    source: "ExternalDataSource",
    data_type: "DataType",
    loaders: "Loaders",
    geocoder_context: GeocoderContext,
) -> GeocodeResult:
    from hub.models import ExternalDataSource, GenericData

    id = source.get_record_id(record)
    update_data = get_update_data(source, record)

    update_data["geocode_data"] = update_data.get("geocode_data", {})
    update_data["geocode_data"]["config"] = source.geocoding_config

    # Try to identify the appropriate geocoder
    geocoder: Geocoder = None
    geocoding_config_type = source.geocoding_config.get("type", None)
    importer_fn = None
    if geocoding_config_type == ExternalDataSource.GeographyTypes.AREA:
        components = source.geocoding_config.get("components", [])
        if len(components) == 1 and components[0].get("type") == "area_code":
            geocoder = LATEST_AREA_CODE_GEOCODER
            importer_fn = import_area_code_data
        else:
            geocoder = LATEST_AREA_GEOCODER
            importer_fn = import_area_data
    elif geocoding_config_type == ExternalDataSource.GeographyTypes.ADDRESS:
        geocoder = LATEST_ADDRESS_GEOCODER
        importer_fn = import_address_data
    elif geocoding_config_type == ExternalDataSource.GeographyTypes.COORDINATES:
        geocoder = LATEST_COORDINATE_GEOCODER
        importer_fn = import_coordinate_data
    else:
        logger.debug(source.geocoding_config)
        raise ValueError("geocoding_config is not a valid type")

    # check if geocoding_config and dependent fields are the same; if so, skip geocoding
    try:
        generic_data = await loaders["generic_data"].load(id)
        # First check if the configs are the same
        if (
            generic_data is not None
            and
            # Already is geocoded
            generic_data.postcode_data is not None
            and
            # Has all the required geocoding metadata for us to check for deduplication
            generic_data.geocode_data is not None
            and generic_data.geocode_data.get("config", None) is not None
            and are_dicts_equal(
                generic_data.geocode_data["config"], source.geocoding_config
            )
            # Add geocoding code versions are the same
            and generic_data.geocoder == geocoder.value
        ):
            # Then, if so, check if the data has changed
            geocoding_field_values = set()
            search_terms_from_last_time = set()
            for item in source.geocoding_config.get("components", []):
                # new data
                new_value = get_config_item_value(source, item, record)
                geocoding_field_values.add(new_value)
                # old data
                old_value = get_config_item_value(source, item, generic_data.json)
                search_terms_from_last_time.add(old_value)
                # logger.debug("Equality check", id, item, new_value, old_value)
            is_equal = geocoding_field_values == search_terms_from_last_time

            if is_equal:
                # Don't bother with geocoding again.
                # Mark this as such
                # And simply update the other data.
                update_data["geocode_data"] = generic_data.geocode_data or {}
                update_data["geocode_data"]["skipped"] = True
                # Return a complete GeocodeResult to avoid clearing previous data
                return GeocodeResult(
                    data_type=data_type,
                    data=id,
                    json=update_data["json"],
                    parsed_json=update_data["parsed_json"],
                    column_types=update_data["column_types"],
                    geocoder=generic_data.geocoder,
                    geocode_data=generic_data.geocode_data,
                    postcode_data=generic_data.postcode_data,
                    area=generic_data.area,
                    point=generic_data.point,
                )
    except GenericData.DoesNotExist:
        # logger.debug("Generic Data doesn't exist, no equality check to be done", id)
        pass

    update_data["geocode_data"]["skipped"] = False

    return await importer_fn(
        record=record,
        source=source,
        data_type=data_type,
        loaders=loaders,
        update_data=update_data,
        geocoder_context=geocoder_context,
    )


async def import_area_code_data(
    record,
    source: "ExternalDataSource",
    data_type: "DataType",
    loaders: "Loaders",
    update_data: dict,
    geocoder_context: GeocoderContext,
):
    from hub.models import Area

    update_data["geocoder"] = LATEST_AREA_CODE_GEOCODER.value

    area = None
    geocoding_data = {}
    steps = []

    components = source.geocoding_config.get("components", [])
    if components:
        item = components[0]

        literal_lih_area_type__code = item.get("metadata", {}).get(
            "lih_area_type__code", None
        )
        literal_mapit_type = item.get("metadata", {}).get("mapit_type", None)
        area_types = literal_lih_area_type__code or literal_mapit_type
        literal_area_field = item.get("field", None)
        area_code = str(source.get_record_field(record, literal_area_field))

        if area_types and literal_area_field and area_code:
            parsed_area_types = [str(s).upper() for s in ensure_list(area_types)]

            area_filters = {}
            if literal_lih_area_type__code:
                area_filters["area_type__code__in"] = ensure_list(
                    literal_lih_area_type__code
                )
            if literal_mapit_type:
                area_filters["mapit_type__in"] = ensure_list(literal_mapit_type)

            AreaLoader = FieldDataLoaderFactory.get_loader_class(
                Area, field="gss", filters=area_filters, select_related=["area_type"]
            )

            area = await AreaLoader(geocoder_context).load(area_code)

            if area:
                step = {
                    "type": "area_code_matching",
                    "area_types": parsed_area_types,
                    "result": "failed" if area is None else "success",
                    "search_term": area_code,
                    "data": (
                        {
                            "centroid": area.polygon.centroid.json,
                            "name": area.name,
                            "id": area.id,
                            "gss": area.gss,
                        }
                        if area is not None
                        else None
                    ),
                }
                steps.append(step)

                geocoding_data["area_fields"] = geocoding_data.get("area_fields", {})
                geocoding_data["area_fields"][area.area_type.code] = area.gss
                update_data["geocode_data"].update({"data": geocoding_data})
                if area is not None:
                    postcode_data = await get_postcode_data_for_area(
                        area, loaders, steps
                    )
                    update_data["postcode_data"] = postcode_data
                    update_data["area"] = area
                    update_data["point"] = area.point
                else:
                    # Reset geocoding data
                    update_data["postcode_data"] = None

                # Update the geocode data regardless, for debugging purposes
                update_data["geocode_data"].update({"steps": steps})

    return GeocodeResult(
        **update_data, data_type=data_type, data=source.get_record_id(record)
    )


async def import_area_data(
    record,
    source: "ExternalDataSource",
    data_type: "DataType",
    loaders: "Loaders",
    update_data: dict,
    geocoder_context: GeocoderContext,
):
    from hub.models import Area

    update_data["geocoder"] = LATEST_AREA_GEOCODER.value

    # Filter down geographies by the config
    parent_area = None
    area = None
    geocoding_data = {}
    steps = []

    for item in source.geocoding_config.get("components", []):
        parent_area = area
        literal_lih_area_type__code = item.get("metadata", {}).get(
            "lih_area_type__code", None
        )
        literal_mapit_type = item.get("metadata", {}).get("mapit_type", None)
        area_types = literal_lih_area_type__code or literal_mapit_type
        literal_area_field = item.get("field", None)
        raw_area_value = str(source.get_record_field(record, literal_area_field))

        if area_types is None or literal_area_field is None or raw_area_value is None:
            continue

        # make searchable for the MapIt database
        lower_name = str(raw_area_value).lower()

        # E.g. ""Bristol, city of" becomes "bristol city" (https://mapit.mysociety.org/area/2561.html)
        searchable_name = (
            re.sub(r"(.+), (.+) of", r"\1 \2", lower_name, flags=re.IGNORECASE)
            or lower_name
        )

        # Sometimes MapIt uses "X council", sometimes "X city council"
        # so try both, knowing we're already specifying the area type so it is safe.
        searchable_name_sans_title = (
            re.sub(r"(.+), (.+) of", r"\1", lower_name, flags=re.IGNORECASE)
            or lower_name
        )

        parsed_area_types = [str(s).upper() for s in ensure_list(area_types)]

        maybe_council = (
            # Check if using LIH area types
            literal_lih_area_type__code is not None
            and any([t in mapit_types.LIH_COUNCIL_TYPES for t in parsed_area_types])
        ) or (
            # Check if using MapIt types
            literal_mapit_type is not None
            and any([t in mapit_types.MAPIT_COUNCIL_TYPES for t in parsed_area_types])
        )

        qs = Area.objects.select_related("area_type")

        if literal_lih_area_type__code is not None:
            qs = qs.filter(area_type__code__in=parsed_area_types)
        elif literal_mapit_type is not None:
            qs = qs.filter(mapit_type__in=parsed_area_types)

        search_values = [
            raw_area_value,
            lower_name,
            searchable_name,
            searchable_name_sans_title,
        ]

        suffixes = [
            # try the values on their own
            ""
        ]

        if maybe_council:
            # Mapit stores councils with their type in the name
            # e.g. https://mapit.mysociety.org/area/2641.html
            suffixes += [
                # add council suffixes
                " council",
                " city council",
                " borough council",
                " district council",
                " county council",
            ]

        # always try a code
        or_statement_area_text_matcher = Q(gss__iexact=raw_area_value)

        # matrix of strings and suffixes
        for value in list(set(search_values)):
            for suffix in suffixes:
                computed_value = f"{value}{suffix}"
                # logger.debug("Trying ", computed_value)
                # we also try trigram because different versions of the same name are used by organisers and researchers
                or_statement_area_text_matcher |= Q(
                    name__unaccent__iexact=computed_value
                )
                or_statement_area_text_matcher |= Q(
                    name__unaccent__trigram_similar=computed_value
                )

        qs = (
            qs.filter(or_statement_area_text_matcher)
            .extra(
                select={"exact_gss_match": "hub_area.gss = %s"},
                select_params=[raw_area_value.upper()],
            )
            .extra(
                # We round the similarity score to 1dp so that
                # two areas with score 0.8 can be distinguished by which has a larger mapit_generation_high
                # which wouldn't be possible if the invalid one had 0.82 and the valid one had 0.80 (because it was renamed "&" to "and")
                select={
                    "name_distance": "round(similarity(hub_area.name, %s)::numeric, 1)"
                },
                select_params=[searchable_name_sans_title],
            )
            .order_by(
                # Prefer exact matches on GSS codes
                "-exact_gss_match",
                # Then prefer name similarity
                "-name_distance",
                # If the names are the same, prefer the most recent one
                "-mapit_generation_high",
            )
        )

        # for debugging, but without all the polygon characters which spam up the terminal/logger
        non_polygon_query = qs

        if parent_area is not None and parent_area.polygon is not None:
            qs = qs.filter(polygon__intersects=parent_area.polygon)

        area = await qs.afirst()

        step = {
            "type": "sql_area_matching",
            "area_types": parsed_area_types,
            "result": "failed" if area is None else "success",
            "search_term": raw_area_value,
            "data": (
                {
                    "centroid": area.polygon.centroid.json,
                    "name": area.name,
                    "id": area.id,
                    "gss": area.gss,
                }
                if area is not None
                else None
            ),
        }
        if settings.DEBUG:
            step.update(
                {
                    "query": str(non_polygon_query.query),
                    "parent_polygon_query": (
                        parent_area.polygon.json
                        if parent_area is not None and parent_area.polygon is not None
                        else None
                    ),
                }
            )
        steps.append(step)

        if area is None:
            break
        else:
            geocoding_data["area_fields"] = geocoding_data.get("area_fields", {})
            geocoding_data["area_fields"][area.area_type.code] = area.gss
            update_data["geocode_data"].update({"data": geocoding_data})
    if area is not None:
        postcode_data = await get_postcode_data_for_area(area, loaders, steps)
        update_data["postcode_data"] = postcode_data
        update_data["area"] = area
        update_data["point"] = area.point
    else:
        # Reset geocoding data
        update_data["postcode_data"] = None

    # Update the geocode data regardless, for debugging purposes
    update_data["geocode_data"].update({"steps": steps})

    return GeocodeResult(
        **update_data, data_type=data_type, data=source.get_record_id(record)
    )


async def get_postcode_data_for_area(area: "Area", loaders: "Loaders", steps: list):
    sample_point = area.polygon.centroid

    # get postcodeIO result for area.coordinates
    postcode_data = None
    try:
        postcode_data = await loaders["postgis_geocoder"].load(sample_point)
    except Exception as e:
        print(
            traceback.format_exc()
        )  # Keep for now to track tricky database errors with bad error messages
        logger.error(
            f"Failed to get postcode data from postgis_geocoder for {sample_point}: {e}"
        )

    steps.append(
        {
            "task": "postcode_from_area_coordinates",
            "service": Geocoder.POSTGIS.value,
            "result": "failed" if postcode_data is None else "success",
        }
    )

    # Try a few other backup strategies (example postcode, another geocoder)
    # to get postcodes.io data
    if postcode_data is None:
        try:
            postcode_data = await loaders["postcodesIOFromPoint"].load(sample_point)
        except Exception as e:
            logger.warning(f"Failed to get postcode data for {sample_point}: {e}")

        steps.append(
            {
                "task": "postcode_from_area_coordinates",
                "service": Geocoder.POSTCODES_IO.value,
                "result": "failed" if postcode_data is None else "success",
            }
        )

    if postcode_data is None:
        try:
            postcode = await get_example_postcode_from_area_gss(area.gss)
        except Exception as e:
            logger.warning(f"Failed to get example postcode for {area.gss}: {e}")
            postcode = None

        steps.append(
            {
                "task": "postcode_from_area",
                "service": Geocoder.FINDTHATPOSTCODE.value,
                "result": "failed" if postcode is None else "success",
            }
        )
        if postcode is not None:
            postcode_data = await loaders["postcodesIO"].load(postcode)
            steps.append(
                {
                    "task": "data_from_postcode",
                    "service": Geocoder.POSTCODES_IO.value,
                    "result": ("failed" if postcode_data is None else "success"),
                }
            )
    if postcode_data is None:
        postcode = await get_postcode_from_coords_ftp(sample_point)
        steps.append(
            {
                "task": "postcode_from_area_coordinates",
                "service": Geocoder.FINDTHATPOSTCODE.value,
                "result": "failed" if postcode is None else "success",
            }
        )
        if postcode is not None:
            postcode_data = await loaders["postcodesIO"].load(postcode)
            steps.append(
                {
                    "task": "data_from_postcode",
                    "service": Geocoder.POSTCODES_IO.value,
                    "result": ("failed" if postcode_data is None else "success"),
                }
            )

    return postcode_data


async def import_address_data(
    record,
    source: "ExternalDataSource",
    data_type: "DataType",
    loaders: "Loaders",
    update_data: dict,
    geocoder_context: GeocoderContext,
):
    """
    Converts a record fetched from the API into
    a GenericData record in the MEEP db.

    Used to batch-import data.
    """
    update_data["geocoder"] = LATEST_ADDRESS_GEOCODER.value

    point = None
    address_data = None
    postcode_data = None
    steps = []

    # place_name — could be as simple as "Glasgow City Chambers"
    place_name_config = find_config_item(source, "type", "place_name")
    place_name_value = get_config_item_value(source, place_name_config, record)
    has_dynamic_place_name_value = place_name_value and place_name_config.get(
        "field", None
    )
    # Address — the place_name (i.e. line1, location name) might be so specific
    # that it's the only thing the organisers add, so don't require it
    address_item = find_config_item(source, "type", "street_address")
    street_address_value = get_config_item_field_value(source, address_item, record)

    if (
        street_address_value
        or
        # In the case of a list of Barclays addresses, the organiser might have defined
        # { "type": "place_name", "value": "Barclays" } in the geocoding_config
        # so that the spreadsheet only needs to contain the address.
        # So we check for a dynamic place_name_value here, so we're not just geocoding a bunch of
        # queries that are just "Barclays", "Barclays", "Barclays"...
        has_dynamic_place_name_value
    ):
        # area
        area_name_config = find_config_item(source, "type", "area_name")
        area_name_value = get_config_item_value(source, area_name_config, record)
        # Countries
        countries_config = find_config_item(source, "type", "countries")
        countries_value = ensure_list(
            get_config_item_value(source, countries_config, record, source.countries)
        )
        # join them into a string using join and a comma
        query = ", ".join(
            [
                x
                for x in [place_name_value, street_address_value, area_name_value]
                if x is not None and x != ""
            ]
        )
        address_data = await sync_to_async(google_maps.geocode_address)(
            google_maps.GeocodingQuery(
                query=query,
                country=countries_value,
            )
        )

        steps.append(
            {
                "task": "address_from_query",
                "service": Geocoder.GOOGLE.value,
                "result": "failed" if address_data is None else "success",
                "search_term": query,
                "country": countries_value,
            }
        )

        if address_data is not None:
            update_data["geocode_data"]["data"] = address_data
            point = (
                Point(
                    x=address_data.geometry.location.lng,
                    y=address_data.geometry.location.lat,
                )
                if (
                    address_data is not None
                    and address_data.geometry is not None
                    and address_data.geometry.location is not None
                )
                else None
            )

            postcode_data = None

            # Prefer to get the postcode from the address data
            # rather than inferring it from coordinate which might be wrong / non-canonical
            postcode_component = find(
                address_data.address_components,
                lambda x: "postal_code" in x.get("types", []),
            )
            if postcode_component is not None:
                postcode = postcode_component.get("long_name", None)

                if postcode:
                    postcode_data = await loaders["postcodesIO"].load(postcode)

                    steps.append(
                        {
                            "task": "data_from_postcode",
                            "service": Geocoder.POSTCODES_IO.value,
                            "result": "failed" if postcode_data is None else "success",
                        }
                    )
            # Else if no postcode's found, use the coordinates
            if postcode_data is None and point is not None:
                # Capture this so we have standardised Postcodes IO data for all records
                # (e.g. for analytical queries that aggregate on region)
                # even if the address is not postcode-specific (e.g. "London").
                # this can be gleaned from geocode_data__types, e.g. [ "administrative_area_level_1", "political" ]
                postcode_data = await loaders["postcodesIOFromPoint"].load(point)

                steps.append(
                    {
                        "task": "postcode_from_coordinates",
                        "service": Geocoder.POSTCODES_IO.value,
                        "result": "failed" if postcode_data is None else "success",
                    }
                )

                # Try a backup geocoder in case that one fails
                if postcode_data is None:
                    postcode = await get_postcode_from_coords_ftp(point)
                    steps.append(
                        {
                            "task": "postcode_from_coordinates",
                            "service": Geocoder.FINDTHATPOSTCODE.value,
                            "result": "failed" if postcode_data is None else "success",
                        }
                    )
                    if postcode is not None:
                        postcode_data = await loaders["postcodesIO"].load(postcode)
                        steps.append(
                            {
                                "task": "data_from_postcode",
                                "service": Geocoder.POSTCODES_IO.value,
                                "result": (
                                    "failed" if postcode_data is None else "success"
                                ),
                            }
                        )

    update_data["geocode_data"].update({"steps": steps})
    update_data["postcode_data"] = postcode_data
    update_data["point"] = point

    return GeocodeResult(
        **update_data, data_type=data_type, data=source.get_record_id(record)
    )


async def import_coordinate_data(
    record,
    source: "ExternalDataSource",
    data_type: "DataType",
    loaders: "Loaders",
    update_data: dict,
    geocoder_context: GeocoderContext,
):
    update_data["geocoder"] = LATEST_COORDINATE_GEOCODER.value

    steps = []

    raw_lng = get_config_item_value(
        source, find_config_item(source, "type", "longitude"), record
    )
    raw_lat = get_config_item_value(
        source, find_config_item(source, "type", "latitude"), record
    )
    postcode_data = None
    point = None

    if raw_lng is not None and raw_lat is not None:
        try:
            point = Point(
                x=float(raw_lng),
                y=float(raw_lat),
            )
            postcode_data = await loaders["postgis_geocoder"].load(point)
            steps.append(
                {
                    "task": "postcode_from_coordinates",
                    "service": Geocoder.POSTGIS.value,
                    "result": "failed" if postcode_data is None else "success",
                }
            )

            if postcode_data is None:
                postcode_data = await loaders["postcodesIOFromPoint"].load(point)

                steps.append(
                    {
                        "task": "postcode_from_coordinates",
                        "service": Geocoder.POSTCODES_IO.value,
                        "result": "failed" if postcode_data is None else "success",
                    }
                )
        except ValueError:
            # If the coordinates are invalid, let it go.
            pass

    # Try a backup geocoder in case that one fails
    if point is not None and postcode_data is None:
        postcode = await get_postcode_from_coords_ftp(point)
        steps.append(
            {
                "task": "postcode_from_coordinates",
                "service": Geocoder.FINDTHATPOSTCODE.value,
                "result": "failed" if postcode_data is None else "success",
            }
        )
        if postcode is not None:
            postcode_data = await loaders["postcodesIO"].load(postcode)
            steps.append(
                {
                    "task": "data_from_postcode",
                    "service": Geocoder.POSTCODES_IO.value,
                    "result": "failed" if postcode_data is None else "success",
                }
            )

    update_data["geocode_data"].update({"steps": steps})
    update_data["postcode_data"] = postcode_data
    update_data["point"] = point

    return GeocodeResult(
        **update_data, data_type=data_type, data=source.get_record_id(record)
    )
