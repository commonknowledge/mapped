from datetime import datetime, timezone

from django.test import TestCase
from asgiref.sync import async_to_sync
from hub.models import LocalJSONSource
from hub.validation import validate_and_format_phone_number
from benedict import benedict
import subprocess


class TestDateFieldParer(TestCase):
    fixture = [
        {
            "id": "1",
            "date": "01/06/2024, 09:30",
            "expected": datetime(2024, 6, 1, 9, 30, tzinfo=timezone.utc),
        },
        {
            "id": "2",
            "date": "15/06/2024, 09:30",
            "expected": datetime(2024, 6, 15, 9, 30, tzinfo=timezone.utc),
        },
        {
            "id": "3",
            "date": "15/06/2024, 09:30:00",
            "expected": datetime(2024, 6, 15, 9, 30, 0, tzinfo=timezone.utc),
        },
        {
            "id": "4",
            "date": "2023-12-20 06:00:00",
            "expected": datetime(2023, 12, 20, 6, 0, 0, tzinfo=timezone.utc),
        },
    ]

    @classmethod
    def setUpTestData(cls):
        cls.source = LocalJSONSource.objects.create(
            name="date_test",
            id_field="id",
            start_time_field="date",
            data=[
                {
                    "id": d["id"],
                    "date": d["date"],
                }
                for d in cls.fixture
            ],
        )

        # generate GenericData records
        async_to_sync(cls.source.import_many)(cls.source.data)

        # test that the GenericData records have valid dates
        cls.data = cls.source.get_import_data()

    def test_date_field(self):
        for e in self.fixture:
            d = self.data.get(data=e["id"])
            self.assertEqual(d.start_time, e["expected"])


class TestPhoneFieldParser(TestCase):
    fixture = [
        {"id": "bad1", "phone": "123456789", "expected": None},
        {"id": "good1", "phone": "07123456789", "expected": "+447123456789"},
        {"id": "good2", "phone": "+447123456789", "expected": "+447123456789"},
    ]

    @classmethod
    def setUpTestData(cls):
        cls.source = LocalJSONSource.objects.create(
            name="phone_test",
            id_field="id",
            phone_field="phone",
            countries=["GB"],
            data=[
                {
                    "id": e["id"],
                    "phone": e["phone"],
                }
                for e in cls.fixture
            ],
        )

        # generate GenericData records
        async_to_sync(cls.source.import_many)(cls.source.data)

        # test that the GenericData records have valid, formatted phone field
        cls.data = cls.source.get_import_data()

    def test_phone_field(self):
        for e in self.fixture:
            d = self.data.get(data=e["id"])
            self.assertEqual(d.phone, e["expected"])
            self.assertEqual(d.json["phone"], e["phone"])

    def test_valid_phone_number_for_usa(self):
        phone = "4155552671"
        result = validate_and_format_phone_number(phone, ["US"])
        self.assertEqual(result, "+14155552671")


class TestMultiFieldGeocoding(TestCase):
    fixture = [
        # Name matching; cases that historically didn't work
        {
            "id": "1",
            "council": "Barnsley",
            "ward": "St Helens",
            "expected_postcodedata_column": "codes.admin_ward",
            "expected_postcodedata_value": "E05000993",
        },
        {
            "id": "2",
            "council": "North Lincolnshire",
            "ward": "Brigg & Wolds",
            "expected_postcodedata_column": "codes.admin_ward",
            "expected_postcodedata_value": "E05015081",
        },
        {
            "id": "3",
            "council": "Test Valley",
            "ward": "Andover Downlands",
            "expected_postcodedata_column": "codes.admin_ward",
            "expected_postcodedata_value": "E05012085",
        },
        {
            "id": "4",
            "council": "North Warwickshire",
            "ward": "Baddesley and Grendon",
            "expected_postcodedata_column": "codes.admin_ward",
            "expected_postcodedata_value": "E05007461",
        },
        # Name rewriting required
        {
            "id": "5",
            "council": "Herefordshire, County of",
            "ward": "Credenhill",
            "expected_postcodedata_column": "codes.admin_ward",
            "expected_postcodedata_value": "E05012957",
        },
        # GSS code matching
        {
            "id": "999",
            "ward": "E05000993",
            "expected_postcodedata_column": "codes.admin_ward",
            "expected_postcodedata_value": "E05000993",
        },
    ]

    @classmethod
    def setUpTestData(cls):
        # Get wards and council areas in to the DB
        subprocess.call("bin/import_preview_env_seed.sh --quiet")

        cls.source = LocalJSONSource.objects.create(
            name="geo_test",
            id_field="id",
            data=cls.fixture.copy(),
            geocoding_config=[
                {"field": "council", "type": ["STC", "DIS"]},
                {"field": "ward", "type": "WD23"},
            ],
        )

        # generate GenericData records
        async_to_sync(cls.source.import_many)(cls.source.data)

        # test that the GenericData records have valid, formatted phone field
        cls.data = cls.source.get_import_data()

    def test_geocoding_matches(self):
        for d in self.data:
            self.assertIsNotNone(d.postcode_data)
            postcode_data = benedict(d.postcode_data)
            self.assertEqual(
                postcode_data[d.json["expected_postcodedata_column"]],
                d.json["expected_postcodedata_value"],
            )
