import json
import os
import subprocess
from datetime import datetime, timezone
from unittest import skipIf

from django.test import TestCase

from asgiref.sync import async_to_sync

from hub.models import Area, LocalJSONSource
from hub.tests.fixtures.geocoding_cases import geocoding_cases
from hub.validation import validate_and_format_phone_number
from utils import mapit_types

ignore_geocoding_tests = os.getenv("RUN_GEOCODING_TESTS") != "1"


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


@skipIf(ignore_geocoding_tests, "It messes up data for other tests.")
class TestMultiLevelGeocoding(TestCase):
    fixture = geocoding_cases

    @classmethod
    def setUpTestData(cls):
        subprocess.call("bin/import_areas_seed.sh")

        for d in cls.fixture:
            if d["expected_area_gss"] is not None:
                area = Area.objects.filter(gss=d["expected_area_gss"]).first()
                if area is None:
                    print(f"Area not found, skipping: {d['expected_area_gss']}")
                    # remove the area from the test data so tests can run
                    index_of_data = next(
                        i for i, item in enumerate(cls.fixture) if item["id"] == d["id"]
                    )
                    cls.fixture.pop(index_of_data)

        cls.source = LocalJSONSource.objects.create(
            name="geo_test",
            id_field="id",
            data=cls.fixture.copy(),
            geocoding_config=[
                {"field": "council", "lih_area_type__code": ["STC", "DIS"]},
                {"field": "ward", "lih_area_type__code": "WD23"},
            ],
        )

    def test_geocoding_test_rig_is_valid(self):
        self.assertGreaterEqual(Area.objects.count(), 19542)
        self.assertGreaterEqual(
            Area.objects.filter(polygon__isnull=False).count(), 19542
        )
        self.assertGreaterEqual(Area.objects.filter(area_type__code="DIS").count(), 164)
        self.assertGreaterEqual(Area.objects.filter(area_type__code="STC").count(), 218)
        self.assertGreaterEqual(
            Area.objects.filter(area_type__code="WD23").count(), 8000
        )

        # re-generate GenericData records
        async_to_sync(self.source.import_many)(self.source.data)

        # load up the data for tests
        self.data = self.source.get_import_data()

        for d in self.data:
            try:
                if d.json["expected_area_gss"] is not None:
                    area = Area.objects.get(gss=d.json["expected_area_gss"])
                    self.assertIsNotNone(area)
            except Area.DoesNotExist:
                pass

    def test_geocoding_matches(self):
        # re-generate GenericData records
        async_to_sync(self.source.import_many)(self.source.data)

        # load up the data for tests
        self.data = self.source.get_import_data()

        self.assertEqual(
            len(self.data),
            len(self.source.data),
            "All data should be imported.",
        )

        for d in self.data:
            try:
                try:
                    if d.json["ward"] is None:
                        self.assertIsNone(d.postcode_data, "None shouldn't geocode.")
                        continue
                    elif d.json["expected_area_gss"] is None:
                        self.assertIsNone(
                            d.postcode_data, "Expect MapIt to have failed."
                        )
                        continue
                    elif d.json["expected_area_gss"] is not None:
                        self.assertEqual(
                            d.geocode_data["data"]["area_fields"][
                                d.json["expected_area_type_code"]
                            ],
                            d.json["expected_area_gss"],
                        )
                        self.assertFalse(
                            d.geocode_data["skipped"], "Geocoding should be done."
                        )
                        self.assertIsNotNone(d.postcode_data)
                        self.assertGreaterEqual(
                            len(d.geocode_data["steps"]),
                            3,
                            "Geocoding outcomes should be debuggable, for future development.",
                        )
                except KeyError:
                    raise AssertionError("Expected geocoding data was missing.")
            except AssertionError as e:
                print(e)
                print("Geocoding failed:", d.id, json.dumps(d.json, indent=4))
                print("--Geocode data:", d.id, json.dumps(d.geocode_data, indent=4))
                print("--Postcode data:", d.id, json.dumps(d.postcode_data, indent=4))
                raise

    def test_by_mapit_types(self):
        """
        Geocoding should work identically on more granular mapit_types
        """

        self.source.geocoding_config = [
            {
                "field": "council",
                "mapit_type": mapit_types.MAPIT_COUNCIL_TYPES,
            },
            {"field": "ward", "mapit_type": mapit_types.MAPIT_WARD_TYPES},
        ]
        self.source.save()

        # re-generate GenericData records
        async_to_sync(self.source.import_many)(self.source.data)

        # load up the data for tests
        self.data = self.source.get_import_data()

        for d in self.data:
            try:
                try:
                    if d.json["ward"] is None:
                        self.assertIsNone(d.postcode_data, "None shouldn't geocode.")
                        continue
                    elif d.json["expected_area_gss"] is None:
                        self.assertIsNone(
                            d.postcode_data, "Expect MapIt to have failed."
                        )
                        continue
                    elif d.json["expected_area_gss"] is not None:
                        self.assertEqual(
                            d.geocode_data["data"]["area_fields"][
                                d.json["expected_area_type_code"]
                            ],
                            d.json["expected_area_gss"],
                        )
                        self.assertIsNotNone(d.postcode_data)
                        self.assertDictEqual(
                            dict(self.source.geocoding_config),
                            dict(d.geocode_data.get("config", {})),
                            "Geocoding config should be the same as the source's",
                        )
                        self.assertFalse(
                            d.geocode_data["skipped"], "Geocoding should be done."
                        )
                except KeyError:
                    raise AssertionError("Expected geocoding data was missing.")
            except AssertionError as e:
                print(e)
                print("Geocoding failed:", d.id, json.dumps(d.json, indent=4))
                print("--Geocode data:", d.id, json.dumps(d.geocode_data, indent=4))
                print("--Postcode data:", d.id, json.dumps(d.postcode_data, indent=4))
                raise

    def test_skipping(self):
        """
        If all geocoding config is the same, and the data is the same too, then geocoding should be skipped
        """
        # generate GenericData records — first time they should all geocode
        async_to_sync(self.source.import_many)(self.source.data)

        # re-generate GenericData records — this time, they should all skip
        async_to_sync(self.source.import_many)(self.source.data)

        # load up the data for tests
        self.data = self.source.get_import_data()

        for d in self.data:
            try:
                try:
                    if d.json["expected_area_gss"] is not None:
                        self.assertTrue(
                            d.geocode_data["skipped"], "Geocoding should be skipped."
                        )
                        self.assertIsNotNone(d.postcode_data)
                except KeyError:
                    raise AssertionError("Expected geocoding data was missing.")
            except AssertionError as e:
                print(e)
                print(
                    "Geocoding was repeated unecessarily:",
                    d.id,
                    json.dumps(d.json, indent=4),
                )
                print("--Geocode data:", d.id, json.dumps(d.geocode_data, indent=4))
                print("--Postcode data:", d.id, json.dumps(d.postcode_data, indent=4))
                raise


