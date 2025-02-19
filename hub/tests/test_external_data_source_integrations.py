import os
from asyncio import sleep
from datetime import datetime
from pathlib import Path
from random import randint
from typing import List
from unittest import skip

from django.conf import settings
from django.core.files import File
from django.db.utils import IntegrityError
from django.test import TestCase

from asgiref.sync import async_to_sync, sync_to_async

from hub import models
from hub.tests.fixtures.custom_lookup import custom_lookup


class TestExternalDataSource:
    class Meta:
        abstract = True

    constituency_field = "constituency"
    mayoral_field = "mayoral region"

    def setUp(self) -> None:
        self.records_to_delete: list[tuple[str, models.ExternalDataSource]] = []

        self.organisation = models.Organisation.objects.create(
            name="Test Organisation", slug="test-organisation"
        )

        # Set up the pivot table
        self.custom_data_layer: models.DatabaseJSONSource = (
            models.DatabaseJSONSource.objects.create(
                name="Mayoral regions custom data layer",
                data_type=models.DatabaseJSONSource.DataSourceType.OTHER,
                organisation=self.organisation,
                id_field="council district",
                geography_column="council district",
                geography_column_type=models.DatabaseJSONSource.GeographyTypes.ADMIN_DISTRICT,
            )
        )
        fixture_data = custom_lookup.copy()
        async_to_sync(self.custom_data_layer.import_many)(fixture_data)
        data = self.custom_data_layer.get_import_data()
        self.assertEqual(data.count(), len(fixture_data))
        first_record = data.first()
        self.assertIn("council district", first_record.json)
        self.assertIn("mayoral region", first_record.json)
        self.assertIn(
            first_record.json["council district"],
            [
                "Newcastle upon Tyne",
                "North Tyneside",
                "South Tyneside",
                "Gateshead",
                "County Durham",
                "Sunderland",
                "Northumberland",
            ],
        )

        # Create the source itself
        self.source: models.ExternalDataSource = self.create_test_source()

        if self.source.automated_webhooks:
            self.source.teardown_unused_webhooks(force=True)

    def tearDown(self) -> None:
        try:
            for record_id, source in self.records_to_delete:
                source.delete_one(record_id)
        except NotImplementedError:
            # Not all sources support deletion.
            print("Warning: deletion not implemented for source", self.source.crm_type)
            pass
        if self.source.automated_webhooks:
            self.source.teardown_unused_webhooks(force=True)
        return super().tearDown()

    async def create_test_record(self, record: models.ExternalDataSource.CUDRecord):
        record = self.source.create_one(record)
        self.records_to_delete.append((self.source.get_record_id(record), self.source))
        return record

    async def create_many_test_records(
        self, records: List[models.ExternalDataSource.CUDRecord]
    ):
        records = self.source.create_many(records)
        self.records_to_delete += [
            (self.source.get_record_id(record), self.source) for record in records
        ]
        return records

    # Tests begin

    def test_deduplication(self):
        try:
            self.create_test_source(name="My duplicate source")  # Create duplicate
            self.assertTrue(False)  # Force failure if no exception
        except IntegrityError:
            pass

    def test_healthcheck(self):
        self.assertTrue(self.source.healthcheck())

    def test_field_definitions(self: TestCase):
        if self.source.introspect_fields:
            self.source.refresh_field_definitions()
            field_defs = self.source.field_definitions
            self.assertGreaterEqual(len(field_defs), 1)
        else:
            self.assertRaises(NotImplementedError, self.source.field_definitions)

    async def test_webhooks(self):
        if not self.source.automated_webhooks:
            return self.skipTest("Webhooks not automated")
        self.source.teardown_unused_webhooks(force=True)
        try:
            self.source.webhook_healthcheck()
            self.fail()
        except ValueError as e:
            self.assertTrue("Not enough webhooks" in str(e))
        self.source.setup_webhooks()
        self.assertTrue(self.source.webhook_healthcheck())

    async def test_import_many(self):
        # Confirm the database is empty
        original_count = await self.source.get_import_data().acount()
        self.assertEqual(original_count, 0)
        # Add some test data
        records = list(await self.source.fetch_all())
        fetch_count = len(records)
        self.assertGreaterEqual(fetch_count, 1)
        # Check that the import is storing it all
        await self.source.import_many(
            [self.source.get_record_id(record) for record in records]
        )
        import_data = self.source.get_import_data()
        import_count = await import_data.acount()
        self.assertEqual(import_count, fetch_count)
        # assert that 'council district' and 'mayoral region' keys are in the JSON object
        df = await sync_to_async(self.source.get_imported_dataframe)()
        self.assertEqual(len(df.index), import_count)

    async def test_fetch_one(self):
        record = await self.create_test_record(
            models.ExternalDataSource.CUDRecord(
                email=f"eh{randint(0, 1000)}sp@gmail.com",
                postcode="EH99 1SP",
                data=(
                    {
                        "addr1": "98 Canongate",
                        "city": "Edinburgh",
                        "state": "Midlothian",
                        "country": "GB",
                    }
                    if isinstance(self.source, models.MailchimpSource)
                    else {}
                ),
            )
        )
        # Test this functionality
        record = await self.source.fetch_one(self.source.get_record_id(record))
        # Check
        self.assertEqual(
            self.source.get_record_field(record, self.source.geography_column),
            "EH99 1SP",
        )

    async def test_fetch_many(self):
        test_record_data = [
            models.ExternalDataSource.CUDRecord(
                postcode="E5 0AA",
                email=f"E{randint(0, 1000)}AA@gmail.com",
                data=(
                    {
                        "addr1": "Millfields Rd",
                        "city": "London",
                        "state": "London",
                        "country": "GB",
                    }
                    if isinstance(self.source, models.MailchimpSource)
                    else {}
                ),
            ),
            models.ExternalDataSource.CUDRecord(
                postcode="E10 6EF",
                email=f"E{randint(0, 1000)}EF@gmail.com",
                data=(
                    {
                        "addr1": "123 Colchester Rd",
                        "city": "London",
                        "state": "London",
                        "country": "GB",
                    }
                    if isinstance(self.source, models.MailchimpSource)
                    else {}
                ),
            ),
        ]
        records = await self.create_many_test_records(test_record_data)
        record_ids = [self.source.get_record_id(record) for record in records]
        self.assertEqual(len(record_ids), 2)

        # Test this functionality
        records = await self.source.fetch_many(record_ids)

        # Check
        try:
            self.assertEqual(len(records), 2)
        except AssertionError as e:
            # ActionNetwork is sometimes slow to reflect new members
            if isinstance(self.source, models.ActionNetworkSource):
                await sleep(5)
                records = await self.source.fetch_many(record_ids)
                self.assertEqual(len(records), 2)
            # Should be an error for other source types
            else:
                raise e

        # Check the email field instead of postcode, because Mailchimp doesn't set
        # the postcode without a full address, which is not present in this test
        for test_record in test_record_data:
            record = next(
                filter(
                    lambda r: self.source.get_record_field(
                        r, self.source.postcode_field
                    )
                    == test_record["postcode"],
                    records,
                ),
                None,
            )
            self.assertIsNotNone(record)

    async def test_refresh_one(self):
        if not self.source.allow_updates:
            return self.skipTest("Source does not allow updates")

        record = await self.create_test_record(
            models.ExternalDataSource.CUDRecord(
                email=f"eh{randint(0, 1000)}sp@gmail.com",
                postcode="EH99 1SP",
                data=(
                    {
                        "addr1": "98 Canongate",
                        "city": "Edinburgh",
                        "state": "Midlothian",
                        "country": "GB",
                    }
                    if isinstance(self.source, models.MailchimpSource)
                    else {}
                ),
            )
        )
        # Test this functionality
        await self.source.refresh_one(
            record, update_kwargs=dict(action_network_background_processing=False)
        )
        # Check
        record = await self.source.fetch_one(self.source.get_record_id(record))
        self.assertEqual(
            self.source.get_record_field(record, self.constituency_field),
            "Edinburgh East and Musselburgh",
        )

    async def test_pivot_table(self):
        if not self.source.allow_updates:
            return self.skipTest("Source does not allow updates")

        """
        This is testing the ability for self.source to be updated using data from self.custom_data_layer
        i.e. to test the pivot table functionality
        that brings custom campaign data back into the CRM, based on geography
        """
        # Add a test record
        record = await self.create_test_record(
            models.ExternalDataSource.CUDRecord(
                email=f"NE{randint(0, 1000)}DD@gmail.com",
                postcode="NE12 6DD",
                data=(
                    {
                        "addr1": "Hadrian Court",
                        "city": "Newcastle upon Tyne",
                        "state": "Tyne and Wear",
                        "country": "GB",
                    }
                    if isinstance(self.source, models.MailchimpSource)
                    else {}
                ),
            )
        )
        mapped_member = await self.source.map_one(
            record,
            loaders=await self.source.get_loaders(),
            mapping=[
                models.UpdateMapping(
                    source=str(self.custom_data_layer.id),
                    source_path="mayoral region",
                    destination_column=self.mayoral_field,
                )
            ],
        )
        self.assertEqual(
            mapped_member["update_fields"][self.mayoral_field],
            "North East Mayoral Combined Authority",
        )

    async def test_refresh_many(self):
        if not self.source.allow_updates:
            return self.skipTest("Source does not allow updates")

        records = await self.create_many_test_records(
            [
                models.ExternalDataSource.CUDRecord(
                    postcode="E10 6EF",
                    email=f"hj{randint(0, 1000)}rardd@gmail.com",
                    data=(
                        {
                            "addr1": "123 Colchester Rd",
                            "city": "London",
                            "state": "London",
                            "country": "GB",
                        }
                        if isinstance(self.source, models.MailchimpSource)
                        else {}
                    ),
                ),
                models.ExternalDataSource.CUDRecord(
                    postcode="E5 0AA",
                    email=f"kl{randint(0, 1000)}rwefw@gmail.com",
                    data=(
                        {
                            "addr1": "Millfields Rd",
                            "city": "London",
                            "state": "London",
                            "country": "GB",
                        }
                        if isinstance(self.source, models.MailchimpSource)
                        else {}
                    ),
                ),
            ]
        )
        # Test this functionality
        await self.source.refresh_many(
            records, update_kwargs=dict(action_network_background_processing=False)
        )
        # Check
        records = await self.source.fetch_many(
            [self.source.get_record_id(record) for record in records]
        )
        self.assertEqual(len(records), 2)
        for record in records:
            if (
                self.source.get_record_field(record, self.source.geography_column)
                == "E5 0AA"
            ):
                self.assertEqual(
                    self.source.get_record_field(record, self.constituency_field),
                    "Hackney North and Stoke Newington",
                )
            elif (
                self.source.get_record_field(record, self.source.geography_column)
                == "E10 6EF"
            ):
                self.assertEqual(
                    self.source.get_record_field(record, self.constituency_field),
                    "Leyton and Wanstead",
                )
            else:
                self.fail()

    async def test_enrichment_electoral_commission(self):
        if not self.source.allow_updates:
            return self.skipTest("Source does not allow updates")

        """
        This is testing the ability to enrich data from the data source
        using a third party source
        """
        # Add a test record
        record = await self.create_test_record(
            models.ExternalDataSource.CUDRecord(
                email=f"NE{randint(0, 1000)}DD@gmail.com",
                postcode="DH1 1AE",
                data=(
                    {
                        "addr1": "38 Swinside Dr",
                        "city": "Durham",
                        "state": "Durham",
                        "country": "GB",
                    }
                    if isinstance(self.source, models.MailchimpSource)
                    else {}
                ),
            )
        )
        mapped_member = await self.source.map_one(
            record,
            loaders=await self.source.get_loaders(),
            mapping=[
                models.UpdateMapping(
                    source="electoral_commission_postcode_lookup",
                    source_path="electoral_services.name",
                    destination_column="electoral service",
                )
            ],
        )
        self.assertEqual(
            mapped_member["update_fields"]["electoral service"],
            "Durham County Council",
        )

    async def test_analytics_counts(self):
        """
        This is testing the ability to get record counts from the data source
        """
        # Add some test data
        created_records = await self.create_many_test_records(
            [
                models.ExternalDataSource.CUDRecord(
                    postcode="E5 0AA",
                    email=f"E{randint(0, 1000)}AA@gmail.com",
                    data=(
                        {
                            "addr1": "Millfields Rd",
                            "city": "London",
                            "state": "London",
                            "country": "GB",
                        }
                        if isinstance(self.source, models.MailchimpSource)
                        else {}
                    ),
                ),
                models.ExternalDataSource.CUDRecord(
                    postcode="E10 6EF",
                    email=f"E{randint(0, 1000)}EF@gmail.com",
                    data=(
                        {
                            "addr1": "123 Colchester Rd",
                            "city": "London",
                            "state": "London",
                            "country": "GB",
                        }
                        if isinstance(self.source, models.MailchimpSource)
                        else {}
                    ),
                ),
            ]
        )
        # import
        records = await self.source.fetch_many(
            [self.source.get_record_id(record) for record in created_records]
        )
        await self.source.import_many(
            [self.source.get_record_id(record) for record in records]
        )
        # check analytics
        analytics = self.source.imported_data_count_by_area(
            "parliamentary_constituency"
        )
        analytics = await sync_to_async(list)(analytics)
        self.assertGreaterEqual(len(analytics), 2)
        constituencies_in_report = [a["label"] for a in analytics]

        self.assertIn("Hackney North and Stoke Newington", constituencies_in_report)
        self.assertIn("Leyton and Wanstead", constituencies_in_report)
        for a in analytics:
            if a["label"] == "Hackney North and Stoke Newington":
                self.assertGreaterEqual(a["count"], 1)
            elif a["label"] == "Leyton and Wanstead":
                self.assertGreaterEqual(a["count"], 1)

        analytics = self.source.imported_data_count_by_area("admin_district")
        analytics = await sync_to_async(list)(analytics)
        self.assertGreaterEqual(len(analytics), 2)
        constituencies_in_report = [a["label"] for a in analytics]

        self.assertIn("Hackney", constituencies_in_report)
        self.assertIn("Waltham Forest", constituencies_in_report)
        for a in analytics:
            if a["label"] == "Hackney":
                self.assertGreaterEqual(a["count"], 1)
            elif a["label"] == "Waltham Forest":
                self.assertGreaterEqual(a["count"], 1)

    async def test_analytics_imported_data(self):
        """
        This is testing the ability to get record data from the data source
        """
        # Add some test data
        created_records = await self.create_many_test_records(
            [
                models.ExternalDataSource.CUDRecord(
                    postcode="E5 0AA",
                    email=f"E{randint(0, 1000)}AA@gmail.com",
                    data=(
                        {
                            "addr1": "Millfields Rd",
                            "city": "London",
                            "state": "London",
                            "country": "GB",
                        }
                        if isinstance(self.source, models.MailchimpSource)
                        else {}
                    ),
                ),
                models.ExternalDataSource.CUDRecord(
                    postcode="E5 0AB",
                    email=f"E{randint(0, 1000)}AA@gmail.com",
                    data=(
                        {
                            "addr1": "Millfields Rd",
                            "city": "London",
                            "state": "London",
                            "country": "GB",
                        }
                        if isinstance(self.source, models.MailchimpSource)
                        else {}
                    ),
                ),
                models.ExternalDataSource.CUDRecord(
                    postcode="E10 6EF",
                    email=f"E{randint(0, 1000)}EF@gmail.com",
                    data=(
                        {
                            "addr1": "123 Colchester Rd",
                            "city": "London",
                            "state": "London",
                            "country": "GB",
                        }
                        if isinstance(self.source, models.MailchimpSource)
                        else {}
                    ),
                ),
            ]
        )
        # import
        records = await self.source.fetch_many(
            [self.source.get_record_id(record) for record in created_records]
        )
        await self.source.import_many(
            [self.source.get_record_id(record) for record in records]
        )
        # check analytics
        analytics = self.source.imported_data_by_area("parliamentary_constituency")
        analytics = await sync_to_async(list)(analytics)
        self.assertGreaterEqual(len(analytics), 3)
        constituencies_in_report = [a["label"] for a in analytics]

        self.assertIn("Hackney North and Stoke Newington", constituencies_in_report)
        self.assertIn("Leyton and Wanstead", constituencies_in_report)
        for a in analytics:
            postcode = self.source.get_record_field(
                a["imported_data"], self.source.postcode_field
            )
            if a["label"] == "Hackney North and Stoke Newington":
                self.assertIn(postcode, ["E5 0AA", "E5 0AB"])
            elif a["label"] == "Leyton and Wanstead":
                self.assertEqual(postcode, "E10 6EF")

        analytics = self.source.imported_data_by_area("admin_district")
        analytics = await sync_to_async(list)(analytics)
        self.assertGreaterEqual(len(analytics), 3)
        constituencies_in_report = [a["label"] for a in analytics]

        self.assertIn("Hackney", constituencies_in_report)
        self.assertIn("Waltham Forest", constituencies_in_report)
        for a in analytics:
            postcode = self.source.get_record_field(
                a["imported_data"], self.source.postcode_field
            )
            if a["label"] == "Hackney":
                self.assertIn(postcode, ["E5 0AA", "E5 0AB"])
            elif a["label"] == "Waltham Forest":
                self.assertEqual(postcode, "E10 6EF")


