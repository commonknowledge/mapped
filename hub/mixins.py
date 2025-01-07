from collections import defaultdict
from functools import cache

from django.db.models import Q

from hub.models import Area, AreaData, AreaType, DataSet, DataType, Person, PersonData


class TitleMixin:
    site_title = "Local Intelligence Hub"

    def get_page_title(self):
        if self.page_title:
            return f"{self.page_title} | {self.site_title}"
        else:
            return f"{self.site_title}"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["page_title"] = self.get_page_title()
        return context


class FilterMixin:
    @cache
    def filters(self):
        is_non_member = self.request.user.is_anonymous

        filters = []
        area_type = self.area_type()
        for param, value in self.request.GET.items():
            # we don't filter on blank values so skip them
            if value == "" or value == "null":
                continue

            if "__" in param and param not in ["shader", "columns"]:
                name, comparator = param.split("__", 1)
            else:  # pragma: nocover
                continue

            if "__in" in param:
                value = value.split(",")

            try:
                dataset = DataSet.objects.get(
                    name=name, areas_available=area_type, visible=True
                )
                if is_non_member and not dataset.is_public:
                    continue
                filters.append(
                    {
                        "dataset": dataset,
                        "name": dataset.name,
                        "label": dataset.label,
                        "comparator": comparator,
                        "value": value,
                        "value_col": dataset.value_col,
                    }
                )
            except DataSet.DoesNotExist:  # pragma: nocover
                try:
                    datatype = DataType.objects.get(
                        name=name, area_type=area_type, data_set__visible=True
                    )
                    filters.append(
                        {
                            "dataset": datatype.data_set,
                            "name": datatype.name,
                            "label": datatype.label,
                            "comparator": comparator,
                            "value": value,
                            "value_col": datatype.value_col,
                        }
                    )
                except DataType.DoesNotExist:  # pragma: nocover
                    pass
        return filters

    @cache
    def columns(self, mp_name=False):
        is_non_member = self.request.user.is_anonymous

        columns = []
        col_names = self.request.GET.get("columns", "").split(",")

        if mp_name:
            col_names.append("mp_name")

        col_label_map = {"mp_name": "MP Name", "gss": "GSS", "url": "URL"}

        area_type = self.area_type()

        for col in col_names:
            if col in ["mp_name", "gss", "url"]:
                columns.append({"name": col, "label": col_label_map[col]})
                continue

            try:
                dataset = DataSet.objects.get(
                    name=col, areas_available=area_type, visible=True
                )
                if is_non_member and not dataset.is_public:
                    continue
                columns.append(
                    {
                        "dataset": dataset,
                        "name": dataset.name,
                        "value_col": dataset.value_col,
                        "label": dataset.label,
                        "header_label": dataset.label,
                    }
                )
            except DataSet.DoesNotExist:
                try:
                    datatype = DataType.objects.get(
                        name=col, area_type=area_type, data_set__visible=True
                    )
                    columns.append(
                        {
                            "dataset": datatype.data_set,
                            "name": datatype.name,
                            "value_col": datatype.value_col,
                            "label": datatype.label,
                            "header_label": f"{datatype.data_set.label} - {datatype.label}",
                        }
                    )
                except DataType.DoesNotExist:
                    pass

        return columns

    @cache
    def area_type(self):
        if self.kwargs.get("area_type", None) is not None:
            code = self.kwargs["area_type"]
        else:
            code = self.request.GET.get("area_type", "WMC")
        try:
            area_type = AreaType.objects.get(code=code)
        except AreaType.DoesNotExist:
            return None

        return area_type

    def query(self):
        query = Area.objects
        area_type = self.area_type()
        if area_type is not None:
            query = query.filter(area_type=area_type)

        for f in self.filters():
            query = f["dataset"].filter(
                query,
                name=f["name"],
                comparator=f["comparator"],
                value=f["value"],
            )

        query = query.distinct("pk")
        return query

    def format_value(self, type, value):
        if type == "percent":
            return f"{round(value, 1)}%"
        elif type == "float":
            return round(value, 1)

        return value

    def data(self, as_dict=False, mp_name=False):
        headers = ["Constituency Name"]
        if self.area_type().area_type != "Westminster Constituency":
            headers = ["Council Name"]
        headers += map(lambda f: f["dataset"].label, self.filters())
        headers += map(
            lambda f: f.get("header_label", f["label"]), self.columns(mp_name=mp_name)
        )

        data = [headers]

        area_data = defaultdict(lambda: defaultdict(list))

        """
        it is not really possible in django to do multiple joins to a table
        so it's easiest to construct this by doing one query per column we want
        to add, limited by the set of areas we've already filtered down to
        """
        area_ids = self.query().values_list("pk", flat=True)
        cols = self.filters().copy()
        cols.extend(self.columns(mp_name=mp_name))
        area_type = self.area_type()

        """
        shortcut if no filters/columns were requested: just return a single
        column of constituency names
        """
        if not cols or len(cols) == 0:
            areas = Area.objects
            if area_type is not None:
                areas = areas.filter(area_type=area_type)
            for area in areas.order_by("name"):
                data.append([area.name])
            if as_dict:
                for area in Area.objects.filter(id__in=area_ids):
                    area_data[area.name]["area"] = area
                return area_data
            return data

        """
        Mostly person data is area agnostic but the odd thing, e.g. majority is area
        type specific so only get data that is for the area type or does not have an
        area type.
        """
        person_area_type_filter = Q(data_type__area_type=area_type) | Q(
            data_type__area_type__isnull=True
        )
        """
        first for each column we want gather the data and store it against the
        area
        """
        for col in cols:
            if col["name"] == "mp_name":
                has_mp = []
                for row in Person.objects.filter(
                    personarea__person_type="MP",
                    areas__in=area_ids,
                    personarea__end_date__isnull=True,
                ):
                    has_mp.extend([a.id for a in row.areas.filter(area_type=area_type)])
                    for area in row.areas.filter(area_type=area_type):
                        area_data[area.name]["MP Name"].append(row.name)

                if len(has_mp) < len(area_ids):
                    missing_areas = set(area_ids).difference(has_mp)
                    for row in Area.objects.filter(id__in=missing_areas):
                        area_data[row.name]["MP Name"].append("No current MP")

                continue
            elif col["name"] == "gss":
                for row in self.query():
                    area_data[row.name]["GSS"].append(row.gss)
                continue
            elif col["name"] == "url":
                for row in self.query():
                    area_data[row.name]["URL"].append(
                        f"{self.request.build_absolute_uri(row.get_absolute_url())}"
                    )
                continue

            dataset = col["dataset"]
            if dataset.table == "areadata":
                for row in (
                    AreaData.objects.filter(
                        area_id__in=area_ids, data_type__name=col["name"]
                    )
                    .order_by(col["value_col"])
                    .select_related("area", "data_type")
                ):
                    value = row.value()
                    if as_dict:
                        value = self.format_value(row.data_type.data_type, row.value())
                    area_data[row.area.name][col["label"]].append(str(value))
            else:
                filter = {
                    "person__personarea__area_id__in": area_ids,
                    "data_type__name": col["name"],
                }
                if dataset.person_type is not None:
                    filter["person__personarea__person_type"] = "MP"
                pd = PersonData.objects.filter(**filter)
                pd = pd.filter(person_area_type_filter)

                for row in pd.order_by(col["value_col"]).select_related("data_type"):
                    value = row.value()
                    if as_dict:
                        value = self.format_value(row.data_type.data_type, row.value())
                    for area in row.person.areas.filter(area_type=area_type):
                        area_data[area.name][col["label"]].append(str(value))

        if as_dict:
            for area in Area.objects.filter(id__in=area_ids):
                area_data[area.name]["area"] = area
            return area_data

        """
        and then go through the data for each area and reconstitute it into an array
        """
        for area, values in area_data.items():
            row = [area]
            for col in cols:
                row.append("; ".join(values[col["label"]]))
            data.append(row)

        return data

    def shader(self):
        name = self.request.GET.get("shader")
        area_type = self.area_type()
        try:
            return DataSet.objects.get(
                name=name, areas_available=area_type, visible=True
            )
        except DataSet.DoesNotExist:
            try:
                return DataType.objects.get(
                    name=name, area_type=area_type, data_set__visible=True
                )
            except DataType.DoesNotExist:
                return None
