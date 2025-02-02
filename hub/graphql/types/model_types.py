import logging
from datetime import datetime
from enum import Enum
from typing import List, Optional, TypedDict, Union

from django.contrib.gis.db.models import Union as GisUnion
from django.contrib.gis.geos import Polygon
from django.db.models import F, Q
from django.db.models.fields import FloatField
from django.db.models.functions import Cast
from django.http import HttpRequest
from django.contrib.auth.models import AbstractBaseUser

from hub.graphql.permissions import check_user_can_view_source
from hub.graphql.types import stats as stats
import numexpr as ne
import numpy as np
import pandas as pd
import procrastinate.contrib.django.models
import strawberry
import strawberry_django
import strawberry_django_dataloaders.factories
import strawberry_django_dataloaders.fields
from benedict import benedict
from strawberry import auto
from strawberry.scalars import JSON
from strawberry.types.info import Info
from strawberry_django.auth.utils import get_current_user
from utils.statistics import attempt_interpret_series_as_float, attempt_interpret_series_as_percentage, check_percentage
from wagtail.models import Site

from hub import models
from hub.enrichment.sources import builtin_mapping_sources
from hub.enrichment.sources.electoral_commission_postcode_lookup import (
    electoral_commision_address_lookup,
    electoral_commision_postcode_lookup,
)
from hub.graphql.context import HubDataLoaderContext
from hub.graphql.dataloaders import (
    FieldDataLoaderFactory,
    FieldReturningListDataLoaderFactory,
    ReverseFKWithFiltersDataLoaderFactory,
    filterable_dataloader_resolver,
)
from hub.graphql.types.electoral_commission import ElectoralCommissionPostcodeLookup
from hub.graphql.types.geojson import MultiPolygonFeature, PointFeature
from hub.graphql.types.postcodes import PostcodesIOResult
from hub.graphql.utils import attr_field, dict_key_field, fn_field
from hub.management.commands.import_mps import party_shades
from utils.geo_reference import (
    AnalyticalAreaType,
    area_to_postcode_io_filter,
    lih_to_postcodes_io_key_map,
)
from utils.postcode import get_postcode_data_for_gss

pd.core.computation.ops.MATHOPS = (*pd.core.computation.ops.MATHOPS, "where")

logger = logging.getLogger(__name__)
pd.core.computation.ops.MATHOPS = (*pd.core.computation.ops.MATHOPS, "where")


# Ideally we'd just import this from the library (procrastinate.jobs.Status) but
# strawberry doesn't like subclassed Enums for some reason.
@strawberry.enum
class ProcrastinateJobStatus(Enum):
    todo = "todo"  #: The job is waiting in a queue
    doing = "doing"  #: A worker is running the job
    succeeded = "succeeded"  #: The job ended successfully
    failed = "failed"  #: The job ended with an error
    cancelled = "cancelled"  #: The job was cancelled


@strawberry_django.filters.filter(
    procrastinate.contrib.django.models.ProcrastinateJob, lookups=True
)
class QueueFilter:
    id: auto
    status: ProcrastinateJobStatus
    queue_name: auto
    task_name: auto
    scheduled_at: auto
    attempts: auto
    external_data_source_id: Optional[str]

    def filter_external_data_source_id(self, queryset, info, value):
        return queryset.filter(args__external_data_source_id=value)


@strawberry_django.type(
    procrastinate.contrib.django.models.ProcrastinateJob,
    filters=QueueFilter,
    pagination=True,
)
class QueueJob:
    id: auto
    queue_name: auto
    task_name: auto
    lock: auto
    args: auto
    status: ProcrastinateJobStatus
    scheduled_at: auto
    attempts: auto
    queueing_lock: auto
    events: List["QueueEvent"] = (
        strawberry_django_dataloaders.fields.auto_dataloader_field()
    )

    @strawberry_django.field
    async def last_event_at(self, info) -> datetime:
        loader = FieldReturningListDataLoaderFactory.get_loader_class(
            "procrastinate.ProcrastinateEvent", field="job_id"
        )
        events = await loader(context=info.context).load(self.id)
        return max([event.at for event in events])

    @classmethod
    def get_queryset(cls, queryset, info, **kwargs):
        # Only list data sources that the user has access to
        user = get_current_user(info)
        my_external_data_sources = models.ExternalDataSource.objects.filter(
            organisation__members__user=user.id
        )
        return queryset.filter(
            args__external_data_source_id__in=[
                str(external_data_source.id)
                for external_data_source in my_external_data_sources
            ]
        )


@strawberry_django.type(procrastinate.contrib.django.models.ProcrastinateEvent)
class QueueEvent:
    id: auto
    job: QueueJob = strawberry_django_dataloaders.fields.auto_dataloader_field()
    type: auto
    at: auto


@strawberry_django.type(models.User)
class User:
    email: auto
    user_properties: "UserProperties"


@strawberry_django.type(models.UserProperties)
class UserProperties:
    user_id: str
    user: User
    full_name: auto


@strawberry_django.filters.filter(models.Organisation)
class OrganisationFilters:
    id: auto
    slug: auto


@strawberry_django.type(models.Organisation, filters=OrganisationFilters)
class PublicOrganisation:
    id: auto
    name: auto
    slug: auto


@strawberry_django.type(models.Organisation, filters=OrganisationFilters)
class Organisation(PublicOrganisation):
    members: List["Membership"]
    external_data_sources: List["ExternalDataSource"]

    @strawberry_django.field
    def sharing_permissions_from_other_orgs(
        self, info: Info
    ) -> List["SharingPermission"]:
        # Sources shared to this org via SharingPermission
        results = models.SharingPermission.objects.filter(organisation=self)
        return results

    @classmethod
    def get_queryset(cls, queryset, info, **kwargs):
        user = get_current_user(info)
        return queryset.filter(members__user=user.id)


# Membership
@strawberry_django.type(models.Membership)
class Membership:
    id: auto
    user_id: str
    user: User
    organisation_id: str
    organisation: Organisation
    role: auto

    @classmethod
    def get_queryset(cls, queryset, info, **kwargs):
        user = get_current_user(info)
        # Allow querying memberships of your orgs
        return queryset.filter(organisation__members__user=user.id)


# ExternalDataSource


@strawberry.type
class FieldDefinition:
    value: str = dict_key_field()
    label: Optional[str] = dict_key_field()
    description: Optional[str] = dict_key_field()
    external_id: Optional[str] = dict_key_field()
    editable: bool = dict_key_field(default=True)


@strawberry_django.filter(models.ExternalDataSource)
class ExternalDataSourceFilter:
    data_type: auto
    geography_column_type: auto


@strawberry.type
class DataSetOption:
    title: str = dict_key_field()
    shader: str = dict_key_field()


@strawberry_django.type(models.DataSet)
class DataSet:
    id: auto
    name: auto
    description: auto
    label: auto
    data_type: "DataType" = strawberry_django_dataloaders.fields.auto_dataloader_field()
    last_update: auto
    source_label: auto
    source: auto
    source_type: auto
    options: List[DataSetOption]
    data_url: auto
    release_date: auto
    is_upload: auto
    is_range: auto
    featured: auto
    order: auto
    category: auto
    subcategory: auto
    table: auto
    # comparators: auto
    # options: auto
    default_value: auto
    is_filterable: auto
    is_shadable: auto
    is_public: auto
    fill_blanks: auto
    # exclude_countries: auto
    unit_type: auto
    unit_distribution: auto
    areas_available: auto
    external_data_source: "ExternalDataSource" = (
        strawberry_django_dataloaders.fields.auto_dataloader_field()
    )


