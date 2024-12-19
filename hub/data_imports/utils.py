from datetime import datetime
from typing import TYPE_CHECKING

from hub.validation import validate_and_format_phone_number
from utils.py import parse_datetime

if TYPE_CHECKING:
    from hub.models import ExternalDataSource


def get_update_data(source: "ExternalDataSource", record):
    update_data = {
        "json": source.get_record_dict(record),
    }

    for field in source.import_fields:
        if getattr(source, field, None) is not None:
            value = source.get_record_field(record, getattr(source, field), field)
            if field.endswith("_time_field"):
                value: datetime = parse_datetime(value)
            if field == "can_display_point_field":
                value = bool(value)  # cast None value to False
            if field == "phone_field":
                value = validate_and_format_phone_number(value, source.countries)
            update_data[field.removesuffix("_field")] = value

    return update_data