class TestAirtableSource(TestExternalDataSource, TestCase):
    def create_test_source(self, name="My test Airtable member list"):
        self.source = models.AirtableSource.objects.create(
            name=name,
            data_type=models.AirtableSource.DataSourceType.MEMBER,
            organisation=self.organisation,
            base_id=settings.TEST_AIRTABLE_MEMBERLIST_BASE_ID,
            table_id=settings.TEST_AIRTABLE_MEMBERLIST_TABLE_NAME,
            api_key=settings.TEST_AIRTABLE_MEMBERLIST_API_KEY,
            geography_column="Postcode",
            geography_column_type=models.AirtableSource.GeographyTypes.POSTCODE,
            postcode_field="Postcode",
            email_field="Email",
            auto_update_enabled=True,
            update_mapping=[
                {
                    "source": "postcodes.io",
                    "source_path": "parliamentary_constituency_2024",
                    "destination_column": self.constituency_field,
                },
                {
                    "source": str(self.custom_data_layer.id),
                    "source_path": "mayoral region",
                    "destination_column": self.mayoral_field,
                },
            ],
        )
        return self.source


class TestMailchimpSource(TestExternalDataSource, TestCase):
    constituency_field = "CONSTITUEN"
    mayoral_field = "MAYORAL_RE"

    def create_test_source(self, name="My test Mailchimp member list"):
        self.source = models.MailchimpSource.objects.create(
            name=name,
            data_type=models.MailchimpSource.DataSourceType.MEMBER,
            organisation=self.organisation,
            api_key=settings.TEST_MAILCHIMP_MEMBERLIST_API_KEY,
            list_id=settings.TEST_MAILCHIMP_MEMBERLIST_AUDIENCE_ID,
            email_field="email_address",
            geography_column="ADDRESS.zip",
            geography_column_type=models.MailchimpSource.GeographyTypes.POSTCODE,
            auto_update_enabled=True,
            update_mapping=[
                {
                    "source": "postcodes.io",
                    "source_path": "parliamentary_constituency_2024",
                    # 10 characters and uppercase for Mailchimp custom fields
                    "destination_column": self.constituency_field[:10].upper(),
                },
                {
                    "source": str(self.custom_data_layer.id),
                    "source_path": "mayoral region",
                    "destination_column": self.mayoral_field[:10].upper(),
                },
            ],
        )
        return self.source


