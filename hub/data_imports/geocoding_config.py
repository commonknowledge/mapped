import logging
import re
from typing import TYPE_CHECKING

from django.conf import settings
from django.contrib.gis.geos import Point
from django.db.models import Q

from asgiref.sync import sync_to_async

from hub.data_imports.utils import get_update_data
from utils import google_maps, mapit_types
from utils.findthatpostcode import (
    get_example_postcode_from_area_gss,
    get_postcode_from_coords_ftp,
)
from utils.postcodesIO import PostcodesIOResult
from utils.py import are_dicts_equal, ensure_list, find

logger = logging.getLogger(__name__)
if TYPE_CHECKING:
    from hub.models import DataType, ExternalDataSource, Loaders


def find_config_item(source: "ExternalDataSource", key: str, value, default=None):
    return find(
        source.geocoding_config, lambda item: item.get(key, None) == value, default
    )


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


async def import_record(
    record,
    source: "ExternalDataSource",
    data_type: "DataType",
    loaders: "Loaders",
):
    from hub.models import GenericData, Geocoder

    update_data = get_update_data(source, record)
    id = source.get_record_id(record)

    # check if geocoding_config and dependent fields are the same; if so, skip geocoding
    try:
        generic_data = await GenericData.objects.aget(data_type=data_type, data=id)

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
        ):
            # Then, if so, check if the data has changed
            geocoding_field_values = set()
            search_terms_from_last_time = set()
            for item in source.geocoding_config:
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
                return await GenericData.objects.aupdate_or_create(
                    data_type=data_type, data=id, defaults=update_data
                )
    except GenericData.DoesNotExist:
        # logger.debug("Generic Data doesn't exist, no equality check to be done", id)
        pass
    update_data["geocode_data"] = update_data.get("geocode_data", {})
    update_data["geocode_data"]["config"] = source.geocoding_config
    update_data["geocode_data"]["skipped"] = False
    update_data["geocoder"] = Geocoder.GEOCODING_CONFIG.value

    if all(
        (
            item.get("lih_area_type__code", None) is not None
            or item.get("mapit_type", None) is not None
        )
        for item in source.geocoding_config
    ):
        importer_fn = import_area_data
    elif find_config_item(source, "type", "address") is not None:
        importer_fn = import_address_data
    elif (
        find_config_item(source, "type", "latitude") is not None
        and find_config_item(source, "type", "longitude") is not None
    ):
        importer_fn = import_coordinate_data
    else:
        logger.debug(source.geocoding_config)
        raise ValueError("geocoding_config is not a valid shape")

    return await importer_fn(
        record=record,
        source=source,
        data_type=data_type,
        loaders=loaders,
        update_data=update_data,
    )


async def import_area_data(
    record,
    source: "ExternalDataSource",
    data_type: "DataType",
    loaders: "Loaders",
    update_data: dict,
):
    from hub.models import Area, GenericData, Geocoder

    # Filter down geographies by the config
    parent_area = None
    area = None
    geocoding_data = {}
    steps = []

    for item in source.geocoding_config:
        parent_area = area
        literal_lih_area_type__code = item.get("lih_area_type__code", None)
        literal_mapit_type = item.get("mapit_type", None)
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
        or_statement_area_text_matcher = Q(gss__iexact=raw_area_value.upper().upper())

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
        sample_point = area.polygon.centroid

        # get postcodeIO result for area.coordinates
        try:
            postcode_data: PostcodesIOResult = await loaders[
                "postcodesIOFromPoint"
            ].load(sample_point)
        except Exception as e:
            logger.error(f"Failed to get postcode data for {sample_point}: {e}")
            postcode_data = None

        steps.append(
            {
                "task": "postcode_from_area_coordinates",
                "service": Geocoder.POSTCODES_IO.value,
                "result": "failed" if postcode_data is None else "success",
            }
        )

        # Try a few other backup strategies (example postcode, another geocoder)
        # to get postcodes.io data
        if postcode_data is None:
            postcode = await get_example_postcode_from_area_gss(area.gss)
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

        update_data["postcode_data"] = postcode_data
    else:
        # Reset geocoding data
        update_data["postcode_data"] = None

    # Update the geocode data regardless, for debugging purposes
    update_data["geocode_data"].update({"steps": steps})

    await GenericData.objects.aupdate_or_create(
        data_type=data_type, data=source.get_record_id(record), defaults=update_data
    )


async def import_address_data(
    record,
    source: "ExternalDataSource",
    data_type: "DataType",
    loaders: "Loaders",
    update_data: dict,
):
    """
    Converts a record fetched from the API into
    a GenericData record in the MEEP db.

    Used to batch-import data.
    """
    from hub.models import GenericData, Geocoder

    point = None
    address_data = None
    postcode_data = None
    steps = []

    # Prefix — could be as simple as "Glasgow City Chambers"
    prefix_config = find_config_item(source, "type", "prefix")
    prefix_value = get_config_item_value(source, prefix_config, record)
    # Address — the prefix (i.e. line1, location name) might be so specific
    # that it's the only thing the organisers add, so don't require it
    address_item = find_config_item(source, "type", "address")
    address_value = get_config_item_value(source, address_item, record)

    if prefix_value or address_value:
        # Suffix
        suffix_config = find_config_item(source, "type", "suffix")
        suffix_value = get_config_item_value(source, suffix_config, record)
        # Countries
        countries_config = find_config_item(source, "type", "countries")
        countries_value = ensure_list(
            get_config_item_value(source, countries_config, record, source.countries)
        )
        # join them into a string using join and a comma
        query = ", ".join(
            [
                x
                for x in [prefix_value, address_value, suffix_value]
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
                postcode_data: PostcodesIOResult = await loaders[
                    "postcodesIOFromPoint"
                ].load(point)

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

    await GenericData.objects.aupdate_or_create(
        data_type=data_type, data=source.get_record_id(record), defaults=update_data
    )


async def import_coordinate_data(
    record,
    source: "ExternalDataSource",
    data_type: "DataType",
    loaders: "Loaders",
    update_data: dict,
):
    from hub.models import GenericData, Geocoder

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

    await GenericData.objects.aupdate_or_create(
        data_type=data_type,
        data=source.get_record_id(record),
        defaults=update_data,
    )