@strawberry_django.filter(models.DataType)
class DataTypeFilters:
    id: auto
    data_set: auto
    name: auto


@strawberry_django.type(models.DataType, filters=DataTypeFilters)
class DataType:
    id: auto
    data_set: "DataSet" = strawberry_django_dataloaders.fields.auto_dataloader_field()
    name: auto
    data_type: auto
    last_update: auto
    average: auto
    maximum: auto
    minimum: auto
    label: auto
    description: auto
    order: auto
    area_type: auto
    auto_converted: auto
    auto_converted_text: auto


@strawberry_django.type(models.AreaType)
class AreaType:
    name: auto
    code: auto
    area_type: auto
    description: auto

    data_types: List[DataType] = (
        strawberry_django_dataloaders.fields.auto_dataloader_field()
    )


@strawberry_django.filter(models.CommonData, lookups=True)
class CommonDataFilter:
    data_type: DataTypeFilters
    int: auto
    date: auto
    data: auto
    float: auto


@strawberry_django.interface(models.CommonData)
class CommonData:
    data_type: "DataType" = strawberry_django_dataloaders.fields.auto_dataloader_field()
    data: auto
    date: auto
    float: auto
    int: auto
    json: Optional[JSON]

    @strawberry_django.field
    def shade(self, info: Info) -> Optional[str]:
        # data -> dataType -> dataSet -> options -> shader for data
        # loader = ShaderLoaderFactory.get_loader_class(models.DataSet, field="name")
        shader_options = self.data_type.data_set.options
        if shader_options:
            return next(
                (
                    option["shader"]
                    for option in shader_options
                    if option["title"] == self.data
                ),
                None,
            )


@strawberry_django.filter(models.AreaData, lookups=True)
class AreaDataFilter:
    id: auto
    data_type: DataTypeFilters


@strawberry_django.input(models.CommonData, partial=True)
class CommonDataLoaderFilter:
    data_type__name: str


@strawberry_django.type(models.AreaData, filters=CommonDataFilter)
class AreaData(CommonData):
    id: auto
    area: "Area" = strawberry_django_dataloaders.fields.auto_dataloader_field()


@strawberry_django.filter(models.PersonData, lookups=True)
class PersonDataFilter:
    data_type: DataTypeFilters
    int: auto
    date: auto
    data: auto
    float: auto
    person: auto


@strawberry_django.input(models.PersonData, partial=True)
class PersonDataloaderFilter:
    data_type__name: str


@strawberry_django.type(models.PersonData, filters=PersonDataFilter)
class PersonData(CommonData):
    id: auto
    person: "Person" = strawberry_django_dataloaders.fields.auto_dataloader_field()


@strawberry_django.input(models.Person, partial=True)
class PersonFilter:
    person_type: str


@strawberry_django.type(models.Person)
class Person:
    id: auto
    person_type: auto
    external_id: str
    id_type: auto
    name: auto
    area: "Area" = strawberry_django_dataloaders.fields.auto_dataloader_field()
    photo: auto
    start_date: auto
    end_date: auto
    person_data: List[PersonData] = filterable_dataloader_resolver(
        filter_type=Optional[CommonDataLoaderFilter],
        field_name="persondata",
        # prefetch=["data_type", "data_type__data_set"],
    )
    person_datum: Optional[PersonData] = filterable_dataloader_resolver(
        filter_type=Optional[CommonDataLoaderFilter],
        field_name="persondata",
        single=True,
        # prefetch=["data_type", "data_type__data_set"],
    )


@strawberry_django.filter(models.Area, lookups=True)
class AreaFilter:
    id: auto
    gss: auto
    name: auto
    area_type: auto


@strawberry.type
class PartyResult:
    party: str
    votes: int

    @strawberry_django.field
    def shade(self, info: Info) -> str:
        return party_shades.get(self.party, "#DCDCDC")


@strawberry.type
class ConstituencyElectionResult:
    date: str
    stats: "ConstituencyElectionStats"
    results: List[PartyResult]


@strawberry.type
class ConstituencyElectionStats:
    json: strawberry.Private[dict]

    date: str
    result: str
    majority: int
    electorate: int
    county_name: str
    first_party: str
    region_name: str
    valid_votes: int
    country_name: str
    second_party: str
    invalid_votes: int
    member_gender: str
    ons_region_id: str
    member_surname: str
    declaration_time: str
    constituency_name: str
    constituency_type: str
    member_first_name: str

    @strawberry_django.field
    def first_party_result(self, info: Info) -> PartyResult:
        return PartyResult(
            party=self.first_party,
            votes=next(
                (
                    party["votes"]
                    for party in self.json["results"]
                    if party["party"] == self.first_party
                ),
                0,
            ),
        )

    @strawberry_django.field
    def second_party_result(self, info: Info) -> PartyResult:
        return PartyResult(
            party=self.second_party,
            votes=next(
                (
                    party["votes"]
                    for party in self.json["results"]
                    if party["party"] == self.second_party
                ),
                0,
            ),
        )