class TestActionNetworkSource(TestExternalDataSource, TestCase):
    constituency_field = "custom_fields.constituency"
    mayoral_field = "custom_fields.mayoral_region"

    def create_test_source(self, name="My test AN member list"):
        self.source = models.ActionNetworkSource.objects.create(
            name=name,
            data_type=models.ActionNetworkSource.DataSourceType.MEMBER,
            organisation=self.organisation,
            api_key=settings.TEST_ACTIONNETWORK_MEMBERLIST_API_KEY,
            geography_column="postal_addresses[0].postal_code",
            email_field="email_addresses[0].address",
            geography_column_type=models.MailchimpSource.GeographyTypes.POSTCODE,
            auto_update_enabled=True,
            update_mapping=[
                {
                    "source": "postcodes.io",
                    "source_path": "parliamentary_constituency_2024",
                    "destination_column": self.constituency_field,
                },
                {
                    "source": str(self.custom_data_layer.id),
                    "source_path": "mayoral region",
                    "destination_column": self.mayoral_field,
                },
            ],
        )
        return self.source

    async def create_test_record(self, record: models.ExternalDataSource.CUDRecord):
        records = await self.create_many_test_records([record])
        return records[0]

    async def create_many_test_records(
        self, records: List[models.ExternalDataSource.CUDRecord]
    ):
        # don't create records, and return existing records
        # this is because Action Network records can't be deleted
        postcodes_to_ids = {
            "EH99 1SP": "c6d37304-200c-44b4-8eda-04a03e706531",
            "NE12 6DD": "2574d845-f5bb-4ba2-af9b-a712d10119b1",
            "DH1 1AE": "42fe3b4a-f445-47ce-ba81-7ec38d95dc70",
            "E10 6EF": "d88da43f-8984-41d8-80fa-4f9fbb3d6006",
            "E5 0AA": "ad6228a2-74c1-48fd-85ee-90eafbaca397",
            "E5 0AB": "b762c93b-a23d-45c8-85c4-0d20c3c8a9e5",
        }
        records = await self.source.fetch_many(
            [postcodes_to_ids[record["postcode"]] for record in records]
        )
        return records

    async def test_fetch_page(self):
        """
        Ensure that fetching page-by-page gives the same count as fetching all.
        """
        all_records = await self.source.fetch_all()
        all_records = list(all_records)
        paged_records = []
        page = 1
        while True:
            # page_size 26 to check non-multiples of 25 still work
            records, has_more = await self.source.fetch_page(page, max_page_size=26)
            if not has_more:
                break
            paged_records += records
            page += 1
        self.assertEqual(len(all_records), len(paged_records))


