from django.conf import settings

from hub.models import AreaData, DataSet

from .base_importers import BaseConstituencyCountImportCommand, MultipleAreaTypesMixin


class Command(MultipleAreaTypesMixin, BaseConstituencyCountImportCommand):
    help = "Import pledges to take part in TCC’s 2024 Common Grounds Day of Action"

    message = (
        "importing pledges to take part in TCC’s 2024 Common Grounds Day of Action"
    )
    uses_gss = True
    cons_col = "gss"
    data_file = (
        settings.BASE_DIR / "data" / "tcc_common_grounds_2024_pledges_processed.csv"
    )

    area_types = ["WMC", "WMC23", "STC", "DIS"]
    cons_col_map = {
        "WMC": "WMC",
        "WMC23": "WMC23",
        "STC": "STC",
        "DIS": "DIS",
    }

    defaults = {
        "label": "Constituents pledged to meet MP as part of Common Grounds 2024",
        "data_type": "integer",
        "category": "movement",
        "release_date": "October 2024",
        "source_label": "Data from The Climate Coalition.",
        "source": "https://peopleclimatenature.org/",
        "source_type": "csv",
        "data_url": "",
        "table": "areadata",
        "default_value": 10,
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
    }

    data_sets = {
        "tcc_common_grounds_2024_pledges": {
            "defaults": defaults,
        },
    }

    def delete_data(self):
        for data_type in self.data_types.values():
            AreaData.objects.filter(data_type=data_type).delete()
