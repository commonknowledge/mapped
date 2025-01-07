from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from hub.models import Area, DataSet, Person, PersonArea, UserDataSets

# class Test404Page(TestCase):
#     def test404page(self):
#         url = "/page_does_not_exist"
#         response = self.client.get(url)
#         self.assertEqual(response.status_code, 404)
#         self.assertTemplateUsed(response, "404.html")


class TestPageRenders(TestCase):
    def test_home_page(self):
        url = reverse("home")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "hub/home.html")

    def test_explore_page(self):
        url = reverse("explore")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "hub/explore.html")


class TestExploreDatasetsPage(TestCase):
    fixtures = [
        "areas.json",
        "areas_23.json",
        "mps_23.json",
        "elections.json",
        "area_data.json",
        "mp_memberships.json",
    ]
    output_csv = str.encode(
        "Constituency Name,APPG membership\r\nSouth Borsetshire,MadeUpAPPG; MadeUpAPPG2\r\n"
    )

    def setUp(self):
        u = User.objects.create(username="user@example.com")
        self.client.force_login(u)

    def test_explore_datasets_json_page(self):
        url = reverse("explore_datasets_json")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        datasets = response.json()
        self.assertEqual(13, len(datasets))

        self.client.logout()
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        datasets = response.json()
        self.assertEqual(6, len(datasets))

    def test_explore_view_with_many_to_one(self):
        url = f"{reverse('explore_csv')}?mp_appg_membership__exact=MadeUpAPPG"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.content,
            self.output_csv,
        )

    def test_explore_view_extra_column(self):
        output_csv = str.encode(
            "Constituency Name,APPG membership,Constituency Polling Data - Wind support\r\nSouth Borsetshire,MadeUpAPPG; MadeUpAPPG2,70.0\r\n"
        )

        url = f"{reverse('explore_csv')}?mp_appg_membership__exact=MadeUpAPPG&columns=wind_support"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.content,
            output_csv,
        )

    def test_explore_view_multiple_extra_columns(self):
        output_csv = str.encode(
            "Constituency Name,APPG membership,Constituency Polling Data - Wind support,Constituency Fuel Poverty - Constituency Fuel Poverty\r\nSouth Borsetshire,MadeUpAPPG; MadeUpAPPG2,70.0,12.4321\r\n"
        )

        url = f"{reverse('explore_csv')}?mp_appg_membership__exact=MadeUpAPPG&columns=wind_support,fuel_poverty"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.content,
            output_csv,
        )

    def test_explore_view_extra_columns_multiset(self):
        output_csv = str.encode(
            "Constituency Name,APPG membership,Constituency Polling Data - Wind support,Constituency Age Distribution - Constituency Age 0-9 %age\r\nSouth Borsetshire,MadeUpAPPG; MadeUpAPPG2,70.0,10.1234\r\n"
        )

        url = f"{reverse('explore_csv')}?mp_appg_membership__exact=MadeUpAPPG&columns=wind_support,ages_0-9"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.content,
            output_csv,
        )

    def test_explore_view_extra_columns_new_cons(self):
        output_csv = str.encode(
            "Constituency Name,MP Name,ParlId\r\nSouth Borsetshire,James Madeupname,1\r\nBorsetshire West,Juliet Madeupname,\r\nBorsetshire East,No current MP,\r\n"
        )

        url = f"{reverse('explore_csv')}?columns=mp_name,parlid"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.content,
            output_csv,
        )

        output_csv = str.encode(
            "Constituency Name,MP Name,ParlId\r\nNew Borsetshire West,Juliet Madeupname,\r\nNew South Borsetshire,James Madeupname,1\r\nNew Mid Borsetshire,Andrew Madeupname,\r\n"
        )

        url = f"{reverse('explore_csv')}?area_type=WMC23&columns=mp_name,parlid"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.content,
            output_csv,
        )

    def test_explore_view_extra_columns_new_cons_diff_numbers(self):
        output_csv = str.encode(
            "Constituency Name,MP Majority,MP Name\r\nSouth Borsetshire,1234,James Madeupname\r\n"
        )

        url = f"{reverse('explore_csv')}?columns=mp_name&mp_election_majority__gt=1000"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.content,
            output_csv,
        )

        output_csv = str.encode(
            "Constituency Name,MP Majority,MP Name\r\nNew South Borsetshire,1001,James Madeupname\r\n"
        )

        url = f"{reverse('explore_csv')}?area_type=WMC23&columns=mp_name&mp_election_majority__gt=1000"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.content,
            output_csv,
        )

    def test_explore_view_extra_column_not_visible(self):
        ds = DataSet.objects.get(name="constituency_polling_data")
        ds.visible = False
        ds.save()

        output_csv = str.encode(
            "Constituency Name,APPG membership\r\nSouth Borsetshire,MadeUpAPPG; MadeUpAPPG2\r\n"
        )

        url = f"{reverse('explore_csv')}?mp_appg_membership__exact=MadeUpAPPG&columns=wind_support"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.content,
            output_csv,
        )