@skip(
    reason="Google Sheets can't be automatically tested as the refresh token expires after 7 days - need to use a published app"
)
class TestEditableGoogleSheetsSource(TestExternalDataSource, TestCase):
    def create_test_source(self, name="My test Google member list"):
        self.source: models.EditableGoogleSheetsSource = (
            models.EditableGoogleSheetsSource.objects.create(
                name=name,
                data_type=models.EditableGoogleSheetsSource.DataSourceType.MEMBER,
                organisation=self.organisation,
                oauth_credentials=settings.TEST_GOOGLE_SHEETS_CREDENTIALS,
                spreadsheet_id=settings.TEST_GOOGLE_SHEETS_SPREADSHEET_ID,
                sheet_name=settings.TEST_GOOGLE_SHEETS_SHEET_NAME,
                geography_column="postcode",
                id_field="email",
                email_field="email",
                geography_column_type=models.EditableGoogleSheetsSource.GeographyTypes.POSTCODE,
                auto_update_enabled=True,
                update_mapping=[
                    {
                        "source": "postcodes.io",
                        "source_path": "parliamentary_constituency_2024",
                        "destination_column": self.constituency_field,
                    },
                    {
                        "source": str(self.custom_data_layer.id),
                        "source_path": "mayoral region",
                        "destination_column": self.mayoral_field,
                    },
                ],
            )
        )
        return self.source

    async def test_fetch_all(self):
        now = str(datetime.now().timestamp())
        test_record_data = [
            models.ExternalDataSource.CUDRecord(
                postcode=now + "11111", email=now + "11111@gmail.com", data={}
            ),
            models.ExternalDataSource.CUDRecord(
                postcode=now + "22222", email=now + "22222@gmail.com", data={}
            ),
        ]
        await self.create_many_test_records(test_record_data)

        # Test this functionality
        records = await self.source.fetch_all()

        # Check
        # Assumes there were 4 records in the test data source before this test ran
        self.assertEqual(len(records), 6)

        for test_record in test_record_data:
            record = next(
                filter(
                    lambda r: self.source.get_record_field(r, self.source.email_field)
                    == test_record["email"],
                    records,
                ),
                None,
            )
            self.assertIsNotNone(record)


