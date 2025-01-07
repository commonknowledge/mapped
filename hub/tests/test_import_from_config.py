from io import StringIO
from unittest import mock

from django.core.management import call_command
from django.test import TestCase

import pandas as pd

from hub.models import AreaData, DataSet


class ImportTestCase(TestCase):
    fixtures = ["areas.json"]

    def call_command(self, quiet=True, *args, **kwargs):
        out = StringIO()
        call_command(
            self.command,
            quiet=quiet,
            *args,
            stdout=out,
            stderr=StringIO(),
            **kwargs,
        )
        return out.getvalue()


class ImportAgeDataTestCase(ImportTestCase):
    command = "import_from_config"

    @mock.patch("hub.management.commands.import_from_config.pd.read_excel")
    @mock.patch("hub.management.commands.import_from_config.json.load")
    def test_import(self, patch_get_json, patch_get_excel):
        data = {
            "0-9": [0.123, 0.132, 0.1],
            "10-19": [0.095, 0.144, 0],
            "ONSConstID": [
                "E10000001",
                "E10000002",
                "E40000001",
            ],
        }
        patch_get_excel.return_value = pd.DataFrame(data=data)

        config = [
            {
                "name": "constituency_age_distribution",
                "label": "Constituency age distribution",
                "data_type": "percent",
                "category": "place",
                "subcategory": "",
                "release_date": "2021",
                "is_range": True,
                "source_label": "Data from ONS (England and Wales), NRS (Scotland), and NISRA (Northern Ireland), collated by House of Commons Library.",
                "source": "https://commonslibrary.parliament.uk/constituency-statistics-population-by-age/",
                "data_url": "https://commonslibrary.parliament.uk/constituency-statistics-population-by-age/",
                "exclude_countries": None,
                "fill_blanks": False,
                "source_type": "xlxs",
                "file_type": "excel",
                "uses_gss": True,
                "data_file": "file.xlsx",
                "table": "areadata",
                "default_value": 50,
                "is_shadable": True,
                "is_filterable": True,
                "is_public": True,
                "comparators": DataSet.numerical_comparators(),
                "unit_type": "percentage",
                "unit_distribution": "people_in_area",
                "area_type": "WMC",
                "constituency_col": "ONSConstID",
                "data_types": [
                    {
                        "name": "ages_0_9",
                        "label": "Ages 0 - 9",
                        "data_col": "0-9",
                    },
                    {
                        "name": "ages_10_19",
                        "label": "Ages 10 - 19",
                        "data_col": "10-19",
                    },
                ],
            }
        ]

        patch_get_json.return_value = config

        out = self.call_command(import_name="constituency_age_distribution")

        self.assertEqual(
            out,
            "Failed to find area with code E40000001\nFailed to find area with code E40000001\n",
        )
        area_data = AreaData.objects.all()
        self.assertEqual(area_data.count(), 4)

        south_data = (
            AreaData.objects.filter(area__gss="E10000001", area__area_type__code="WMC")
            .order_by("data_type__name")
            .all()
        )

        self.assertEqual(south_data[0].value(), 0.123)
        self.assertEqual(south_data[1].value(), 0.095)

        self.assertEqual(south_data[0].data_type.average, 0.1275)
        self.assertEqual(south_data[1].data_type.average, 0.1195)

        config[0]["multiply_percentage"] = True

        out = self.call_command(import_name="constituency_age_distribution")

        area_data = AreaData.objects.all()
        self.assertEqual(area_data.count(), 4)
        south_data = (
            AreaData.objects.filter(area__gss="E10000001", area__area_type__code="WMC")
            .order_by("data_type__name")
            .all()
        )

        under_ten_data = (
            AreaData.objects.filter(
                data_type__name="ages_0_9", area__area_type__code="WMC"
            )
            .order_by("data_type__name")
            .all()
        )

        self.assertEqual(south_data[0].value(), 12.3)
        self.assertEqual(south_data[1].value(), 9.5)

        self.assertEqual(round(under_ten_data[0].value(), 1), 12.3)
        self.assertEqual(round(under_ten_data[1].value(), 1), 13.2)

        self.assertEqual(south_data[0].data_type.average, 12.75)
        self.assertEqual(south_data[1].data_type.average, 11.95)