class TestExploreFilteringPage(TestCase):
    fixtures = [
        "areas.json",
        "areas_23.json",
        "mps_23.json",
        "elections.json",
        "area_data.json",
    ]

    def setUp(self):
        self.u = User.objects.create(username="user@example.com")
        self.client.force_login(self.u)

    def test_explore_json_page_null_value(self):
        url = reverse("explore_json")
        response = self.client.get(url + "?mp_last_elected__year__lt=")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "South Borsetshire")
        self.assertContains(response, "Borsetshire West")
        self.assertContains(response, "Borsetshire East")

    def test_explore_json_page_year_lt(self):
        url = reverse("explore_json")
        response = self.client.get(url + "?mp_last_elected__year__lt=2019")
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "South Borsetshire")
        self.assertContains(response, "Borsetshire West")
        self.assertNotContains(response, "Borsetshire East")

    def test_explore_json_page_year_gte(self):
        url = reverse("explore_json")
        response = self.client.get(url + "?mp_last_elected__year__gte=2019")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "South Borsetshire")
        self.assertNotContains(response, "Borsetshire West")
        self.assertNotContains(response, "Borsetshire East")

    def test_explore_json_page_year(self):
        url = reverse("explore_json")
        response = self.client.get(url + "?mp_last_elected__year=2015")
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "South Borsetshire")
        self.assertNotContains(response, "Borsetshire West")
        self.assertNotContains(response, "Borsetshire East")

    def test_explore_csv_page_year_lt(self):
        url = reverse("explore_csv")
        response = self.client.get(url + "?mp_last_elected__year__lt=2019")
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "South Borsetshire")
        self.assertContains(response, "Borsetshire West")
        self.assertNotContains(response, "Borsetshire East")

    def test_explore_csv_page_year_gte(self):
        url = reverse("explore_csv")
        response = self.client.get(url + "?mp_last_elected__year__gte=2019")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "South Borsetshire")
        self.assertNotContains(response, "Borsetshire West")
        self.assertNotContains(response, "Borsetshire East")

    def test_explore_csv_page_year(self):
        url = reverse("explore_csv")
        response = self.client.get(url + "?mp_last_elected__year=2015")
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "South Borsetshire")
        self.assertNotContains(response, "Borsetshire West")
        self.assertNotContains(response, "Borsetshire East")

    def test_explore_json_shader(self):
        url = reverse("explore_json")
        response = self.client.get(url + "?shader=ages_0-9")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "South Borsetshire")
        self.assertContains(response, "shades")

        response = self.client.get(url + "?shader=wind_support")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "South Borsetshire")
        self.assertContains(response, "shades")

    def test_explore_json_shader_custom_colours(self):
        url = reverse("explore_json")
        response = self.client.get(url + "?shader=party")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "#ff0000")

    def test_explore_persondata_area_type(self):
        url = reverse("explore_json")
        response = self.client.get(url + "?mp_election_majority__gt=1000")
        self.assertContains(response, "South Borsetshire")
        self.assertNotContains(response, "New South Borsetshire")
        response = self.client.get(
            url + "?mp_election_majority__gt=1000&area_type=WMC23"
        )
        self.assertContains(response, "New South Borsetshire")
        self.assertNotContains(response, '"South Borsetshire')


