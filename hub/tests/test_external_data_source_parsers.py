from datetime import datetime, timezone
import json

from django.test import TestCase
from asgiref.sync import async_to_sync
from hub.models import LocalJSONSource, Area
from hub.validation import validate_and_format_phone_number
from benedict import benedict
from unittest import skip
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


# @skip(reason="Requires areas to be loaded in the database")
class TestMultiLevelGeocoding(TestCase):
    fixture = [
        # Name matching; cases that historically didn't work
        {
            "id": "1",
            "council": "Barnsley",
            "ward": "St Helens",
            "expected_area_type_code": "WD23",
            "expected_area_gss": "E05000993",
        },
        {
            "id": "2",
            "council": "North Lincolnshire",
            "ward": "Brigg & Wolds",
            "expected_area_type_code": "WD23",
            "expected_area_gss": "E05015081",
        },
        {
            "id": "3",
            "council": "Test Valley",
            "ward": "Andover Downlands",
            "expected_area_type_code": "WD23",
            "expected_area_gss": "E05012085",
        },
        {
            "id": "4",
            "council": "North Warwickshire",
            "ward": "Baddesley and Grendon",
            "expected_area_type_code": "WD23",
            "expected_area_gss": "E05007461",
        },
        # Name rewriting required
        {
            "id": "5",
            "council": "Herefordshire, County of",
            "ward": "Credenhill",
            "expected_area_type_code": "WD23",
            "expected_area_gss": "E05012957",
        },
        # GSS code matching
        {
            "id": "999",
            "council": "E08000016",
            "ward": "E05000993",
            "expected_area_type_code": "WD23",
            "expected_area_gss": "E05000993",
        },
        # Misc
        # Gwynedd		Brithdir and Llanfachreth, Ganllwyd, Llanelltyd
        # is Brithdir and Llanfachreth/Ganllwyd/Llanelltyd in MapIt
        # https://mapit.mysociety.org/area/165898.html
        {
            "id": "6",
            "council": "Gwynedd",
            "ward": "Brithdir and Llanfachreth, Ganllwyd, Llanelltyd",
            "expected_area_type_code": "WD23", # TODO: actually it's a UTE, which 
            "expected_area_gss": "W05001514",
        },
        # Isle of Anglesey		Canolbarth Mon
        # https://mapit.mysociety.org/area/144265.html
        {
            "id": "7",
            "council": "Isle of Anglesey",
            "ward": "Canolbarth Mon",
            "expected_area_type_code": "WD23", # TODO: actually a UTE
            "expected_area_gss": "W05000985",
        },
        # Denbighshire		Rhyl T┼À Newydd
        # Weird character in the name, probably needs trigram matching or something
        # https://mapit.mysociety.org/area/166232.html
        {
            "id": "8",
            "council": "Denbighshire",
            "ward": "Rhyl T┼À Newydd",
            "expected_area_type_code": "WD23", # TODO: actually a UTE
            "expected_area_gss": "W05001354",
        },
        # Swansea		B├┤n-y-maen
        # Similarly, weird stuff in name
        # Maybe it's a problem with the encoding?
        # https://mapit.mysociety.org/area/165830.html  — Bon-y-maen
        {
            "id": "9",
            "council": "Swansea",
            "ward": "B├┤n-y-maen",
            "expected_area_type_code": "WD23", # TODO: actually a UTE
            "expected_area_gss": "W05001040",
        },
        # Gwynedd		Pendraw'r Llan
        # Ought to be Pen draw Llyn
        # https://mapit.mysociety.org/area/166296.html
        {
            "id": "10",
            "council": "Gwynedd",
            "ward": "Pendraw'r Llan",
            "expected_area_type_code": "WD23", # TODO: actually a UTE
            "expected_area_gss": "W05001556",
        },
        # Gwynedd		Tre-garth a Mynydd Llandyg├íi
        # https://mapit.mysociety.org/area/12219.html
        # Tregarth & Mynydd Llandygai
        {
            "id": "10",
            "council": "Gwynedd",
            "ward": "Tre-garth a Mynydd Llandyg├íi",
            "expected_area_type_code": "WD23", # TODO: actually a UTE
            "expected_area_gss": "W05000107",
        }
    ]

    @classmethod
    def setUpTestData(cls):
        subprocess.call("bin/import_areas_seed.sh")

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

    def test_geocoding_test_rig_is_valid(self):
        self.assertGreaterEqual(Area.objects.count(), 10135)
        self.assertGreaterEqual(
            Area.objects.filter(polygon__isnull=False).count(), 10135
        )
        self.assertGreaterEqual(Area.objects.filter(area_type__code="DIS").count(), 164)
        self.assertGreaterEqual(Area.objects.filter(area_type__code="STC").count(), 218)
        self.assertGreaterEqual(
            Area.objects.filter(area_type__code="WD23").count(), 8441
        )

    def test_geocoding_matches(self):
        for d in self.data:
            try:
                try:
                    self.assertEqual(
                        d.geocode_data["data"]["area_fields"][
                            d.json["expected_area_type_code"]
                        ],
                        d.json["expected_area_gss"],
                    )
                except KeyError:
                    raise AssertionError("Expected geocoding data was missing.")
                self.assertIsNotNone(d.postcode_data)
            except AssertionError as e:
                print(e)
                print(f"Geocoding failed:", d.id, json.dumps(d.json, indent=4))
                print(f"--Geocode data:", d.id, json.dumps(d.geocode_data, indent=4))
                print(f"--Postcode data:", d.id, json.dumps(d.postcode_data, indent=4))
                raise