class TestUploadedCSVSource(TestExternalDataSource, TestCase):
    fixtures = ["regions"]
    file_path_from_root = "hub/fixtures/regional_health_data_for_tests.csv"

    def create_test_source(self, name="My test CSV file"):
        path = Path(os.path.join(settings.BASE_DIR, self.file_path_from_root))

        with path.open(mode="rb") as f:
            file = File(f, name=path.name)

            self.source: models.UploadedCSVSource = (
                models.UploadedCSVSource.objects.create(
                    name=name,
                    data_type=models.EditableGoogleSheetsSource.DataSourceType.AREA_STATS,
                    organisation=self.organisation,
                    id_field="geography code",
                    geocoding_config={
                        "type": models.UploadedCSVSource.GeographyTypes.AREA,
                        "components": [
                            {
                                "field": "geography",
                                "metadata": {"lih_area_type__code": "EER"},
                            }
                        ],
                    },
                    spreadsheet_file=file,
                )
            )
            return self.source

    async def test_fetch_one(self):
        # Get a single ID from the freshly read CSV
        # Test this functionality
        record = await self.source.fetch_one("E12000001")
        # Check
        self.assertEqual(
            self.source.get_record_field(record, "geography"),
            "North East",
        )

    async def test_fetch_many(self):
        rows = await self.source.fetch_many(["E12000004", "E12000005"])

        # 10 rows
        self.assertEqual(len(rows), 2)
        # Find data matching
        expected_rows = [
            {"geography": "East Midlands", "geography code": "E12000004"},
            {"geography": "West Midlands", "geography code": "E12000005"},
        ]
        for expected in expected_rows:
            record = next(
                filter(
                    lambda r: self.source.get_record_field(r, "geography code")
                    == expected["geography code"],
                    rows,
                ),
                None,
            )
            self.assertIsNotNone(record)
            self.assertEqual(
                self.source.get_record_field(record, "geography"),
                expected["geography"],
            )

    async def test_fetch_all(self):
        rows = await self.source.fetch_all()

        # 10 rows
        self.assertEqual(len(rows), 10)
        # Check fetch generates valid dictionaries (via DF ingest)
        for record in rows:
            self.assertEqual(
                self.source.get_record_id(record),
                record.get("geography code", None),
            )

    async def test_import_async(self):
        self.skipTest("Not implemented")

    async def test_import_many(self):
        # Confirm the database is empty
        original_count = await self.source.get_import_data().acount()
        self.assertEqual(original_count, 0)

        # Add some test data
        records = list(await self.source.fetch_all())
        fetch_count = len(records)
        self.assertGreaterEqual(fetch_count, 10)

        # Check that the import is storing it all
        await self.source.import_many(
            [self.source.get_record_id(record) for record in records]
        )

        # Test GenericData queryset
        import_data = self.source.get_import_data()
        import_count = await import_data.acount()
        self.assertEqual(import_count, fetch_count)
        data = await sync_to_async(list)(import_data.select_related("area"))

        # Check the data has been geocoded
        north_east = next(
            filter(
                lambda r: r.json.get("geography code") == "E12000001",
                data,
            ),
            None,
        )
        self.assertEqual("E12000001", north_east.data)
        self.assertIsNotNone(north_east.postcode_data)
        self.assertIsNotNone(north_east.area.name)

        # Test dataframe
        df = await sync_to_async(self.source.get_imported_dataframe)()
        self.assertEqual(len(df.index), import_count)
        self.assertEqual(len(df.index), import_count)
        self.assertIn("geography", list(df.columns.values))

    async def test_analytics_counts(self):
        """
        This is testing the ability to get record counts from the data source
        """
        # Load all data into DB
        records = list(await self.source.fetch_all())
        await self.source.import_many(
            [self.source.get_record_id(record) for record in records]
        )

        # Check analytical queries
        analytics = self.source.imported_data_count_by_area("european_electoral_region")
        analytics = await sync_to_async(list)(analytics)
        self.assertEqual(len(analytics), 10)

    async def test_analytics_imported_data(self):
        """
        This is testing the ability to get record data from the data source
        """
        self.skipTest("Not implemented")
        analytics = self.source.imported_data_count_by_area("european_electoral_region")
        analytics = await sync_to_async(list)(analytics)
        self.assertEqual(len(analytics), 10)
        constituencies_in_report = [a["label"] for a in analytics]
        self.assertIn("North West", constituencies_in_report)

    def test_field_definitions(self: TestCase):
        self.source.refresh_field_definitions()
        field_defs = self.source.field_definitions
        self.assertSetEqual(
            set([field["value"] for field in field_defs]),
            set(
                [
                    "date",
                    "geography",
                    "geography code",
                    "General Health: Very good health",
                    "General Health: Good health",
                    "General Health: Fair health",
                    "General Health: Bad health",
                    "General Health: Very bad health",
                ]
            ),
        )
