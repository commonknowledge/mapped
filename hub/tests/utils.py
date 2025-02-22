import mimetypes
import os

from django.core.files.uploadedfile import UploadedFile
from django.test import Client, TestCase, override_settings
from django.test.testcases import (
    LiveServerTestCase,
    LiveServerThread,
    QuietWSGIRequestHandler,
    SerializeMixin,
)
from django.urls import reverse

from hub import models

extras_dir = os.path.join(os.path.dirname(__file__), "extras")
mimetypes.init()


def get_extras_file(name):
    return os.path.join(extras_dir, name)


def get_uploaded_file(filename, content_type=None, upload_name=None):
    if content_type is False:
        return UploadedFile(
            open(filename, "rb"), upload_name or os.path.basename(filename), None
        )
    return UploadedFile(
        open(filename, "rb"),
        upload_name or os.path.basename(filename),
        content_type or mimetypes.guess_type(filename)[0],
    )


def get_function_name(s):
    query_name = s.__class__.__name__ + "." + s._testMethodName
    return query_name


@override_settings(ALLOWED_HOSTS=["testserver"])
class TestGraphQLClientCase(TestCase):
    username = "testuser"
    password = "12345"

    def setUp(self) -> None:
        # Load areas
        self.client = Client()
        # Create user
        self.user = models.User.objects.create_user(
            username=self.username, password=self.password
        )

        # Login user
        self.client.login(username=self.username, password=self.password)
        res = self.client.post(
            reverse("graphql"),
            content_type="application/json",
            data={
                "variables": {"username": self.username, "password": self.password},
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

    def graphql_query(self, query, variables=None, headers=None):
        __headers = {}
        if self.token:
            __headers.update({"Authorization": f"JWT {self.token}"})
        if headers and isinstance(headers, dict):
            __headers.update(headers)
        data = {"query": query}
        if variables:
            data["variables"] = variables
        res = self.client.post(
            reverse("graphql"),
            content_type="application/json",
            data=data,
            headers=__headers,
        )
        return res.json()


class ReusableLiveServerThread(LiveServerThread):
    def _create_server(self, connections_override=None):
        return self.server_class(
            (self.host, self.port),
            QuietWSGIRequestHandler,
            allow_reuse_address=False,
            connections_override=connections_override,
        )


class SeriablisedLiveServerTestCase(LiveServerTestCase, SerializeMixin):
    lockfile = "one_by_one_live_server_test_case.lock"
    server_thread_class = ReusableLiveServerThread