@strawberry_django.type(models.Area, filters=AreaFilter)
class Area:
    id: auto
    gss: auto
    mapit_id: str
    gss: auto
    name: auto
    area_type: "AreaType" = strawberry_django_dataloaders.fields.auto_dataloader_field()
    geometry: auto
    overlaps: auto
    # So that we can pass in properties to the geojson Feature objects
    extra_geojson_properties: strawberry.Private[object]
    people: List[Person] = filterable_dataloader_resolver(
        filter_type=Optional[PersonFilter],
        field_name="person",
        # prefetch=[
        #     "persondata_set",
        #     "persondata_set__data_type",
        #     "persondata_set__data_type__data_set",
        # ],
    )
    person: Optional[Person] = filterable_dataloader_resolver(
        filter_type=Optional[PersonFilter],
        field_name="person",
        single=True,
        # prefetch=[
        #     "persondata_set",
        #     "persondata_set__data_type",
        #     "persondata_set__data_type__data_set",
        # ],
    )
    data: List[AreaData] = filterable_dataloader_resolver(
        filter_type=Optional[CommonDataLoaderFilter]
    )
    datum: Optional[AreaData] = filterable_dataloader_resolver(
        filter_type=Optional[CommonDataLoaderFilter], single=True, field_name="data"
    )
    fit_bounds: Optional[JSON] = fn_field()

    @strawberry_django.field
    async def last_election(self, info: Info) -> Optional[ConstituencyElectionResult]:
        # return self.data.get(data_type__name="last_election")
        # # Create a dataloader for this
        loader = ReverseFKWithFiltersDataLoaderFactory.get_loader_class(
            "hub.AreaData",
            filters=CommonDataLoaderFilter(data_type__name="last_election"),
            reverse_path="area_id",
        )
        res = await loader(context=info.context).load(self.id)
        if res is None or len(res) == 0 or res[0] is None or res[0].json is None:
            return None
        result = res[0].json
        cer = ConstituencyElectionResult(
            date=result["date"],
            stats=ConstituencyElectionStats(**result["stats"], json=result),
            results=[
                PartyResult(party=party["party"], votes=party["votes"])
                for party in result["results"]
            ],
        )
        return cer

    @strawberry_django.field
    def polygon(
        self, info: Info, with_parent_data: bool = False
    ) -> Optional[MultiPolygonFeature]:
        props = {
            "name": self.name,
            "gss": self.gss,
            "id": self.gss,
            "area_type": self.area_type,
        }
        if with_parent_data and hasattr(self, "extra_geojson_properties"):
            props["extra_geojson_properties"] = self.extra_geojson_properties

        return MultiPolygonFeature.from_geodjango(
            multipolygon=self.polygon, id=self.gss, properties=props
        )

    @strawberry_django.field
    def point(
        self, info: Info, with_parent_data: bool = False
    ) -> Optional[PointFeature]:
        props = {"name": self.name, "gss": self.gss}
        if with_parent_data and hasattr(self, "extra_geojson_properties"):
            props["extra_geojson_properties"] = self.extra_geojson_properties

        return PointFeature.from_geodjango(
            point=self.point, id=self.gss, properties=props
        )

    @strawberry_django.field
    def generic_data_for_hub(self, hostname: str) -> List["GenericData"]:
        site = Site.objects.get(hostname=hostname)
        hub = site.root_page.specific
        data = []
        for layer in hub.layers:
            data.extend(
                models.GenericData.objects.filter(
                    data_type__data_set__external_data_source=layer.get("source"),
                    data_type__data_set__external_data_source__can_display_points_publicly=True,
                    data_type__data_set__external_data_source__can_display_details_publicly=True,
                    point__within=self.polygon,
                    **layer.get("filter", {}),
                )
            )
        return data

    @strawberry_django.field
    async def sample_postcode(
        self, info: Info[HubDataLoaderContext]
    ) -> Optional[PostcodesIOResult]:
        return await get_postcode_data_for_gss(self.gss)
        # return await info.context.area_coordinate_loader.load(self.point)


@strawberry.type
class GroupedDataCount:
    label: Optional[str]
    # Provide filter if gss code is not unique (e.g. WMC and WMC23 constituencies)
    area_type_filter: Optional[stats.AreaTypeFilter] = None
    gss: Optional[str]
    count: float
    columns: Optional[List[str]] = None
    row: Optional[JSON] = None
    formatted_count: Optional[str]
    area_data: Optional[strawberry.Private[Area]] = None
    is_percentage: bool = False

    @strawberry_django.field
    async def gss_area(self, info: Info) -> Optional[Area]:
        if self.area_data is not None:
            return self.area_data
        filters = self.area_type_filter.query_filter if self.area_type_filter else {}
        loader = FieldDataLoaderFactory.get_loader_class(
            models.Area, field="gss", filters=filters
        )
        return await loader(context=info.context).load(self.gss)


@strawberry_django.type(models.GenericData, filters=CommonDataFilter)
class GroupedData:
    label: Optional[str]
    # Provide filter if gss code is not unique (e.g. WMC and WMC23 constituencies)
    area_type_filter: Optional[stats.AreaTypeFilter] = None
    gss: Optional[str]
    area_data: Optional[strawberry.Private[Area]] = None
    imported_data: Optional[JSON] = None

    @strawberry_django.field
    async def gss_area(self, info: Info) -> Optional[Area]:
        if self.area_data is not None:
            return self.area_data
        filters = self.area_type_filter.query_filter if self.area_type_filter else {}
        loader = FieldDataLoaderFactory.get_loader_class(
            models.Area, field="gss", filters=filters
        )
        return await loader(context=info.context).load(self.gss)


class GroupedDataCountForSource(GroupedDataCount):
    source_id: Optional[str] = dict_key_field()

    @strawberry_django.field
    async def source(self: str, info: Info) -> Optional["ExternalDataSource"]:
        source_id = self.get("source_id", None)
        if source_id is None:
            return None
        loader = strawberry_django_dataloaders.factories.PKDataLoaderFactory.get_loader_class(
            models.ExternalDataSource,
        )
        data = await loader(context=info.context).load(source_id)
        return data


@strawberry.type
class GroupedDataCountWithBreakdown(GroupedDataCount):
    sources: List[GroupedDataCountForSource] = dict_key_field()


@strawberry_django.type(models.GenericData, filters=CommonDataFilter)
class GenericData(CommonData):
    id: auto
    data: auto
    last_update: auto
    name: auto = attr_field()
    first_name: auto
    last_name: auto
    full_name: auto
    email: auto
    phone: auto
    address: auto
    title: auto
    start_time: auto
    end_time: auto
    public_url: auto
    description: auto
    image: auto
    area: Optional[Area]

    postcode: auto
    remote_url: str = fn_field()

    @strawberry_django.field
    def postcode_data(self) -> Optional[PostcodesIOResult]:
        return benedict(self.postcode_data)

    @strawberry_django.field
    def areas(self, info: Info) -> Optional[Area]:
        if self.point is None:
            return None

        # TODO: data loader for this
        # Convert to list to make deeper async resolvers work
        return list(models.Area.objects.filter(polygon__contains=self.point))

    @strawberry_django.field
    def area_from_point(self, area_type: str, info: Info) -> Optional[Area]:
        if self.point is None:
            return None

        # TODO: data loader for this
        return models.Area.objects.filter(
            polygon__contains=self.point, area_type__code=area_type
        ).first()


@strawberry.type
class MapReportMemberFeature(PointFeature):
    # Optional, because of sharing options
    id: Optional[str]
    properties: Optional[GenericData]

    # TODO: move this somewhere more rational
    @strawberry_django.field
    async def electoral_commission(
        self, address_slug: Optional[str] = None
    ) -> Optional[ElectoralCommissionPostcodeLookup]:
        if address_slug:
            return await electoral_commision_address_lookup(address_slug)
        if self.properties and self.properties.postcode:
            return await electoral_commision_postcode_lookup(self.properties.postcode)
        return None


