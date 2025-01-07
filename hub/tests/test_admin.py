from django.contrib.auth.models import Permission, User
from django.test import TestCase

from hub.models import DataSet


class TestDataSetAdmin(TestCase):
    fixtures = ["areas.json", "area_data.json"]

    def setUp(self):
        self.u = User.objects.create(username="user@example.com")
        self.staff = User.objects.create(username="staff@example.com", is_staff=True)

        self.su = User.objects.create(
            username="superuser@example.com",
            is_staff=True,
            is_superuser=True,
        )

        self.order_permission = Permission.objects.get(codename="order_and_feature")

    def test_access(self):
        url = "/admin/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 302)

        self.client.force_login(self.su)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_dataset_order_permission(self):
        url = "/admin/"
        self.client.force_login(self.staff)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        context = response.context
        self.assertEqual(len(context["available_apps"]), 0)

        self.staff.user_permissions.set([self.order_permission])

        response = self.client.get(url)
        context = response.context
        self.assertEqual(len(context["available_apps"]), 1)

    def test_dataset_field_availability(self):
        ds = DataSet.objects.all()[0]
        url = f"/admin/hub/dataset/{ds.id}/change/"
        self.staff.user_permissions.set([self.order_permission])
        self.client.force_login(self.staff)
        response = self.client.get(url)

        context = response.context
        form = context["adminform"]

        self.assertEqual(len(form.fields), 19)