@skipIf(ignore_geocoding_tests, "It messes up data for other tests.")
class TestComplexAddressGeocoding(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.source = LocalJSONSource.objects.create(
            name="address_test",
            id_field="id",
            data=[
                {
                    "id": "1",
                    "venue_name": "Boots",
                    "address": "415-417 Victoria Rd, Govanhill",
                    "expected_postcode": "G42 8RW",
                },
                {
                    "id": "2",
                    "venue_name": "Lidl",
                    "address": "Victoria Road",
                    "expected_postcode": "G42 7RP",
                },
                {
                    "id": "3",
                    "venue_name": "Sainsbury's",
                    "address": "Gordon Street",
                    "expected_postcode": "G1 3RS",
                },
                {
                    # Special case: "online"
                    "id": "4",
                    "venue_name": "Barclays",
                    "address": "online",
                    "expected_postcode": None,
                },
                # Edge cases
                {
                    "id": "5",
                    "venue_name": None,
                    "address": "100 Torisdale Street",
                    "expected_postcode": "G42 8PH",
                },
                {
                    "id": "6",
                    "venue_name": "Glasgow City Council Chambers",
                    "address": None,
                    "expected_postcode": "G2 1DU",
                },
                {
                    "id": "7",
                    "venue_name": "Boots",
                    "address": None,
                    "expected_postcode": None,
                },
                {
                    "id": "8",
                    "venue_name": None,
                    "address": None,
                    "expected_postcode": None,
                },
            ],
            geocoding_config=[
                # Resulting address query should be something like "Barclays, Victoria Road, Glasgow"
                {"type": "prefix", "field": "venue_name"},
                {"type": "address", "field": "address"},
                {"type": "suffix", "value": "Glasgow"},
            ],
        )

    def test_geocoding_matches(self):
        # re-generate GenericData records
        async_to_sync(self.source.import_many)(self.source.data)

        # load up the data for tests
        self.data = self.source.get_import_data()

        self.assertEqual(
            len(self.data),
            len(self.source.data),
            "All data should be imported.",
        )

        for d in self.data:
            try:
                try:
                    if d.json["expected_postcode"] is not None:
                        self.assertIsNotNone(d.postcode_data)
                        self.assertEqual(
                            d.postcode_data["postcode"], d.json["expected_postcode"]
                        )
                        self.assertGreaterEqual(len(d.geocode_data["steps"]), 1)
                except KeyError:
                    raise AssertionError("Expected geocoding data was missing.")
            except AssertionError as e:
                print(e)
                print("Geocoding failed:", d.id, json.dumps(d.json, indent=4))
                print("--Geocode data:", d.id, json.dumps(d.geocode_data, indent=4))
                print("--Postcode data:", d.id, json.dumps(d.postcode_data, indent=4))
                raise

    def test_skipping(self):
        """
        If all geocoding config is the same, and the data is the same too, then geocoding should be skipped
        """
        # generate GenericData records — first time they should all geocode
        async_to_sync(self.source.import_many)(self.source.data)

        # re-generate GenericData records — this time, they should all skip
        async_to_sync(self.source.import_many)(self.source.data)

        # load up the data for tests
        self.data = self.source.get_import_data()

        for d in self.data:
            try:
                try:
                    if d.json["expected_postcode"] is not None:
                        self.assertIsNotNone(d.postcode_data)
                        self.assertTrue(
                            d.geocode_data["skipped"], "Geocoding should be skipped."
                        )
                except KeyError:
                    raise AssertionError("Expected geocoding data was missing.")
            except AssertionError as e:
                print(e)
                print(
                    "Geocoding was repeated unecessarily:",
                    d.id,
                    json.dumps(d.json, indent=4),
                )
                print("--Geocode data:", d.id, json.dumps(d.geocode_data, indent=4))
                print("--Postcode data:", d.id, json.dumps(d.postcode_data, indent=4))
                raise


@skipIf(ignore_geocoding_tests, "It messes up data for other tests.")
class TestCoordinateGeocoding(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.source = LocalJSONSource.objects.create(
            name="coordinates_test",
            id_field="id",
            data=[
                {
                    "id": "1",
                    "longitude": -1.342881,
                    "latitude": 51.846073,
                    "expected_postcode": "OX20 1ND",
                },
                {
                    # Should work with strings too
                    "id": "2",
                    "longitude": "-1.702695",
                    "latitude": "52.447681",
                    "expected_postcode": "B92 0HJ",
                },
                {
                    "id": "3",
                    "longitude": " -1.301473",
                    "latitude": 53.362753,
                    "expected_postcode": "S26 2GA",
                },
                {
                    # Handle failure cases gracefully
                    "id": "4",
                    "longitude": -4.2858,
                    "latitude": None,
                    "expected_postcode": None,
                },
                # Gracefully handle non-numeric coordinates
                {
                    "id": "5",
                    "longitude": "invalid",
                    "latitude": "invalid",
                    "expected_postcode": None,
                },
                # Gracefully handle crazy big coordinates
                {
                    "id": "6",
                    "longitude": 0,
                    "latitude": 1000,
                    "expected_postcode": None,
                },
            ],
            geocoding_config=[
                # Resulting address query should be something like "Barclays, Victoria Road, Glasgow"
                {"type": "latitude", "field": "latitude"},
                {"type": "longitude", "field": "longitude"},
            ],
        )

    def test_geocoding_matches(self):
        # re-generate GenericData records
        async_to_sync(self.source.import_many)(self.source.data)

        # load up the data for tests
        self.data = self.source.get_import_data()

        self.assertEqual(
            len(self.data),
            len(self.source.data),
            "All data should be imported.",
        )

        for d in self.data:
            try:
                try:
                    if d.json["expected_postcode"] is not None:
                        self.assertIsNotNone(d.postcode_data)
                        self.assertEqual(
                            d.postcode_data["postcode"], d.json["expected_postcode"]
                        )
                        self.assertGreaterEqual(len(d.geocode_data["steps"]), 1)
                except KeyError:
                    raise AssertionError("Expected geocoding data was missing.")
            except AssertionError as e:
                print(e)
                print("Geocoding failed:", d.id, json.dumps(d.json, indent=4))
                print("--Geocode data:", d.id, json.dumps(d.geocode_data, indent=4))
                print("--Postcode data:", d.id, json.dumps(d.postcode_data, indent=4))
                raise

    def test_skipping(self):
        """
        If all geocoding config is the same, and the data is the same too, then geocoding should be skipped
        """
        # generate GenericData records — first time they should all geocode
        async_to_sync(self.source.import_many)(self.source.data)

        # re-generate GenericData records — this time, they should all skip
        async_to_sync(self.source.import_many)(self.source.data)

        # load up the data for tests
        self.data = self.source.get_import_data()

        for d in self.data:
            try:
                try:
                    if d.json["expected_postcode"] is not None:
                        self.assertIsNotNone(d.postcode_data)
                        self.assertTrue(
                            d.geocode_data["skipped"], "Geocoding should be skipped."
                        )
                except KeyError:
                    raise AssertionError("Expected geocoding data was missing.")
            except AssertionError as e:
                print(e)
                print(
                    "Geocoding was repeated unecessarily:",
                    d.id,
                    json.dumps(d.json, indent=4),
                )
                print("--Geocode data:", d.id, json.dumps(d.geocode_data, indent=4))
                print("--Postcode data:", d.id, json.dumps(d.postcode_data, indent=4))
                raise