@strawberry.interface
class Analytics:
    imported_data_count: int = fn_field()

    @strawberry_django.field
    def imported_data_count_by_area(
        self,
        analytical_area_type: AnalyticalAreaType,
        layer_ids: Optional[List[str]] = [],
    ) -> List[GroupedDataCount]:
        data = self.imported_data_count_by_area(
            postcode_io_key=analytical_area_type.value,
            layer_ids=layer_ids,
        )
        area_type_filter = stats.postcodeIOKeyAreaTypeLookup[analytical_area_type]
        return [
            GroupedDataCount(**datum, area_type_filter=area_type_filter)
            for datum in data
        ]

    @strawberry_django.field
    def imported_data_count_of_areas(
        self,
        analytical_area_type: AnalyticalAreaType,
        layer_ids: Optional[List[str]] = [],
    ) -> int:
        data = self.imported_data_count_by_area(
            postcode_io_key=analytical_area_type.value,
            layer_ids=layer_ids,
        )
        return max(len([d for d in data if d.get("count", 0) > 0]) or 0, 0)

    @strawberry_django.field
    def imported_data_count_unlocated(self) -> int:
        return self.imported_data_count_unlocated()

    @strawberry_django.field
    def imported_data_count_located(self) -> int:
        return self.imported_data_count_located()

    @strawberry_django.field
    def imported_data_geocoding_rate(self) -> float:
        return self.imported_data_geocoding_rate()

    @strawberry_django.field
    def imported_data_by_area(
        self,
        analytical_area_type: AnalyticalAreaType,
        layer_ids: Optional[List[str]] = [],
    ) -> List[GroupedData]:
        data = self.imported_data_by_area(
            postcode_io_key=analytical_area_type.value,
            layer_ids=layer_ids,
        )
        area_type_filter = stats.postcodeIOKeyAreaTypeLookup[analytical_area_type]
        return [
            GroupedData(**datum, area_type_filter=area_type_filter) for datum in data
        ]

    @strawberry_django.field
    def imported_data_count_for_area(
        self, info: Info, analytical_area_type: AnalyticalAreaType, gss: str
    ) -> Optional[GroupedDataCount]:
        res = self.imported_data_count_by_area(
            postcode_io_key=analytical_area_type.value, gss=gss, layer_ids=None
        )
        if len(res) == 0:
            return None
        area_type_filter = postcodeIOKeyAreaTypeLookup[analytical_area_type]
        return GroupedDataCount(**res[0], area_type_filter=area_type_filter)


@strawberry.type
class BatchJobProgress:
    status: ProcrastinateJobStatus
    id: strawberry.scalars.ID
    started_at: datetime
    has_forecast: bool = True
    total: Optional[int] = None
    succeeded: Optional[int] = None
    doing: Optional[int] = None
    failed: Optional[int] = None
    estimated_seconds_remaining: Optional[float] = None
    estimated_finish_time: Optional[datetime] = None
    actual_finish_time: Optional[datetime] = None
    seconds_per_record: Optional[float] = None
    done: Optional[int] = None
    remaining: Optional[int] = None
    number_of_jobs_ahead_in_queue: Optional[int] = None
    send_email: bool = False

    @strawberry_django.field
    def in_queue(self, info: Info) -> bool:
        if (
            self.status == ProcrastinateJobStatus.doing.value
            or self.status == ProcrastinateJobStatus.todo.value
        ):
            return True
        else:
            return False


@strawberry.enum
class CrmType(Enum):
    airtable = "airtable"
    mailchimp = "mailchimp"
    actionnetwork = "actionnetwork"
    tickettailor = "tickettailor"
    editablegooglesheets = "editablegooglesheets"
    uploadedcsv = "uploadedcsv"


@strawberry_django.type(models.ExternalDataSource, filters=ExternalDataSourceFilter)
class BaseDataSource(Analytics):
    id: auto
    name: auto
    crm_type: CrmType = attr_field()
    data_type: auto
    description: auto
    created_at: auto
    last_update: auto
    geography_column: auto
    geography_column_type: auto
    geocoding_config: JSON
    postcode_field: auto
    first_name_field: auto
    last_name_field: auto
    full_name_field: auto
    email_field: auto
    phone_field: auto
    address_field: auto
    title_field: auto
    description_field: auto
    image_field: auto
    start_time_field: auto
    end_time_field: auto
    public_url_field: auto
    social_url_field: auto
    can_display_point_field: auto
    record_url_template: Optional[str] = fn_field()
    organisation_id: str = strawberry_django.field(
        resolver=lambda self: self.organisation_id
    )
    predefined_column_names: bool = attr_field()
    has_webhooks: bool = attr_field()
    automated_webhooks: bool = attr_field()
    introspect_fields: bool = attr_field()
    allow_updates: bool = attr_field()
    default_data_type: Optional[str] = attr_field()
    defaults: JSON = attr_field()
    auto_update_enabled: auto
    auto_import_enabled: auto
    remote_name: Optional[str] = fn_field()
    remote_url: Optional[str] = fn_field()
    healthcheck: bool = fn_field()

    field_definitions: Optional[List[FieldDefinition]] = strawberry_django.field(
        resolver=lambda self: self.field_definitions()
    )

    @strawberry_django.field
    def id_field(self) -> Optional[str]:
        if hasattr(self, "id_field"):
            return self.id_field

    @strawberry_django.field
    def uses_valid_geocoding_config(self) -> bool:
        return self.uses_valid_geocoding_config()

    @strawberry_django.field
    def is_import_scheduled(self: models.ExternalDataSource, info: Info) -> bool:
        job = self.get_scheduled_import_job()
        return job is not None

    @strawberry_django.field
    def import_progress(
        self: models.ExternalDataSource, info: Info
    ) -> Optional[BatchJobProgress]:
        user = info.context.request.user
        job = self.get_latest_import_job()
        if job is None:
            return None
        progress = self.get_scheduled_batch_job_progress(job, user=user)
        if progress is None:
            return None
        return BatchJobProgress(**progress)

    @strawberry_django.field
    def is_update_scheduled(self: models.ExternalDataSource, info: Info) -> bool:
        job = self.get_scheduled_update_job()
        return job is not None

    @strawberry_django.field
    def update_progress(
        self: models.ExternalDataSource, info: Info
    ) -> Optional[BatchJobProgress]:
        user = info.context.request.user
        job = self.get_latest_update_job()
        if job is None:
            return None
        progress = self.get_scheduled_batch_job_progress(job, user=user)
        if progress is None:
            return None
        return BatchJobProgress(**progress)


@strawberry_django.field
def imported_data_geojson_point(
    info: Info, generic_data_id: str
) -> MapReportMemberFeature | None:
    datum = models.GenericData.objects.prefetch_related(
        "data_type__data_set__external_data_source",
    ).get(pk=generic_data_id)
    if datum is None:
        logger.debug(f"GenericData {generic_data_id} not found")
        return None
    if datum.point is None:
        logger.debug(f"GenericData {generic_data_id} has no point data")
        return None
    external_data_source = datum.data_type.data_set.external_data_source
    user = get_current_user(info)
    permissions = models.ExternalDataSource.user_permissions(user, external_data_source)
    if not permissions.get("can_display_points"):
        logger.debug(f"User {user} does not have permission to view points")
        return None
    return MapReportMemberFeature.from_geodjango(
        point=datum.point,
        id=datum.id,
        properties=datum if permissions.get("can_display_details") else None,
    )


@strawberry_django.type(models.ExternalDataSource, filters=ExternalDataSourceFilter)
class SharedDataSource(BaseDataSource):
    organisation: PublicOrganisation = (
        strawberry_django_dataloaders.fields.auto_dataloader_field()
    )

    @classmethod
    def get_queryset(cls, queryset, info, **kwargs):
        user = get_current_user(info)
        return queryset.filter(
            # allow querying your orgs' data sources
            Q(organisation__members__user=user.id)
            # and also data sources shared with your orgs
            | Q(
                id__in=models.SharingPermission.objects.filter(
                    organisation__members__user=user.id
                ).values_list("external_data_source_id", flat=True)
            )
        )