class TestAreaPage(TestCase):
    fixtures = [
        "areas.json",
        "areas_23.json",
        "mps.json",
        "elections.json",
        "area_data.json",
    ]

    def setUp(self):
        self.u = User.objects.create(username="user@example.com")
        self.client.force_login(self.u)

    def test_area_page_bad_area(self):
        url = reverse("area", args=("WMC", "East Borsetshire"))
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

    def test_area_page_bad_area_code(self):
        url = reverse("area", args=("WMX", "South Borsetshire"))
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

    def test_area_page_lower_case_area_code(self):
        url = reverse("area", args=("wmc", "South Borsetshire"))
        response = self.client.get(url)

        self.assertEqual(response.status_code, 301)
        self.assertEqual(response.headers["Location"], "/area/WMC/South%20Borsetshire")

    def test_area_page_lower_case_area_name(self):
        url = reverse("area", args=("wmc", "south borsetshire"))
        response = self.client.get(url)

        self.assertEqual(response.status_code, 301)
        self.assertEqual(response.headers["Location"], "/area/WMC/South%20Borsetshire")

    def test_area_page_logged_in(self):
        DataSet.objects.update(featured=True)
        url = reverse("area", args=("WMC", "South Borsetshire"))
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "hub/area.html")

        context = response.context
        self.assertEqual(context["page_title"], "South Borsetshire")
        self.assertEqual(context["area"].name, "South Borsetshire")

        mp = context["mp"]
        self.assertEqual(len(mp.keys()), 9)
        self.assertEqual(mp["person"].name, "James Madeupname")
        self.assertEqual(mp["parlid"], "1")
        self.assertEqual(mp["mp_election_majority"], 1234)
        self.assertEqual(mp["mp_first_elected"].date().isoformat(), "2005-05-05")

        places = context["categories"]["place"]
        self.assertEqual(len(places), 2)

        ages = places[0]
        self.assertEqual(len(ages["data"]), 2)
        self.assertEqual(ages["data"][0].value(), 10.1234)

        fuel_poverty = places[1]
        self.assertEqual(fuel_poverty["data"].value(), 12.4321)

        opinion = context["categories"]["opinion"]
        self.assertEqual(len(opinion), 1)

        support = opinion[0]
        self.assertEqual(len(support["data"]), 2)
        self.assertEqual(support["data"][0].value(), 75)

    def test_area_page_no_mp(self):
        url = reverse("area", args=("WMC", "Borsetshire East"))
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        context = response.context
        self.assertTrue(context.get("no_mp"))

    def test_area_page_logged_out(self):
        self.client.logout()

        DataSet.objects.update(featured=True)
        url = reverse("area", args=("WMC", "South Borsetshire"))
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "hub/area.html")

        context = response.context
        self.assertEqual(context["page_title"], "South Borsetshire")
        self.assertEqual(context["area"].name, "South Borsetshire")

        mp = context["mp"]
        self.assertEqual(len(mp.keys()), 5)
        self.assertEqual(mp["person"].name, "James Madeupname")
        self.assertIsNone(mp.get("parlid", None))
        self.assertEqual(mp["mp_election_majority"], 1234)
        self.assertIsNone(mp.get("mp_first_elected", None))

        places = context["categories"]["place"]
        self.assertEqual(len(places), 1)

        ages = places[0]
        self.assertEqual(len(ages["data"]), 2)
        self.assertEqual(ages["data"][0].value(), 10.1234)

        opinion = context["categories"]["opinion"]
        self.assertEqual(len(opinion), 0)

    def test_area_page_mp_with_multiple_areas(self):
        p = Person.objects.get(name="James Madeupname")
        a = Area.objects.get(name="New South Borsetshire", area_type__code="WMC23")
        ap = PersonArea(area=a, person=p, person_type="MP")
        ap.save()

        DataSet.objects.update(featured=True)
        url = reverse("area", args=("WMC", "South Borsetshire"))
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "hub/area.html")

        context = response.context
        self.assertEqual(context["page_title"], "South Borsetshire")
        self.assertEqual(context["area"].name, "South Borsetshire")

        mp = context["mp"]
        self.assertEqual(mp["person"].name, "James Madeupname")

        url = reverse("area", args=("WMC", "South Borsetshire"))
        response = self.client.get(url)
        context = response.context
        self.assertEqual(context["page_title"], "South Borsetshire")
        self.assertEqual(context["area"].name, "South Borsetshire")

        mp = context["mp"]
        self.assertEqual(mp["person"].name, "James Madeupname")

    def test_area_page_multiple_mps(self):
        p = Person(
            name="Francis Notaperson",
            person_type="MP",
            external_id="99",
            id_type="twfy_id",
        )
        p.save()
        a = Area.objects.get(name="South Borsetshire", area_type__code="WMC")
        ap = PersonArea(area=a, person=p, person_type="MP", end_date="2023-01-01")
        ap.save()

        DataSet.objects.update(featured=True)
        url = reverse("area", args=("WMC", "South Borsetshire"))
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "hub/area.html")

        context = response.context
        self.assertEqual(context["page_title"], "South Borsetshire")
        self.assertEqual(context["area"].name, "South Borsetshire")

        mp = context["mp"]
        self.assertEqual(mp["person"].name, "James Madeupname")

    def test_area_page_hidden_datasets(self):
        DataSet.objects.update(featured=True)
        for name in ["constituency_fuel_poverty", "mp_election_majority"]:
            ds = DataSet.objects.get(name=name)
            ds.visible = False
            ds.save()

        url = reverse("area", args=("WMC", "South Borsetshire"))
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        context = response.context
        mp = context["mp"]
        self.assertEqual(len(mp.keys()), 8)
        self.assertIsNone(mp.get("mp_election_majority"))

        places = context["categories"]["place"]
        self.assertEqual(len(places), 1)


