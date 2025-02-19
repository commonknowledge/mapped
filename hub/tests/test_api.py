import json

from django.test import Client, TestCase
from django.urls import reverse

from hub import models


class TestPublicAPI(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.client = Client()
        # Create user
        cls.user = models.User.objects.create_user(
            username="testuser", password="12345"
        )
        # Create org for user
        cls.org = models.Organisation.objects.create(name="testorg", slug="testorg")
        cls.membership = models.Membership.objects.create(
            user=cls.user, organisation=cls.org, role="owner"
        )
        # Create source
        cls.custom_data_layer: models.AirtableSource = (
            models.AirtableSource.objects.create(
                name="Mayoral regions custom data layer",
                data_type=models.AirtableSource.DataSourceType.OTHER,
                organisation=cls.org,
                geography_column="council district",
                geography_column_type=models.AirtableSource.GeographyTypes.ADMIN_DISTRICT,
            )
        )
        # Some dummy data
        ds, x = models.DataSet.objects.update_or_create(
            name="xyz", external_data_source=cls.custom_data_layer
        )
        dt, x = models.DataType.objects.update_or_create(name="xyz", data_set=ds)
        models.GenericData.objects.update_or_create(
            json={
                "mayoral region": "North East Mayoral Combined Authority",
                "council district": "Newcastle upon Tyne",
            },
            data_type=dt,
            data="1",
        )
        models.GenericData.objects.update_or_create(
            json={
                "mayoral region": "North East Mayoral Combined Authority",
                "council district": "County Durham",
            },
            data_type=dt,
            data="2",
        )
        # Make a dummy region
        area_type, x = models.AreaType.objects.update_or_create(
            name="2010 Parliamentary Constituency",
            code="WMC",
            area_type="Westminster Constituency",
            description="Westminster Parliamentary Constituency boundaries, as created in 2010",
        )
        models.Area.objects.update_or_create(
            mapit_id="66055",
            gss="E14001377",
            name="Newcastle upon Tyne Central and West",
            area_type=area_type,
        )
        models.Area.objects.update_or_create(
            name="City of Durham",
            gss="E14001173",
            mapit_id="66021",
            area_type=area_type,
        )
        cls.client.login(username="testuser", password="12345")
        res = cls.client.post(
            reverse("graphql"),
            content_type="application/json",
            data={
                "variables": {"username": "testuser", "password": "12345"},
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
        cls.token = res.json()["data"]["tokenAuth"]["token"]["token"]

    def test_single_enrich_postcode(self):
        postcode = "NE13AF"
        query = """
          query EnrichPostcode($postcode: String!, $customSourceId: String!) {
            enrichPostcode(postcode: $postcode) {
              postcode
              mayoralRegion: customSourceData(
                source: $customSourceId,
                sourcePath: "mayoral region"
              )
              councilDistrict: customSourceData(
                source: $customSourceId,
                sourcePath: "council district"
              )
              postcodesIO {
                parliamentaryConstituency
              }
              constituency {
                name
                # TODO: import/mock political data and test this
                # lastElection {
                #   date
                # }
                # people {
                #   name
                #   personType
                # }
              }
            }
          }
        """

        res = self.client.post(
            reverse("graphql"),
            content_type="application/json",
            data={
                "query": query,
                "variables": {
                    "postcode": postcode,
                    "customSourceId": str(self.custom_data_layer.id),
                },
            },
            headers={
                "Authorization": f"JWT {self.token}",
            },
        )
        result = res.json()

        self.assertIsNone(result.get("errors", None))
        self.assertJSONEqual(
            json.dumps(result["data"]["enrichPostcode"]),
            {
                "postcode": "NE13AF",
                "mayoralRegion": "North East Mayoral Combined Authority",
                "councilDistrict": "Newcastle upon Tyne",
                "postcodesIO": {
                    "parliamentaryConstituency": "Newcastle upon Tyne Central and West"
                },
                "constituency": {
                    "name": "Newcastle upon Tyne Central and West",
                    # TODO: import/mock political data and test this
                    # "lastElection": {
                    #   "date": "2019-12-12"
                    # },
                    # "people": [
                    #   {
                    #     "name": "Chi Onwurah",
                    #     "personType": "MP"
                    #   }
                    # ]
                },
            },
        )

    def test_bulk_enrich_postcode(self):
        postcodes = ["NE13AF", "DH13SG"]
        query = """
          query BulkEnrichPostcodes($postcodes: [String!]!, $customSourceId: String!) {
            enrichPostcodes(postcodes: $postcodes) {
              postcode
              mayoralRegion: customSourceData(
                source: $customSourceId,
                sourcePath: "mayoral region"
              )
              councilDistrict: customSourceData(
                source: $customSourceId,
                sourcePath: "council district"
              )
              postcodesIO {
                parliamentaryConstituency
              }
              constituency {
                name
                # TODO: import/mock political data and test this
                # lastElection {
                #   date
                # }
                # people {
                #   name
                #   personType
                # }
              }
            }
          }
        """

        res = self.client.post(
            reverse("graphql"),
            content_type="application/json",
            data={
                "query": query,
                "variables": {
                    "postcodes": postcodes,
                    "customSourceId": str(self.custom_data_layer.id),
                },
            },
            headers={
                "Authorization": f"JWT {self.token}",
            },
        )
        result = res.json()

        self.assertIsNone(result.get("errors", None))
        self.assertJSONEqual(
            json.dumps(result["data"]["enrichPostcodes"]),
            [
                {
                    "postcode": "NE13AF",
                    "mayoralRegion": "North East Mayoral Combined Authority",
                    "councilDistrict": "Newcastle upon Tyne",
                    "postcodesIO": {
                        "parliamentaryConstituency": "Newcastle upon Tyne Central and West"
                    },
                    "constituency": {
                        "name": "Newcastle upon Tyne Central and West",
                        # TODO: import/mock political data and test this
                        # "lastElection": {
                        #   "date": "2019-12-12"
                        # },
                        # "people": [
                        #   {
                        #     "name": "Chi Onwurah",
                        #     "personType": "MP"
                        #   }
                        # ]
                    },
                },
                {
                    "postcode": "DH13SG",
                    "mayoralRegion": "North East Mayoral Combined Authority",
                    "councilDistrict": "County Durham",
                    "postcodesIO": {"parliamentaryConstituency": "City of Durham"},
                    "constituency": {
                        "name": "City of Durham",
                        # "gss": "E14000641",
                        # TODO: import/mock political data and test this
                        # "mapitId": "66021",
                        # "lastElection": {
                        #   "date": "2019-12-12"
                        # },
                        # "people": [
                        #   {
                        #     "name": "Mary Foy",
                        #     "personType": "MP"
                        #   }
                        # ]
                    },
                },
            ],
        )

    def test_create_use_revoke_api_token(self):
        # Generate an API token
        query = """
          mutation CreateRevokeApiToken {
            createApiToken {
              token
              signature
            }
          }
        """

        res = self.client.post(
            reverse("graphql"),
            content_type="application/json",
            data={
                "query": query,
            },
            headers={
                "Authorization": f"JWT {self.token}",
            },
        )
        result = res.json()

        generated_token = result["data"]["createApiToken"]["token"]
        generated_signature = result["data"]["createApiToken"]["signature"]

        self.assertIsNotNone(generated_token)

        # Test the new token

        postcode = "NE13AF"
        postcode_query = """
          query EnrichPostcode($postcode: String!) {
            enrichPostcode(postcode: $postcode) {
              postcode
            }
          }
        """

        res = self.client.post(
            reverse("graphql"),
            content_type="application/json",
            data={
                "query": postcode_query,
                "variables": {
                    "postcode": postcode,
                },
            },
            headers={
                "Authorization": f"JWT {generated_token}",
            },
        )
        result = res.json()

        self.assertIsNone(result.get("errors", None))
        self.assertIsNotNone(result["data"]["enrichPostcode"])

        # Revoke the token

        revoke_query = """
          mutation RevokeToken($signature: ID!) {
            revokeApiToken(signature: $signature) {
              signature
              revoked
            }
          }
        """

        res = self.client.post(
            reverse("graphql"),
            content_type="application/json",
            data={
                "query": revoke_query,
                "variables": {
                    "signature": generated_signature,
                },
            },
            headers={
                "Authorization": f"JWT {self.token}",
            },
        )

        result = res.json()
        self.assertIsNone(result.get("errors", None))
        self.assertTrue(result["data"]["revokeApiToken"]["revoked"])

        # Now make a new query with the revoked token and check it doesn't work anymore

        res = self.client.post(
            reverse("graphql"),
            content_type="application/json",
            data={
                "query": postcode_query,
                "variables": {
                    "postcode": postcode,
                },
            },
            headers={
                "Authorization": f"JWT {generated_token}",
            },
        )

        result = res.json()
        self.assertJSONEqual(
            json.dumps(result),
            {"data": None, "errors": [{"message": "Token has been revoked"}]},
        )
