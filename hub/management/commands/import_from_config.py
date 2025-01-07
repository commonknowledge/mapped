import json

from django.conf import settings

import pandas as pd

from hub.models import AreaData, DataSet

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import based on config"

    json_config_file = settings.BASE_DIR / "conf" / "imports.json"

    defaults_cols = [
        "label",
        "data_type",
        "category",
        "subcategory",
        "release_date",
        "source_label",
        "source",
        "source_type",
        "data_url",
        "table",
        "default_value",
        "exclude_countries",
        "unit_type",
        "unit_distribution",
        "fill_blanks",
        "is_public",
        "is_filterable",
    ]

    def add_arguments(self, parser):
        super().add_arguments(parser)

        parser.add_argument(
            "--import_name", action="store", required=True, help="Name of import to run"
        )

    def get_configs(self, import_name):
        confs = []

        with open(self.json_config_file) as config:
            c = json.load(config)
            for conf in c:
                if conf["name"] == import_name:
                    if conf.get("data_types"):
                        conf["data_set_name"] = conf["name"]
                        conf["data_set_label"] = conf["label"]
                        for dt in conf["data_types"]:
                            dt_conf = {**conf, **dt}
                            del dt_conf["data_types"]
                            confs.append(dt_conf)
                    else:
                        confs.append(conf)

        return confs

    def setup(self, import_name, row):
        self.message = f"Importing {row['label']}"
        self.cons_row = row["constituency_col"]
        self.cons_col = row["constituency_col"]
        self.data_file = settings.BASE_DIR / "data" / row["data_file"]
        self.file_type = row["file_type"]
        self.area_type = row["area_type"]
        self.header_row = row.get("header_row")
        self.sheet = row.get("sheet")
        self.data_types = {}

        if row["uses_gss"]:
            self.uses_gss = True
        else:
            self.uses_gss = False

        try:
            self.cons_col = int(self.cons_col)
            self.cons_row = int(self.cons_row)
        except ValueError:
            pass

        if row.get("do_not_delete"):
            self.skip_delete = True
        else:
            self.skip_delete = False

        if row.get("multiply_percentage"):
            self.multiply_percentage = True
        else:
            self.multiply_percentage = False

        if row.get("delete_first"):
            self.delete_first = True
        else:
            self.delete_first = False

        defaults = {}

        comparators = row.get("comparators", None)
        if comparators:
            name = f"{comparators}_comparators"
            if hasattr(DataSet, name):
                c = getattr(DataSet, name)
                comparators = c()
            else:
                comparators = DataSet.comparators_default()
        else:
            comparators = DataSet.comparators_default()

        defaults["comparators"] = comparators

        for col in self.defaults_cols:
            val = row[col]
            if val is None:
                val = ""
            defaults[col] = val

        if defaults["exclude_countries"] is None:
            defaults["exclude_countries"] = []

        if row["is_range"]:
            defaults["is_range"] = True
            defaults["data_set_name"] = row["data_set_name"]
            defaults["data_set_label"] = row["data_set_label"]
            if row.get("order"):
                defaults["order"] = row["order"]

        self.data_sets = {import_name: {"defaults": defaults, "col": row["data_col"]}}

    def get_dataframe(self):
        if self.file_type == "csv":
            df = pd.read_csv(self.data_file)
        elif self.file_type == "excel":
            kwargs = {}
            if self.sheet:
                kwargs["sheet_name"] = self.sheet
            if self.header_row:
                kwargs["header"] = int(self.header_row)
            df = pd.read_excel(self.data_file, **kwargs)
        else:
            self.stderr.write(f"Unknown file type: {self.file_type}")
            return None

        if type(self.get_cons_col()) != int:
            df = df.astype({self.get_cons_col(): "str"})
        return df

    def get_row_data(self, row, conf):
        value = super().get_row_data(row, conf)
        if self.multiply_percentage:
            value = value * 100

        return value

    def initial_delete(self, conf):
        AreaData.objects.filter(
            data_type__name=conf["name"], area__area_type__code=self.area_type
        ).delete()

    def handle(
        self,
        quiet=False,
        skip_new_areatype_conversion=False,
        import_name=None,
        *args,
        **options,
    ):

        initial_delete_done = False
        configs = self.get_configs(import_name)
        for conf in configs:
            self.setup(conf["name"], conf)

            if not initial_delete_done and self.delete_first:
                self.initial_delete(conf)
                initial_delete_done = True

            super().handle(quiet, skip_new_areatype_conversion, *args, **options)