@strawberry_django.type(models.ExternalDataSource, filters=ExternalDataSourceFilter)
class ExternalDataSource(BaseDataSource):
    organisation: Organisation = (
        strawberry_django_dataloaders.fields.auto_dataloader_field()
    )
    update_mapping: Optional[List["AutoUpdateConfig"]]
    orgs_with_access: List[Organisation]

    @strawberry_django.field
    def sharing_permissions(
        self: models.ExternalDataSource, info: Info
    ) -> List["SharingPermission"]:
        return models.SharingPermission.objects.filter(external_data_source=self.id)

    @strawberry_django.field()
    def jobs(
        self,
        filters: Optional[QueueFilter] = None,
        pagination: Optional[strawberry_django.pagination.OffsetPaginationInput] = None,
    ) -> list[QueueJob]:
        # filters and pagination are applied at the type level (see QueueFilter def)
        # however they are still required as declared arguments here.
        return (
            procrastinate.contrib.django.models.ProcrastinateJob.objects.filter(
                args__external_data_source_id=str(self.id)
            )
            .prefetch_related("procrastinateevent_set")
            .order_by("-id")
        )

    @classmethod
    def get_queryset(cls, queryset, info, **kwargs):
        user = get_current_user(info)
        return queryset.filter(
            # allow querying your orgs' data sources
            Q(organisation__members__user=user.id)
        )

    @strawberry_django.field
    def last_import_job(
        self: models.ExternalDataSource, info: Info
    ) -> Optional[QueueJob]:
        job = (
            procrastinate.contrib.django.models.ProcrastinateJob.objects.filter(
                args__external_data_source_id=str(self.id),
                task_name__startswith="hub.tasks.import_",
            )
            .order_by("-scheduled_at")
            .first()
        )
        return job

    @strawberry_django.field
    def last_update_job(
        self: models.ExternalDataSource, info: Info
    ) -> Optional[QueueJob]:
        job = (
            procrastinate.contrib.django.models.ProcrastinateJob.objects.filter(
                args__external_data_source_id=str(self.id),
                task_name__startswith="hub.tasks.refresh_",
            )
            .order_by("-scheduled_at")
            .first()
        )
        return job

    @strawberry_django.field
    def connection_details(self: models.ExternalDataSource, info) -> Union[
        "AirtableSource",
        "MailchimpSource",
        "ActionNetworkSource",
        "EditableGoogleSheetsSource",
        "TicketTailorSource",
        "UploadedCSVSource",
    ]:
        instance = self.get_real_instance()
        return instance

    @strawberry_django.field
    def oauth_credentials(self: models.ExternalDataSource, info) -> Optional[str]:
        if isinstance(self, models.EditableGoogleSheetsSource):
            return self.oauth_credentials
        return None

    @strawberry_django.field
    def webhook_url(self: models.ExternalDataSource, info) -> str:
        return self.webhook_url()

    @strawberry_django.field
    def webhook_healthcheck(self: models.ExternalDataSource, info) -> bool:
        try:
            return self.webhook_healthcheck()
        except Exception:
            # TODO: Return the error message to the UI.
            return False


@strawberry.type
class AutoUpdateConfig:
    source: str = dict_key_field()
    source_path: str = dict_key_field()
    destination_column: str = dict_key_field()


@strawberry_django.type(models.AirtableSource)
class AirtableSource(ExternalDataSource):
    api_key: str
    base_id: str
    table_id: str


@strawberry_django.type(models.UploadedCSVSource)
class UploadedCSVSource(ExternalDataSource):
    spreadsheet_file: str
    delimiter: auto


@strawberry_django.type(models.MailchimpSource)
class MailchimpSource(ExternalDataSource):
    api_key: str
    list_id: auto


@strawberry_django.type(models.ActionNetworkSource)
class ActionNetworkSource(ExternalDataSource):
    api_key: str
    group_slug: str


@strawberry_django.type(models.EditableGoogleSheetsSource)
class EditableGoogleSheetsSource(ExternalDataSource):
    spreadsheet_id: str
    sheet_name: str


@strawberry_django.type(models.TicketTailorSource)
class TicketTailorSource(ExternalDataSource):
    api_key: str


@strawberry_django.filter(models.Report, lookups=True)
class ReportFilter:
    organisation: auto
    created_at: auto
    last_update: auto


@strawberry_django.type(models.Report, filters=ReportFilter)
class Report:
    id: auto
    organisation_id: str
    organisation: Organisation
    name: auto
    slug: auto
    description: auto
    created_at: auto
    last_update: auto

    @classmethod
    def get_queryset(cls, queryset, info, **kwargs):
        user = get_current_user(info)
        return queryset.filter(organisation__members__user=user.id)


@strawberry.enum
class InspectorDisplayType(Enum):
    BigNumber = "BigNumber"
    BigRecord = "BigRecord"
    ElectionResult = "ElectionResult"
    List = "List"
    Properties = "Properties"
    Table = "Table"


@strawberry.type
class MapLayer:
    id: str = dict_key_field()
    name: str = dict_key_field()
    source: str = dict_key_field()
    type: str = dict_key_field(default="events")
    visible: Optional[bool] = dict_key_field()
    custom_marker_text: Optional[str] = dict_key_field()
    icon_image: Optional[str] = dict_key_field()
    mapbox_paint: Optional[JSON] = dict_key_field()
    mapbox_layout: Optional[JSON] = dict_key_field()
    inspector_type: Optional[str] = dict_key_field(default=InspectorDisplayType.Table)
    inspector_config: Optional[JSON] = dict_key_field()

    @strawberry_django.field
    def is_shared_source(self, info: Info) -> bool:
        # see if this source is shared with the user's org
        user = get_current_user(info)
        return models.SharingPermission.objects.filter(
            organisation__members__user=user.id,
            external_data_source_id=self["source"],
        ).exists()

    @strawberry_django.field
    def sharing_permission(self, info: Info) -> Optional["SharingPermission"]:
        # see if this source is shared with the user's org
        user = get_current_user(info)
        return models.SharingPermission.objects.filter(
            organisation__members__user=user.id,
            external_data_source_id=self["source"],
        ).first()

    @strawberry_django.field
    def source_data(self, info: Info) -> SharedDataSource:
        # Set in MapReport GraphQL type
        if self.get("cached_source"):
            return self.get("cached_source")
        source_id = self.get("source")
        return models.ExternalDataSource.objects.get(id=source_id)


@strawberry_django.type(model=models.SharingPermission)
class SharingPermission:
    id: auto
    external_data_source_id: str = strawberry_django.field(
        resolver=lambda self: self.external_data_source_id
    )
    external_data_source: SharedDataSource = (
        strawberry_django_dataloaders.fields.auto_dataloader_field()
    )
    organisation_id: str = strawberry_django.field(
        resolver=lambda self: self.organisation_id
    )
    organisation: PublicOrganisation = (
        strawberry_django_dataloaders.fields.auto_dataloader_field()
    )
    created_at: auto
    last_update: auto
    visibility_record_coordinates: auto
    visibility_record_details: auto
    deleted: bool = strawberry_django.field(resolver=lambda: False)


@strawberry_django.type(models.MapReport)
class MapReport(Report):
    display_options: JSON

    @strawberry_django.field
    def layers(self, info: Info) -> List[MapLayer]:
        """
        Filter out layers that refer to missing sources
        """
        layers = self.layers
        for layer in layers:
            layer["cached_source"] = models.ExternalDataSource.objects.filter(
                id=layer.get("source")
            ).first()
        return [layer for layer in self.layers if layer["cached_source"]]