class TestAreaSearchPage(TestCase):
    fixtures = ["areas.json", "areas_23.json", "mps_23.json"]

    def setUp(self):
        u = User.objects.create(username="user@example.com")
        self.client.force_login(u)

    @patch("utils.mapit.MapIt.postcode_point_to_gss_codes")
    def test_postcode_lookup(self, mapit_areas):
        mapit_areas.return_value = ["E10000005"]

        url = reverse("area_search")
        response = self.client.get(url, {"search": "SE17 3HE"}, follow=True)

        self.assertRedirects(response, "/area/WMC23/New%20South%20Borsetshire")
        self.assertTemplateUsed(response, "hub/area.html")

        context = response.context
        self.assertEqual(context["area"].name, "New South Borsetshire")

    @patch("utils.mapit.MapIt.postcode_point_to_gss_codes")
    def test_postcode_lookup_multiple_areas(self, mapit_areas):
        mapit_areas.return_value = ["E10000005", "E10000101", "E10000002"]

        url = reverse("area_search")
        response = self.client.get(url, {"search": "SE17 3HE"}, follow=True)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "hub/area_search.html")

        context = response.context
        self.assertEqual(len(context["areas"]), 2)
        self.assertContains(response, "New South Borsetshire")
        self.assertContains(response, "Borsetshire East District Council")
        self.assertNotContains(response, "Borsetshire West")

    @patch("utils.mapit.session.get")
    def test_bad_postcode(self, mapit_get):
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.json.return_value = {"error": "Bad postcode"}

        mapit_get.return_value = mock_response

        url = reverse("area_search")
        response = self.client.get(url, {"search": "SE17 3HE"}, follow=True)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "hub/area_search.html")

        context = response.context
        self.assertEqual(str(context["error"]), "Bad postcode")

    @patch("utils.mapit.MapIt.wgs84_point_to_gss_codes")
    def test_latlon_lookup(self, mapit_areas):
        mapit_areas.return_value = ["E10000005"]

        url = reverse("area_search")
        response = self.client.get(url, {"lat": "0.11", "lon": "0.12"}, follow=True)

        self.assertRedirects(response, "/area/WMC23/New%20South%20Borsetshire")
        self.assertTemplateUsed(response, "hub/area.html")

        context = response.context
        self.assertEqual(context["area"].name, "New South Borsetshire")

    def test_area_name_lookup(self):
        url = reverse("area_search")
        response = self.client.get(
            url, {"search": "New South Borsetshire"}, follow=True
        )

        self.assertRedirects(response, "/area/WMC23/New%20South%20Borsetshire")
        self.assertTemplateUsed(response, "hub/area.html")

        context = response.context
        self.assertEqual(context["area"].name, "New South Borsetshire")

    def test_search_with_spaces(self):
        url = reverse("area_search")
        response = self.client.get(
            url, {"search": " New South Borsetshire"}, follow=True
        )

        self.assertRedirects(response, "/area/WMC23/New%20South%20Borsetshire")
        self.assertTemplateUsed(response, "hub/area.html")

        response = self.client.get(
            url, {"search": "New South Borsetshire "}, follow=True
        )

        self.assertRedirects(response, "/area/WMC23/New%20South%20Borsetshire")
        self.assertTemplateUsed(response, "hub/area.html")

        context = response.context
        self.assertEqual(context["area"].name, "New South Borsetshire")

    def test_mp_name_lookup(self):
        url = reverse("area_search")
        response = self.client.get(url, {"search": "Andrew Madeupname"}, follow=True)

        self.assertRedirects(response, "/area/WMC23/New%20Mid%20Borsetshire")
        self.assertTemplateUsed(response, "hub/area.html")

        context = response.context
        self.assertEqual(context["area"].name, "New Mid Borsetshire")

    def test_no_match_found(self):
        url = reverse("area_search")
        response = self.client.get(url, {"search": "Lower Locksley"})

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "hub/area_search.html")

        context = response.context
        self.assertIn("can’t find", context["error"])
        self.assertIn("Lower Locksley", context["error"])

    def test_multiple_matches(self):
        url = reverse("area_search")
        response = self.client.get(url, {"search": "Borsetshire"})

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "hub/area_search.html")

        context = response.context
        self.assertEqual(len(context["areas"]), 5)
        self.assertContains(response, "Borsetshire East Council")
        self.assertContains(response, "Borsetshire East District Council")
        self.assertNotContains(response, "/WMC/Borsetshire East")


