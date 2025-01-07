import shutil
from pathlib import Path
from unittest import skip
from unittest.mock import MagicMock, patch

from django.core.management import call_command
from django.test import TestCase

import pandas as pd

from hub.management.commands.import_mps import Command as ImportMpsCommand
from hub.models import Person, PersonData

BASE_DIR = Path(__file__).resolve().parent
IMG_DIR = BASE_DIR / "images"


class ImportMPsTestCase(TestCase):
    quiet_parameter: bool = False
    media_root = BASE_DIR / "media"

    def setUp(self):
        if not self.media_root.exists():
            self.media_root.mkdir()

    def tearDown(self):
        if self.media_root.exists():
            shutil.rmtree(self.media_root)

    fixtures = ["areas.json", "areas_23.json"]

    @patch("hub.management.commands.import_mps.requests")
    @patch("hub.management.commands.import_mps.urllib.request.urlretrieve")
    @patch("hub.management.commands.import_mps.Command.get_twfy_df")
    @patch("hub.management.commands.import_mps.Command.get_id_df")
    def test_import(self, id_df_mock, twfy_df_mock, retrieve_mock, request_mock):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "results": {
                "bindings": [
                    {
                        "twfyid": {"value": 26},
                        "personLabel": {"value": "James Madeupname"},
                        "partyLabel": {"value": "Borsetshire Independence"},
                    },
                    {
                        "twfyid": {"value": 27},
                        "gss_code": {"value": "E10000012"},
                        "personLabel": {"value": "Angela Madeupname"},
                        "partyLabel": {"value": "Borsetshire Unionist"},
                    },
                ]
            }
        }
        request_mock.get.return_value = mock_response
        df = pd.DataFrame.from_dict(
            {
                "twfyid": [
                    26,
                    27,
                ],
                "Constituency": ["New South Borsetshire", "New Borsetshire West"],
                "Party": ["Borsetshire Independence", "Borsetshire Unionist"],
                "First name": ["James", "Angela"],
                "Last name": ["Madeupname", "Madeupname"],
            }
        )
        twfy_df_mock.return_value = df
        df = pd.DataFrame.from_dict(
            {
                "twfyid": [
                    "uk.org.publicwhip/person/26",
                    "uk.org.publicwhip/person/27",
                    "uk.org.publicwhip/person/27",
                ],
                "identifier": [1, "Q12", 2],
                "scheme": ["datadotparl_id", "wiki", "datadotparl_id"],
            }
        )
        id_df_mock.return_value = df

        # we don't use the headers value here
        retrieve_mock.return_value = (IMG_DIR / "mp.jpg", 1)

        with self.settings(MEDIA_ROOT=self.media_root):
            call_command("import_mps", quiet=self.quiet_parameter)

        mps = Person.objects.order_by("-name").all()
        self.assertEqual(mps.count(), 2)

        first = mps[0]
        self.assertEqual(first.name, "James Madeupname")
        self.assertEqual(first.external_id, "26")
        self.assertRegex(first.photo.url, r"/media/person/mp_1.jpeg")

        all_data = PersonData.objects.filter(person=first)
        self.assertEqual(all_data.count(), 3)

        data = all_data.filter(data_type__name="twfyid").first()
        self.assertEqual(data.data, "26")

        data = all_data.filter(data_type__name="party").first()
        self.assertEqual(data.data, "Borsetshire Independence")


class ImportMPsTestCaseQuiet(ImportMPsTestCase):
    """
    Do the ImportMPs check, but with the quiet flag on
    """

    quiet_parameter: bool = True


class ImportMPElectionResultsTestCase(TestCase):
    fixtures = ["areas.json", "areas_23.json", "mps.json"]

    @patch("hub.management.commands.import_mps_election_results.requests")
    def test_import(self, request_mock):
        mock_response = MagicMock()
        mock_response.status_code = 200

        # helpfully we can use the same return for both calls as the returns
        # look similar but don't have overlapping keys
        mock_response.json.return_value = {
            "value": {
                "majority": 100,
                "electionDate": "2019-12-12T00:00:00",
                "latestHouseMembership": {"membershipStartDate": "2015-05-05T00:00:00"},
            }
        }
        request_mock.get.return_value = mock_response
        call_command("import_mps_election_results")

        mp = Person.objects.get(id=1)

        keys = {
            "mp_election_majority": 100,
            "mp_last_elected": "2019-12-12",
            "mp_first_elected": "2015-05-05",
        }

        for key, value in keys.items():
            data = PersonData.objects.get(person=mp, data_type__name=key)
            if data.data_type.data_type == "date":
                self.assertEqual(data.value().date().isoformat(), value)
            else:
                self.assertEqual(data.value(), value)


@skip("Skipping while we fix election result importing")
class DuplicateMPsTestCase(TestCase):
    fixtures = ["duplicate_mps.json"]

    @patch("hub.management.commands.import_mps.call_command")
    def test_duplicates_detected(self, mock_call_command):
        # Run the duplicate MPs method
        import_mps = ImportMpsCommand()
        import_mps.check_for_duplicate_mps()

        # Check that it's making calls to other commands
        # (showing that it's found a duplicate)
        self.assertTrue(mock_call_command.called)

    @patch("hub.management.commands.import_mps.call_command")
    def test_only_one_mp_left(self, mock_call_command):
        # Run the duplicate MPs method
        import_mps = ImportMpsCommand()
        import_mps.check_for_duplicate_mps()

        # Count the number of People objects associated
        # with area 2, and ensure it is one
        self.assertEqual(Person.objects.filter(areas=2).count(), 1)

    @patch("hub.management.commands.import_mps.call_command")
    def test_correct_mp_left(self, mock_call_command):
        # Run the duplicate MPs method
        import_mps = ImportMpsCommand()
        import_mps.check_for_duplicate_mps()

        # Check the MP returned is the most recently
        # elected MP (as of last elections)
        self.assertEqual(
            Person.objects.get(areas=2),
            Person.objects.get(name="Juliet Replacement"),
        )

    @patch("hub.management.commands.import_mps.call_command")
    def test_data_not_reimported_if_no_duplicates(self, mock_call_command):
        # Remove the duplicated MP
        Person.objects.get(name="Juliet Replacement").delete()
        # Run the duplicate MPs method
        import_mps = ImportMpsCommand()
        import_mps.check_for_duplicate_mps()

        # Check that the call_command was never executed
        self.assertEqual(mock_call_command.call_count, 0)