def public_map_report(info: Info, org_slug: str, report_slug: str) -> models.MapReport:
    return models.MapReport.objects.get(
        organisation__slug=org_slug, slug=report_slug, public=True
    )


@strawberry_django.field()
def area_by_gss(
    gss: str, analytical_area_type: Optional[AnalyticalAreaType] = None
) -> models.Area:
    qs = models.Area.objects.all()
    if analytical_area_type:
        area_type_filter = stats.postcodeIOKeyAreaTypeLookup[analytical_area_type]
        qs = qs.filter(**area_type_filter.query_filter)
    return qs.get(gss=gss)


@strawberry_django.field()
def dataset_by_name(name: str) -> models.DataSet:
    return models.DataSet.objects.filter(
        # Exclude strawberry.private data sets
        external_data_source=None
    ).get(name=name)


@strawberry.type
class MappingSourcePath:
    value: str
    label: Optional[str] = None
    description: Optional[str] = None


@strawberry.type
class MappingSource:
    slug: str
    name: str
    author: Optional[str] = None
    description: Optional[str] = None
    description_url: Optional[str] = None
    builtin: bool = False
    source_paths: List[MappingSourcePath]
    external_data_source: Optional[SharedDataSource] = None


def mapping_sources(info: Info, organisation_pk: str) -> List[MappingSourcePath]:
    organisation = models.Organisation.objects.get(pk=organisation_pk)

    external_data_sources = organisation.get_external_data_sources(
        include_shared=True,
        sharing_permission_filters={
            "visibility_record_coordinates": True,
            "visibility_record_details": True,
        },
    ).exclude(data_type=models.ExternalDataSource.DataSourceType.MEMBER)

    return [
        MappingSource(
            slug=s.get("slug", None),
            name=s.get("name", None),
            author=s.get("author", None),
            description=s.get("description", None),
            description_url=s.get("description_url", None),
            builtin=s.get("builtin", False),
            external_data_source=s.get("external_data_source", None),
            source_paths=[
                MappingSourcePath(
                    value=sp["value"],
                    label=sp.get("label", None),
                    description=sp.get("description", None),
                )
                for sp in s["source_paths"]
            ],
        )
        for s in (
            list(builtin_mapping_sources.values())
            + [source.as_mapping_source() for source in external_data_sources]
        )
    ]


@strawberry_django.type(models.Page)
class HubPage:
    id: auto
    title: str
    slug: str
    path: str
    full_url: Optional[str] = attr_field()

    search_description: Optional[str]

    @strawberry_django.field
    def seo_title(self) -> str:
        return self.seo_title or self.title

    @strawberry_django.field
    def hostname(self) -> str:
        return self.get_site().hostname

    @strawberry_django.field
    def live_url(self) -> Optional[str]:
        return self.full_url

    @strawberry_django.field
    def live_url_without_protocol(self) -> str:
        url = self.full_url
        return url.split("://")[1]

    @strawberry_django.field
    def puck_json_content(self) -> JSON:
        specific = self.specific
        if hasattr(specific, "puck_json_content"):
            json = specific.puck_json_content
            try:
                if "root" in json and "props" in json["root"]:
                    for field in models.puck_wagtail_root_fields:
                        json["root"]["props"][field] = getattr(specific, field)
            except Exception as e:
                logger.error(f"Error adding root fields to puck json: {e}")
            return json
        return {}

    @strawberry_django.field
    def model_name(self) -> str:
        return self.specific._meta.object_name

    @strawberry_django.field
    def ancestors(self, inclusive: bool = False) -> List["HubPage"]:
        return self.get_ancestors(inclusive=inclusive)

    @strawberry_django.field
    def parent(self) -> Optional["HubPage"]:
        return self.get_parent()

    @strawberry_django.field
    def children(self) -> List["HubPage"]:
        return self.get_children()

    @strawberry_django.field
    def descendants(self, inclusive: bool = False) -> List["HubPage"]:
        return self.get_descendants(inclusive=inclusive)

    @strawberry_django.field
    def hub(self) -> "HubHomepage":
        page = self.get_site().root_page.specific
        if isinstance(page, models.HubHomepage):
            return page


@strawberry.type
class HubNavLink:
    label: str = dict_key_field()
    link: str = dict_key_field()


@strawberry_django.type(models.HubHomepage)
class HubHomepage(HubPage):
    organisation: Organisation
    layers: List[MapLayer]
    nav_links: List[HubNavLink]
    favicon_url: Optional[str] = None
    google_analytics_tag_id: Optional[str] = None
    custom_css: Optional[str] = None
    primary_colour: Optional[str] = None
    secondary_colour: Optional[str] = None

    @strawberry_django.field
    def seo_image_url(self) -> Optional[str]:
        if self.seo_image is None:
            return None
        return self.seo_image.get_rendition("width-800").full_url

    @classmethod
    def get_queryset(cls, queryset, info, **kwargs):
        # Only list pages belonging to this user's orgs
        user = get_current_user(info)
        user_orgs = models.Organisation.objects.filter(members__user=user.id)
        return queryset.filter(
            organisation__in=user_orgs,
        )


@strawberry_django.field()
def hub_page_by_path(
    info: Info, hostname: str, path: Optional[str] = None
) -> Optional[HubPage]:
    # get request for strawberry query
    request: HttpRequest = info.context["request"]
    request.META = {
        **request.META,
        "HTTP_HOST": hostname,
        "SERVER_PORT": request.get_port(),
    }
    request.path = path
    site = Site.objects.get(hostname=hostname)
    if isinstance(site.root_page.specific, models.HubHomepage):
        if path is None:
            return site.root_page.specific
        page = models.Page.find_for_request(request, path)
        return page.specific if page else None


@strawberry_django.field()
def hub_by_hostname(hostname: str) -> HubHomepage:
    site = Site.objects.get(hostname=hostname)
    return site.root_page.specific


@strawberry_django.field()
def generic_data_by_external_data_source(
    external_data_source_id: str, info: Info
) -> List[GenericData]:
    user = get_current_user(info)
    external_data_source: models.ExternalDataSource = (
        models.ExternalDataSource.objects.get(pk=external_data_source_id)
    )
    permissions = models.ExternalDataSource.user_permissions(user, external_data_source)
    if not permissions.get("can_display_points") or not permissions.get(
        "can_display_details"
    ):
        raise ValueError(f"User {user} does not have permission to view points")
    return models.GenericData.objects.filter(
        data_type__data_set__external_data_source=external_data_source
    )


