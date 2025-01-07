from django.conf import settings

import pandas as pd
from tqdm import tqdm

from hub.import_utils import filter_authority_type
from hub.models import DataSet, DataType

from .base_importers import BaseImportFromDataFrameCommand, MultipleAreaTypesMixin

declare_map = {
    "Y": "Yes",
    "N": "No",
}


class Command(MultipleAreaTypesMixin, BaseImportFromDataFrameCommand):
    cons_row = "gss_code"
    message = "Importing council scorecards data"
    uses_gss = True
    do_not_convert = True

    data_file = settings.BASE_DIR / "data" / "2023_scorecards_data.csv"

    area_types = ["STC", "DIS"]

    defaults = {
        "label": "Council Climate Action Scorecard",
        "description": "",
        "data_type": "percent",
        "category": "place",
        "release_date": "2023",
        "source_label": "Data from Climate Emergency UK.",
        "source": "https://councilclimatescorecards.uk/",
        "source_type": "csv",
        "table": "areadata",
        "data_url": "",
        "comparators": DataSet.numerical_comparators(),
        "is_filterable": True,
        "is_shadable": True,
        "is_public": True,
        "unit_type": "raw",
        "unit_distribution": "physical_area",
    }

    data_sets = {
        "council_action_scorecard_total": {
            "defaults": defaults,
            "col": "weighted_total",
        },
        "council_action_scorecard_bh": {
            "defaults": {
                **defaults,
                "label": "Buildings & Heating",
            },
            "col": "Buildings & Heating",
        },
        "council_action_scorecard_transport": {
            "defaults": {
                **defaults,
                "label": "Transport",
            },
            "col": "Transport",
        },
        "council_action_scorecard_planning": {
            "defaults": {
                **defaults,
                "label": "Planning & Land Use",
            },
            "col": "Planning & Land Use",
        },
        "council_action_scorecard_governance": {
            "defaults": {
                **defaults,
                "label": "Goverance & Finance",
            },
            "col": "Governance & Finance",
        },
        "council_action_scorecard_biodiversity": {
            "defaults": {
                **defaults,
                "label": "Biodiversity",
            },
            "col": "Biodiversity",
        },
        "council_action_scorecard_collaboration": {
            "defaults": {
                **defaults,
                "label": "Collaboration & Engagement",
            },
            "col": "Collaboration & Engagement",
        },
        "council_action_scorecard_waste": {
            "defaults": {
                **defaults,
                "label": "Waste Reduction & Food",
            },
            "col": "Waste Reduction & Food",
        },
    }

    # do not want to calculate averages as the comparisons are only relevant
    # to councils of the same type
    def update_averages(self):
        pass

    def add_data_sets(self, df):
        if not self._quiet:
            self.stdout.write("Creating dataset + types")

        total_data_set, created = DataSet.objects.update_or_create(
            name="council_action_scorecard_total", defaults=self.defaults
        )

        section_data_set, created = DataSet.objects.update_or_create(
            name="council_action_scorecard_sections",
            defaults={
                **self.defaults,
                "is_range": True,
                "label": "Action Scorecards section scores",
            },
        )

        total_data_set.areas_available.add(self.get_area_type())
        section_data_set.areas_available.add(self.get_area_type())

        for name in tqdm(self.data_sets.keys()):
            if name == "council_action_scorecard_total":
                data_set = total_data_set
            else:
                data_set = section_data_set

            data_type, created = DataType.objects.update_or_create(
                data_set=data_set,
                name=name,
                area_type=self.get_area_type(),
                defaults={
                    "data_type": "percent",
                    "label": self.data_sets[name]["defaults"]["label"],
                },
            )
            self.data_types[name] = data_type

    def get_dataframe(self):

        if self.data_file.exists() is False:
            return None

        df = pd.read_csv(self.data_file)
        df = filter_authority_type(df, self.area_type, "gss")

        councils = []
        for index, row in df.iterrows():
            councils.append(
                {
                    "gss_code": row["gss"],
                    "weighted_total": row["weighted_total"] * 100,
                    "Buildings & Heating": row["Buildings & Heating"] * 100,
                    "Transport": row["Transport"] * 100,
                    "Governance & Finance": row["Governance & Finance"] * 100,
                    "Biodiversity": row["Biodiversity"] * 100,
                    "Planning & Land Use": row["Planning & Land Use"] * 100,
                    "Waste Reduction & Food": row["Waste Reduction & Food"] * 100,
                    "Collaboration & Engagement": row["Collaboration & Engagement"]
                    * 100,
                }
            )

        df = pd.DataFrame(councils)

        return df
