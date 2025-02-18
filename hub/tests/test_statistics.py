from django.test import Client, TestCase, override_settings
from django.urls import reverse

from asgiref.sync import async_to_sync

from hub import models
from hub.graphql.types.stats import AggregationOp
from hub.tests.utils import get_function_name
from utils.geo_reference import AnalyticalAreaType

from .fixtures.statistics import eu_population_by_la

username = "testuser"
password = "12345"


@override_settings(ALLOWED_HOSTS=["testserver"])
class TestStatistics(TestCase):
    fixtures = ["councils", "regions"]

    def setUp(self) -> None:
        # Load areas
        self.client = Client()
        # Create user
        self.user = models.User.objects.create_user(
            username=username, password=password
        )
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
                        "field": "LA code",
                        "metadata": {"lih_area_type__code": ["STC", "DIS"]},
                    },
                ],
            },
        )
        # Ingest data
        async_to_sync(self.source.import_many)(self.source.data)
        self.row_count = len(self.source.get_import_data())
        self.assertEqual(
            self.row_count,
            331,
            "Something's gone wrong with data ingestion.",
        )
        # Some of that dataset uses out of date councils,
        # which have been merged together in the geocoding
        # (see `duplicate_councils`)
        self.geocodable_council_count = 315
        self.count_regions = models.Area.objects.filter(area_type__code="EER").count()

        # Login user
        self.client.login(username=username, password=password)
        res = self.client.post(
            reverse("graphql"),
            content_type="application/json",
            data={
                "variables": {"username": username, "password": password},
                "query": """
                  mutation Login($username: String!, $password: String!) {
                    tokenAuth(username: $username, password: $password) {
                      errors
                      success
                      token {
                        token
                      }
                    }
                  }
              """,
            },
        )
        self.assertIn(res.status_code, [200, 204])
        self.token = res.json()["data"]["tokenAuth"]["token"]["token"]

    def graphql_query(self, query, variables=None):
        res = self.client.post(
            reverse("graphql"),
            content_type="application/json",
            data={"query": query, "variables": variables},
            headers={"Authorization": f"JWT {self.token}"},
        )
        return res.json()

    def test_count_by_area(self):
        # get function name from `self`
        query_name = get_function_name(self)

        result = self.graphql_query(
            """
            query SourceStatsByBoundary($statsConfig: StatisticsConfig!, $choroplethConfig: ChoroplethConfig) {
              statisticsForChoropleth(statsConfig: $statsConfig, choroplethConfig: $choroplethConfig) {
                gss
                label
                count
              }
            }
            """,
            {
                "statsConfig": {
                    "queryId": query_name,
                    "sourceIds": [str(self.source.id)],
                    "groupByArea": AnalyticalAreaType.admin_district.value,
                    "aggregationOperation": AggregationOp.Count.value,
                },
                "choroplethConfig": {},
            },
        )

        self.assertIsNone(result.get("errors", None))
        self.assertEqual(
            len(result["data"]["statisticsForChoropleth"]),
            self.geocodable_council_count,
            "As many councils as can be geocoded",
        )
        self.assertTrue(
            all(
                isinstance(
                    r["count"],
                    (
                        int,
                        float,
                    ),
                )
                for r in result["data"]["statisticsForChoropleth"]
            ),
            "There should be a numeric count for every council",
        )

    def test_field_value_by_area(self):
        query_name = get_function_name(self)

        result = self.graphql_query(
            """
            query SourceStatsByBoundary($statsConfig: StatisticsConfig!, $choroplethConfig: ChoroplethConfig!) {
              statisticsForChoropleth(statsConfig: $statsConfig, choroplethConfig: $choroplethConfig) {
                gss
                label
                count
              }
            }
            """,
            {
                "statsConfig": {
                    "queryId": query_name,
                    "sourceIds": [str(self.source.id)],
                    "groupByArea": AnalyticalAreaType.admin_district.value,
                    "aggregationOperation": AggregationOp.Sum.value,
                },
                "choroplethConfig": {
                    "countKey": "EU Citizens - Total electors (includes attainers) 1 December 2022",
                },
            },
        )

        self.assertIsNone(result.get("errors", None))
        self.assertEqual(
            len(result["data"]["statisticsForChoropleth"]),
            self.geocodable_council_count,
        )
        isle_of_anglesey = next(
            (
                r
                for r in result["data"]["statisticsForChoropleth"]
                if r["label"] == "Isle of Anglesey Council"
            ),
            None,
        )
        self.assertIsNotNone(isle_of_anglesey)
        self.assertEqual(
            isle_of_anglesey["count"],
            296,
            "The count should be the unadultered Total EU population",
        )

    def test_field_aggregation_by_area(self):
        query_name = get_function_name(self)

        result = self.graphql_query(
            """
            query SourceStatsByBoundary($statsConfig: StatisticsConfig!, $choroplethConfig: ChoroplethConfig!) {
              statisticsForChoropleth(statsConfig: $statsConfig, choroplethConfig: $choroplethConfig) {
                gss
                label
                count
              }
            }
            """,
            {
                "statsConfig": {
                    "queryId": query_name,
                    "sourceIds": [str(self.source.id)],
                    "groupByArea": AnalyticalAreaType.european_electoral_region.value,
                    "aggregationOperation": AggregationOp.Sum.value,
                },
                "choroplethConfig": {
                    "countKey": "EU Citizens - Total electors (includes attainers) 1 December 2022",
                },
            },
        )

        self.assertIsNone(result.get("errors", None))
        self.assertEqual(
            len(result["data"]["statisticsForChoropleth"]),
            11,
        )
        london = next(
            (
                r
                for r in result["data"]["statisticsForChoropleth"]
                if r["label"] == "London"
            ),
            None,
        )
        self.assertIsNotNone(london)
        self.assertEqual(
            london["count"],
            714378,
            "The numbers should be summed",
        )

    def test_percent_field_value_by_area(self):
        query_name = get_function_name(self)

        result = self.graphql_query(
            """
            query SourceStatsByBoundary($statsConfig: StatisticsConfig!, $choroplethConfig: ChoroplethConfig!) {
              statisticsForChoropleth(statsConfig: $statsConfig, choroplethConfig: $choroplethConfig) {
                gss
                label
                count
                formattedCount
              }
            }
            """,
            {
                "statsConfig": {
                    "queryId": query_name,
                    "sourceIds": [str(self.source.id)],
                    "groupByArea": AnalyticalAreaType.admin_district.value,
                    "aggregationOperation": AggregationOp.Mean.value,
                },
                "choroplethConfig": {
                    "countKey": "Percentage registered",
                    "isCountKeyPercentage": True,
                },
            },
        )

        self.assertIsNone(result.get("errors", None))
        self.assertEqual(
            len(result["data"]["statisticsForChoropleth"]),
            self.geocodable_council_count,
        )
        isle_of_anglesey = next(
            (
                r
                for r in result["data"]["statisticsForChoropleth"]
                if r["label"] == "Isle of Anglesey Council"
            ),
            None,
        )
        self.assertIsNotNone(isle_of_anglesey)
        self.assertEqual(
            isle_of_anglesey["count"],
            0.2603,
            "The count should be the plain numeric representation of the percentage",
        )
        self.assertEqual(
            isle_of_anglesey["formattedCount"],
            "26%",
            "The formatted count should be the percentage",
        )

    def test_percent_field_aggregation_by_area(self):
        query_name = get_function_name(self)

        result = self.graphql_query(
            """
            query SourceStatsByBoundary($statsConfig: StatisticsConfig!, $choroplethConfig: ChoroplethConfig!) {
              statisticsForChoropleth(statsConfig: $statsConfig, choroplethConfig: $choroplethConfig) {
                gss
                label
                count
              }
            }
            """,
            {
                "statsConfig": {
                    "queryId": query_name,
                    "sourceIds": [str(self.source.id)],
                    "groupByArea": AnalyticalAreaType.european_electoral_region.value,
                    "aggregationOperation": AggregationOp.Mean.value,
                },
                "choroplethConfig": {
                    "countKey": "Percentage registered",
                    "isCountKeyPercentage": True,
                },
            },
        )

        self.assertIsNone(result.get("errors", None))
        self.assertEqual(
            len(result["data"]["statisticsForChoropleth"]),
            11,
        )
        london = next(
            (
                r
                for r in result["data"]["statisticsForChoropleth"]
                if r["label"] == "London"
            ),
            None,
        )
        self.assertIsNotNone(london)
        self.assertAlmostEqual(
            london["count"],
            0.64,
            2,
            "The numbers should be averaged",
        )

    def test_formula_by_area(self):
        query_name = get_function_name(self)

        result = self.graphql_query(
            """
            query SourceStatsByBoundary($statsConfig: StatisticsConfig!, $choroplethConfig: ChoroplethConfig!) {
              statisticsForChoropleth(statsConfig: $statsConfig, choroplethConfig: $choroplethConfig) {
                gss
                label
                count
              }
            }
            """,
            {
                "statsConfig": {
                    "queryId": query_name,
                    "sourceIds": [str(self.source.id)],
                    "groupByArea": AnalyticalAreaType.admin_district.value,
                    "aggregationOperation": AggregationOp.Sum.value,
                    "preGroupByCalculatedColumns": [
                        {
                            "name": "Total EU population",
                            "expression": "`Total EU population` * 1000",
                        }
                    ],
                },
                "choroplethConfig": {
                    "countKey": "Total EU population",
                },
            },
        )

        self.assertIsNone(result.get("errors", None))
        self.assertEqual(
            len(result["data"]["statisticsForChoropleth"]),
            self.geocodable_council_count,
            "As many councils as can be geocoded",
        )
        isle_of_anglesey = next(
            (
                r
                for r in result["data"]["statisticsForChoropleth"]
                if r["label"] == "Isle of Anglesey Council"
            ),
            None,
        )
        self.assertIsNotNone(isle_of_anglesey)
        self.assertEqual(
            isle_of_anglesey["count"],
            1137 * 1000,
            "The count should be the Total EU population multiplied by 1000",
        )

    def test_categorical_data_by_area(self):
        query_name = get_function_name(self)

        result = self.graphql_query(
            """
            query SourceStatsByBoundary($statsConfig: StatisticsConfig!, $choroplethConfig: ChoroplethConfig) {
              statisticsForChoropleth(statsConfig: $statsConfig, choroplethConfig: $choroplethConfig) {
                gss
                label
                category
              }
            }
            """,
            {
                "statsConfig": {
                    "queryId": query_name,
                    "sourceIds": [str(self.source.id)],
                    "groupByArea": AnalyticalAreaType.admin_district.value,
                    "aggregationOperation": AggregationOp.Sum.value,
                },
                "choroplethConfig": {
                    "categoryKey": "LA Name",
                },
            },
        )

        self.assertIsNone(result.get("errors", None))
        self.assertEqual(
            len(result["data"]["statisticsForChoropleth"]),
            self.geocodable_council_count,
            "As many councils as can be geocoded",
        )
        self.assertEqual(
            len(
                set([r["category"] for r in result["data"]["statisticsForChoropleth"]])
            ),
            self.geocodable_council_count,
            "Every category should appear once only, due to the nature of the data",
        )
        self.assertIn(
            "Isle of Anglesey",
            [r["category"] for r in result["data"]["statisticsForChoropleth"]],
            "Every result should have a category field that corresponds correctly",
        )

    def test_summary_data(self):
        query_name = get_function_name(self)

        result = self.graphql_query(
            """
            query Statistics($statsConfig: StatisticsConfig!) {
              statistics(statsConfig: $statsConfig)
            }
            """,
            {
                "statsConfig": {
                    "queryId": query_name,
                    "sourceIds": [str(self.source.id)],
                    "groupAbsolutely": True,
                },
            },
        )

        self.assertIsNone(result.get("errors", None))
        self.assertEqual(
            len(result["data"]["statistics"]),
            1,
            "There should be a single result",
        )
        self.assertIn(
            "Total EU population",
            result["data"]["statistics"][0].keys(),
            "The result should have a key for the Total EU population",
        )
        self.assertEqual(
            result["data"]["statistics"][0]["Total EU population"],
            3643214,
            "The sum should be a sum of all the values",
        )

    def test_summary_average(self):
        query_name = get_function_name(self)

        result = self.graphql_query(
            """
            query Statistics($statsConfig: StatisticsConfig!) {
              statistics(statsConfig: $statsConfig)
            }
            """,
            {
                "statsConfig": {
                    "queryId": query_name,
                    "sourceIds": [str(self.source.id)],
                    "aggregationOperation": AggregationOp.Mean.value,
                    "groupAbsolutely": True,
                },
            },
        )

        self.assertIsNone(result.get("errors", None))
        self.assertEqual(
            len(result["data"]["statistics"]),
            1,
            "There should be a single result",
        )
        self.assertIn(
            "Total EU population",
            result["data"]["statistics"][0].keys(),
            "The result should have a key for the Total EU population",
        )
        self.assertAlmostEqual(
            result["data"]["statistics"][0]["Total EU population"],
            11006.688821752266,
            1,
            "Take an average of all the values",
        )

    # TODO: def test_summary_groupby_column(self):
