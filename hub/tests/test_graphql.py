from hub import models
from hub.tests.utils import TestGraphQLClientCase

from .fixtures.statistics import eu_population_by_la


class TestGraphQL(TestGraphQLClientCase):
    def setUp(self) -> None:
        super().setUp()
        # Create org for user
        self.org = models.Organisation.objects.create(name="testorg", slug="testorg")
        self.membership = models.Membership.objects.create(
            user=self.user, organisation=self.org, role="owner"
        )
        # Create source
        self.source = models.DatabaseJSONSource.objects.create(
            name="EU Population by LA",
            organisation=self.org,
            data=eu_population_by_la,
            id_field="LA code",
            geocoding_config={
                "type": models.DatabaseJSONSource.GeographyTypes.AREA,
                "components": [
                    {
                        "type": "area_code",
                        "field": "LA code",
                        "metadata": {"lih_area_type__code": ["STC", "DIS"]},
                    },
                ],
            },
        )
        # Create a report from this source
        self.report = models.MapReport.objects.create(
            name="EU Population by LA",
            organisation=self.org,
            layers=[
                {
                    "id": str(self.source.id),
                    "name": "EU Population by LA",
                    "source": str(self.source.id),
                }
            ],
        )

    def test_list_sources(self):
        result = self.graphql_query(
            """
              query ListOrganisations($currentOrganisationId: ID!) {
                myOrganisations(filters: { id: $currentOrganisationId }) {
                  id
                  externalDataSources {
                    id
                    name
                    dataType
                    crmType
                    autoImportEnabled
                    autoUpdateEnabled
                    sharingPermissions {
                      id
                      organisation {
                        id
                        name
                      }
                    }
                  }
                  sharingPermissionsFromOtherOrgs {
                    id
                    externalDataSource {
                      id
                      name
                      dataType
                      crmType
                      organisation {
                        name
                      }
                    }
                  }
                }
              }
            """,
            {
                "currentOrganisationId": str(self.org.id),
            },
        )

        self.assertIsNone(result.get("errors", None))
        self.assertEqual(
            len(result["data"]["myOrganisations"][0]["externalDataSources"]),
            1,
        )
        self.assertEqual(
            result["data"]["myOrganisations"][0]["externalDataSources"][0]["name"],
            "EU Population by LA",
        )

    def test_inspect_source(self):
        result = self.graphql_query(
            """
              query ExternalDataSourceInspectPage($ID: ID!) {
                  externalDataSource(id: $ID) {
                    id
                    name
                    dataType
                    remoteUrl
                    crmType
                    connectionDetails {
                      ... on AirtableSource {
                        apiKey
                        baseId
                        tableId
                      }
                      ... on MailchimpSource {
                        apiKey
                        listId
                      }
                      ... on ActionNetworkSource {
                        apiKey
                        groupSlug
                      }
                      ... on TicketTailorSource {
                        apiKey
                      }
                    }
                    lastImportJob {
                      id
                      lastEventAt
                      status
                    }
                    lastUpdateJob {
                      id
                      lastEventAt
                      status
                    }
                    autoImportEnabled
                    autoUpdateEnabled
                    hasWebhooks
                    allowUpdates
                    automatedWebhooks
                    webhookUrl
                    webhookHealthcheck
                    geographyColumn
                    geographyColumnType
                    geocodingConfig
                    usesValidGeocodingConfig
                    postcodeField
                    firstNameField
                    lastNameField
                    fullNameField
                    emailField
                    phoneField
                    addressField
                    titleField
                    descriptionField
                    imageField
                    startTimeField
                    endTimeField
                    publicUrlField
                    socialUrlField
                    canDisplayPointField
                    isImportScheduled
                    importProgress {
                      id
                      hasForecast
                      status
                      total
                      succeeded
                      estimatedFinishTime
                      actualFinishTime
                      inQueue
                      numberOfJobsAheadInQueue
                      sendEmail
                    }
                    isUpdateScheduled
                    updateProgress {
                      id
                      hasForecast
                      status
                      total
                      succeeded
                      estimatedFinishTime
                      actualFinishTime
                      inQueue
                      numberOfJobsAheadInQueue
                      sendEmail
                    }
                    importedDataCount
                    importedDataGeocodingRate
                    regionCount: importedDataCountOfAreas(
                      analyticalAreaType: european_electoral_region
                    )
                    constituencyCount: importedDataCountOfAreas(
                      analyticalAreaType: parliamentary_constituency
                    )
                    ladCount: importedDataCountOfAreas(analyticalAreaType: admin_district)
                    wardCount: importedDataCountOfAreas(analyticalAreaType: admin_ward)
                    fieldDefinitions(refreshFromSource: true) {
                      label
                      value
                      description
                      editable
                    }
                    updateMapping {
                      source
                      sourcePath
                      destinationColumn
                    }
                    sharingPermissions {
                      id
                    }
                    organisation {
                      id
                      name
                    }
                  }
                }
            """,
            {
                "ID": str(self.source.id),
            },
        )

        self.assertIsNone(result.get("errors", None))
        self.assertEqual(
            result["data"]["externalDataSource"]["name"],
            "EU Population by LA",
        )

    def list_reports(self):
        result = self.graphql_query(
            """
            query ListReports($currentOrganisationId: ID!) {
              reports(filters: { organisation: { id: $currentOrganisationId } }) {
                id
                name
                lastUpdate
                coverImageAbsoluteUrl
              }
            }
            """,
            {
                "currentOrganisationId": str(self.org.id),
            },
        )

        self.assertIsNone(result.get("errors", None))
        self.assertEqual(len(result["data"]["reports"]), 1)
        self.assertEqual(result["data"]["reports"][0]["name"], "EU Population by LA")

    def test_inspect_report(self):
        result = self.graphql_query(
            """
            query GetMapReport($id: ID!) {
              mapReport(id: $id) {
                id
                name
                slug
                displayOptions
                coverImageAbsoluteUrl
                organisation {
                  id
                  slug
                  name
                }
                layers {
                  id
                  name
                  inspectorType
                  inspectorConfig
                  mapboxPaint
                  mapboxLayout
                  sharingPermission {
                    visibilityRecordDetails
                    visibilityRecordCoordinates
                    organisation {
                      name
                    }
                  }
                  source
                  sourceData {
                    id
                    name
                    isImportScheduled
                    importedDataCount
                    idField
                    crmType
                    dataType
                    remoteUrl
                    organisation {
                      name
                    }
                    fieldDefinitions {
                      externalId
                      value
                      label
                    }
                  }
                }
              }
            }
            """,
            {
                "id": str(self.report.id),
            },
        )

        self.assertIsNone(result.get("errors", None))
        self.assertEqual(result["data"]["mapReport"]["name"], "EU Population by LA")
        self.assertEqual(
            result["data"]["mapReport"]["layers"][0]["name"], "EU Population by LA"
        )
        self.assertEqual(
            result["data"]["mapReport"]["layers"][0]["source"], str(self.source.id)
        )
