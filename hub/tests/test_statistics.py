from asgiref.sync import async_to_sync

from hub import models
from hub.graphql.types.stats import AggregationOp
from hub.tests.utils import TestGraphQLClientCase, get_function_name
from utils.geo_reference import AnalyticalAreaType

from .fixtures.statistics import eu_population_by_la


class TestStatistics(TestGraphQLClientCase):
    fixtures = ["councils", "regions"]

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
        self.geocodable_council_count = 318
        self.count_regions = models.Area.objects.filter(area_type__code="EER").count()

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
            "There should be a numeric count for every council: "
            + str([r["count"] for r in result["data"]["statisticsForChoropleth"]]),
        )
        for r in result["data"]["statisticsForChoropleth"]:
            self.assertGreaterEqual(r["count"], 1)

    def test_field_value_by_area(self):
        query_name = get_function_name(self)

        result = self.graphql_query(
            """
            query SourceStatsByBoundary($statsConfig: StatisticsConfig!, $choroplethConfig: ChoroplethConfig!) {
              statisticsForChoropleth(statsConfig: $statsConfig, choroplethConfig: $choroplethConfig) {
                gss
                label
                count
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
                category
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
            10,
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
                category
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
                category
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
            10,
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
                count
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