def __get_generic_data_for_area_and_external_data_source(
    external_data_source: models.ExternalDataSource,
    gss: str,
    mode: stats.AreaQueryMode,
) -> List[GenericData]:
    area = models.Area.objects.get(gss=gss)
    data_source_records = external_data_source.get_import_data()

    filters = Q()

    if mode is stats.AreaQueryMode.POINTS_WITHIN:
        # We filter on area=None so we don't pick up statistical area data
        # since a super-area may have a point within this area, skewing the results
        filters = Q(point__within=area.polygon) & Q(area=None)

    elif mode is stats.AreaQueryMode.AREA:
        # Find only data specifically related to this GSS area — not about its children
        filters = Q(area__gss=area.gss)

    elif mode is stats.AreaQueryMode.AREA_OR_CHILDREN:
        filters = Q(area__gss=area.gss)
        # Or find GenericData tagged with area that is fully contained by this area's polygon
        postcode_io_key = area_to_postcode_io_filter(area)
        if postcode_io_key is None:
            postcode_io_key = lih_to_postcodes_io_key_map.get(area.area_type.code, None)
        if postcode_io_key:
            subclause = Q()
            # See if there's a matched postcode data field for this area
            subclause &= Q(
                **{f"postcode_data__codes__{postcode_io_key.value}": area.gss}
            )
            # And see if the area is SMALLER than the current area — i.e. a child
            subclause &= Q(area__polygon__within=area.polygon)
            filters |= subclause

    elif mode is stats.AreaQueryMode.AREA_OR_PARENTS:
        filters = Q(area__gss=area.gss)
        # Or find GenericData tagged with area that fully contains this area's polygon
        postcode_io_key = area_to_postcode_io_filter(area)
        if postcode_io_key is None:
            postcode_io_key = lih_to_postcodes_io_key_map.get(area.area_type.code, None)
        if postcode_io_key:
            subclause = Q()
            # See if there's a matched postcode data field for this area
            subclause &= Q(
                **{f"postcode_data__codes__{postcode_io_key.value}": area.gss}
            )
            # And see if the area is LARGER than the current area — i.e. a parent
            subclause &= Q(area__polygon__contains=area.polygon)
            filters |= subclause

    elif mode is stats.AreaQueryMode.OVERLAPPING:
        filters = Q(area__gss=area.gss)
        # Or find GenericData tagged with area that overlaps this area's polygon
        postcode_io_key = area_to_postcode_io_filter(area)
        if postcode_io_key is None:
            postcode_io_key = lih_to_postcodes_io_key_map.get(area.area_type.code, None)
        if postcode_io_key:
            filters |= Q(**{f"postcode_data__codes__{postcode_io_key.value}": area.gss})

    else:
        raise ValueError(f"Unknown stats.AreaQueryMode: {mode}")

    return data_source_records.filter(filters)


@strawberry_django.field()
def generic_data_from_source_about_area(
    info: Info, source_id: str, gss: str, mode: stats.AreaQueryMode = stats.AreaQueryMode.AREA
) -> List[GenericData]:
    user = get_current_user(info)
    # Check user can access the external data source
    external_data_source = models.ExternalDataSource.objects.get(pk=source_id)
    permissions = models.ExternalDataSource.user_permissions(user, external_data_source)
    if not permissions.get("can_display_points") or not permissions.get(
        "can_display_details"
    ):
        raise ValueError(
            f"User {user} does not have permission to view this external data source's data"
        )

    qs = __get_generic_data_for_area_and_external_data_source(
        external_data_source, gss, mode
    )

    return qs


@strawberry.type
class DataSummaryMetadata:
    first: Optional[float] = None
    second: Optional[float] = None
    third: Optional[float] = None
    last: Optional[float] = None
    total: Optional[float] = None
    majority: Optional[float] = None
    count: Optional[float] = None
    mean: Optional[float] = None
    median: Optional[float] = None
    percentage_keys: Optional[List[str]] = None
    numerical_keys: Optional[List[str]] = None
    is_percentage: Optional[bool] = False


@strawberry.type
class DataSummary:
    aggregated: JSON
    metadata: DataSummaryMetadata


@strawberry_django.field()
def generic_data_summary_from_source_about_area(
    info: Info, source_id: str, gss: str, mode: stats.AreaQueryMode = stats.AreaQueryMode.AREA
) -> Optional[DataSummary]:
    user = get_current_user(info)
    # Check user can access the external data source
    external_data_source = models.ExternalDataSource.objects.get(pk=source_id)
    permissions = models.ExternalDataSource.user_permissions(user, external_data_source)
    if not permissions.get("can_display_points") or not permissions.get(
        "can_display_details"
    ):
        raise ValueError(
            f"User {user} does not have permission to view this external data source's data"
        )

    qs = __get_generic_data_for_area_and_external_data_source(
        external_data_source, gss, mode
    )

    # ingest the .json data into a pandas dataframe
    df = pd.DataFrame([record.json for record in qs])
    # convert any stringified numbers to floats
    is_percentage = False
    percentage_keys = []
    for column in df:
        if all(df[column].apply(check_percentage)):
            is_percentage = True
            percentage_keys += [str(column)]
            df[column] = attempt_interpret_series_as_percentage(df[column])
        else:
            df[column] = attempt_interpret_series_as_float(df[column])
    numerical_keys = df.select_dtypes(include="number").columns
    # remove columns that aren't numerical_keys
    df = df[numerical_keys]
    # summarise the data in a single dictionary, with summed values for each column
    if is_percentage:
        summary = df.mean()
    else:
        summary = df.sum()
    summary_dict = summary.to_dict()

    if len(summary_dict.keys()) <= 0:
        return None

    # Convert selected columns to numpy array for faster operations
    summary_values = dict()
    if not is_percentage:
        np_values = summary.values
        summary["first"] = np_values.max()
        summary["second"] = np.partition(np_values, -2)[:, -2]
        summary["third"] = np.partition(np_values, -3)[:, -3]
        try:
            summary["majority"] = summary["first"] - summary["second"]
        except IndexError:
            # In case there's only one value.
            pass
        summary["last"] = np_values.min()
        summary["total"] = np_values.sum()
        summary["count"] = np_values.count()
        summary["mean"] = np_values.mean()
        summary["median"] = np_values.median()
        summary_values = summary_values.update(
            first=summary["first"],
            second=summary["second"],
            majority=summary["majority"],
            third=summary["third"],
            last=summary["last"],
            total=summary["total"],
            count=summary["count"],
            mean=summary["mean"],
            median=summary["median"],
        )

    return DataSummary(
        aggregated=summary_dict,
        metadata=DataSummaryMetadata(
            **summary_values,
            is_percentage=is_percentage,
            percentage_keys=percentage_keys,
            numerical_keys=numerical_keys
        ),
    )


@strawberry.enum
class ChoroplethMode(Enum):
    Count = "Count"
    Field = "Field"
    Formula = "Formula"
    Table = "Table"


