import csv
import json
import math
from collections import defaultdict
from operator import itemgetter

from django.http import HttpResponse, JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_control
from django.views.generic import TemplateView

from hub.mixins import FilterMixin, TitleMixin
from hub.models import DataSet, DataType, UserDataSets


class ExploreView(TitleMixin, TemplateView):
    page_title = "Explore"
    template_name = "hub/explore.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        context["user_is_member"] = not self.request.user.is_anonymous

        return context


class ExploreDatasetsJSON(TemplateView):
    def render_to_response(self, context, **response_kwargs):
        types = DataType.objects.exclude(data_set__is_range=True).select_related(
            "data_set",
            "area_type",
        )
        type_map = defaultdict(dict)
        for t in types:
            avg = t.average
            maximum = t.maximum
            minimum = t.minimum
            if t.is_number:
                if avg is not None:
                    # we never want this to be 0
                    avg = math.ceil(avg)
                if maximum is not None:
                    maximum = round(maximum)
                if minimum is not None:
                    minimum = round(minimum)
            stats = type_map[t.data_set.name].get("stats", {})

            if t.area_type is not None:
                code = t.area_type.code
                stats[code] = {
                    "max": maximum,
                    "min": minimum,
                    "avg": avg,
                    "defaultValue": avg,
                }

            type_map[t.data_set.name]["stats"] = stats

        is_non_member = self.request.user.is_anonymous

        datasets = []
        for d in DataSet.objects.filter(visible=True):
            try:
                options = list(map(itemgetter("title"), d.options))
            # catch bad options and ignore them for now
            except TypeError:
                continue

            scope = "private"
            if d.is_public:
                scope = "public"

            if scope == "private" and is_non_member:
                continue

            is_favourite = False
            if not is_non_member:
                is_favourite = UserDataSets.objects.filter(
                    data_set=d,
                    user=self.request.user,
                ).exists()

            ds = dict(
                scope=scope,
                name=d.name,
                title=d.label,
                description=d.description,
                category=d.category or "mp",
                source=d.source,
                source_label=d.source_label,
                is_favourite=is_favourite,
                is_filterable=d.is_filterable,
                is_shadable=d.is_shadable,
                is_featured=d.featured,
                comparators=dict(
                    map(itemgetter("field_lookup", "title"), d.comparators)
                ),
                options=options if len(options) > 0 else None,
                defaultValue=d.default_value,
                is_in=True if d.comparators[0]["field_lookup"] == "in" else False,
                is_range=d.is_range,
                data_type=d.data_type,
                areas_available=[t.code for t in d.areas_available.all()],
            )
            if d.release_date is not None:
                ds["release_date"] = d.release_date

            if (
                type_map.get(d.name, None) is not None
                and type_map[d.name]["stats"] is not None
                and type_map[d.name]["stats"]
            ):
                ds = {**ds, **type_map[d.name]}
            if d.is_range:
                ds["types"] = [
                    {
                        "name": dt.name,
                        "title": dt.label,
                        "area_type": dt.area_type.code if dt.area_type else None,
                    }
                    for dt in DataType.objects.filter(data_set=d).select_related(
                        "area_type"
                    )
                ]
            datasets.append(ds)

        datasets.append(
            {
                "scope": "public",
                "is_featured": False,
                "is_favourite": False,
                "is_filterable": False,
                "is_shadable": False,
                "category": "mp",
                "name": "mp_name",
                "title": "MP Name",
                "source_label": "Data from mySociety.",
                "areas_available": ["WMC", "WMC23"],
            }
        )

        datasets.append(
            {
                "scope": "public",
                "is_featured": False,
                "is_favourite": False,
                "is_filterable": False,
                "is_shadable": False,
                "category": "place",
                "name": "gss",
                "title": "Constituency GSS code",
                "source_label": "Data from mySociety.",
                "areas_available": ["WMC", "WMC23"],
            }
        )

        datasets.append(
            {
                "scope": "public",
                "is_featured": False,
                "is_favourite": False,
                "is_filterable": False,
                "is_shadable": False,
                "category": "place",
                "name": "gss",
                "title": "Council GSS code",
                "source_label": "Data from mySociety.",
                "areas_available": ["DIS", "STC"],
            }
        )

        datasets.append(
            {
                "scope": "public",
                "is_featured": False,
                "is_favourite": False,
                "is_filterable": False,
                "is_shadable": False,
                "category": "place",
                "name": "url",
                "title": "Constituency URL",
                "description": "A link to this constituency on the Local Intelligence Hub.",
                "source_label": "Data from mySociety.",
                "areas_available": ["WMC", "WMC23"],
            }
        )

        return JsonResponse(list(datasets), safe=False)


class ExploreGeometryJSON(FilterMixin, TemplateView):
    def render_to_response(self, context, **response_kwargs):
        geom = []
        areas = list(self.query().filter(geometry__isnull=False))
        shader = self.shader()
        colours = {}
        if shader is not None:
            colours = shader.colours_for_areas(areas)

        for area in areas:
            geometry = json.loads(area.geometry)
            props = geometry["properties"]
            if colours.get(area.gss, None) is not None:
                props["color"] = colours[area.gss]["colour"]
                props["opacity"] = colours[area.gss]["opacity"]
            else:
                props["color"] = "#ed6832"
                props["opacity"] = 0.7

            geometry["properties"] = props

            geom.append(geometry)

        return JsonResponse(
            {
                "type": "FeatureCollection",
                "features": geom,
                "properties": colours.get("properties", None),
            }
        )


@method_decorator(cache_control(max_age=604800), name="dispatch")  # cache for a week
class ExploreGeometryCachedJSON(ExploreGeometryJSON):
    """serve a cache-control version of the json area geometry

    This is here entirely to allow using a second path with the area type
    as a slug in the URL rather than as a query param and hence to make
    caching a bit clearer.
    """

    pass


class ExploreJSON(FilterMixin, TemplateView):
    def render_to_response(self, context, **response_kwargs):
        geom = []
        mp_name = self.area_type().code in ["WMC", "WMC23"]
        areas = self.data(as_dict=True, mp_name=mp_name)
        shader_areas = [a["area"] for a in areas.values()]
        shader = self.shader()
        colours = {}
        if shader is not None:
            colours = shader.colours_for_areas(shader_areas)

        for area in areas.values():
            area_obj = area["area"]
            geometry = {
                "properties": {
                    "PCON13CD": area_obj.gss,
                    "name": area_obj.name,
                    "type": area_obj.area_type.name,
                }
            }
            for k in area.keys():
                if k == "area":
                    continue
                geometry["properties"][k] = area[k]
            props = geometry["properties"]
            if colours.get(area_obj.gss, None) is not None:
                props["color"] = colours[area_obj.gss]["colour"]
                props["opacity"] = colours[area_obj.gss]["opacity"]
                # there is no data for the area to use in a shader, e.g country specific datasets
                if props.get("label", None) is not None:
                    props[colours[area_obj.gss]["label"]] = colours[area_obj.gss][
                        "value"
                    ]
            else:
                props["color"] = "#ed6832"
                props["opacity"] = 0.7

            geometry["properties"] = props

            geom.append(geometry)

        return JsonResponse(
            {
                "type": "FeatureCollection",
                "features": geom,
                "properties": colours.get("properties", None),
            }
        )


class ExploreCSV(FilterMixin, TemplateView):
    def render_to_response(self, context, **response_kwargs):
        response = HttpResponse(content_type="text/csv")
        writer = csv.writer(response)
        d = self.data()
        for row in d:  # self.data():
            writer.writerow(row)
        return response
