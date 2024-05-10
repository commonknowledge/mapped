import re
from datetime import date

from django.conf import settings
from django.core.management.base import BaseCommand

import numpy as np
import pandas as pd
import requests
from dateutil import parser
from tqdm import tqdm

from hub.models import Area, AreaData, AreaType, DataSet, DataType


def format_key(value):
    return value.replace(" ", "_").lower()


class Command(BaseCommand):
    help = "Import data from the last election"
    source_url = "https://commonslibrary.parliament.uk/tag/elections-data/"

    # Machine queries return 403 forbidden
    # https://commonslibrary.parliament.uk/research-briefings/cbp-8749/
    # https://researchbriefings.files.parliament.uk/documents/CBP-8749/HoC-GE2019-results-by-constituency.csv
    general_election_source_file = (
        settings.BASE_DIR / "data" / "2019_general_election.csv"
    )

    by_election_api_url = "https://lda.data.parliament.uk/electionresults.json?_sort=-election.date&_pageSize=40"

    area_type = "WMC"

    party_translate_down_dict = {
        "Conservative": "con",
        "Labour": "lab",
        "Green": "green",
        "Liberal Democrats": "ld",
        "Liberal Democrat": "ld",
        "Social Democratic": "sdlp",
        "Conservative Party": "con",
        "Labour Party": "lab",
        "Green Party": "green",
        "Reform UK": "brexit",
        "SNP": "snp",
        "Other": "all_other_candidates",
    }

    party_translate_up_dict = {
        "lab": "Labour Party",
        "snp": "Scottish National Party",
        "ld": "Liberal Democrats",
        "ind": "independent politician",
        "alliance": "Alliance Party of Northern Ireland",
        "sdlp": "Social Democratic and Labour Party",
        "pc": "Plaid Cymru",
        "sf": "Sinn Féin",
        "spk": "Speaker of the House of Commons",
        "brexit": "Reform UK",
        "all_other_candidates": "Other",
        "dup": "Democratic Unionist Party",
        "uup": "Ulster Unionist Party",
        "con": "Conservative Party",
        "green": "Green Party",
        "pbpa": "People Before Profit Alliance",
    }

    def up(self, value):
        return self.party_translate_up_dict.get(value.lower(), value)

    party_options = [
        {"title": "Alba Party", "shader": "#005EB8"},
        {"title": "Alliance Party of Northern Ireland", "shader": "#F6CB2F"},
        {"title": "Conservative Party", "shader": "#0087DC"},
        {"title": "Democratic Unionist Party", "shader": "#D46A4C"},
        {"title": "Green Party", "shader": "#6AB023"},
        {"title": "Labour Co-operative", "shader": "#E4003B"},
        {"title": "Labour Party", "shader": "#E4003B"},
        {"title": "Liberal Democrats", "shader": "#FAA61A"},
        {"title": "Plaid Cymru", "shader": "#005B54"},
        {"title": "Scottish National Party", "shader": "#FDF38E"},
        {"title": "Sinn Féin", "shader": "#326760"},
        {"title": "Social Democratic and Labour Party", "shader": "#2AA82C"},
        {"title": "Speaker of the House of Commons", "shader": "#DCDCDC"},
        {"title": "independent politician", "shader": "#DCDCDC"},
    ]

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.delete_data()
        df = self.get_last_election_df()
        self.data_types = self.create_data_types()
        self.import_results(df)

    def get_area_type(self):
        return AreaType.objects.get(code=self.area_type)

    unformatted_str_columns = [
        # from CSV:
        "ONS ID",
        "ONS region ID",
        "Constituency name",
        "County name",
        "Region name",
        "Country name",
        "Constituency type",
        "Declaration time",
        "Member first name",
        "Member surname",
        "Member gender",
        "Result",
        "First party",
        "Second party",
        # manually added columns:
        "date",
    ]
    str_columns = list(map(format_key, unformatted_str_columns))

    unformatted_stats_columns = [
        "Electorate",
        "Valid votes",
        "Invalid votes",
        "Majority",
    ]
    stats_columns = list(map(format_key, unformatted_stats_columns))

    def get_general_election_data(self):
        df = pd.read_csv(self.general_election_source_file).set_flags(
            allows_duplicate_labels=False
        )
        df["date"] = "2019-12-12"
        # convert to pythonic snake_case
        # df.columns = (df.columns
        #   .str.replace('\s', '_', regex=True)
        #   .str.lower()
        # )
        party_keys = [
            col
            for col in df.columns
            if col not in self.unformatted_str_columns
            and col not in self.unformatted_stats_columns
        ]
        df = df.rename(
            columns=lambda column: (
                format_key(column) if column not in party_keys else self.up(column)
            )
        )
        # df["spk"] = df["Of which other winner"]
        # df["All other candidates"] = df["All other candidates"] - df.spk
        # df = df.drop(columns="Of which other winner")
        df = df.set_index("ons_id")
        return df

    def get_by_elections_data(self):
        response = requests.get(self.by_election_api_url)

        by_election_data = {}

        if response.status_code == 200:
            elections = response.json()
            election_ids = []
            for election in elections["result"]["items"]:
                desc = election["election"]["label"]["_value"]
                if desc == "2019 General Election":
                    break
                election_id = election["_about"]
                election_id = election_id.replace(
                    "http://data.parliament.uk/resources/", ""
                )
                election_ids.append(election_id)

            for election_id in election_ids:
                uri = (
                    f"https://lda.data.parliament.uk/electionresults/{election_id}.json"
                )
                election_response = requests.get(uri)
                if election_response.status_code == 200:
                    election_data = election_response.json()
                    election_data = election_data["result"]["primaryTopic"]
                    label = election_data["election"]["label"]["_value"]
                    election_date = re.match(r"(\d+-\w+-\d+) .*", label)
                    election_date = election_date.group(1)
                    election_date = parser.parse(election_date)
                    cons = election_data["constituency"]["label"]["_value"]
                    electorate = election_data["electorate"]
                    majority = election_data["majority"]
                    valid_votes = election_data["turnout"]
                    result_of_election = election_data["resultOfElection"]
                    a = Area.get_by_name(cons)

                    result = {
                        "date": election_date.date().isoformat(),
                        "electorate": electorate,
                        "majority": majority,
                        "result": result_of_election,
                        "valid_votes": valid_votes,
                    }

                    def name_votes(candidate):
                        return {
                            "name": (
                                self.up(candidate["party"]["_value"])
                                # prevent attributing votes for one indie to another in the UI
                                if candidate["party"]["_value"].lower() != "ind"
                                else candidate["fullName"]["_value"]
                            ),
                            "numberOfVotes": int(candidate["numberOfVotes"]),
                        }

                    sorted_results = list(
                        map(
                            name_votes,
                            sorted(
                                election_data["candidate"],
                                key=lambda c: int(c["numberOfVotes"]),
                                reverse=True,
                            ),
                        )
                    )

                    for candidate in sorted_results:
                        result[candidate["name"]] = candidate["numberOfVotes"]
                    result["first_party"] = sorted_results[0]["name"]
                    result["second_party"] = sorted_results[1]["name"]

                    by_election_data[a.gss] = result

        df = pd.DataFrame.from_dict(by_election_data, orient="index")

        return df

    def get_last_election_df(self):
        df = self.get_general_election_data()
        be_df = self.get_by_elections_data()
        # Remove the election results from the general election df, where there has been a by-election since
        cols = df.columns.to_list()[1:]
        df.loc[be_df.index, cols] = np.nan
        # Patch in the by-election results where null values have been found
        df = df.combine_first(be_df)
        df = df.fillna(0)
        # cols = [col for col in df.columns if "party" not in col and "date" not in col]
        int_cols = [col for col in df.columns if col not in self.str_columns]
        df[int_cols] = df[int_cols].astype(int)
        df.first_party = df.first_party.apply(lambda party: self.up(party))
        df.second_party = df.second_party.apply(lambda party: self.up(party))
        df = df.rename(columns=lambda party: self.up(party))
        return df

    def create_data_types(self):
        second_party_ds, created = DataSet.objects.update_or_create(
            name="second_party",
            defaults={
                "data_type": "text",
                "description": "The parliamentary party who came second in this constituency’s most recent election or by-election",
                "label": "Second placed party at most recent election",
                "category": "opinion",
                "release_date": str(date.today()),
                "source_label": "Data from UK Parliament.",
                "source": "https://parliament.uk/",
                "table": "areadata",
                "options": self.party_options,
                "is_filterable": True,
                "comparators": DataSet.in_comparators(),
            },
        )
        second_party_ds.areas_available.add(self.get_area_type())

        second_party, created = DataType.objects.update_or_create(
            data_set=second_party_ds,
            name="second_party",
            defaults={"data_type": "text"},
        )

        last_election_ds, created = DataSet.objects.update_or_create(
            name="last_election",
            defaults={
                "data_type": "json",
                "description": "The results of the last parliamentary election held in this constituency",
                "label": "Results of last election",
                "release_date": str(date.today()),
                "source_label": "Data from UK Parliament.",
                "source": "https://parliament.uk/",
                "category": "opinion",
                "table": "areadata",
                "is_filterable": False,
            },
        )

        last_election_ds.areas_available.add(self.get_area_type())

        last_election, created = DataType.objects.update_or_create(
            data_set=last_election_ds,
            name="last_election",
            defaults={"data_type": "json"},
        )

        return {"second_party": second_party, "last_election": last_election}

    def import_results(self, df):
        if not self._quiet:
            print("Adding 'second party' data to database")
        for gss, party in tqdm(df.second_party.items(), disable=self._quiet):
            area = Area.get_by_gss(gss, area_type=self.area_type)
            if area is not None:
                data, created = AreaData.objects.update_or_create(
                    area=area, data_type=self.data_types["second_party"], data=party
                )
            else:
                print(
                    f"Area with GSS code: {str(gss)} doesn't exist for area type {self.area_type}."
                )
        if not self._quiet:
            print("Adding 'last election' data to database")
        for gss, dataset in tqdm(df.iterrows(), disable=self._quiet):
            try:
                area = Area.get_by_gss(gss, area_type=self.area_type)
                party_keys = [
                    col
                    for col in dataset.keys()
                    if col not in self.str_columns and col not in self.stats_columns
                ]
                json_data = {
                    "date": dataset.date,
                    "stats": dataset.drop(party_keys).to_dict(),
                    "results": [
                        {"party": k, "votes": v}
                        for k, v in dataset.filter(party_keys).to_dict().items()
                    ],
                }
                data, created = AreaData.objects.update_or_create(
                    area=area,
                    data_type=self.data_types["last_election"],
                    json=json_data,
                )
            except Area.DoesNotExist:
                print(f"Area with GSS code: {str(gss)} doesn't exist.")

    def delete_data(self):
        AreaData.objects.filter(data_type__name="second_party").delete()
        AreaData.objects.filter(data_type__name="last_election").delete()