@strawberry_django.field()
def choropleth_data_for_source(
    info: Info,
    source_id: str,
    analytical_area_key: AnalyticalAreaType,
    # Field could be a column name or a Pandas formulaic expression
    # or, if not provided, a count of records
    mode: Optional[ChoroplethMode] = ChoroplethMode.Count,
    field: Optional[str] = None,
    map_bounds: Optional[stats.MapBounds] = None,
    formula: Optional[str] = None,
    aggregation_operation: stats.AggregationOp = stats.AggregationOp.Guess
) -> List[GroupedDataCount]:
    decided_operation = aggregation_operation
    # Check user can access the external data source
    user = get_current_user(info)
    external_data_source = models.ExternalDataSource.objects.get(pk=source_id)
    permissions = models.ExternalDataSource.user_permissions(user, external_data_source)
    if not permissions.get("can_display_points") or not permissions.get(
        "can_display_details"
    ):
        raise ValueError(
            f"User {user} does not have permission to view this external data source's data"
        )

    # Get the required data for the source
    qs = (
        external_data_source.get_import_data()
        .filter(postcode_data__codes__isnull=False)
        .annotate(
            label=F(f"postcode_data__{analytical_area_key.value}"),
            gss=F(f"postcode_data__codes__{analytical_area_key.value}"),
            latitude=Cast("postcode_data__latitude", output_field=FloatField()),
            longitude=Cast("postcode_data__longitude", output_field=FloatField()),
        )
    )

    if map_bounds:
        area_type_filter = stats.postcodeIOKeyAreaTypeLookup[analytical_area_key]
        bbox_coords = (
            (map_bounds.west, map_bounds.north),  # Top left
            (map_bounds.east, map_bounds.north),  # Top right
            (map_bounds.east, map_bounds.south),  # Bottom right
            (map_bounds.west, map_bounds.south),  # Bottom left
            (map_bounds.west, map_bounds.north),  # Back to start to close polygon
        )
        bbox = Polygon(bbox_coords, srid=4326)
        areas = models.Area.objects.filter(**area_type_filter.query_filter).filter(
            point__within=bbox
        )
        combined_area = areas.aggregate(union=GisUnion("polygon"))["union"]
        # all geocoded GenericData should have `point` set
        qs = qs.filter(point__within=combined_area or bbox)

    qs = qs.values("json", "label", "gss")

    if not qs:
        return []

    # ingest the .json data into a pandas dataframe so we can do analytics
    df = pd.DataFrame([record for record in qs])

    # if length of dataframe is 0, return an empty list
    if len(df) <= 0:
        logger.debug("No data found for this source")
        return []

    # Break the json column into separate columns for each key
    df = df.join(pd.json_normalize(df["json"]))

    # Remove the json column
    df = df.drop(columns=["json"])

    # Choropleth mode
    # TODO: maybe make this explicit via an argument?
    # is_data_source_statistical = external_data_source.data_type == models.ExternalDataSource.DataSourceType.AREA_STATS
    # check that field is in DF
    is_valid_field = (
        mode is ChoroplethMode.Field
        and field
        and field is not None
        and len(field)
        and field in df.columns
    )
    is_row_count = mode is ChoroplethMode.Count
    is_valid_formula = (
        mode is ChoroplethMode.Formula
        and formula
        and formula is not None
        and len(formula)
    )
    is_table = mode is ChoroplethMode.Table

    if mode is ChoroplethMode.Field and not is_valid_field:
        raise ValueError("Field not found in data source")

    if mode is ChoroplethMode.Formula and not is_valid_formula:
        raise ValueError("Formula is invalid")

    is_percentage = False
    if is_row_count:
        # Simple count of data points per area

        # Count the number of rows per GSS
        df_count = (
            df.drop(columns=["label"]).groupby("gss").size().reset_index(name="count")
        )

        # Calculate the mode for the 'label' column
        def get_mode(series):
            try:
                return series.mode()[0]
            except KeyError:
                return None

        df_mode = df.groupby("gss")["label"].agg(get_mode).reset_index()

        # Merge the summed DataFrame with the mode DataFrame
        df = pd.merge(df_count, df_mode, on="gss")

        # Convert DF to GroupedDataCount(label=label, gss=gss, count=count) list
        return [
            GroupedDataCount(
                label=row.label,
                gss=row.gss,
                count=row.count,
                formatted_count=f"{row.count:,.0f}",
            )
            for row in df.itertuples()
        ]
    elif is_valid_field or is_valid_formula or is_table:
        # Convert any stringified JSON numbers to floats
        for column in df:
            if all(df[column].apply(check_percentage)):
                is_percentage = True
                if decided_operation is stats.AggregationOp.Guess:
                    decided_operation = stats.AggregationOp.Mean
                df[column] = attempt_interpret_series_as_percentage(df[column])
            else:
                df[column] = attempt_interpret_series_as_float(df[column])

        # You end up with something like:
        """
                        json
          gss    label  Ref Lab Con LDem
        0 E10001 Bucks  1   2   3   4
        1 E10002 Herts  2   3   4   5
        2 E10003 Beds   3   4   5   6
        """

        # Group by the postcode_io level that we want to
        # Aggregation will be by summing the values in the field, excluding 'label'
        grouped_data = df.drop(columns=["label"]).groupby("gss")
        match decided_operation:
            case stats.AggregationOp.Mean:
                df_aggregated = grouped_data.mean().reset_index()
            case stats.AggregationOp.Sum | _:
                df_aggregated = grouped_data.sum().reset_index()

        # Calculate the mode for the 'label' column
        def get_mode(series):
            try:
                return series.mode()[0]
            except KeyError:
                return None

        df_mode = df.groupby("gss")["label"].agg(get_mode).reset_index()

        # Merge the summed DataFrame with the mode DataFrame
        df = pd.merge(df_aggregated, df_mode, on="gss")

        # Add a "maximum" column that figures out the biggest numerical value in each row
        numerical_keys = df.select_dtypes(include="number").columns
        try:
            # Convert selected columns to numpy array for faster operations
            values = df[numerical_keys].values
            df["first"] = values.max(axis=1)
            df["second"] = np.partition(values, -2, axis=1)[:, -2]
            df["third"] = np.partition(values, -3, axis=1)[:, -3]
            try:
                df["majority"] = df["first"] - df["second"]
            except IndexError:
                # In case there's only one value.
                pass
            df["last"] = values.min(axis=1)

            df["total"] = df[numerical_keys].sum(axis=1)
            df["count"] = df[numerical_keys].count(axis=1)
            df["mean"] = df[numerical_keys].mean(axis=1)
            df["median"] = df[numerical_keys].median(axis=1)
        except IndexError:
            pass

        # Now fetch the requested series from the dataframe
        # If the field is a column name, we can just return that column
        if is_valid_field:
            df["count"] = df[field]
        # If the field is a formula, we need to evaluate it
        elif is_valid_formula:
            try:
                df["count"] = df.eval(formula)
            except ValueError:
                # In case "where" is used, which pandas doesn't support
                # https://github.com/pandas-dev/pandas/issues/34834
                df["count"] = ne.evaluate(formula, local_dict=df)

        # Convert DF to GroupedDataCount(label=label, gss=gss, count=count) list
        return [
            GroupedDataCount(
                label=row.label,
                gss=row.gss,
                count=row.count,
                columns=df.columns.to_list() if is_table else None,
                row=row if is_table else None,
                is_percentage=is_percentage,
                formatted_count=(
                    (
                        # pretty percentage
                        f"{row.count:.0%}"
                    )
                    if is_percentage
                    else (
                        # comma-separated integer
                        f"{row.count:,.0f}"
                    )
                ),
            )
            for row in df.itertuples()
        ]

    else:
        raise ValueError("Incorrect configuration for choropleth")


def statistics(
    info: Info,
    # --- Querying + data ---
    # Pick one or more GenericData sets to blend together.
    # they're gonna all be geo-joined for now.
    stats_config: stats.StatisticsConfig
) -> Optional[List[JSON]]:
    user = get_current_user(info)
    for source in stats_config.source_ids:
        check_user_can_view_source(user, source)
    return stats.statistics(stats_config)