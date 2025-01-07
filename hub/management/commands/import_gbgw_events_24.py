from django.conf import settings

from hub.models import DataSet

from .base_importers import BaseConstituencyCountImportCommand, MultipleAreaTypesMixin


class Command(MultipleAreaTypesMixin, BaseConstituencyCountImportCommand):
    help = "Import data about number of GBGW events in 2024 per constituency"
    message = "Importing 2024 GBGW events"
    uses_gss = False

    data_file = settings.BASE_DIR / "data" / "gbgw_events_24_processed.csv"

    area_types = ["WMC23", "STC", "DIS"]
    cons_col_map = {
        "WMC23": "WMC23",
        "STC": "STC",
        "DIS": "DIS",
    }

    data_sets = {
        "constituency_gbgw_2024_event_count": {
            "defaults": {
                "label": "Number of Great Big Green Week 2024 events",
                "description": "Number of public Great Big Green week 2024 events held in the area. This exludes any private events that were held.",
                "release_date": "September 2024",
                "data_type": "integer",
                "category": "movement",
                "subcategory": "events",
                "source_label": "Data from The Climate Coalition.",
                "source": "https://greatbiggreenweek.com/",
                "source_type": "google sheet",
                "data_url": "",
                "table": "areadata",
                "is_public": True,
                "default_value": 10,
                "comparators": DataSet.numerical_comparators(),
                "unit_type": "raw",
                "unit_distribution": "people_in_area",
            }
        }
    }
