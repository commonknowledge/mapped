import logging

from django.core.exceptions import PermissionDenied
from django.db.models import CharField, Count, F, OuterRef, Subquery
from django.db.models import Value as V
from django.db.models.functions import Cast, Concat
from django.db.models.query import QuerySet
from django.http import JsonResponse
from django.urls import reverse
from django.views.generic import DetailView

from benedict import benedict
from gqlauth.core.middlewares import UserOrError, get_user_or_error
from vectortiles import VectorLayer
from vectortiles.views import MVTView, TileJSONView
from wagtail.models import Site

from hub.models import Area, ExternalDataSource, GenericData, HubHomepage

logger = logging.getLogger(__name__)


class GenericDataVectorLayer(VectorLayer):
    model = GenericData
    geom_field = "point"
    min_zoom = 1

    id = "generic_data"
    vector_tile_layer_name = id
    external_data_source_id: str
    filter: dict = {}

    def __init__(self, *args, **kwargs):
        self.external_data_source_id = kwargs.pop("external_data_source_id", None)
        self.source: ExternalDataSource = ExternalDataSource.objects.get(
            id=self.external_data_source_id
        ).get_real_instance()
        if self.external_data_source_id is None:
            raise ValueError("external_data_source is required")
        self.permissions = kwargs.pop("permissions", {})
        self.layer_options = benedict(kwargs.pop("layer_options", {}))
        super().__init__(*args, **kwargs)

    def get_queryset(self) -> QuerySet:
        return self.source.get_import_data().filter(**self.filter)

    def get_tile_fields(self):
        fields = []
        if self.layer_options.get("popup"):
            fields.append("id")
        if self.layer_options.get("cluster"):
            fields.append("cluster")
        if self.layer_options.get("fields"):
            fields.extend(self.layer_options.get("fields"))
        if self.source.data_type == ExternalDataSource.DataSourceType.GROUP:
            fields.extend(("id", "title", "public_url", "social_url"))
        if self.source.data_type == ExternalDataSource.DataSourceType.EVENT:
            fields.extend((
              "id",
              "start_time__ispast",
              "start_time__isfuture",
            ))
        if self.permissions.get("can_display_details", False):
            fields.append("json",)
        final = tuple(set(fields))
        return final


class ExternalDataSourceTileView(MVTView, DetailView):
    model = ExternalDataSource
    layer_classes = [GenericDataVectorLayer]

    def get_id(self):
        return self.kwargs.get(self.pk_url_kwarg)

    def get_hostname(self):
        return self.kwargs.get("hostname", None)

    def get_layer_class_kwargs(self, *args, **kwargs):
        external_data_source_id = self.get_id()
        user_or_error: UserOrError = get_user_or_error(self.request)
        user = user_or_error.user if user_or_error.user else None
        permissions = ExternalDataSource.user_permissions(user, self.get_id())
        if not permissions.get("can_display_points", False):
            raise PermissionDenied(
                "You don't have permission to view location data for this data source."
            )
        hostname = self.get_hostname()
        return {
            "external_data_source_id": external_data_source_id,
            "permissions": dict(permissions),
            "layer_options": (
                dict(self.get_site_layer_kwargs(hostname, external_data_source_id))
                if hostname
                else {}
            ),
        }

    def get_site_layer_kwargs(self, hostname: str, external_data_source_id: str):
        """
        Obey hub-level layer filtering logic.
        """
        site = Site.objects.filter(hostname=hostname).first()
        logger.debug(f"Querying filter for {hostname}: {external_data_source_id}")
        if site is not None:
            hub = site.root_page.specific
            logger.debug(f"Hub: {hub}")
            if isinstance(hub, HubHomepage):
                layers = hub.get_layers()
                logger.debug(f"filter in layers: {layers}")
                if isinstance(layers, list):
                    for layer in layers:
                        if layer.get("source") == external_data_source_id:
                            return layer
        return {}


class ExternalDataSourcePointTileJSONView(TileJSONView, DetailView):
    model = ExternalDataSource
    layer_classes = [GenericDataVectorLayer]

    def get_name(self):
        return self.get_object().name

    def get_attribution(self):
        return self.get_object().organisation.name

    def get_description(self):
        return f"{self.get_name()} is a {self.get_object().crm_type} source."

    def setup(self, *args, **kwargs):
        super().setup(*args, **kwargs)

    def get_id(self):
        return self.kwargs.get(self.pk_url_kwarg)

    def get_hostname(self):
        return self.kwargs.get("hostname", None)

    def get_object(self):
        return ExternalDataSource.objects.get(pk=self.get_id())

    def get_min_zoom(self, *args, **kwargs):
        return 1

    def get_max_zoom(self, *args, **kwargs):
        return 30

    def get_tile_url(self):
        """Base MVTView Url used to generates urls in TileJSON in a.tiles.xxxx/{z}/{x}/{y} format"""
        id = self.get_id()
        hostname = self.get_hostname()
        if hostname:
            return str(
                reverse(
                    "external_data_source_point_tile",
                    args=(hostname, id, 0, 0, 0),
                )
            ).replace("/0/0/0", "/{z}/{x}/{y}")
        else:
            return str(
                reverse(
                    "external_data_source_point_tile",
                    args=(id, 0, 0, 0),
                )
            ).replace("/0/0/0", "/{z}/{x}/{y}")

    def get_layer_class_kwargs(self, *args, **kwargs):
        return {"external_data_source_id": self.get_id()}

    # def get_layers(self):
    #     return [GenericDataVectorLayer(external_data_source=self.get_object())]


class ExternalDataSourcePointGeoJSONView(DetailView):
    def get_id(self):
        return self.kwargs.get(self.pk_url_kwarg)

    def get_object(self) -> ExternalDataSource:
        user_or_error: UserOrError = get_user_or_error(self.request)
        user = user_or_error.user if user_or_error.user else None
        permissions = ExternalDataSource.user_permissions(user, self.get_id())
        if not permissions.get("can_display_points", False):
            raise PermissionDenied(
                "You don't have permission to view location data for this data source."
            )
        return ExternalDataSource.objects.get(pk=self.get_id()).get_real_instance()

    def get(self, *args, **kwargs):
        qs = self.get_object().get_import_data().filter(can_display_point=True)
        area = Area.objects.annotate(gss_str=Concat(V('"'), "gss", V('"'))).filter(
            gss_str=Cast(
                OuterRef("postcode_data__codes__parliamentary_constituency_2024"),
                output_field=CharField(),
            ),
            area_type__code="WMC23",
        )
        qs = (
            qs.annotate(
                gss=F("postcode_data__codes__parliamentary_constituency_2024"),
            )
            .values("gss")
            .annotate(count=Count("gss"))
            .annotate(point=Subquery(area.values("point")[:1]))
        )
        return JsonResponse(
            {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [area["point"].x, area["point"].y],
                        },
                        "properties": {"count": area["count"]},
                    }
                    for area in qs
                    if area["point"]
                ],
            }
        )
