import logging
import uuid

from django.conf import settings
from django.core.management.base import BaseCommand

from asgiref.sync import async_to_sync
from wagtail.models import Site

from hub.models import (
    AirtableSource,
    HubContentPage,
    HubHomepage,
    MapReport,
    Organisation,
    User,
)

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        if settings.ENVIRONMENT == "production":
            logger.info("Refusing to run the seed command in production")
            return

        # Create an org for the first user
        user = User.objects.filter(username=settings.DJANGO_SUPERUSER_USERNAME).first()
        if not user:
            user = User.objects.create_superuser(
                settings.DJANGO_SUPERUSER_USERNAME,
                settings.DJANGO_SUPERUSER_EMAIL,
                settings.DJANGO_SUPERUSER_PASSWORD,
            )

        logger.info(
            "Created a user with credentials: "
            f"{settings.DJANGO_SUPERUSER_USERNAME} / {settings.DJANGO_SUPERUSER_PASSWORD}"
        )

        org = Organisation.get_or_create_for_user(user)

        # Import custom data source
        custom_data_source: AirtableSource
        custom_data_source, _ = AirtableSource.objects.get_or_create(
            base_id=settings.SEED_AIRTABLE_DATASOURCE_BASE_ID,
            table_id=settings.SEED_AIRTABLE_DATASOURCE_TABLE_NAME,
            defaults={
                "api_key": settings.SEED_AIRTABLE_DATASOURCE_API_KEY,
                "name": "Seed Custom Data",
                "data_type": AirtableSource.DataSourceType.OTHER,
                "organisation": org,
                "geography_column_type": AirtableSource.GeographyTypes.PARLIAMENTARY_CONSTITUENCY_2024,
                "geography_column": "Constituency",
                "title_field": "Element",
                "auto_update_enabled": False,
                "auto_import_enabled": False,
                "update_mapping": [],
            },
        )
        logger.info(f"Created an AirTable data source: {custom_data_source}")
        custom_data = list(async_to_sync(custom_data_source.fetch_all)())
        async_to_sync(custom_data_source.import_many)(custom_data)
        logger.info(f"Imported {len(custom_data)} custom data items from AirTable")

        # Import member list
        members_source: AirtableSource
        members_source, _ = AirtableSource.objects.get_or_create(
            base_id=settings.SEED_AIRTABLE_MEMBERLIST_BASE_ID,
            table_id=settings.SEED_AIRTABLE_MEMBERLIST_TABLE_NAME,
            defaults={
                "api_key": settings.SEED_AIRTABLE_MEMBERLIST_API_KEY,
                "name": "Seed Member List",
                "data_type": AirtableSource.DataSourceType.MEMBER,
                "organisation": org,
                "geography_column_type": AirtableSource.GeographyTypes.POSTCODE,
                "geography_column": "Postcode",
                "postcode_field": "Postcode",
                "full_name_field": "Name",
                "auto_update_enabled": False,
                "auto_import_enabled": False,
                "update_mapping": [
                    {
                        "source": "postcodes.io",
                        "source_path": "parliamentary_constituency_2024",
                        "destination_column": "Constituency",
                    },
                    {
                        "source": str(custom_data_source.id),
                        "source_path": "Element",
                        "destination_column": "Element",
                    },
                ],
            },
        )
        logger.info(f"Created an AirTable data source: {members_source}")
        members = list(async_to_sync(members_source.fetch_all)())
        async_to_sync(members_source.import_many)(members)
        logger.info(f"Imported {len(members)} members from AirTable")
        async_to_sync(members_source.refresh_many)(members)
        logger.info(f"Updated {len(members)} members in AirTable")

        # Import pledge list
        pledges_source: AirtableSource
        pledges_source, _ = AirtableSource.objects.get_or_create(
            base_id=settings.SEED_AIRTABLE_PLEDGELIST_BASE_ID,
            table_id=settings.SEED_AIRTABLE_PLEDGELIST_TABLE_NAME,
            defaults={
                "api_key": settings.SEED_AIRTABLE_PLEDGELIST_API_KEY,
                "name": "Pledge List",
                "data_type": AirtableSource.DataSourceType.MEMBER,
                "organisation": org,
                "geography_column_type": AirtableSource.GeographyTypes.POSTCODE,
                "geography_column": "POSTCODE",
                "postcode_field": "POSTCODE",
                "first_name_field": "FNAME",
                "last_name_field": "LNAME",
                "auto_update_enabled": False,
                "auto_import_enabled": False,
                "can_display_points_publicly": True,
                "can_display_details_publicly": True,
                "update_mapping": [],
            },
        )
        logger.info(f"Created an AirTable data source: {pledges_source}")
        pledges = list(async_to_sync(pledges_source.fetch_all)())
        async_to_sync(pledges_source.import_many)(pledges)
        logger.info(f"Imported {len(pledges)} pledges from AirTable")

        # Import event list
        events_source: AirtableSource
        events_source, _ = AirtableSource.objects.get_or_create(
            base_id=settings.SEED_AIRTABLE_EVENTS_BASE_ID,
            table_id=settings.SEED_AIRTABLE_EVENTS_TABLE_NAME,
            defaults={
                "api_key": settings.SEED_AIRTABLE_EVENTS_API_KEY,
                "name": "Seed Events",
                "data_type": AirtableSource.DataSourceType.EVENT,
                "organisation": org,
                "geography_column_type": AirtableSource.GeographyTypes.ADDRESS,
                "geography_column": "Address",
                "title_field": "Name",
                "start_time_field": "Start time",
                "auto_update_enabled": False,
                "auto_import_enabled": False,
                "can_display_points_publicly": True,
                "can_display_details_publicly": True,
                "update_mapping": [],
            },
        )
        logger.info(f"Created an AirTable data source: {events_source}")
        events = list(async_to_sync(events_source.fetch_all)())
        async_to_sync(events_source.import_many)(events)
        logger.info(f"Imported {len(events)} events from AirTable")

        # Create a Map Report for the data source
        layer_id = str(uuid.uuid4())
        view_id = str(uuid.uuid4())
        view_layer_id = str(uuid.uuid4())
        map_report, _ = MapReport.objects.get_or_create(
            organisation=org,
            name="Test map report",
            slug="test-map-report",
            defaults={
                "layers": [
                    {
                        "id": layer_id,
                        "name": members_source.name,
                        "source": str(members_source.id),
                        "visible": True,
                    }
                ],
                "display_options": {
                    "views": {
                        view_id: {
                            "id": layer_id,
                            "type": "Map",
                            "mapOptions": {
                                "layers": {
                                    view_layer_id: {
                                        "id": view_layer_id,
                                        "name": members_source.name,
                                        "layerId": layer_id,
                                        "minZoom": 5,
                                        "visible": True,
                                        "circleRadius": 5,
                                    }
                                },
                                "display": {
                                    "borders": True,
                                    "choropleth": True,
                                    "boundaryNames": True,
                                    "labelsForAllAreas": False,
                                    "choroplethValueLabels": True,
                                },
                                "choropleth": {
                                    "mode": "Count",
                                    "palette": "Inferno",
                                    "dataType": "Continuous",
                                    "boundaryType": "parliamentary_constituency_2024",
                                    "advancedStatisticsConfig": {},
                                },
                            },
                        }
                    },
                    "starred": {},
                    "version": "2025-02-08",
                    "areaExplorer": {"displays": {}, "displaySortOrder": []},
                    "viewSortOrder": [view_id],
                },
            },
        )

        logger.info(f"Created a Map Report: {map_report}")

        # Create a hub for the org
        hostname = "hub.localhost"
        hub = HubHomepage.objects.filter(title=hostname, organisation=org).first()
        if not hub:
            logger.info("Creating a hub...")
            hub = HubHomepage.create_for_user(user=user, hostname=hostname, org=org)

        hub.puck_json_content = {
            "root": {
                "props": {
                    "slug": "testdomainorg",
                    "title": "testdomain.org",
                    "search_description": "",
                }
            },
            "zones": {
                "GridRow-c5896794-5c2d-427f-ba8a-8ad726b4f7c3:Col-1": [
                    {
                        "type": "Card",
                        "props": {
                            "id": "Card-c1249b7e-5de6-42a5-aa7d-115cb433d1cd",
                            "link": "/map",
                            "type": "action",
                            "title": "View the map",
                            "behaviour": "link",
                            "linkLabel": "Learn more",
                            "description": "It's right here!",
                            "dialogDescription": "",
                        },
                    }
                ],
                "GridRow-c5896794-5c2d-427f-ba8a-8ad726b4f7c3:Col-2": [],
                "GridRow-c5896794-5c2d-427f-ba8a-8ad726b4f7c3:Col-3": [],
                "GridRow-c5896794-5c2d-427f-ba8a-8ad726b4f7c3:Col-4": [],
            },
            "content": [
                {
                    "type": "Hero",
                    "props": {
                        "id": "Hero-71f52de9-e01f-485d-bd51-fd0c5da123d6",
                        "title": "Heading",
                        "prompt": "Something",
                        "description": "Description",
                    },
                },
                {
                    "type": "GridRow",
                    "props": {
                        "id": "GridRow-c5896794-5c2d-427f-ba8a-8ad726b4f7c3",
                        "columns": "4-columns",
                    },
                },
            ],
        }
        hub.layers = [
            MapReport.MapLayer(
                id=str(pledges_source.id),
                name="Pledges",
                source=str(pledges_source.id),
            ),
        ]
        hub.save()
        site = Site.objects.get(hostname=hostname)
        site.port = 3000
        site.save()

        pledge_page = HubContentPage.objects.filter(slug="pledge").first()

        if not pledge_page:
            pledge_page = HubContentPage(
                title="Pledge",
                slug="pledge",
            )
            hub.add_child(instance=pledge_page)

        pledge_page.puck_json_content = {
            "root": {
                "props": {"slug": "pledge", "title": "Pledge", "search_description": ""}
            },
            "zones": {
                "GridRow-49680e46-8ed0-4618-821f-8d957a90b78a:Col-1": [
                    {
                        "type": "RichText",
                        "props": {
                            "id": "RichText-fa76e080-45e7-48d5-a7a2-22538c8007e3",
                            "width": "standard",
                            "content": '<p><span class="size-huge">Lorem Ipsum</span></p><p><span class="size-small">Dolor sit amet.</span><span class="size-medium"><span class="ql-cursor">﻿</span></span></p>',
                        },
                    }
                ],
                "GridRow-49680e46-8ed0-4618-821f-8d957a90b78a:Col-2": [
                    {
                        "type": "MemberForm",
                        "props": {
                            "id": "MemberForm-0c026a70-336b-46c8-98b4-413a0f4824e5",
                            "successRedirect": "",
                            "externalDataSourceIds": [
                                # Usually these would be 3 separate data sources
                                # Climate Coalition used a MailChimp source for Communication consent
                                # and AirTables for All pledges and Group pledges
                                str(pledges_source.id),  # All pledges list
                                str(pledges_source.id),  # Communication consent list
                                str(pledges_source.id),  # Group pledges list
                            ],
                        },
                    }
                ],
            },
            "content": [
                {
                    "type": "GridRow",
                    "props": {
                        "id": "GridRow-49680e46-8ed0-4618-821f-8d957a90b78a",
                        "columns": "2-columns",
                    },
                }
            ],
        }
        pledge_page.save()

        logger.info(f"Created a hub at {hostname}:3000")
