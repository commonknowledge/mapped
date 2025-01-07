from django.conf import settings
from django.db.models import Avg, FloatField, Max, Min
from django.db.models.functions import Cast, Coalesce

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet, DataType
from hub.transformers import DataTypeConverter

from .base_importers import BaseImportFromDataFrameCommand


def extend(dict1, dict2):
    merged = dict1.copy()
    merged.update(dict2)
    return merged


class Command(BaseImportFromDataFrameCommand):
    # This importer is a bit weird, because we import three separate CSV files
    # (one for each MRP question), creating a separate dataset for each.
    # Note also that the datasets have `is_range`, meaning they contain
    # child datasets (one for each MRP question "response" bucket).
    #
    # We inherit from BaseImportFromDataFrameCommand, but to be honest, we end
    # up overriding so much to handle the multiple datasets at once that we
    # probably should have just inherited from BaseAreaImportCommand.

    help = "Import Hope Not Hate polling data, from February 2023"
    message = "Importing Hope Not Hate polling data"
    cast_field = FloatField

    defaults = {
        "data_type": "percent",
        "category": "opinion",
        "is_range": True,
        "release_date": "April 2023",
        "source_label": "Focaldata 2023 MRP polling, commissioned by HOPE not hate.",
        "source": "https://hopenothate.org.uk/research/",
        "source_type": "google sheet",
        "table": "areadata",
        "data_url": "",
        "default_value": 50,
        "is_filterable": True,
        "exclude_countries": ["Northern Ireland"],
        "is_shadable": True,
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    }

    files = [
        {
            "data_set_name": "hnh_mrp_41-1",
            "defaults": extend(
                defaults,
                {
                    "label": "Loss of nature and destruction of the environment should be one of the most important concerns for the country",
                    "description": None,
                },
            ),
            "source_filename": "Aid Alliance MRP Q41.1 1_3_23 - Constituency.csv",
            "source_cols": [
                {"source_string": "Name", "slug": "name", "label": None},
                {
                    "source_string": "Westminster Constituency",
                    "slug": "gss_code",
                    "label": None,
                },
                {
                    "source_string": "Region",
                    "slug": "region",
                    "label": None,
                },
                {
                    "source_string": "Winner",
                    "slug": "winner",
                    "label": None,
                },
                {
                    "source_string": "Strongly agree",
                    "slug": "strongly_agree",
                    "label": "Strongly agree",
                },
                {
                    "source_string": "Partly agree",
                    "slug": "partly_agree",
                    "label": "Partly agree",
                },
                {
                    "source_string": "Neither agree nor disagree",
                    "slug": "neither",
                    "label": "Neither agree nor disagree",
                },
                {
                    "source_string": "Partly disagree",
                    "slug": "partly_disagree",
                    "label": "Partly disagree",
                },
                {
                    "source_string": "Strongly disagree",
                    "slug": "vstrongly_disagree",
                    "label": "Strongly disagree",
                },
                {
                    "source_string": "NET_agree",
                    "slug": "net_agree",
                    "label": "Net agree",
                },
                {
                    "source_string": "NET_disagree",
                    "slug": "net_disagree",
                    "label": "Net disagree",
                },
            ],
        },
        {
            "data_set_name": "hnh_mrp_24-3",
            "defaults": extend(
                defaults,
                {
                    "label": "Likelihood to take action such as voting for a particular candidate or lobbying an MP to tackle climate change and protect nature",
                    "description": None,
                },
            ),
            "source_filename": "TCC Hope Not Hate MRP Q24.3 27_2_23 - Constituency.csv",
            "source_cols": [
                {
                    "source_string": "Name",
                    "slug": "name",
                    "label": None,
                },
                {
                    "source_string": "Westminster Constituency",
                    "slug": "gss_code",
                    "label": None,
                },
                {
                    "source_string": "Region",
                    "slug": "region",
                    "label": None,
                },
                {
                    "source_string": "Winner",
                    "slug": "winner",
                    "label": None,
                },
                {
                    "source_string": "Very likely",
                    "slug": "very_likely",
                    "label": "Very likely",
                },
                {
                    "source_string": "Quite likely",
                    "slug": "quite_likely",
                    "label": "Quite likely",
                },
                {
                    "source_string": "Neither likely or unlikely",
                    "slug": "neither",
                    "label": "Neither likely nor unlikely",
                },
                {
                    "source_string": "Quite unlikely",
                    "slug": "quite_unlikely",
                    "label": "Quite unlikely",
                },
                {
                    "source_string": "Very unlikely",
                    "slug": "very_unlikely",
                    "label": "Very unlikely",
                },
                {
                    "source_string": "NET_likely",
                    "slug": "net_likely",
                    "label": "Net likely",
                },
                {
                    "source_string": "NET_unlikely",
                    "slug": "net_unlikely",
                    "label": "Net unlikely",
                },
            ],
        },
        {
            "data_set_name": "hnh_mrp_29",
            "defaults": extend(
                defaults,
                {
                    "label": "Tackling climate change should / should not be one of the Government’s biggest priorities right now",
                    "description": None,
                },
            ),
            "source_filename": "TCC Hope Not Hate MRP Q29 27_2_23 - Constituency.csv",
            "source_cols": [
                {
                    "source_string": "Name",
                    "slug": "name",
                    "label": None,
                },
                {
                    "source_string": "Westminster Constituency",
                    "slug": "gss_code",
                    "label": None,
                },
                {
                    "source_string": "Region",
                    "slug": "region",
                    "label": None,
                },
                {
                    "source_string": "winner",
                    "slug": "winner",
                    "label": None,
                },
                {
                    "source_string": "Tackling Climate Change should be one of the Government's biggest priorities right now",
                    "slug": "should",
                    "label": "Should be a priority",
                },
                {
                    "source_string": "Tackling Climate Change should not be one of the Government's biggest priorities right now",
                    "slug": "should_not",
                    "label": "Should not be a priority",
                },
            ],
        },
        {
            "data_set_name": "hnh_mrp_37-1",
            "defaults": extend(
                defaults,
                {
                    "label": "Policies for tackling the cost of living crisis should go hand in hand with policies to tackle the climate crisis",
                    "description": None,
                },
            ),
            "source_filename": "TCC Hope Not Hate MRP Q37.1 27_2_23 - Constituency.csv",
            "source_cols": [
                {
                    "source_string": "Name",
                    "slug": "name",
                    "label": None,
                },
                {
                    "source_string": "Westminster Constituency",
                    "slug": "gss_code",
                    "label": None,
                },
                {
                    "source_string": "Region",
                    "slug": "region",
                    "label": None,
                },
                {
                    "source_string": "Winner",
                    "slug": "winner",
                    "label": None,
                },
                {
                    "source_string": "strongly_agree",
                    "slug": "strongly_agree",
                    "label": "Strongly agree",
                },
                {
                    "source_string": "somewhat_agree",
                    "slug": "somewhat_agree",
                    "label": "Somewhat agree",
                },
                {
                    "source_string": "neither_agree_or_disagree",
                    "slug": "neither",
                    "label": "Neither agree nor disagree",
                },
                {
                    "source_string": "somewhat_disagree",
                    "slug": "somewhat_disagree",
                    "label": "Somewhat disagree",
                },
                {
                    "source_string": "strongly_disagree",
                    "slug": "strongly_disagree",
                    "label": "Strongly disagree",
                },
                {
                    "source_string": "NET_agree",
                    "slug": "net_agree",
                    "label": "Net agree",
                },
                {
                    "source_string": "NET_disagree",
                    "slug": "net_disagree",
                    "label": "Net disagree",
                },
            ],
        },
        {
            "data_set_name": "hnh_mrp_25",
            "defaults": extend(
                defaults,
                {
                    "label": "Government policies on the overseas aid budget",
                    "description": None,
                },
            ),
            "source_filename": "Aid Alliance MRP Q25 1_3_23.xlsx - Constituency.csv",
            "source_cols": [
                {
                    "source_string": "Name",
                    "slug": "name",
                    "label": None,
                },
                {
                    "source_string": "Westminster Constituency",
                    "slug": "gss_code",
                    "label": None,
                },
                {
                    "source_string": "Region",
                    "slug": "region",
                    "label": None,
                },
                {
                    "source_string": "Winner",
                    "slug": "winner",
                    "label": None,
                },
                {
                    "source_string": "The UK government should increase the overseas aid budget",
                    "slug": "increase_overseas_aid_budget",
                    "label": "Should increase",
                },
                {
                    "source_string": "The UK government should reduce the overseas aid budget",
                    "slug": "decrease_overseas_aid_budget",
                    "label": "Should decrease",
                },
            ],
        },
    ]

    def get_data_type_slug(self, data_set_slug, column_slug):
        return f"{data_set_slug}_{column_slug}"

    def log(self, message):
        if not self._quiet:
            self.stdout.write(message)

    def extract_and_save_data(self):

        self.log(self.message)

        area_type = self.get_area_type()
        for file in self.files:

            file_loc = settings.BASE_DIR / "data" / file["source_filename"]

            if not file_loc.exists():
                self.log(f"File {file_loc} not found")
                continue

            self.log(file["defaults"]["label"])

            data_set, created = DataSet.objects.update_or_create(
                name=file["data_set_name"],
                defaults=file["defaults"],
            )

            data_types = {}

            # Loop through columns with a defined label,
            # creating a data_type for each one.
            for col in file["source_cols"]:
                if col["label"] is not None:
                    data_type_slug = self.get_data_type_slug(
                        file["data_set_name"], col["slug"]
                    )
                    data_type, created = DataType.objects.update_or_create(
                        data_set=data_set,
                        name=data_type_slug,
                        area_type=area_type,
                        defaults={
                            "data_type": "percent",
                            "label": col["label"],
                        },
                    )
                    data_types[col["slug"]] = data_type

            df = pd.read_csv(file_loc)

            # Give the dataframe nice slugified columns from here on
            df.columns = [col["slug"] for col in file["source_cols"]]

            self.log(f"dataframe rows={df.shape[0]}")
            self.log(f"dataframe columns={', '.join(df.columns)}")

            for index, row in tqdm(
                df.iterrows(), disable=self._quiet, total=df.shape[0]
            ):
                area = Area.get_by_gss(row["gss_code"], area_type=self.area_type)
                if area is None:
                    self.stdout.write(
                        f"Failed to find area with code {row['gss_code']} and type {area_type}"
                    )
                    continue

                # Loop through columns with a defined label,
                # saving this row’s (constituency’s) value,
                # as an AreaData record.
                for col in file["source_cols"]:
                    if col["label"] is not None:
                        value = row[col["slug"]].replace("%", "")
                        AreaData.objects.update_or_create(
                            data_type=data_types[col["slug"]],
                            area=area,
                            defaults={"data": value},
                        )

            converter = DataTypeConverter()
            for data_type in data_types.values():
                if data_type.area_type == converter.old_area_type:
                    converter.convert_datatype_to_new_geography(data_type)

    def delete_data(self):
        self.log("Deleting existing AreaData objects for DataTypes:")
        for file in self.files:
            for col in file["source_cols"]:
                if col["label"] is not None:
                    data_type_slug = self.get_data_type_slug(
                        file["data_set_name"], col["slug"]
                    )
                    self.log(f"    {data_type_slug}")
                    AreaData.objects.filter(data_type__name=data_type_slug).delete()

    def update_averages(self):
        self.log("Calculating averages for DataTypes:")
        for file in self.files:

            file_loc = settings.BASE_DIR / "data" / file["source_filename"]

            if not file_loc.exists():
                self.log(f"File {file_loc} not found - not calculating average")
                continue

            for col in file["source_cols"]:
                if col["label"] is not None:
                    data_type_slug = self.get_data_type_slug(
                        file["data_set_name"], col["slug"]
                    )
                    self.log(f"    {data_type_slug}")
                    data_type = DataType.objects.get(
                        name=data_type_slug,
                        area_type__code=self.area_type,
                    )
                    average = (
                        AreaData.objects.filter(data_type=data_type)
                        .annotate(
                            cast_data=Cast(
                                Coalesce("int", "float"), output_field=self.cast_field()
                            )
                        )
                        .all()
                        .aggregate(Avg("cast_data"))
                    )

                    data_type.average = average["cast_data__avg"]
                    data_type.save()

    def update_max_min(self):
        self.log("Calculating min/max values for DataTypes:")
        for file in self.files:

            file_loc = settings.BASE_DIR / "data" / file["source_filename"]

            if not file_loc.exists():
                self.log(f"File {file_loc} not found - not calculating average")
                continue

            for col in file["source_cols"]:
                if col["label"] is not None:
                    data_type_slug = self.get_data_type_slug(
                        file["data_set_name"], col["slug"]
                    )
                    self.log(f"    {data_type_slug}")
                    data_type = DataType.objects.get(
                        name=data_type_slug,
                        area_type__code=self.area_type,
                    )
                    base = (
                        AreaData.objects.filter(data_type=data_type)
                        .annotate(
                            cast_data=Cast(
                                Coalesce("int", "float"), output_field=self.cast_field()
                            )
                        )
                        .all()
                    )
                    max = base.aggregate(Max("cast_data"))
                    min = base.aggregate(Min("cast_data"))
                    data_type.maximum = max["cast_data__max"]
                    data_type.minimum = min["cast_data__min"]
                    data_type.save()

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.delete_data()
        self.extract_and_save_data()
        self.update_averages()
        self.update_max_min()