class testUserFavouriteViews(TestCase):
    fixtures = ["areas.json", "mps.json", "elections.json", "area_data.json"]

    def setUp(self):
        self.u = User.objects.create(username="user@example.com")
        self.client.force_login(self.u)

    def test_favouriting(self):
        count = UserDataSets.objects.count()
        self.assertEqual(count, 0)

        ds = DataSet.objects.get(name="constituency_fuel_poverty")

        url = reverse("favourite_dataset", args=(ds.pk,))
        response = self.client.post(url, HTTP_REFERER="/area/WMC/Borsetshire")

        self.assertEqual(response.status_code, 302)

        count = UserDataSets.objects.count()
        self.assertEqual(count, 1)

        self.assertTrue(UserDataSets.objects.filter(data_set=ds, user=self.u).exists())

    def test_ajax_favouriting(self):
        count = UserDataSets.objects.count()
        self.assertEqual(count, 0)

        ds = DataSet.objects.get(name="constituency_fuel_poverty")

        url = reverse("favourite_dataset", args=(ds.pk,))
        response = self.client.post(url, HTTP_ACCEPT="application/json")

        self.assertEqual(response.status_code, 200)

        count = UserDataSets.objects.count()
        self.assertEqual(count, 1)

        self.assertTrue(UserDataSets.objects.filter(data_set=ds, user=self.u).exists())
        fav = UserDataSets.objects.get(data_set=ds, user=self.u)
        self.assertEqual(response.json(), {"pk": fav.pk})

    def test_unfavouriting(self):
        count = UserDataSets.objects.count()
        self.assertEqual(count, 0)

        ds = DataSet.objects.get(name="constituency_fuel_poverty")
        UserDataSets.objects.create(data_set=ds, user=self.u)

        url = reverse("unfavourite_dataset", args=(ds.pk,))
        response = self.client.post(url, HTTP_REFERER="/area/WMC/Borsetshire")

        self.assertEqual(response.status_code, 302)

        count = UserDataSets.objects.count()
        self.assertEqual(count, 0)

        self.assertFalse(UserDataSets.objects.filter(data_set=ds, user=self.u).exists())

    def test_ajax_unfavouriting(self):
        count = UserDataSets.objects.count()
        self.assertEqual(count, 0)

        ds = DataSet.objects.get(name="constituency_fuel_poverty")
        UserDataSets.objects.create(data_set=ds, user=self.u)

        url = reverse("unfavourite_dataset", args=(ds.pk,))
        response = self.client.post(url, HTTP_ACCEPT="application/json")

        self.assertEqual(response.status_code, 200)

        count = UserDataSets.objects.count()
        self.assertEqual(count, 0)

        self.assertEqual(response.json(), {"deleted": True})


class TestStatusView(TestCase):
    def test_status_view_is_200(self):
        url = reverse("status")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["database"], "ok")
        self.assertEqual(response.json()["areas"], 0)
        self.assertEqual(response.json()["datasets"], 0)
