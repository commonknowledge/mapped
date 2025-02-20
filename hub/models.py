import asyncio
import hashlib
import itertools
import json
import math
import threading
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Self, Type, TypedDict, Union
from urllib.parse import urlencode, urljoin

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractBaseUser
from django.contrib.gis.db.models import MultiPolygonField, PointField
from django.contrib.gis.geos import Point
from django.contrib.postgres.fields import ArrayField
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.core.validators import FileExtensionValidator
from django.db import connection, models
from django.db.models import Avg, IntegerField, Max, Min, Q
from django.db.models.functions import Cast, Coalesce
from django.db.utils import IntegrityError
from django.dispatch import receiver
from django.urls import reverse
from django.utils.functional import cached_property
from django.utils.text import slugify

import google_auth_oauthlib.flow
import googleapiclient
import googleapiclient.discovery
import httpx
import numpy as np
import pandas as pd
import posthog
import pytz
from asgiref.sync import async_to_sync, sync_to_async
from benedict import benedict
from codemirror2.widgets import CodeMirrorEditor
from django_choices_field import TextChoicesField
from django_jsonform.models.fields import JSONField
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2.credentials import Credentials as GoogleCredentials
from mailchimp3 import MailChimp
from polymorphic.models import PolymorphicModel
from procrastinate.contrib.django import app as procrastinate
from procrastinate.contrib.django.models import ProcrastinateEvent, ProcrastinateJob
from procrastinate.exceptions import AlreadyEnqueued
from psycopg import sql as pgsql
from psycopg.errors import UniqueViolation
from pyairtable import Api as AirtableAPI
from pyairtable import Base as AirtableBase
from pyairtable import Table as AirtableTable
from pyairtable.models.schema import TableSchema as AirtableTableSchema
from sentry_sdk import metrics
from strawberry.dataloader import DataLoader
from wagtail.admin.panels import FieldPanel, ObjectList, TabbedInterface
from wagtail.images.models import AbstractImage, AbstractRendition, Image
from wagtail.models import Page, Site
from wagtail_color_panel.edit_handlers import NativeColorPanel
from wagtail_color_panel.fields import ColorField
from wagtail_json_widget.widgets import JSONEditorWidget

import utils as lih_utils
from hub.analytics import Analytics
from hub.cache_keys import site_tile_filter_dict
from hub.data_imports import geocoding_config
from hub.data_imports.utils import get_update_data
from hub.enrichment.sources import builtin_mapping_sources
from hub.fields import EncryptedCharField, EncryptedTextField
from hub.filters import Filter
from hub.parsons.action_network.action_network import ActionNetwork
from hub.storage import OverwriteStorage
from hub.tasks import (
    import_all,
    import_many,
    import_pages,
    refresh_all,
    refresh_many,
    refresh_one,
    refresh_pages,
    refresh_webhooks,
)
from hub.validation import validate_and_format_phone_number
from hub.views.mapped import ExternalDataSourceWebhook
from utils import google_maps, google_sheets, postgis_geocoder
from utils.django_json import DBJSONEncoder, PandasMappingSafeForPG
from utils.log import get_simple_debug_logger
from utils.postcodesIO import (
    PostcodesIOResult,
    get_bulk_postcode_geo,
    get_bulk_postcode_geo_from_coords,
)
from utils.procrastinate import ProcrastinateQueuePriority
from utils.py import batched, ensure_list, get, is_maybe_id
from utils.statistics import (
    StatisticalDataType,
    get_materialized_view_column_name,
    merge_column_types,
)

User = get_user_model()

logger = get_simple_debug_logger(__name__)


class Organisation(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    last_update = models.DateTimeField(auto_now=True)
    slug = models.SlugField(max_length=100, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    logo = models.ImageField(null=True, blank=True, upload_to="organisation")

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    @classmethod
    def get_or_create_for_user(self, user: any):
        if isinstance(user, (str, int)):
            user = User.objects.get(pk=user)
        membership = Membership.objects.filter(user=user).first()
        if membership:
            return membership.organisation
        org = self.objects.create(
            name=f"{user.username}'s personal workspace", slug=user.username
        )
        Membership.objects.create(user=user, organisation=org, role="owner")
        return org

    def get_external_data_sources(
        self,
        include_shared: bool = False,
        sharing_permission_filters: Union[dict, None] = None,
    ):
        if not include_shared:
            return ExternalDataSource.objects.filter(organisation=self)
        else:
            sharing_permission_filters = sharing_permission_filters or {}
            return ExternalDataSource.objects.filter(
                # allow querying your orgs' data sources
                Q(organisation=self)
                # and also data sources shared with your orgs
                | Q(
                    id__in=SharingPermission.objects.filter(
                        organisation=self,
                        external_data_source__isnull=False,
                        **sharing_permission_filters,
                    ).values_list("external_data_source_id", flat=True)
                )
            )


class Membership(models.Model):
    class Meta:
        unique_together = ["user", "organisation"]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="memberships")
    organisation = models.ForeignKey(
        Organisation, on_delete=models.CASCADE, related_name="members"
    )
    role = models.CharField(max_length=250, default="owner")

    def __str__(self):
        return f"{self.user}: {self.role} in {self.organisation}"


class UserProperties(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="properties"
    )
    organisation_name = models.TextField(null=True, blank=True)
    full_name = models.TextField(null=True, blank=True)
    email_confirmed = models.BooleanField(default=False)
    account_confirmed = models.BooleanField(default=False)
    last_seen = models.DateTimeField(null=True, blank=True)
    agreed_terms = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username


# on user create signal, create an org
@receiver(models.signals.post_save, sender=User)
def create_user_organisation(sender, instance, created, **kwargs):
    Organisation.get_or_create_for_user(instance)


class TypeMixin:
    TYPE_CHOICES = [
        ("text", "Text"),
        ("integer", "Integer"),
        ("float", "Floating Point Number"),
        ("percent", "Percentage"),
        ("date", "Date"),
        ("boolean", "True/False"),
        ("profile_id", "Profile Id"),
        ("json", "JSON data"),
        ("url", "URL"),
    ]

    @property
    def is_number(self):
        if self.data_type in ("integer", "float", "percent"):
            return True

        return False

    @property
    def is_percentage(self):
        if self.data_type == "percent":
            return True

        return False

    @property
    def is_float(self):
        if self.data_type == "float" or self.data_type == "percent":
            return True

        return False

    @property
    def is_date(self):
        if self.data_type == "date":
            return True

        return False

    @property
    def is_json(self):
        if self.data_type == "json":
            return True

        return False

    @property
    def is_url(self):
        if self.data_type == "url":
            return True

        return False

    @property
    def value_col(self):
        if self.is_date:
            return "date"
        elif self.is_float:
            return "float"
        elif self.is_number:
            return "int"
        elif self.is_url or self.is_json:
            return "json"
        elif self.is_json:
            return "json"
        else:
            return "data"


class ShaderMixin:
    shades = [
        "#ffffd9",
        "#edf8b1",
        "#c7e9b4",
        "#7fcdbb",
        "#41b6c4",
        "#1d91c0",
        "#225ea8",
        "#253494",
        "#081d58",
    ]

    COLOUR_NAMES = {
        "red-500": "#CC3517",
        "orange-500": "#ED6832",
        "yellow-500": "#FEC835",
        "teal-600": "#068670",
        "blue-500": "#21A8E0",
        "purple-500": "#6F42C1",
        "gray-500": "#ADB5BD",
        "gray-300": "#DEE2E6",
    }

    @property
    def shader_table(self):
        return self.table

    @property
    def shader_filter(self):
        return {"data_type__data_set": self}

    def shade(self, val, cmin, cmax):
        if val == "":
            return None
        try:
            x = float(val - cmin) / (cmax - cmin)
        except ZeroDivisionError:
            x = 0.5  # cmax == cmin

        shade = int(x * 9) - 1
        if shade < 0:
            shade = 0
        return self.shades[shade]

    def colours_for_areas(self, areas):
        if len(areas) == 0:
            return {"properties": {"no_areas": True}}

        values, mininimum, maximum = self.shader_value(areas)
        legend = {}
        if hasattr(self, "options"):
            for option in self.options:
                if option.get("shader", None) is not None:
                    legend[option["title"]] = self.COLOUR_NAMES.get(
                        option["shader"], option["shader"]
                    )

        if len(legend) > 0:
            props = {"properties": {"legend": legend}}
        else:
            d_max = maximum
            d_min = mininimum
            if self.is_float:
                d_max = round(maximum, 1)
                d_min = round(mininimum, 1)
                if self.is_percentage:
                    d_max = f"{d_max}%"
                    d_min = f"{d_min}%"

            props = {
                "properties": {
                    "maximum": d_max,
                    "minimum": d_min,
                    "shades": self.shades,
                }
            }
        colours = {}
        for value in values:
            data = value.value()
            if hasattr(self, "options"):
                for option in self.options:
                    if option["title"] == data:
                        colours[value.gss] = {
                            "colour": self.COLOUR_NAMES.get(
                                option["shader"], option["shader"]
                            ),
                            "opacity": value.opacity(mininimum, maximum) or 0.7,
                            "value": data,
                            "label": self.label,
                        }

            if self.is_number and colours.get(value.gss, None) is None:
                shade = self.shade(data, mininimum, maximum)
                if shade is not None:
                    colours[value.gss] = {
                        "colour": shade,
                        "opacity": 0.7,
                        "label": self.label,
                        "value": data,
                    }

        # if there is no data for an area then need to set the shader to opacity 0 otherwise
        # they will end up as the default
        missing = {}
        for area in areas:
            if colours.get(area.gss, None) is None:
                missing[area.gss] = {"colour": "#ed6832", "opacity": 0}

        return {**colours, **missing, **props}

    def shader_value(self, area):
        if self.shader_table == "areadata":
            min_max = AreaData.objects.filter(
                area__in=area, **self.shader_filter
            ).aggregate(
                max=models.Max(self.value_col),
                min=models.Min(self.value_col),
            )

            data = (
                AreaData.objects.filter(area__in=area, **self.shader_filter)
                .select_related("area", "data_type")
                .annotate(
                    gss=models.F("area__gss"),
                )
            )
            return data, min_max["min"], min_max["max"]
        else:
            min_max = PersonData.objects.filter(
                person__area__in=area, **self.shader_filter
            ).aggregate(
                max=models.Max(self.value_col),
                min=models.Min(self.value_col),
            )

            data = (
                PersonData.objects.filter(person__area__in=area, **self.shader_filter)
                .select_related("person__area", "data_type")
                .annotate(gss=models.F("person__area__gss"))
            )
            return data, min_max["min"], min_max["max"]

        return None, None, None


class DataSet(TypeMixin, ShaderMixin, models.Model):
    SOURCE_CHOICES = [
        ("csv", "CSV File"),
        ("xlxs", "Excel File"),
        ("api", "External API"),
    ]
    SUBCATEGORY_CHOICES = [
        ("net_zero_support", "Support for net zero"),
        ("renewable_energy", "Renewable energy"),
        ("voting", "Voting"),
        ("government_action", "Government action"),
        ("supporters_and_activists", "Supporters and activists"),
        ("groups", "Groups"),
        ("places_and_spaces", "Places and spaces"),
        ("events", "Events"),
        ("cost_of_living", "Cost of living"),
    ]

    CATEGORY_CHOICES = [
        ("opinion", "Public Opinion"),
        ("place", "Place"),
        ("movement", "Movement"),
    ]

    TABLE_CHOICES = [
        ("areadata", "AreaData"),
        ("person__persondata", "PersonData"),
    ]

    UNIT_TYPE_CHOICES = [
        ("raw", "Raw unit (e.g. people or buildings)"),
        ("percentage", "Percentage"),
        ("point", "Point data (e.g. lat/long)"),
    ]

    UNIT_DISTRIBUTION_CHOICES = [
        ("people_in_area", "Evenly distributed over people in an area"),
        ("physical_area", "Evenly distributed over a physical area"),
        ("point", "Point data (recalculated)"),
    ]

    COMPARATORS_SCHEMA = {
        "type": "array",
        "items": {
            "type": "dict",
            "keys": {"field_lookup": {"type": "string"}, "title": {"type": "string"}},
        },
        "minItems": 2,
    }

    EXCLUDE_COUNTRIES_SCHEMA = {
        "type": "array",
        "items": {
            "type": "string",
        },
    }

    def comparators_default():
        return [
            dict(field_lookup="exact", title="is"),
            dict(field_lookup="not_exact", title="is not"),
        ]

    def exclude_countries_default():
        return []

    def numerical_comparators():
        return [
            dict(field_lookup="gte", title="is equal or greater than"),
            dict(field_lookup="lt", title="is less than"),
        ]

    def year_comparators():
        return [
            dict(field_lookup="year__lt", title="before year"),
            dict(field_lookup="year__gte", title="since year"),
        ]

    def string_comparators():
        return [
            dict(field_lookup="icontains", title="contains"),
            dict(field_lookup="not_icontains", title="does not contain"),
        ]

    def in_comparators():
        return [
            dict(field_lookup="in", title="is one of"),
            dict(field_lookup="not_in", title="is not one of"),
        ]

    OPTIONS_SCHEMA = {
        "type": "array",
        "items": {
            "type": "dict",
            "properties": {"title": {"type": "string"}, "shader": {"type": "string"}},
        },
    }

    def options_default():
        return []

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    label = models.CharField(max_length=500, blank=True, null=True)
    data_type = models.CharField(max_length=20, choices=TypeMixin.TYPE_CHOICES)
    last_update = models.DateTimeField(auto_now=True)
    source_label = models.TextField(max_length=300, blank=True, null=True)
    source = models.CharField(max_length=500)
    source_type = models.TextField(
        max_length=50, blank=True, null=True, choices=SOURCE_CHOICES
    )
    data_url = models.URLField(blank=True, null=True)
    release_date = models.TextField(blank=True, null=True)
    is_upload = models.BooleanField(default=False)
    is_range = models.BooleanField(default=False)
    featured = models.BooleanField(default=False)
    order = models.IntegerField(blank=True, null=True)
    category = models.TextField(blank=True, null=True, choices=CATEGORY_CHOICES)
    subcategory = models.TextField(blank=True, null=True, choices=SUBCATEGORY_CHOICES)
    table = models.CharField(max_length=20, null=True, choices=TABLE_CHOICES)
    comparators = JSONField(schema=COMPARATORS_SCHEMA, default=comparators_default)
    options = JSONField(schema=OPTIONS_SCHEMA, blank=True, default=options_default)
    default_value = models.CharField(max_length=50, blank=True, null=True)
    is_filterable = models.BooleanField(default=True)
    is_shadable = models.BooleanField(default=True)
    is_public = models.BooleanField(default=False)
    fill_blanks = models.BooleanField(default=True)
    exclude_countries = JSONField(
        schema=EXCLUDE_COUNTRIES_SCHEMA, blank=True, default=exclude_countries_default
    )
    unit_type = models.TextField(null=True, choices=UNIT_TYPE_CHOICES)
    unit_distribution = models.TextField(null=True, choices=UNIT_DISTRIBUTION_CHOICES)
    areas_available = models.ManyToManyField("AreaType")
    external_data_source = models.ForeignKey(
        "ExternalDataSource",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="data_sets",
    )

    def __str__(self):
        if self.label:
            return self.label

        return self.name

    @property
    def source_name(self):
        if self.source_label is not None:
            return self.source_label
        elif not self.source == "" and self.source is not None:
            return lih_utils.domain_human(self.source)
        elif not self.data_url == "" and self.data_url is not None:
            return lih_utils.domain_human(self.data_url)

        return "unknown"

    @property
    def source_url(self):
        if not self.source == "":
            return self.source

        return self.data_url

    class Meta:
        permissions = [
            ("order_and_feature", "Can change sort order and mark as featured")
        ]

    def filter(self, query, **kwargs):
        return Filter(self, query).run(**kwargs)


class AreaType(models.Model):
    VALID_AREA_TYPES = ["WMC", "WMC23", "STC", "DIS"]

    AREA_TYPES = [
        ("westminster_constituency", "Westminster Constituency"),
        ("single_tier_council", "Single Tier Council"),
        ("district_council", "District Council"),
    ]
    name = models.CharField(max_length=50, unique=True)
    code = models.CharField(max_length=10, unique=True)
    area_type = models.CharField(max_length=50, choices=AREA_TYPES)
    description = models.CharField(max_length=300)

    def __str__(self):
        return self.code


class DataType(TypeMixin, ShaderMixin, models.Model):
    data_set = models.ForeignKey(
        DataSet, on_delete=models.CASCADE, related_name="data_types"
    )
    name = models.CharField(max_length=100)
    data_type = models.CharField(max_length=20, choices=TypeMixin.TYPE_CHOICES)
    last_update = models.DateTimeField(auto_now=True)
    average = models.FloatField(blank=True, null=True)
    maximum = models.FloatField(blank=True, null=True)
    minimum = models.FloatField(blank=True, null=True)
    label = models.CharField(max_length=500, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    order = models.IntegerField(blank=True, null=True)
    area_type = models.ForeignKey(
        AreaType, on_delete=models.CASCADE, null=True, related_name="data_types"
    )
    auto_converted = models.BooleanField(
        default=False,
        help_text="True if this has been auto converted from an area with overlapping geometry",
    )
    auto_converted_text = models.TextField(blank=True, null=True)

    def __str__(self):
        name = self.name
        if self.label:
            name = self.label

        if self.area_type:
            return f"{name} ({self.area_type})"

        return name

    def update_average(self):
        average = (
            AreaData.objects.filter(area__area_type=self.area_type, data_type=self)
            .annotate(
                cast_data=Cast(Coalesce("int", "float"), output_field=self.cast_field())
            )
            .all()
            .aggregate(Avg("cast_data"))
        )

        self.average = average["cast_data__avg"]
        self.save()

    def update_max_min(self):
        base = (
            AreaData.objects.filter(area__area_type=self.area_type, data_type=self)
            .annotate(
                cast_data=Cast(Coalesce("int", "float"), output_field=self.cast_field())
            )
            .all()
        )

        max = base.aggregate(Max("cast_data"))
        min = base.aggregate(Min("cast_data"))

        self.maximum = max["cast_data__max"]
        self.minimum = min["cast_data__min"]
        self.save()

    @property
    def cast_field(self):
        return IntegerField

    @property
    def shader_table(self):
        return self.data_set.table

    @property
    def shader_filter(self):
        return {"data_type": self}

    @property
    def auto_conversion_disclaimer(self):
        text = None
        if self.auto_converted:
            if self.auto_converted_text:
                text = self.auto_converted_text
            elif self.area_type.code == "WMC":
                text = "This dataset has been automatically converted from 2025 parliamentary constituencies."
            elif self.area_type.code == "WMC23":
                text = "This dataset has been automatically converted from 2010 parliamentary constituencies."
            else:
                text = "This dataset has been automatically converted from a different boundary type."

        return text


class UserDataSets(models.Model):
    data_set = models.ForeignKey(DataSet, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)


class CommonData(models.Model):
    data_type = models.ForeignKey(DataType, on_delete=models.CASCADE)
    data = models.CharField(max_length=400)
    date = models.DateTimeField(blank=True, null=True)
    float = models.FloatField(blank=True, null=True)
    int = models.IntegerField(blank=True, null=True)
    json = models.JSONField(blank=True, null=True, encoder=DBJSONEncoder)

    def value(self):
        try:
            if self.is_date:
                return self.date
            elif self.is_float:
                if self.float is None:
                    return 0
                return self.float
            elif self.is_number:
                if self.int is None:
                    return 0
                return self.int
            elif self.is_json or self.is_url:
                return self.json
        except ValueError:
            return self.data

        return self.data

    def opacity(self, min, max):
        if self.is_number:
            inc = (max - min) / 100
            if max == min:
                opacity = 100
            elif self.value() == min:
                opacity = min / inc
            else:
                opacity = (self.value() - min) / inc
            return opacity / 100
        return 100

    @property
    def average(self):
        return self.data_type.average

    @property
    def label(self):
        return self.data_type.label

    @property
    def is_number(self):
        return self.data_type.is_number

    @property
    def is_percentage(self):
        return self.data_type.is_percentage

    @property
    def is_float(self):
        return self.data_type.is_float

    @property
    def is_date(self):
        return self.data_type.is_date

    @property
    def is_json(self):
        return self.data_type.is_json

    @property
    def is_url(self):
        return self.data_type.is_url

    class Meta:
        abstract = True


class GenericData(CommonData):
    created_at = models.DateTimeField(auto_now_add=True)
    last_update = models.DateTimeField(auto_now=True)
    parsed_json = models.JSONField(blank=True, null=True, encoder=DBJSONEncoder)
    point = PointField(srid=4326, blank=True, null=True)
    polygon = MultiPolygonField(srid=4326, blank=True, null=True)
    area = models.ForeignKey(
        "Area",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="generic_data",
    )
    postcode_data = JSONField(blank=True, null=True)
    postcode = models.CharField(max_length=1000, blank=True, null=True)
    first_name = models.CharField(max_length=300, blank=True, null=True)
    last_name = models.CharField(max_length=300, blank=True, null=True)
    full_name = models.CharField(max_length=300, blank=True, null=True)
    email = models.EmailField(max_length=300, blank=True, null=True)
    phone = models.CharField(max_length=100, blank=True, null=True)
    start_time = models.DateTimeField(blank=True, null=True)
    end_time = models.DateTimeField(blank=True, null=True)
    public_url = models.URLField(max_length=2000, blank=True, null=True)
    social_url = models.URLField(max_length=2000, blank=True, null=True)
    geocode_data = models.JSONField(blank=True, null=True)
    geocoder = models.CharField(max_length=1000, blank=True, null=True)
    address = models.CharField(max_length=1000, blank=True, null=True)
    title = models.CharField(max_length=1000, blank=True, null=True)
    description = models.TextField(max_length=3000, blank=True, null=True)
    image = models.ImageField(null=True, max_length=1000, upload_to="generic_data")
    can_display_point = models.BooleanField(default=True, null=True, blank=True)

    class Meta:
        unique_together = ["data_type", "data"]

    def remote_url(self):
        return self.data_type.data_set.external_data_source.record_url(
            self.data, self.json
        )

    def __str__(self):
        if self.name:
            return self.name
        return self.data

    @property
    def name(self) -> Optional[str]:
        full_name = (
            self.full_name if self.full_name and len(self.full_name) > 0 else None
        )

        merged_name = (
            f"{self.first_name} {self.last_name}".strip()
            if self.first_name
            and self.last_name
            and len(self.first_name) > 0
            and len(self.last_name) > 0
            else None
        )

        # pick whichever is longer
        if full_name and merged_name:
            full_name = sorted([full_name, merged_name], key=len, reverse=True)[0]

        for option in [full_name, self.first_name, self.last_name, self.title]:
            if option and len(option) > 0:
                return option

        return None

    def get_postcode_data(self) -> Optional[PostcodesIOResult]:
        if self.postcode_data is None:
            return None

        return self.postcode_data

    @cached_property
    def external_data_source(self):
        return self.data_type.data_set.external_data_source

    def save(self, *args, **kwargs):
        if self.phone:
            try:
                self.phone = validate_and_format_phone_number(
                    self.phone, self.external_data_source.countries
                )
            except ValidationError as e:
                raise ValidationError({"phone": f"Invalid phone number: {e}"})

        super().save(*args, **kwargs)


class Area(models.Model):
    mapit_id = models.CharField(max_length=30)
    mapit_type = models.CharField(max_length=30, db_index=True, blank=True, null=True)
    mapit_generation_low = models.IntegerField(blank=True, null=True)
    mapit_generation_high = models.IntegerField(blank=True, null=True)
    gss = models.CharField(max_length=30)
    name = models.CharField(max_length=200)
    mapit_all_names = models.JSONField(blank=True, null=True)
    area_type = models.ForeignKey(
        AreaType, on_delete=models.CASCADE, related_name="areas"
    )
    geometry = models.TextField(blank=True, null=True)
    polygon = MultiPolygonField(srid=4326, blank=True, null=True)
    point = PointField(srid=4326, blank=True, null=True)
    overlaps = models.ManyToManyField("self", through="AreaOverlap")

    class Meta:
        indexes = [models.Index(fields=["gss"])]
        unique_together = ["gss", "area_type"]

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return f"/area/{self.area_type.code}/{self.name}"

    def get_value(self, dataset):
        area = self

        if dataset.table == "areadata":
            scope = area.areadata_set
        else:
            person = area.person_set.first()
            scope = person.persondata_set if person else None

        if scope is None:
            return None

        data = scope.get(data_type__data_set=dataset)
        return data.value() if data else None

    @classmethod
    def get_by_gss(cls, gss, area_type="WMC"):
        try:
            area = cls.objects.get(gss=gss, area_type__code=area_type)
        except cls.DoesNotExist:
            area = None

        return area

    @classmethod
    def get_by_name(cls, name, area_type="WMC"):
        return (
            cls.objects.filter(name__iexact=name, area_type__code=area_type)
            .order_by("-mapit_generation_high")
            .first()
        )

    def fit_bounds(self):
        """
        Useful for mapbox's fitBounds method
        """
        if self.polygon:
            bounds_tuple = self.polygon.extent
            return [
                [bounds_tuple[0], bounds_tuple[1]],
                [bounds_tuple[2], bounds_tuple[3]],
            ]


class AreaOverlap(models.Model):
    area_old = models.ForeignKey(
        Area, on_delete=models.CASCADE, related_name="old_overlaps"
    )
    area_new = models.ForeignKey(
        Area, on_delete=models.CASCADE, related_name="new_overlaps"
    )
    population_overlap = models.SmallIntegerField(default=0)
    area_overlap = models.SmallIntegerField(default=0)


class AreaData(CommonData):
    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name="data")


class Person(models.Model):
    person_type = models.CharField(max_length=10)
    external_id = models.CharField(db_index=True, max_length=20)
    id_type = models.CharField(max_length=30)
    name = models.CharField(max_length=500)
    area = models.ForeignKey(Area, on_delete=models.CASCADE)
    photo = models.ImageField(null=True, upload_to="person")
    start_date = models.DateField(null=True)
    end_date = models.DateField(null=True)

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        area = self.area
        return f"/area/{area.area_type.code}/{area.name}"

    class Meta:
        unique_together = ("external_id", "id_type")
        indexes = [models.Index(fields=["external_id", "id_type"])]


class PersonData(CommonData):
    person = models.ForeignKey(Person, on_delete=models.CASCADE)


class Token(models.Model):
    DOMAINS = [("user", "User")]
    token = models.CharField(max_length=300)
    domain = models.CharField(max_length=50, choices=DOMAINS)
    domain_id = models.IntegerField()


@receiver(models.signals.pre_save, sender=AreaData)
@receiver(models.signals.pre_save, sender=PersonData)
def cast_data(sender, instance, *args, **kwargs):
    if instance.is_date and instance.date is None and instance.data:
        date = datetime.fromisoformat(instance.data)
        # parliament API does not add timezones to things that are dates so we
        # need to add them
        if date.tzinfo is None:
            date = date.replace(tzinfo=timezone.utc)
        instance.date = date
        instance.data = ""

    elif instance.is_float and instance.float is None and instance.data:
        instance.float = float(instance.data)
        instance.data = ""

    elif instance.is_number and instance.int is None and instance.data:
        instance.int = int(instance.data)
        instance.data = ""


class Loaders(TypedDict):
    postcodesIO: DataLoader[str, PostcodesIOResult | None]
    postcodesIOFromPoint: DataLoader[Point, PostcodesIOResult | None]
    fetch_record: DataLoader[str, dict | None]
    source_loaders: dict[str, DataLoader["EnrichmentLookup", str | None]]
    generic_data: DataLoader[str, GenericData | None]
    postgis_geocoder: DataLoader[Point, PostcodesIOResult | None]


class EnrichmentLookup(TypedDict):
    member_id: str
    postcode_data: PostcodesIOResult
    source_id: "ExternalDataSource"
    source_path: str
    source_data: Optional[any]


class UpdateMapping(TypedDict):
    source: str
    # Can be a dot path, for use with benedict
    source_path: str
    destination_column: str


def default_countries():
    return ["GB"]


class ExternalDataSource(PolymorphicModel, Analytics):
    """
    A third-party data source that can be read and optionally written back to.
    E.g. Google Sheet or an Action Network table.
    This class is to be subclassed by specific data source types.
    """

    # Set TRUE for CRMs which have specific storage slots for name/address/etc.
    predefined_column_names = False
    has_webhooks = False
    automated_webhooks = False
    introspect_fields = False
    allow_updates = True
    can_forecast_job_progress = True
    crm_type: str

    # Allow sources to define default values for themselves
    # for example opinionated CRMs which are only for people and have defined slots for data
    defaults = {}

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deduplication_hash = models.CharField(max_length=32, unique=True, editable=False)
    organisation = models.ForeignKey(
        Organisation,
        on_delete=models.CASCADE,
        related_name="external_data_sources",
        null=True,
        blank=True,
    )

    orgs_with_access = models.ManyToManyField(
        Organisation,
        through="hub.SharingPermission",
        related_name="sources_from_other_orgs",
    )

    # TODO: Revisit the rationale behind these data source types, then
    # document what they are in the repo wiki
    # Specifically in terms of geocoding: what is the difference between
    # each type in terms of how they are or can be geocoded, and what the requirements are
    # for the source data to be correctly (successfully) processed
    class DataSourceType(models.TextChoices):
        MEMBER = "MEMBER", "Members or supporters"
        GROUP = "GROUP", "Group or organisation"
        # Example: AREA_STATS expects (requires) a data source with a single row per area code
        # (for example an ONS GSS code for UK geographies) and a column for each stat
        AREA_STATS = "AREA_STATS", "Area statistics"
        EVENT = "EVENT", "Events"
        LOCATION = "LOCATION", "Locations"
        STORY = "STORY", "Stories"
        OTHER = "OTHER", "Other"

    data_type = TextChoicesField(
        choices_enum=DataSourceType, default=DataSourceType.OTHER
    )
    name = models.CharField(max_length=250)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_update = models.DateTimeField(auto_now=True)
    last_import = models.DateTimeField(blank=True, null=True)
    last_materialized = models.DateTimeField(blank=True, null=True)
    # Geocoding data

    can_display_points_publicly = models.BooleanField(default=False)
    can_display_details_publicly = models.BooleanField(default=False)

    class GeographyTypes(models.TextChoices):
        """
        The keys and values here are identical (for GraphQL compatibility)
        and are uppercased versions of the PostcodesIO terms
        (for ease of mapping).
        """

        ADDRESS = "ADDRESS", "Address"
        POSTCODE = "POSTCODE", "Postcode"
        WARD = "WARD", "Ward"
        ADMIN_DISTRICT = "ADMIN_DISTRICT", "Council"
        PARLIAMENTARY_CONSTITUENCY = "PARLIAMENTARY_CONSTITUENCY", "Constituency"
        PARLIAMENTARY_CONSTITUENCY_2024 = (
            "PARLIAMENTARY_CONSTITUENCY_2024",
            "Constituency (2024)",
        )
        COORDINATES = (
            "COORDINATES",
            "Coordinates",
        )
        AREA = "AREA", "Area"
        OUTPUT_AREA = "OUTPUT_AREA", "Census output area"

    GEOCODING_CONFIG_SCHEMA = {
        "type": "object",
        "properties": {
            "type": {
                "type": "string",
                "enum": [
                    GeographyTypes.ADDRESS,
                    GeographyTypes.POSTCODE,
                    GeographyTypes.COORDINATES,
                    GeographyTypes.AREA,
                ],
                "default": GeographyTypes.AREA,
            },
            "components": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "field": {"type": "string"},
                        "type": {"type": "string"},
                        "value": {"type": "string"},
                        "metadata": {
                            "oneOf": [
                                {
                                    "type": "object",
                                    "properties": {
                                        "lih_area_type__code": {
                                            "oneOf": [
                                                {"type": "string"},
                                                {
                                                    "type": "array",
                                                    "items": {"type": "string"},
                                                },
                                            ]
                                        }
                                    },
                                },
                                {
                                    "type": "object",
                                    "properties": {
                                        "mapit_type": {
                                            "oneOf": [
                                                {"type": "string"},
                                                {
                                                    "type": "array",
                                                    "items": {"type": "string"},
                                                },
                                            ]
                                        }
                                    },
                                },
                            ]
                        },
                    },
                },
            },
        },
    }
    geocoding_config = JSONField(
        blank=False, null=False, default=dict, schema=GEOCODING_CONFIG_SCHEMA
    )

    def uses_valid_geocoding_config(self):
        # TODO: Could replace this with a Pydantic schema or something
        return (
            self.geocoding_config is not None
            and isinstance(self.geocoding_config, dict)
            and self.geocoding_config.get("type", None) is not None
            and self.geocoding_config.get("type", None) in self.GeographyTypes.values
            and self.geocoding_config.get("components", None) is not None
            and isinstance(self.geocoding_config.get("components", None), list)
            and len(self.geocoding_config.get("components", [])) > 0
        ) is True

    geography_column_type = TextChoicesField(
        choices_enum=GeographyTypes,
        default=GeographyTypes.POSTCODE,
    )
    geography_column = models.CharField(max_length=250, blank=True, null=True)
    countries = models.JSONField(
        default=default_countries,
        blank=True,
        null=True,
        help_text="ISO 3166-1 alpha-2 country codes for geocoding addresses.",
    )

    # Useful for explicit querying and interacting with members in the UI
    # TODO: longitude_field = models.CharField(max_length=250, blank=True, null=True)
    # TODO: latitude_field = models.CharField(max_length=250, blank=True, null=True)
    postcode_field = models.CharField(max_length=250, blank=True, null=True)
    first_name_field = models.CharField(max_length=250, blank=True, null=True)
    last_name_field = models.CharField(max_length=250, blank=True, null=True)
    full_name_field = models.CharField(max_length=250, blank=True, null=True)
    email_field = models.CharField(max_length=250, blank=True, null=True)
    phone_field = models.CharField(max_length=250, blank=True, null=True)
    address_field = models.CharField(max_length=250, blank=True, null=True)
    title_field = models.CharField(max_length=250, blank=True, null=True)
    description_field = models.CharField(max_length=250, blank=True, null=True)
    image_field = models.CharField(max_length=250, blank=True, null=True)
    start_time_field = models.CharField(max_length=250, blank=True, null=True)
    end_time_field = models.CharField(max_length=250, blank=True, null=True)
    public_url_field = models.CharField(max_length=250, blank=True, null=True)
    social_url_field = models.CharField(max_length=250, blank=True, null=True)
    can_display_point_field = models.CharField(max_length=250, blank=True, null=True)

    import_fields = [
        "postcode_field",
        "first_name_field",
        "last_name_field",
        "full_name_field",
        "email_field",
        "phone_field",
        "address_field",
        "title_field",
        "description_field",
        "image_field",
        "start_time_field",
        "end_time_field",
        "public_url_field",
        "social_url_field",
        "can_display_point_field",
    ]

    @classmethod
    def get_deduplication_field_names(cls) -> list[str]:
        """
        Return the fields that should be used to prevent sources
        being added multiple times, e.g. ["list_id", "api_key"]
        for Mailchimp.
        """
        raise NotImplementedError(
            "Deduplication not implemented for this data source type."
        )

    def get_deduplication_hash(self) -> str:
        # Special path for ExternalDataSource to make this method work
        # while also forcing subclasses to implement get_deduplication_field_names
        if self.__class__ is ExternalDataSource:
            hash_values = ["name"]
        else:
            hash_values = [
                str(getattr(self, field))
                for field in self.get_deduplication_field_names()
            ]
        return hashlib.md5("".join(hash_values).encode()).hexdigest()

    def save(self, *args, **kwargs):
        for key, value in self.defaults.items():
            if (getattr(self, key) is None or getattr(self, key) == "") and (
                value is not None and value != ""
            ):
                setattr(self, key, value)
        # Always keep these two in sync
        if (
            self.geography_column is not None
            and self.geography_column_type == self.GeographyTypes.POSTCODE
        ):
            self.postcode_field = self.geography_column
        elif (
            self.geography_column is not None
            and self.geography_column_type == self.GeographyTypes.ADDRESS
        ):
            self.address_field = self.geography_column

        if not self.deduplication_hash:
            self.deduplication_hash = self.get_deduplication_hash()

        super().save(*args, **kwargs)

    def as_mapping_source(self):
        return {
            "slug": self.id,
            "name": self.name,
            "author": self.organisation.name,
            "description": self.description,
            "source_paths": self.field_definitions,
            "external_data_source": self,
        }

    class FieldDefinition(TypedDict):
        value: str
        type: str = StatisticalDataType.UNKNOWN.value
        label: Optional[str]
        description: Optional[str]
        external_id: Optional[str]
        editable: Optional[bool] = True

    FIELD_DEFINITIONS_SCHEMA = {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "value": {"type": "string", "required": True},
                "type": {"type": "string"},
                "label": {"type": "string"},
                "description": {"type": "string"},
                "external_id": {"type": "string"},
                "editable": {"type": "boolean", "default": True},
            },
        },
    }

    field_definitions = JSONField(
        blank=True, null=True, default=list, schema=FIELD_DEFINITIONS_SCHEMA
    )
    # Auto-updates
    UPDATE_MAPPING_SCHEMA = {
        "type": "array",
        "items": {
            "type": "dict",
            "properties": {
                "source": {"type": "string"},
                "source_path": {"type": "string"},
                "destination_column": {"type": "string"},
            },
        },
    }
    update_mapping = JSONField(
        blank=True, null=True, default=list, schema=UPDATE_MAPPING_SCHEMA
    )
    auto_update_enabled = models.BooleanField(default=False, blank=True)
    # Auto-import
    auto_import_enabled = models.BooleanField(default=False, blank=True)

    def __str__(self):
        return self.name if self.name is not None else super().__str__()

    def event_log_queryset(self):
        return ProcrastinateJob.objects.filter(
            args__external_data_source_id=str(self.id)
        ).order_by("-scheduled_at")

    def get_scheduled_parent_job(self, filter: dict):
        # Find any of this source's jobs that are live, with a request_id which signals a parent job
        some_active_batch_job_for_this_source = (
            self.event_log_queryset()
            .filter(
                **filter, status__in=["todo", "doing"], args__request_id__isnull=False
            )
            .first()
        )
        if some_active_batch_job_for_this_source is None:
            return None
        request_id = some_active_batch_job_for_this_source.args.get("request_id", None)
        # Now find the oldest, first job with that request_id
        original_job = (
            self.event_log_queryset()
            .filter(args__request_id=request_id)
            .order_by("id")
            .first()
        )
        return original_job

    def get_latest_parent_job(self, filter: dict):
        latest_batch_job_for_this_source = (
            self.event_log_queryset()
            .filter(**filter, args__request_id__isnull=False)
            .first()
        )
        if latest_batch_job_for_this_source is None:
            return None
        request_id = latest_batch_job_for_this_source.args.get("request_id", None)
        # Now find the oldest, first job with that request_id
        original_job = (
            self.event_log_queryset()
            .filter(args__request_id=request_id)
            .order_by("id")
            .first()
        )
        return original_job

    def get_scheduled_import_job(self):
        return self.get_scheduled_parent_job(
            dict(task_name__contains="hub.tasks.import")
        )

    def get_scheduled_update_job(self):
        return self.get_scheduled_parent_job(
            dict(task_name__contains="hub.tasks.refresh")
        )

    def get_latest_import_job(self):
        return self.get_latest_parent_job(dict(task_name__contains="hub.tasks.import"))

    def get_latest_update_job(self):
        return self.get_latest_parent_job(dict(task_name__contains="hub.tasks.refresh"))

    class BatchJobProgress(TypedDict):
        status: str
        id: str
        started_at: datetime
        total: int = 0
        succeeded: int = 0
        doing: int = 0
        failed: int = 0
        estimated_seconds_remaining: float = 0
        actual_finish_time: Optional[datetime]
        estimated_finish_time: Optional[datetime]
        has_forecast: bool = True
        seconds_per_record: float = 0
        done: int = 0
        remaining: int = 0
        number_of_jobs_ahead_in_queue: int = 0
        send_email: bool = False

    def get_scheduled_batch_job_progress(self, parent_job: ProcrastinateJob, user=None):
        # TODO: This doesn't work for import/refresh by page. How can it cover this case?
        request_id = parent_job.args.get("request_id")

        if request_id is None:
            return None

        if not self.can_forecast_job_progress:
            request_completed_signal = (
                self.event_log_queryset()
                .filter(
                    args__request_id=request_id,
                    task_name="hub.tasks.signal_request_complete",
                )
                .first()
            )
            if request_completed_signal is not None:
                return self.BatchJobProgress(
                    status=(
                        "succeeded"
                        if request_completed_signal.args.get("success", True)
                        else "failed"
                    ),
                    id=request_id,
                    started_at=parent_job.scheduled_at,
                    has_forecast=False,
                )
            else:
                return self.BatchJobProgress(
                    status=(
                        parent_job.status
                        if parent_job.status != "succeeded"
                        else "doing"
                    ),
                    id=request_id,
                    started_at=parent_job.scheduled_at,
                    has_forecast=False,
                )

        jobs = self.event_log_queryset().filter(args__request_id=request_id).all()
        status = "todo"

        number_of_jobs_ahead_in_queue = (
            ProcrastinateJob.objects.filter(id__lt=parent_job.id)
            .filter(status__in=["todo", "doing"])
            .count()
        )

        if any([job.status == "doing" for job in jobs]):
            status = "doing"
        elif any([job.status == "failed" for job in jobs]):
            status = "failed"
        elif all([job.status == "succeeded" for job in jobs]):
            status = "succeeded"
        elif all([job.status == "todo" for job in jobs]):
            status = "todo"
        elif number_of_jobs_ahead_in_queue <= 0:
            status = "succeeded"

        total = 0
        statuses = dict()

        for job in jobs:
            job_record_count = len(job.args.get("members", []))
            total += job_record_count
            if statuses.get(job.status, None) is not None:
                statuses[job.status] += job_record_count
            else:
                statuses[job.status] = job_record_count

        done = (
            statuses.get("succeeded", 0)
            + statuses.get("failed", 0)
            + statuses.get("doing", 0)
        )

        time_started = (
            ProcrastinateEvent.objects.filter(job_id=parent_job.id)
            .order_by("at")
            .first()
            .at.replace(tzinfo=pytz.utc)
        )

        remaining = total - done

        time_so_far = datetime.now(pytz.utc) - time_started
        duration_per_record = time_so_far / (done or 1)
        time_remaining = duration_per_record * remaining
        estimated_finish_time = datetime.now(pytz.utc) + time_remaining

        if status == "succeeded" or status == "failed":
            actual_finish_time = (
                ProcrastinateEvent.objects.filter(job__in=jobs)
                .order_by("-at")
                .first()
                .at.replace(tzinfo=pytz.utc)
            )

        else:
            actual_finish_time = None

        time_threshold = timedelta(minutes=5)
        send_email = False
        estimated_job_duration = estimated_finish_time - time_started

        if estimated_job_duration > time_threshold:
            send_email = True
            BatchRequest.objects.filter(id=request_id).update(
                send_email=True, status=status
            )

        return self.BatchJobProgress(
            send_email=send_email,
            status=status,
            id=request_id,
            started_at=time_started,
            estimated_seconds_remaining=time_remaining,
            estimated_finish_time=estimated_finish_time,
            actual_finish_time=actual_finish_time,
            seconds_per_record=duration_per_record.seconds,
            total=total,
            done=done,
            remaining=remaining,
            succeeded=statuses.get("succeeded", 0),
            failed=statuses.get("failed", 0),
            doing=statuses.get("doing", 0),
            number_of_jobs_ahead_in_queue=number_of_jobs_ahead_in_queue,
        )

    def get_update_mapping(self) -> list[UpdateMapping]:
        return ensure_list(self.update_mapping)

    def delete(self, *args, **kwargs):
        self.disable_auto_import()
        self.disable_auto_update()
        return super().delete(*args, **kwargs)

    # CRM methods
    # to be implemented by subclasses

    def capture_event(self, event: str, data: dict):
        try:
            crm_type = (
                self.crm_type if hasattr(self, "crm_type") else str(self.__class__)
            )
            posthog.group_identify(
                "external_data_source",
                str(self.id),
                properties={
                    "name": self.name,
                    "data_type": self.data_type,
                    "crm_type": crm_type,
                    "point_geography_type": self.geography_column_type,
                    "organisation_id": self.organisation.pk,
                    "organisation_name": self.organisation.name,
                    "organisation_slug": self.organisation.slug,
                    "created_at": self.created_at,
                },
            )

            posthog.capture(
                "commonknowledge-server-worker",
                event,
                groups={
                    "organisation": self.organisation.pk,
                    "external_data_source": str(self.id),
                },
                properties=dict(
                    external_data_source_id=str(self.id),
                    external_data_source_name=self.name,
                    external_data_source_crm_type=crm_type,
                    external_data_source_data_type=self.data_type,
                    external_data_source_point_geography_type=self.geography_column_type,
                    organsiation_id=self.organisation.pk,
                    organisation_name=self.organisation.name,
                    **(data or {}),
                ),
            )
        except Exception as e:
            logger.error(f"Could not capture posthog event: {e}")

    def healthcheck(self):
        """
        Check the connection to the API.
        """
        raise NotImplementedError(
            "Healthcheck not implemented for this data source type."
        )

    def load_field_definitions(self) -> list[FieldDefinition]:
        """
        Dummy implementation of loading field definitions from an external source.
        """
        raise NotImplementedError(
            "Field definitions not implemented for this data source."
        )

    def refresh_field_definitions(self) -> None:
        """
        Get the fields for the data source, then save them to the database.
        """
        # Keep previously derived type information
        column_types = {}
        for field in self.field_definitions or []:
            column_types[field["value"]] = field.get(
                "type", StatisticalDataType.UNKNOWN.value
            )

        self.field_definitions = self.load_field_definitions()

        # Restore previously derived type information
        for field in self.field_definitions:
            field["type"] = column_types.get(
                field["value"], StatisticalDataType.UNKNOWN.value
            )

        # Only save the source if it already exists in the database
        if self.created_at:
            self.save()

    async def update_field_definition_types(
        self, column_types: dict[str, StatisticalDataType]
    ) -> None:
        processed_fields = []
        for field in self.field_definitions:
            field["type"] = column_types.get(
                field["value"], StatisticalDataType.UNKNOWN
            ).value
            processed_fields.append(field["value"])
        for column, type in column_types.items():
            if column not in processed_fields:
                self.field_definitions.append(
                    {"value": column, "label": column, "type": type.value}
                )
        await self.asave()

    def refresh_materialized_view(self, column_types: dict[str, StatisticalDataType]):
        """
        Creates and refreshes a materialized view for this dataset that creates columns
        for each key of the .json field, typed by statistics.parse_json_and_types
        (these types are also stored on the source's field definitions).

        The view is dropped at the start of the import_all() process in case the data
        types or our implementation has changed.
        """
        logger.info(f"Refreshing materialized view for {self} ({self.id})")
        with connection.cursor() as cursor:
            # Create a materialized view with the GenericData id and postcode_data columns
            table_expr = pgsql.SQL(
                "CREATE MATERIALIZED VIEW IF NOT EXISTS {} AS SELECT id, point, postcode_data, "
            ).format(pgsql.Identifier(f"{self.id}_json"))
            # Add all the parsed_json keys as columns
            column_exprs = []
            for column, type in column_types.items():
                db_safe_column = get_materialized_view_column_name(column)
                column_sql = pgsql.SQL(
                    "(parsed_json->>{})::" + type.get_database_type() + " as {}"
                ).format(pgsql.Literal(column), pgsql.Identifier(db_safe_column))
                column_exprs.append(column_sql)
            # Only include GenericData for the current ExternalDataSource
            from_expr = pgsql.SQL(
                f"""
                FROM {GenericData._meta.db_table}
                WHERE data_type_id IN (
                  SELECT id FROM {DataType._meta.db_table} WHERE data_set_id = (
                    SELECT id FROM {DataSet._meta.db_table} WHERE external_data_source_id = '{self.id}'
                  )
                )
                """
            )
            sql = table_expr + pgsql.SQL(", ").join(column_exprs) + from_expr
            cursor.execute(sql)
            cursor.execute(
                pgsql.SQL("REFRESH MATERIALIZED VIEW {}").format(
                    pgsql.Identifier(f"{self.id}_json")
                )
            )
        self.last_materialized = datetime.now(pytz.utc)
        self.save()

    def drop_materialized_view(self):
        with connection.cursor() as cursor:
            sql = pgsql.SQL("DROP MATERIALIZED VIEW IF EXISTS {}").format(
                pgsql.Identifier(f"{self.id}_json")
            )
            cursor.execute(sql)

    def remote_name(self) -> Optional[str]:
        """
        Get the name of the data source in the remote system.
        """
        return None

    def record_url_template(self) -> Optional[str]:
        """
        Get the URL template for a record in the remote system.
        """
        return None

    def record_url(self, record_id: str, record_data: dict) -> Optional[str]:
        """
        Get the URL of a record in the remote system.
        """
        return None

    def remote_url(self) -> Optional[str]:
        """
        Get the URL of the data source in the remote system.
        """
        return None

    def setup_webhooks(self, refresh=True):
        """
        Set up a webhook.
        """
        raise NotImplementedError(
            "Webhook setup not implemented for this data source type."
        )

    def refresh_webhooks(self):
        """
        Refresh the webhook.
        """
        return self.setup_webhooks()

    def get_webhooks(self):
        """
        Refresh the webhook.
        """
        raise NotImplementedError(
            "Get webhooks not implemented for this data source type."
        )

    def webhook_healthcheck(self):
        if self.has_webhooks is False:
            return False
        if self.automated_webhooks is False:
            return True
        expected_webhooks = 0
        if self.auto_update_enabled or self.auto_import_enabled:
            expected_webhooks += 1
        webhooks = []
        try:
            webhooks = self.get_webhooks()
        except Exception as e:
            logger.error(f"Could't fetch webhooks: {e}")
            raise ValueError("Couldn't fetch webhooks")
        if len(webhooks) < expected_webhooks:
            raise ValueError("Webhook healthcheck: Not enough webhooks")
        if len(webhooks) > expected_webhooks:
            raise ValueError("Webhook healthcheck: Too many webhooks")
        return True

    def extra_webhook_healthcheck(self, webhooks):
        return True

    def webhook_url(self):
        return urljoin(
            settings.BASE_URL,
            reverse("external_data_source_webhook", args=[self.id]),
        )

    def webhook_create_url(self):
        return urljoin(
            settings.BASE_URL,
            reverse("external_data_source_create_webhook", args=[self.id]),
        )

    def get_member_ids_from_webhook(self, payload: dict) -> list[str]:
        """
        Get the member ID from the webhook payload.
        """
        raise NotImplementedError(
            "Get member ID not implemented for this data source type."
        )

    async def import_page(self, page: int) -> bool:
        """
        Page starts at 1. Returns True if the next page
        contains further data.
        """
        logger.info(f"Importing page {page} for {self}")
        members, has_more = await self.fetch_page(page)
        if not members:
            logger.info(f"No more members by page {page} for {self}")
            return 0
        count = len(members)
        await self.import_many(members)
        logger.info(f"Imported {count} members from page {page} for {self}")
        return has_more

    async def import_many(self, members: list):
        """
        Members doesn't mean members, it's actually generic records.
        Copy data to this database for use in dashboarding features.
        """

        from hub.data_imports.geocoding_config import Geocoder

        if not members:
            logger.error("import_many called with 0 records")
            return

        if is_maybe_id(members[0]):
            data = await self.fetch_many(members)
        else:
            data = members

        # A Local Intelligence Hub record of this data
        data_set, created = await DataSet.objects.aupdate_or_create(
            external_data_source=self,
            defaults={
                "name": str(self.id),
                "data_type": "json",
                "table": "commondata",
                "default_value": {},
                "is_filterable": True,
                "is_shadable": False,
                "is_public": False,
            },
        )

        data_type, created = await DataType.objects.aupdate_or_create(
            data_set=data_set, name=self.id, defaults={"data_type": "json"}
        )

        loaders = await self.get_loaders()
        geocoder_context = geocoding_config.GeocoderContext()

        logger.info(f"Importing {len(members)} records")

        if self.uses_valid_geocoding_config():
            geocode_results = await asyncio.gather(
                *[
                    geocoding_config.geocode_record(
                        record, self, data_type, loaders, geocoder_context
                    )
                    for record in data
                ]
            )

            geocode_results = [r for r in geocode_results if r]
            if not geocode_results or len(geocode_results) == 0:
                return

            unique_fields = ["data_type", "data"]
            # Update all other fields in GeocodeResult
            update_fields = [
                field
                for field in geocode_results[0].__dict__.keys()
                if field not in unique_fields and field != "column_types"
            ]

            generic_data = []
            column_types = {}
            for result in geocode_results:
                # Get the result as a dictionary
                data_dict = result.__dict__
                # Remove the column_types key and add it to the overall type dict
                merge_column_types(column_types, data_dict.pop("column_types"))
                # Create a GenericData from the dict
                generic_data.append(GenericData(**data_dict))

            await self.update_field_definition_types(column_types)

            logger.info(
                f"Geocoded {len(members)} records, first data: {generic_data[0].data}"
            )

            await GenericData.objects.abulk_create(
                generic_data,
                update_conflicts=True,
                unique_fields=["data_type", "data"],
                update_fields=update_fields,
            )

            logger.info(
                f"Updated {len(members)} records, first data: {generic_data[0].data}"
            )
        elif (
            self.geography_column
            and self.geography_column_type == self.GeographyTypes.POSTCODE
        ):

            async def create_import_record(record):
                """
                Converts a record fetched from the API into
                a GenericData record in the MEEP db.

                Used to batch-import data.
                """
                structured_data = get_update_data(self, record)
                column_types = structured_data.pop("column_types")
                postcode_data: PostcodesIOResult = await loaders["postcodesIO"].load(
                    self.get_record_field(record, self.geography_column)
                )
                update_data = {
                    **structured_data,
                    "postcode_data": postcode_data,
                    "geocoder": Geocoder.POSTCODES_IO.value,
                    "point": (
                        Point(
                            postcode_data["longitude"],
                            postcode_data["latitude"],
                        )
                        if (
                            postcode_data is not None
                            and "latitude" in postcode_data
                            and "longitude" in postcode_data
                        )
                        else None
                    ),
                }

                await GenericData.objects.aupdate_or_create(
                    data_type=data_type,
                    data=self.get_record_id(record),
                    defaults=update_data,
                )

                return column_types

            all_column_types = await asyncio.gather(
                *[create_import_record(record) for record in data]
            )
            combined_column_types = {}
            for column_types in all_column_types:
                merge_column_types(combined_column_types, column_types)
            await self.update_field_definition_types(combined_column_types)
        elif (
            self.geography_column
            and self.geography_column_type == self.GeographyTypes.WARD
        ):

            async def create_import_record(record):
                structured_data = get_update_data(self, record)
                column_types = structured_data.pop("column_types")
                gss = self.get_record_field(record, self.geography_column)
                ward = await Area.objects.filter(
                    area_type__code="WD23",
                    gss=gss,
                ).afirst()
                if ward:
                    coord = ward.point.centroid
                    postcode_data = await loaders["postcodesIOFromPoint"].load(coord)
                else:
                    logger.warning(
                        f"Could not find ward for record {self.get_record_id(record)} and gss {gss}"
                    )
                    postcode_data = None

                update_data = {
                    **structured_data,
                    "area": ward,
                    "point": ward.point,
                    "postcode_data": postcode_data,
                }

                await GenericData.objects.aupdate_or_create(
                    data_type=data_type,
                    data=self.get_record_id(record),
                    defaults=update_data,
                )

                return column_types

            all_column_types = await asyncio.gather(
                *[create_import_record(record) for record in data]
            )
            combined_column_types = {}
            for column_types in all_column_types:
                merge_column_types(combined_column_types, column_types)
            await self.update_field_definition_types(combined_column_types)

            logger.info(f"Imported {len(data)} records from {self}")
        elif (
            self.geography_column
            and self.geography_column_type == self.GeographyTypes.OUTPUT_AREA
        ):

            async def create_import_record(record):
                structured_data = get_update_data(self, record)
                column_types = structured_data.pop("column_types")
                gss = self.get_record_field(record, self.geography_column)
                output_area = await Area.objects.filter(
                    area_type__code="OA21",
                    gss=gss,
                ).afirst()
                if output_area:
                    postcode_data = await geocoding_config.get_postcode_data_for_area(
                        output_area, loaders, []
                    )
                    if postcode_data:
                        # override lat/lng based output_area with known output area
                        postcode_data.output_area = output_area.name
                        postcode_data.codes.output_area = gss
                else:
                    logger.warning(
                        f"Could not find output area for record {self.get_record_id(record)} and gss {gss}"
                    )
                    postcode_data = None

                update_data = {
                    **structured_data,
                    "area": output_area,
                    "point": output_area.point,
                    "postcode_data": postcode_data,
                }

                await GenericData.objects.aupdate_or_create(
                    data_type=data_type,
                    data=self.get_record_id(record),
                    defaults=update_data,
                )

                return column_types

            all_column_types = await asyncio.gather(
                *[create_import_record(record) for record in data]
            )
            combined_column_types = {}
            for column_types in all_column_types:
                merge_column_types(combined_column_types, column_types)
            await self.update_field_definition_types(combined_column_types)

            logger.info(f"Imported {len(data)} records from {self}")

        elif (
            self.geography_column
            and self.geography_column_type == self.GeographyTypes.ADDRESS
        ):

            async def create_import_record(record):
                """
                Converts a record fetched from the API into
                a GenericData record in the MEEP db.

                Used to batch-import data.
                """
                structured_data = get_update_data(self, record)
                column_types = structured_data.pop("column_types")
                address = self.get_record_field(record, self.geography_column)
                point = None
                address_data = None
                postcode_data = None
                if address is None or (
                    isinstance(address, str)
                    and (address.strip() == "" or address.lower() == "online")
                ):
                    address_data = None
                else:
                    # async-ify the function because it uses sync cache queries
                    address_data = await sync_to_async(google_maps.geocode_address)(
                        google_maps.GeocodingQuery(
                            query=address,
                            country=self.countries,
                        )
                    )
                    if address_data is not None:
                        point = (
                            Point(
                                x=address_data.geometry.location.lng,
                                y=address_data.geometry.location.lat,
                            )
                            if (
                                address_data is not None
                                and address_data.geometry is not None
                                and address_data.geometry.location is not None
                            )
                            else None
                        )
                        if point is not None:
                            # Capture this so we have standardised Postcodes IO data for all records
                            # (e.g. for analytical queries that aggregate on region)
                            # even if the address is not postcode-specific (e.g. "London").
                            # this can be gleaned from geocode_data__types, e.g. [ "administrative_area_level_1", "political" ]
                            postcode_data = await loaders["postcodesIOFromPoint"].load(
                                point
                            )

                update_data = {
                    **structured_data,
                    "postcode_data": postcode_data,
                    "geocode_data": address_data,
                    "geocoder": (
                        Geocoder.GOOGLE.value if address_data is not None else None
                    ),
                    "point": point,
                }

                await GenericData.objects.aupdate_or_create(
                    data_type=data_type,
                    data=self.get_record_id(record),
                    defaults=update_data,
                )

                return column_types

            all_column_types = await asyncio.gather(
                *[create_import_record(record) for record in data]
            )
            combined_column_types = {}
            for column_types in all_column_types:
                merge_column_types(combined_column_types, column_types)
            await self.update_field_definition_types(combined_column_types)
        else:
            # To allow us to lean on LIH's geo-analytics features,
            # TODO: Re-implement this data as `AreaData`, linking each datum to an Area/AreaType as per `self.geography_column` and `self.geography_column_type`.
            # This will require importing other AreaTypes like admin_district, Ward
            for record in data:
                update_data = get_update_data(self, record)
                column_types = update_data.pop("column_types")
                data, created = await GenericData.objects.aupdate_or_create(
                    data_type=data_type,
                    data=self.get_record_id(record),
                    defaults=update_data,
                )
                await self.update_field_definition_types(column_types)
        self.last_import = datetime.now(tz=pytz.UTC)
        await self.asave()

    async def fetch_one(self, member_id: str):
        """
        Get one member from the data source.
        """
        raise NotImplementedError("Get one not implemented for this data source type.")

    async def fetch_many(self, id_list: list[str]):
        """
        Get many members from the data source.
        """
        raise NotImplementedError("Get many not implemented for this data source type.")

    async def fetch_page(self, page: int, max_page_size=500) -> tuple[list, bool]:
        """
        Get a page of members from the data source. Should return a tuple:
        (members: list, has_more: boolean) to indicate if more data
        exists in subsequent pages.
        """
        raise NotImplementedError("Get page not implemented for this data source type.")

    async def fetch_all(self):
        """
        Get all members from the data source.
        """
        raise NotImplementedError("Get all not implemented for this data source type.")

    MappedMember = TypedDict(
        "MatchedMember", {"member": dict, "update_fields": dict[str, any]}
    )

    async def update_one(self, mapped_record: MappedMember, **kwargs):
        """
        Append data for one member to the table.
        """
        raise NotImplementedError(
            "Update one not implemented for this data source type."
        )

    async def update_many(self, mapped_records: list[MappedMember], **kwargs):
        """
        Append mapped data to the table.
        """
        raise NotImplementedError(
            "Update many not implemented for this data source type."
        )

    def get_record_id(self, record) -> Optional[Union[str, int]]:
        """
        Get the ID for a record.
        """
        return record.get("id", None)

    def get_record_field(self, record: dict, field: str, field_type=None):
        """
        Get a field from a record.
        """
        return get(record, field, None)

    def get_record_dict(self, record: any) -> dict:
        """
        Get a record as a dictionary.
        """
        return record

    # Mapping mechanics

    async def fetch_many_loader(self, keys):
        results = await self.fetch_many(keys)
        # sort results by keys, including None
        return [
            next(
                (result for result in results if self.get_record_id(result) == key),
                None,
            )
            for key in keys
        ]

    def get_import_data(self, **kwargs):
        return GenericData.objects.filter(
            data_type__data_set__external_data_source_id=self.id
        )

    async def imported_data_loader(self, record_ids):
        """
        A dataloader function for getting already-imported GenericData
        for a given record ID. This ID should be the result of calling
        get_record_id(record) on the source data (i.e. the record that
        comes from the 3rd party data source) – NOT the GenericData.id.
        """
        if not record_ids:
            return []

        logger.info(
            f"Loading previously imported data for {len(record_ids)} records, first data: {record_ids[0]}"
        )
        results = GenericData.objects.filter(
            data_type__data_set__external_data_source_id=self.id, data__in=record_ids
        ).select_related("area")
        results = await sync_to_async(list)(results)

        logger.info(f"Loaded previously imported data, first data: {record_ids[0]}")
        return [
            next(
                (result for result in results if result.data == id),
                None,
            )
            for id in record_ids
        ]

    def get_analytics_queryset(self, **kwargs):
        return self.get_import_data()

    def get_imported_dataframe(self):
        json_list = [
            {
                **(d.postcode_data if d.postcode_data else {}),
                **(d.json if d.json else {}),
                "__mapped_id": d.data,
            }
            for d in self.get_import_data()
        ]
        logger.debug("building imported data frame")
        enrichment_df = pd.DataFrame.from_records(json_list)
        logger.debug(f"got imported data frame with {len(json_list)} rows")
        return enrichment_df

    def data_loader_factory(self):
        async def fetch_enrichment_data(keys: List[EnrichmentLookup]) -> list[str]:
            return_data = []
            enrichment_df = await sync_to_async(self.get_imported_dataframe)()
            for key in keys:
                logger.debug(
                    f"loading enrichment data for key {key['member_id']} {key['source_id']} {key['source_path']}"
                )
                try:
                    if key.get("postcode_data", None) is None:
                        logger.debug(
                            f"returning none for key {key['member_id']} because postcode data is none"
                        )
                        return_data.append(None)
                        continue
                    postcodes_io_key = self.geography_column_type.lower()
                    relevant_member_geography = get(
                        key["postcode_data"], postcodes_io_key, ""
                    )
                    # Backup check if the geography refers to the GSS codes, not the name
                    if (
                        relevant_member_geography == ""
                        or relevant_member_geography is None
                    ):
                        relevant_member_geography = get(
                            key["postcode_data"]["codes"],
                            postcodes_io_key,
                            "",
                        )
                    if (
                        relevant_member_geography == ""
                        or relevant_member_geography is None
                    ):
                        logger.debug(
                            f"returning none for key {key['member_id']} because relevant_member_geography is blank"
                        )
                        return_data.append(None)
                        continue
                    else:
                        logger.debug(
                            f"picking key {key['member_id']} {key['source_path']} from data frame"
                        )
                        enrichment_value = enrichment_df.loc[
                            # Match the member's geography to the enrichment source's geography
                            enrichment_df[self.geography_column]
                            == relevant_member_geography,
                            # and return the requested value for this enrichment source row
                            key["source_path"],
                        ].values
                        if enrichment_value is not None:
                            enrichment_value = enrichment_value[0]
                            if enrichment_value is np.nan or enrichment_value == np.nan:
                                logger.debug(
                                    f"missing data for {key['member_id']} {key['source_path']}"
                                )
                                return_data.append(None)
                            else:
                                logger.debug(
                                    f"picked {enrichment_value} for {key['member_id']} {key['source_path']}"
                                )
                                return_data.append(enrichment_value)
                        else:
                            logger.debug(
                                f"missing data for {key['member_id']} {key['source_path']}"
                            )
                            return_data.append(None)
                except Exception as e:
                    logger.debug(f"loader exception {e}")
                    return_data.append(None)

            return return_data

        def cache_key_fn(key: EnrichmentLookup) -> str:
            return f"{key['member_id']}_{key['source_id']}_{key['source_path']}"

        return DataLoader(load_fn=fetch_enrichment_data, cache_key_fn=cache_key_fn)

    async def get_loaders(self) -> Loaders:
        loaders = Loaders(
            postcodesIO=DataLoader(load_fn=get_bulk_postcode_geo),
            postcodesIOFromPoint=DataLoader(load_fn=get_bulk_postcode_geo_from_coords),
            postgis_geocoder=DataLoader(
                load_fn=postgis_geocoder.get_bulk_postcode_geo_from_coords
            ),
            fetch_record=DataLoader(load_fn=self.fetch_many_loader, cache=False),
            source_loaders=await self.get_source_loaders(),
            generic_data=DataLoader(load_fn=self.imported_data_loader),
        )

        return loaders

    async def get_source_loaders(self) -> dict[str, Self]:
        # If this isn't preloaded, it is a sync function to use self.organisation
        org: Organisation = await sync_to_async(getattr)(self, "organisation")
        loaders = {}

        if org is None:
            return loaders

        sources = (
            org.get_external_data_sources(
                # Allow enrichment via sources shared with this data source's organisation
                include_shared=True,
                sharing_permission_filters={
                    "visibility_record_coordinates": True,
                    "visibility_record_details": True,
                },
            )
            .filter(
                geography_column__isnull=False,
                geography_column_type__isnull=False,
            )
            .all()
        )

        async for source in sources:
            loaders[str(source.id)] = source.data_loader_factory()

        return loaders

    async def map_one(
        self,
        member: Union[str, dict],
        loaders: Loaders,
        mapping: list[UpdateMapping] = None,
    ) -> MappedMember:
        """
        Match one member to a record in the data source, via ID or record.
        """
        if type(member) is str:
            member = await loaders["fetch_record"].load(member)

        if member is None:
            # TODO: write tests for the case when the loader fails for a member
            return None

        if mapping is None or len(mapping) == 0:
            mapping = self.get_update_mapping()
        if mapping is None or len(mapping) == 0:
            return self.MappedMember(member=member, update_fields={})

        id = self.get_record_id(member)
        update_fields = {}
        try:
            logger.debug(f"mapping member {id} {mapping}")
            postcode_data = None
            if self.geography_column_type == self.GeographyTypes.POSTCODE:
                # Get postcode from member
                postcode = self.get_record_field(member, self.geography_column)
                # Get relevant config data for that postcode
                postcode_data = await loaders["postcodesIO"].load(postcode)
            # Map the fields
            for mapping_dict in mapping:
                source = mapping_dict["source"]
                source_path = mapping_dict["source_path"]
                destination_column = mapping_dict["destination_column"]
                if source == "postcodes.io":
                    if postcode_data is not None:
                        update_fields[destination_column] = get(
                            postcode_data, source_path
                        )
                        continue
                if (
                    enrichment_source := builtin_mapping_sources.get(source, None)
                ) is not None and (
                    fetch_fn := enrichment_source.get("async_postcode_request", None)
                ) is not None:
                    row = await fetch_fn(postcode)
                    try:
                        update_fields[destination_column] = get(row, source_path, None)
                    except Exception as e:
                        logger.debug(f"mapping exception {e}")
                        # TODO: Sentry logging
                        pass
                    continue
                try:
                    source_loader = loaders["source_loaders"].get(source, None)
                    if source_loader is not None and postcode_data is not None:
                        loaded = await source_loader.load(
                            EnrichmentLookup(
                                member_id=self.get_record_id(member),
                                postcode_data=postcode_data,
                                source_id=source,
                                source_path=source_path,
                            )
                        )
                        logger.debug(
                            f"setting {source_path} {destination_column} to {loaded}"
                        )
                        update_fields[destination_column] = loaded
                        continue
                except Exception as e:
                    logger.debug(f"mapping exception {e}")
                    continue
            # Return the member and config data
            logger.debug(f"mapped member {id} {update_fields}")
            return self.MappedMember(member=member, update_fields=update_fields)
        except TypeError:
            # Error fetching postcode data
            return self.MappedMember(member=member, update_fields={})

    async def map_many(
        self,
        members: list,
        loaders: Loaders,
        mapping: list[UpdateMapping] = None,
    ) -> list[MappedMember]:
        """
        Match many members to records in the data source.
        """
        if mapping is None or len(mapping) == 0:
            mapping = self.get_update_mapping()

        return await asyncio.gather(
            *[self.map_one(member, loaders, mapping=mapping) for member in members]
        )

    async def refresh_one(
        self,
        member,
        update_kwargs={},
        mapping: list[UpdateMapping] = None,
    ):
        if not self.allow_updates:
            logger.error(f"Updates requested for non-updatable CRM {self}")
            return

        if mapping is None or len(mapping) == 0:
            mapping = self.get_update_mapping()
        if len(mapping) == 0:
            return
        loaders = await self.get_loaders()
        mapped_record = await self.map_one(member, loaders, mapping=mapping)
        return await self.update_one(mapped_record, **update_kwargs)

    async def refresh_page(self, page: int) -> bool:
        """
        Page starts at 1. Returns True if the next page
        contains further data.
        """
        logger.info(f"Refreshing page {page} for {self}")
        members, has_more = await self.fetch_page(page)
        if not members:
            logger.info(f"No more members by page {page} for {self}")
            return 0
        count = len(members)
        await self.refresh_many(members)
        logger.info(f"Refreshed {count} members from page {page} for {self}")
        return has_more

    async def refresh_many(
        self,
        members: list,
        update_kwargs={},
        mapping: list[UpdateMapping] = None,
    ):
        if not self.allow_updates:
            logger.error(f"Updates requested for non-updatable CRM {self}")
            return

        if mapping is None or len(mapping) == 0:
            mapping = self.get_update_mapping()
        if len(mapping) == 0:
            return
        loaders = await self.get_loaders()
        mapped_records = await self.map_many(members, loaders, mapping=mapping)
        return await self.update_many(mapped_records=mapped_records, **update_kwargs)

    # UI

    def enable_auto_import(self) -> Union[None, int]:
        self.auto_import_enabled = True
        if self.automated_webhooks:
            self.refresh_webhooks()
            # And schedule a cron to keep doing it
            refresh_webhooks.defer(
                external_data_source_id=str(self.id),
            )
        self.save()

    def disable_auto_import(self):
        self.auto_import_enabled = False
        self.save()
        if self.automated_webhooks and hasattr(self, "teardown_unused_webhooks"):
            self.teardown_unused_webhooks()

    def enable_auto_update(self) -> Union[None, int]:
        if not self.allow_updates:
            logger.error(f"Updates requested for non-updatable CRM {self}")
            return

        self.auto_update_enabled = True
        if self.automated_webhooks:
            self.refresh_webhooks()
            # And schedule a cron to keep doing it
            refresh_webhooks.defer(
                external_data_source_id=str(self.id),
            )
        self.save()

    def disable_auto_update(self):
        if not self.allow_updates:
            logger.error(f"Updates requested for non-updatable CRM {self}")
            return

        self.auto_update_enabled = False
        self.save()
        if self.automated_webhooks and hasattr(self, "teardown_unused_webhooks"):
            self.teardown_unused_webhooks()

    # Webhooks

    def handle_update_webhook_view(self, member_ids):
        try:
            if not self.allow_updates:
                logger.error(f"Updates requested for non-updatable CRM: {self}")
                return False

            if not self.auto_update_enabled:
                logger.error(
                    f"Updates requested for CRM without webhooks enabled: {self}"
                )
                return False

            if len(member_ids) == 1:
                async_to_sync(self.schedule_refresh_one)(member=member_ids[0])
            else:
                async_to_sync(self.schedule_refresh_many)(members=member_ids)
        except AlreadyEnqueued:
            # This is fine.
            pass
        return True

    def handle_import_webhook_view(self, member_ids):
        try:
            if not self.auto_import_enabled:
                logger.error(
                    f"Imports requested for CRM without webhooks enabled: {self}"
                )
                return False

            async_to_sync(self.schedule_import_many)(members=member_ids)
        except AlreadyEnqueued:
            # This is fine.
            pass
        return True

    # Scheduling

    @classmethod
    async def deferred_refresh_one(cls, external_data_source_id: str, member: str):
        if not cls.allow_updates:
            logger.error(f"Updates requested for non-updatable CRM {cls}")
            return

        external_data_source: ExternalDataSource = await cls.objects.aget(
            id=external_data_source_id
        )
        await external_data_source.refresh_one(member=member)

    @classmethod
    async def deferred_refresh_page(
        cls, external_data_source_id: str, page: int, request_id: str = None
    ) -> bool:
        """
        Returns True if the next page contains further data.
        """
        external_data_source: ExternalDataSource = await cls.objects.aget(
            id=external_data_source_id
        )
        return await external_data_source.refresh_page(page=page)

    @classmethod
    async def deferred_refresh_many(
        cls, external_data_source_id: str, members: list, request_id: str = None
    ):

        if not cls.allow_updates:
            logger.error(f"Updates requested for non-updatable CRM {cls}")
            return

        external_data_source: ExternalDataSource = await cls.objects.aget(
            id=external_data_source_id
        )
        await external_data_source.refresh_many(members=members)

    @classmethod
    async def deferred_refresh_all(
        cls, external_data_source_id: str, request_id: str = None
    ):
        if not cls.allow_updates:
            logger.error(f"Updates requested for non-updatable CRM {cls}")
            return

        external_data_source: ExternalDataSource = await cls.objects.aget(
            id=external_data_source_id
        )

        members = await external_data_source.fetch_all()
        member_count = 0
        batches = batched(members, settings.IMPORT_UPDATE_ALL_BATCH_SIZE)
        for batch in batches:
            member_count += len(batch)
            await external_data_source.schedule_refresh_many(batch, request_id)
        metrics.distribution(key="update_rows_requested", value=member_count)

    @classmethod
    async def deferred_refresh_webhooks(cls, external_data_source_id: str):
        if not cls.has_webhooks:
            return

        external_data_source: ExternalDataSource = await cls.objects.aget(
            pk=external_data_source_id
        )
        if (
            external_data_source.auto_update_enabled
            or external_data_source.auto_import_enabled
        ):
            if external_data_source.automated_webhooks:
                external_data_source.refresh_webhooks()

    @classmethod
    async def deferred_setup_webhooks(cls, external_data_source_id: str, refresh=True):
        if not cls.has_webhooks:
            return

        external_data_source: ExternalDataSource = await cls.objects.aget(
            pk=external_data_source_id
        )

        if (
            external_data_source.auto_update_enabled
            or external_data_source.auto_import_enabled
        ):
            if external_data_source.automated_webhooks:
                external_data_source.setup_webhooks(refresh=refresh)

    @classmethod
    async def deferred_import_many(
        cls, external_data_source_id: str, members: list, request_id: str = None
    ):

        external_data_source: ExternalDataSource = await cls.objects.aget(
            id=external_data_source_id
        )
        await external_data_source.import_many(members=members)

    @classmethod
    async def deferred_import_page(
        cls, external_data_source_id: str, page: int, request_id: str = None
    ) -> bool:
        """
        Returns True if the next page contains further data.
        """
        external_data_source: ExternalDataSource = await cls.objects.aget(
            id=external_data_source_id
        )
        return await external_data_source.import_page(page=page)

    @classmethod
    async def deferred_import_all(
        cls, external_data_source_id: str, request_id: str = None
    ):
        external_data_source: ExternalDataSource = await cls.objects.aget(
            id=external_data_source_id
        )

        # Drop previous materialized view as data may have changed
        await sync_to_async(external_data_source.drop_materialized_view)()
        members = await external_data_source.fetch_all()
        priority_enum = None
        match len(members):
            case _ if len(members) < settings.SUPER_QUICK_IMPORT_ROW_COUNT_THRESHOLD:
                priority_enum = ProcrastinateQueuePriority.SUPER_QUICK
            case _ if len(
                members
            ) < settings.MEDIUM_PRIORITY_IMPORT_ROW_COUNT_THRESHOLD:
                priority_enum = ProcrastinateQueuePriority.MEDIUM
            case _ if len(members) < settings.LARGE_IMPORT_ROW_COUNT_THRESHOLD:
                priority_enum = ProcrastinateQueuePriority.SLOW
            case _:
                priority_enum = ProcrastinateQueuePriority.VERY_SLOW
        member_count = 0
        batches = batched(members, settings.IMPORT_UPDATE_ALL_BATCH_SIZE)
        for i, batch in enumerate(batches):
            logger.info(
                f"Scheduling import batch {i} for source {external_data_source} with priority {priority_enum.name}"
            )
            member_count += len(batch)
            await external_data_source.schedule_import_many(
                batch, request_id=request_id, priority=priority_enum.value
            )
            logger.info(f"Scheduled import batch {i} for source {external_data_source}")
        metrics.distribution(key="import_rows_requested", value=member_count)
        await sync_to_async(call_command)("autoscale_render_workers")

    async def schedule_refresh_one(self, member) -> int:
        logger.info(f"Scheduling refresh one for source {self} and member {member}")
        if not self.allow_updates:
            logger.error(f"Updates requested for non-updatable CRM {self}")
            return

        if is_maybe_id(member):
            member_id = member
        else:
            member_id = self.get_record_id(member)

        try:
            return await refresh_one.configure(
                # Dedupe `update_many` jobs for the same config
                # https://procrastinate.readthedocs.io/en/stable/howto/queueing_locks.html
                queueing_lock=f"update_one_{str(self.id)}_{str(member_id)}",
                schedule_in={"seconds": settings.SCHEDULED_UPDATE_SECONDS_DELAY},
            ).defer_async(external_data_source_id=str(self.id), member=member)
        except (UniqueViolation, IntegrityError) as e:
            logger.error(f"Error in schedule_refresh_one: {e}")

    async def schedule_refresh_many(
        self, members: list[str] | list[dict], request_id: str = None
    ) -> int:
        logger.info(f"Scheduling refresh many for source {self} and members {members}")

        if not self.allow_updates:
            logger.error(f"Updates requested for non-updatable CRM {self}")
            return

        if not members:
            logger.error("Updates requested for 0 members")
            return

        if is_maybe_id(members[0]):
            member_ids = members
        else:
            member_ids = [self.get_record_id(member) for member in members]
        member_ids = [str(x) for x in member_ids if x is not None]

        member_ids_hash = hashlib.md5("".join(sorted(member_ids)).encode()).hexdigest()
        try:
            return await refresh_many.configure(
                # Dedupe `update_many` jobs for the same config
                # https://procrastinate.readthedocs.io/en/stable/howto/queueing_locks.html
                queueing_lock=f"update_many_{str(self.id)}_{member_ids_hash}",
                schedule_in={"seconds": settings.SCHEDULED_UPDATE_SECONDS_DELAY},
            ).defer_async(
                request_id=request_id,
                external_data_source_id=str(self.id),
                members=members,
            )
        except (UniqueViolation, IntegrityError) as e:
            logger.error(f"Error in schedule_refresh_many: {e}")

    async def schedule_refresh_all(self, request_id: str = None) -> int:
        if not self.allow_updates:
            logger.error(f"Updates requested for non-updatable CRM {self}")
            return

        try:
            return await refresh_all.configure(
                # Dedupe `update_all` jobs for the same config
                # https://procrastinate.readthedocs.io/en/stable/howto/queueing_locks.html
                queueing_lock=f"update_all_{str(self.id)}",
                schedule_in={"seconds": settings.SCHEDULED_UPDATE_SECONDS_DELAY},
            ).defer_async(external_data_source_id=str(self.id), request_id=request_id)
        except (UniqueViolation, IntegrityError):
            pass

    async def schedule_import_many(
        self, members: list, request_id: str = None, priority: int = None
    ) -> int:
        if not members:
            logger.error("Import requested for 0 members")
            return

        if is_maybe_id(members[0]):
            member_ids = members
        else:
            member_ids = [self.get_record_id(member) for member in members]
        member_ids = [str(x) for x in member_ids if x is not None]

        member_ids_hash = hashlib.md5("".join(sorted(member_ids)).encode()).hexdigest()
        try:
            return await import_many.configure(
                priority=priority,
                # Dedupe `import_many` jobs for the same config
                # https://procrastinate.readthedocs.io/en/stable/howto/queueing_locks.html
                queueing_lock=f"import_many_{str(self.id)}_{member_ids_hash}",
                schedule_in={"seconds": settings.SCHEDULED_UPDATE_SECONDS_DELAY},
            ).defer_async(
                external_data_source_id=str(self.id),
                members=members,
                request_id=request_id,
            )
        except (UniqueViolation, IntegrityError):
            pass

    async def schedule_import_all(
        self, requested_at: str, request_id: str = None
    ) -> int:
        try:
            return await import_all.configure(
                # Dedupe `import_all` jobs for the same config
                # https://procrastinate.readthedocs.io/en/stable/howto/queueing_locks.html
                queueing_lock=f"import_all_{str(self.id)}",
                schedule_in={"seconds": settings.SCHEDULED_UPDATE_SECONDS_DELAY},
                # So that import jobs themselves can be correctly prioritised
                priority=ProcrastinateQueuePriority.BEFORE_ANY_MORE_IMPORT_EXPORT.value,
            ).defer_async(
                external_data_source_id=str(self.id),
                requested_at=requested_at,
                request_id=request_id,
            )
        except (UniqueViolation, IntegrityError):
            pass

    @classmethod
    async def schedule_import_pages(
        self,
        external_data_source_id: str,
        current_page: int = 1,
        request_id: str = None,
        priority: int = None,
    ) -> int:
        """
        This is a classmethod for a performance boost - the import pages
        flow doesn't need to get the actual instance, it just needs
        the id.
        """
        try:
            return await import_pages.configure(
                # Dedupe `import_pages` jobs for the same config
                # https://procrastinate.readthedocs.io/en/stable/howto/queueing_locks.html
                queueing_lock=f"import_pages_{external_data_source_id}",
                schedule_in={"seconds": settings.SCHEDULED_UPDATE_SECONDS_DELAY},
                priority=priority,
            ).defer_async(
                external_data_source_id=external_data_source_id,
                current_page=current_page,
                request_id=request_id,
            )
        except (UniqueViolation, IntegrityError):
            pass

    @classmethod
    async def schedule_refresh_pages(
        self,
        external_data_source_id: str,
        current_page: int = 1,
        request_id: str = None,
        priority: int = None,
    ) -> int:
        """
        This is a classmethod for a performance boost - the refresh pages
        flow doesn't need to get the actual instance, it just needs
        the id.
        """
        try:
            return await refresh_pages.configure(
                # Dedupe `refresh_pages` jobs for the same config
                # https://procrastinate.readthedocs.io/en/stable/howto/queueing_locks.html
                queueing_lock=f"refresh_pages_{external_data_source_id}",
                schedule_in={"seconds": settings.SCHEDULED_UPDATE_SECONDS_DELAY},
                priority=priority,
            ).defer_async(
                external_data_source_id=external_data_source_id,
                current_page=current_page,
                request_id=request_id,
            )
        except (UniqueViolation, IntegrityError):
            pass

    class CUDRecord(TypedDict):
        """
        Used for tests
        """

        email = str
        postcode = str
        data = dict
        tags = list[str]

    def delete_one(self, record_id: str):
        """
        Used for tests
        """
        raise NotImplementedError(
            "Delete one not implemented for this data source type."
        )

    def create_one(self, record: CUDRecord):
        """
        Used for tests
        """
        raise NotImplementedError(
            "Create one not implemented for this data source type."
        )

    def create_many(self, records: List[CUDRecord]):
        """
        Used for tests
        """
        raise NotImplementedError(
            "Create many not implemented for this data source type."
        )

    class DataPermissions(TypedDict):
        can_display_points: bool = False
        can_display_details: bool = False

        def __str__(self):
            return f"DataPermissions(can_display_points={self.can_display_points}, can_display_details={self.can_display_details})"

    # TODO: cache this and bust it when the db fields change
    def default_data_permissions(self):
        return ExternalDataSource.DataPermissions(
            can_display_points=self.can_display_points_publicly,
            can_display_details=self.can_display_details_publicly,
        )

    @classmethod
    def user_permissions(
        cls,
        user: Union[AbstractBaseUser, str, None],
        external_data_source: Union["ExternalDataSource", str],
    ) -> DataPermissions:
        if external_data_source is None:
            # logger.debug("No source provided, returning default permissions")
            permissions = cls.DataPermissions(
                can_display_points=False,
                can_display_details=False,
            )
            # logger.debug(
            #     "🔍 No source provided, returning default permissions", permissions
            # )
            return permissions

        external_data_source_id = (
            external_data_source
            if isinstance(external_data_source, str)
            else str(external_data_source.id)
        )

        source = ExternalDataSource.objects.get(pk=external_data_source_id)
        permissions: cls.DataPermissions = source.default_data_permissions()

        if user is None:
            # logger.debug(
            #     "🔍 No user provided, returning default permissions", permissions
            # )
            return permissions

        if not user.is_authenticated:
            # logger.debug(
            #     "🔍 User not authenticated, returning default permissions", permissions
            # )
            return permissions

        # Check for cached permissions on this source
        user_id = user if not hasattr(user, "id") else str(user.id)
        # logger.debug(
        #     f"🔍 Checking for cached permissions for user {user_id} on source {external_data_source_id}"
        # )
        permission_cache_key = SharingPermission._get_cache_key(external_data_source_id)
        permissions_dict = cache.get(permission_cache_key)

        if permissions_dict is None:
            permissions_dict = {}

        # If cached permissions exist, look for this user's permissions
        elif permissions_dict.get(user_id, None) is not None:
            # logger.debug("User provided, returning cached permissions")
            # logger.debug(
            #     f"🔍 Cached permissions dict found in cache", permissions_dict[user_id]
            # )
            return permissions_dict[user_id]

        # Calculate permissions for this source
        if not isinstance(external_data_source, ExternalDataSource):
            external_data_source = cls.objects.get(pk=external_data_source)
            if external_data_source is None:
                permissions = cls.DataPermissions(
                    can_display_points=False,
                    can_display_details=False,
                )
                # logger.debug(
                #     "🔍 Source not found, returning default permissions", permissions
                # )
                return permissions

        if user_id is None or external_data_source.organisation is None:
            # logger.debug(
            #     "🔍 User or org not found, returning default permissions", permissions
            # )
            return permissions
        else:
            # If the user's org owns the source, they can see everything
            is_owner = external_data_source.organisation.members.filter(
                user=user_id
            ).exists()
            if is_owner:
                permissions["can_display_points"] = True
                permissions["can_display_details"] = True
                # logger.debug(
                #     f"🔍 User {user_id} is owner, currently looking at {permissions}"
                # )

        # Otherwise, check if their org has sharing permissions at any granularity
        if not is_owner:
            permission = SharingPermission.objects.filter(
                external_data_source=external_data_source,
                organisation__members__user=user_id,
            ).first()
            if permission is not None:
                if permission.visibility_record_coordinates:
                    permissions["can_display_points"] = True
                    if permission.visibility_record_details:
                        permissions["can_display_details"] = True

        permissions_dict[user_id] = permissions

        cache.set(
            permission_cache_key,
            permissions_dict,
            # Cached permissions for this source will be reset on save/delete
            # so we can set the timeout to something fairly generous.
            timeout=60 * 60,
        )

        perms = permissions_dict[user_id]

        # logger.debug(f"🔍 Calculated new user permissions for user {user}: {perms}")
        return perms

    def filter(self, filter: dict) -> dict:
        """
        Look up a record by a value in a column.
        """
        raise NotImplementedError("Lookup not implemented for this data source type.")

    def cancel_jobs(
        self,
        type: "BatchRequest.BatchRequestType" = None,
        # If ALL, then cancel all jobs, regardless of whether they're batched or not
        all=False,
    ):
        """
        Cancel all imports for this data source.
        """
        job_filters = dict(
            args__external_data_source_id=str(self.id),
            status__in=["todo", "doing"],
        )
        if not all:
            # Cancel all BatchRequests
            BatchRequest.objects.filter(
                source=self,
                is_cancelled_by_user=None,
                **({"type": type.value} if type else {}),
            ).update(is_cancelled_by_user=True)

            cancelled_request_ids = BatchRequest.objects.filter(
                source=self,
                is_cancelled_by_user=True,
            )

            job_filters.update(
                args__request_id__in=[
                    str(id) for id in cancelled_request_ids.values_list("id", flat=True)
                ]
            )

        # Cancel all user-requested procrastinate import jobs
        jobs = ProcrastinateJob.objects.filter(**job_filters)

        # by using the sync method
        for job in jobs:
            try:
                procrastinate.job_manager.cancel_job_by_id(job.id, abort=True)
            except Exception as e:
                logger.error(f"Failed to cancel job {job.id}: {e}")

        # run command to update worker instances
        call_command("autoscale_render_workers")


class DataFrameSource(ExternalDataSource):
    class Meta:
        abstract = True

    id_field = models.CharField(max_length=250, default="id")
    use_row_number_as_id = models.BooleanField(default=False)
    internal_id_key = "mapped_internal_data_id"

    def save(self, *args, **kwargs):
        if self.use_row_number_as_id:
            self.id_field = self.internal_id_key
        return super().save(*args, **kwargs)

    def load_data_into_unformatted_df(self) -> pd.DataFrame:
        raise NotImplementedError(
            "load_data_into_unformatted_df not implemented for this data source type."
        )

    @cached_property
    def df(self):
        df = self.load_data_into_unformatted_df()
        if df is None:
            raise ValueError("Could not load CSV file")
        if self.use_row_number_as_id:
            if self.id_field != self.internal_id_key:
                self.id_field = self.internal_id_key
                self.save()
                self.refresh_from_db()
        df[self.internal_id_key] = (
            df.index if self.use_row_number_as_id else df[self.id_field]
        )
        df = df.set_index(self.internal_id_key, drop=False)
        return df

    def load_field_definitions(self):
        return [
            self.FieldDefinition(
                label=key,
                value=key,
                type=StatisticalDataType.from_dtype(dtype),
                editable=self.allow_updates,
            )
            for key, dtype in self.df.dtypes.to_dict().items()
            if key != self.internal_id_key
        ]

    def get_record_id(self, record: dict):
        if record is None:
            return None
        return record.get(self.internal_id_key, None)

    async def fetch_one(self, member_id):
        el = self.df.loc[member_id]
        # Check if series or dataframe
        if isinstance(el, pd.Series):
            return el.to_dict(into=PandasMappingSafeForPG)
        else:
            return el.to_dict(orient="records", into=PandasMappingSafeForPG)[0]

    async def fetch_many(self, id_list: list[str]):
        return self.df.loc[id_list].to_dict(
            orient="records", into=PandasMappingSafeForPG
        )

    async def fetch_all(self):
        return self.df.to_dict(orient="records", into=PandasMappingSafeForPG)

    def get_record_field(self, record, field, field_type=None):
        return get(record, field)

    def get_record_dict(self, record):
        return record


class DatabaseJSONSource(DataFrameSource):
    crm_type = "DatabaseJSONSource"
    has_webhooks = False
    automated_webhooks = False
    introspect_fields = False
    default_data_type = None
    data = JSONField(default=list, blank=True)

    class Meta:
        verbose_name = "Database JSON source"

    @classmethod
    def get_deduplication_field_names(self) -> list[str]:
        return ["id"]

    def healthcheck(self):
        return True

    def load_data_into_unformatted_df(self) -> pd.DataFrame:
        return pd.DataFrame(self.data).set_index(self.id_field, drop=False)

    async def update_one(self, mapped_record, **kwargs):
        id = self.get_record_id(mapped_record["member"])
        data = mapped_record["update_fields"]
        self.data = [
            {**record, **data} if record[self.id_field] == id else record
            for record in self.data
        ]
        await self.asave()

    async def update_many(self, mapped_records, **kwargs):
        for mapped_record in mapped_records:
            await self.update_one(mapped_record)

    def delete_one(self, record_id):
        self.data = [
            record for record in self.data if record[self.id_field] != record_id
        ]
        self.save()

    def create_one(self, record):
        self.data.append(record["data"])
        self.save()
        return record

    def create_many(self, records):
        self.data.extend([record["data"] for record in records])
        self.save()
        return records


class UploadedCSVSource(ExternalDataSource):
    """
    A media URL
    """

    crm_type = "uploadedcsv"
    has_webhooks = False
    automated_webhooks = False
    introspect_fields = True
    allow_updates = False
    default_data_type = ExternalDataSource.DataSourceType.AREA_STATS

    def org_directory_path(instance, filename):
        # file will be uploaded to MEDIA_ROOT/user_<id>/<filename>
        return f"user_content/org_{instance.organisation.pk}/data_sources/{filename}"

    # User provided
    spreadsheet_file = models.FileField(
        upload_to=org_directory_path,
        validators=[FileExtensionValidator(("csv",))],
    )
    delimiter = models.TextField(default=",", blank=True)

    class Meta:
        verbose_name = "Uploaded CSV file"

    @classmethod
    def get_deduplication_field_names(self) -> list[str]:
        return ["spreadsheet_file"]

    def healthcheck(self):
        # Check if file exists in Django
        return self.spreadsheet_file.storage.exists(self.spreadsheet_file.name)

    def load_data_into_unformatted_df(self) -> pd.DataFrame:
        df = None
        if settings.MINIO_STORAGE_ENDPOINT:
            # file_text = io.StringIO(file.read().decode('utf-8')), delimiter=self.delimiter)
            s3_file_location = f"s3://{settings.MINIO_STORAGE_MEDIA_BUCKET_NAME}/{self.spreadsheet_file.name}"
            df = pd.read_csv(
                s3_file_location,
                storage_options={
                    "key": settings.MINIO_ACCESS_KEY,
                    "secret": settings.MINIO_SECRET_KEY,
                    "client_kwargs": {
                        "endpoint_url": f"https://{settings.MINIO_ENDPOINT}"
                    },
                },
                sep=self.delimiter,
                # Read in chunks
                low_memory=True,
            )
        else:
            df = pd.read_csv(
                self.spreadsheet_file.path,
                sep=self.delimiter,
                # Read in chunks
                low_memory=True,
            )
        return df


class AirtableSource(ExternalDataSource):
    """
    An Airtable table.
    """

    crm_type = "airtable"
    api_key = EncryptedCharField(
        max_length=250,
        help_text="Personal access token. Requires the following 4 scopes: data.records:read, data.records:write, schema.bases:read, webhook:manage",
        null=True,
        blank=True,
    )

    base_id = models.CharField(max_length=250)
    table_id = models.CharField(max_length=250)
    has_webhooks = True
    automated_webhooks = True
    introspect_fields = True
    default_data_type = None

    class Meta:
        verbose_name = "Airtable table"

    @classmethod
    def get_deduplication_field_names(self) -> list[str]:
        return ["base_id", "table_id", "api_key"]

    @cached_property
    def api(self) -> AirtableAPI:
        return AirtableAPI(self.api_key)

    @cached_property
    def base(self) -> AirtableBase:
        return self.api.base(self.base_id)

    @cached_property
    def table(self) -> AirtableTable:
        return self.base.table(self.table_id)

    @cached_property
    def schema(self) -> AirtableTableSchema:
        try:
            return self.table.schema()
        except Exception as e:
            logger.error(f"Couldn't get AirTable schema: {e}")
            raise BadCredentialsError()

    def remote_url(self) -> str:
        return f"https://airtable.com/{self.base_id}/{self.table_id}?blocks=hide"

    def healthcheck(self):
        # This throws an exception if the config is bad, so no need to check
        # if the response contains a record or not. This permits empty tables.
        self.table.first()
        return True

    def load_field_definitions(self):
        return [
            self.FieldDefinition(
                label=field.name,
                # For `value`, we use the field name because
                # because in the UI we want users to type the field name, not the field ID
                # and so self.fetch_all doesn't use table(return_fields_by_field_id=True)
                # TODO: implement a field ID lookup in the UI, then revisit this
                value=field.name,
                description=field.description,
                external_id=field.id,
            )
            for field in self.schema.fields
        ]

    def remote_name(self):
        return self.schema.name

    def record_url_template(self):
        return f"https://airtable.com/{self.base_id}/{self.table_id}/{{record_id}}"

    def record_url(self, record_id: str, record_data: dict):
        return f"https://airtable.com/{self.base_id}/{self.table_id}/{record_id}"

    async def fetch_one(self, member_id):
        record = self.table.get(member_id)
        return record

    async def fetch_many(self, id_list: list[str]):
        formula = "OR("
        formula += ",".join([f"RECORD_ID()='{member_id}'" for member_id in id_list])
        formula += ")"
        records = self.table.all(formula=formula)
        return records

    async def fetch_all(self):
        # iterate() returns an Iterator[List[RecordDict]]
        # chain converts this into an Iterator[RecordDict]
        # this makes the data loading from AirTable lazy
        # and reduces memory load
        return itertools.chain.from_iterable(self.table.iterate())

    def get_record_id(self, record):
        return record.get("id", None)

    def get_record_field(self, record, field, field_type=None):
        record_dict = record["fields"] if "fields" in record else record
        d = record_dict.get(str(field), None)
        if field_type == "image_field" and d is not None and len(d) > 0:
            # TODO: implement image handling
            # e.g. [{'id': 'attDWjeMhUfNMTqRG', 'width': 2200, 'height': 1518, 'url': 'https://v5.airtableusercontent.com/v3/u/27/27/1712044800000/CxNHcR-sBRUhrWt_54_NFA/wcYpoqFV5W_wRmVwh2RM8qs-mJkwwHkQLZuhtf7rFk5-34gILMXJeIYg9vQMcTtgSEd1dDb7lU0CrgJldTcZBN9VyaTU0IkYiw1e5PzTs8ZsOEmA6wrva7UavQCnoacL8b7yUt4ZuWWhna8wzZD2MTZC1K1C1wLkfA1UyN76ZDO-Q6WkBjgg5uZv7rtXlhj9/WL6lQJQAHKXqA9J1YIteSJ3J0Yepj69c55PducG607k'
            #     url = d[0]["url"]
            #     return download_file_from_url(url)
            return None
        return d

    def get_record_dict(self, record):
        return record["fields"]

    async def update_one(self, mapped_record, **kwargs):
        await sync_to_async(self.capture_event)("data update", data=dict(count=1))
        return self.table.update(
            self.get_record_id(mapped_record["member"]), mapped_record["update_fields"]
        )

    async def update_many(self, mapped_records, **kwargs):
        await sync_to_async(self.capture_event)(
            "data update", data=dict(count=len(mapped_records))
        )
        return self.table.batch_update(
            [
                {
                    "id": self.get_record_id(mapped_record["member"]),
                    "fields": mapped_record["update_fields"],
                }
                for mapped_record in mapped_records
            ]
        )

    def auto_webhook_specification(self):
        # DOCS: https://airtable.com/developers/web/api/model/webhooks-specification
        return {
            "options": {
                "filters": {
                    "recordChangeScope": self.table_id,
                    "dataTypes": ["tableData"],
                    "changeTypes": [
                        "add",
                        "update",
                    ],
                }
            }
        }

    def get_webhooks(self):
        list = self.base.webhooks()
        webhook_url = self.webhook_url()
        return [webhook for webhook in list if webhook.notification_url == webhook_url]

    def extra_webhook_healthcheck(self, webhooks):
        for webhook in webhooks:
            if not webhook.is_hook_enabled:
                logger.debug("Webhook healthcheck: a webhook expired")
                return False
        return True

    def teardown_unused_webhooks(self, force=False):
        # Only teardown if forced or if no webhook behavior is enabled
        should_teardown = force or (
            not self.auto_import_enabled and not self.auto_update_enabled
        )
        if not should_teardown:
            return
        list = self.base.webhooks()
        for webhook in list:
            if ExternalDataSourceWebhook.base_path in webhook.notification_url:
                webhook.delete()

    def setup_webhooks(self, refresh=True):
        self.teardown_unused_webhooks(force=True)
        # Auto-import
        logger.info(f"Setting up webhooks for source {self}")
        if self.auto_import_enabled or self.auto_update_enabled:
            res = self.base.add_webhook(
                self.webhook_url(), self.auto_webhook_specification()
            )
            logger.info(f"Set up webhook for source {self}: {res}")

    def get_member_ids_from_webhook(self, webhook_payload: dict) -> list[str]:
        member_ids: list[str] = []
        webhook_id = webhook_payload["webhook"]["id"]
        webhook = self.base.webhook(webhook_id)
        webhook_object, is_new = AirtableWebhook.objects.update_or_create(
            airtable_id=webhook_id
        )
        payloads = webhook.payloads(cursor=webhook_object.cursor)
        for payload in payloads:
            webhook_object.cursor = webhook_object.cursor + 1
            for table_id, details in payload.changed_tables_by_id.items():
                if table_id == self.table_id:
                    member_ids += details.changed_records_by_id.keys()
                    member_ids += details.created_records_by_id.keys()
        webhook_object.save()
        member_ids = list(sorted(set(member_ids)))
        logger.debug("Webhook member result", webhook_object.cursor, member_ids)
        return member_ids

    def delete_one(self, record_id):
        return self.table.delete(record_id)

    def create_one(self, record):
        data = {
            **record["data"],
        }
        if self.postcode_field:
            data[self.postcode_field] = record["postcode"]
        if self.email_field:
            data[self.email_field] = record["email"]
        record = self.table.create(data)
        return record

    def create_many(self, records):
        records = self.table.batch_create(
            [
                {
                    **record.get("data", {}),
                    self.postcode_field: record["postcode"],
                    self.email_field: record["email"],
                }
                for record in records
            ]
        )
        return records

    def filter(self, d: dict):
        formula = "AND("
        formula += ",".join([f"{key}='{value}'" for key, value in d.items()])
        formula += ")"
        records = self.table.all(formula=formula)
        return records


class AirtableWebhook(models.Model):
    """
    We need a way to persist the cursor for the Airtable webhook, so we are saving it per-webhook in the DB.
    """

    # Airtable ID
    airtable_id = models.CharField(max_length=250, primary_key=True)
    cursor = models.IntegerField(default=1, blank=True)


class SharingPermission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    last_update = models.DateTimeField(auto_now=True)
    external_data_source = models.ForeignKey(
        ExternalDataSource, on_delete=models.CASCADE
    )
    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE)
    visibility_record_coordinates = models.BooleanField(
        default=False, blank=True, null=True
    )
    visibility_record_details = models.BooleanField(
        default=False, blank=True, null=True
    )

    class Meta:
        unique_together = ["external_data_source", "organisation"]

    @classmethod
    def _get_cache_key(cls, external_data_source_id: str) -> str:
        return f"external_data_source_permissions:{external_data_source_id}"

    def get_cache_key(self) -> str:
        return self._get_cache_key(self.external_data_source_id)


@receiver(models.signals.pre_delete, sender=SharingPermission)
@receiver(models.signals.pre_save, sender=SharingPermission)
def clear_permissions_cache_for_source(sender, instance, *args, **kwargs):
    """
    Clear the cache for the external data source when a sharing permission is saved or deleted
    """
    sharing_permission = instance
    cache.delete(sharing_permission.get_cache_key())


@receiver(models.signals.pre_delete, sender=Membership)
@receiver(models.signals.pre_save, sender=Membership)
def clear_permissions_cache_intersecting_user(sender, instance, *args, **kwargs):
    """
    Since the permissions cache for each source is a dictionary of users, we need to clear it when a membership is saved or deleted as this will affect a user's permissions.
    """
    membership = instance
    sharing_permissions = SharingPermission.objects.filter(
        organisation=membership.organisation
    )
    for sharing_permission in sharing_permissions:
        cache.delete(sharing_permission.get_cache_key())


class Report(PolymorphicModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organisation = models.ForeignKey(
        Organisation, on_delete=models.CASCADE, related_name="reports"
    )
    name = models.CharField(max_length=250)
    slug = models.SlugField(max_length=250, unique=True, default=uuid.uuid4)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_update = models.DateTimeField(auto_now=True)
    public = models.BooleanField(default=False, blank=True)

    def report_image_path(instance, filename):
        # file will be uploaded to MEDIA_ROOT/user_<id>/<filename>
        return f"report/{str(instance.id)}/{filename}"

    cover_image = models.ImageField(
        storage=OverwriteStorage(),
        upload_to=report_image_path,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name


class MailchimpSource(ExternalDataSource):
    """
    A Mailchimp list.
    """

    crm_type = "mailchimp"

    class Meta:
        verbose_name = "Mailchimp list"

    predefined_column_names = True
    has_webhooks = True
    automated_webhooks = True
    introspect_fields = True
    default_data_type = ExternalDataSource.DataSourceType.MEMBER

    defaults = dict(
        # Reports
        data_type=ExternalDataSource.DataSourceType.MEMBER,
        # Geocoding
        geography_column="ADDRESS.zip",
        geography_column_type=ExternalDataSource.GeographyTypes.POSTCODE,
        # Imports
        postcode_field="ADDRESS.zip",
        first_name_field="FNAME",
        last_name_field="LNAME",
        full_name_field=None,
        email_field="email_address",
        phone_field="PHONE",
        address_field="ADDRESS.addr1",
    )

    api_key = EncryptedCharField(
        max_length=250, help_text="Mailchimp API key.", null=True, blank=True
    )
    list_id = models.CharField(
        max_length=250,
        help_text="The unique identifier for the Mailchimp list.",
    )

    def remote_url(self):
        return f"https://admin.mailchimp.com/audience/contacts?id={self.list_id}"

    @classmethod
    def get_deduplication_field_names(self) -> list[str]:
        return ["list_id", "api_key"]

    @cached_property
    def client(self) -> MailChimp:
        # Initializes the MailChimp client
        client = MailChimp(mc_api=self.api_key)

        members_client = client.lists.members
        _build_path = members_client._build_path

        # Modify API request to include ?skip_merge_validation=true
        # Otherwise data can't be updated if the address is not complete
        # (i.e. with addr1, city, state and country)
        def build_path_with_skip_validation(self, *args, **kwargs):
            path = _build_path(self, *args, **kwargs)
            return f"{path}?skip_merge_validation=true"

        members_client._build_path = build_path_with_skip_validation
        return client

    def healthcheck(self):
        # Checks if the Mailchimp list is accessible
        list = self.client.lists.get(self.list_id)
        if list:
            return True
        return False

    def get_record_id(self, record):
        return record.get("id", None)

    def get_record_field(self, record, field: str, field_type=None):
        field_options = [
            field,
            f"merge_fields.{field}",
            # Mailchimp custom fields are max 10 chars long and typically uppercase
            f"merge_fields.{field[0:10].upper()}",
        ]

        value = None

        for field in field_options:
            try:
                value = get(record, field)
                if value:
                    break
            except KeyError:
                pass

        return value

    def record_url_template(self) -> Optional[str]:
        """
        Get the URL template for a record in the remote system.
        """
        return "https://admin.mailchimp.com/audience/contact-profile?contact_id={record_id}"

    def record_url(self, record_id: str, record_data: dict) -> Optional[str]:
        """
        Get the URL of a record in the remote system.
        """

        return f"https://admin.mailchimp.com/audience/contact-profile?contact_id={record_data['contact_id']}"

    def get_webhooks(self):
        webhooks = self.client.lists.webhooks.all(self.list_id)["webhooks"]
        return [webhook for webhook in webhooks if webhook["url"] == self.webhook_url()]

    def setup_webhooks(self, refresh=True):
        self.teardown_unused_webhooks(force=True)
        # Update external data webhook
        config = {
            "events": {
                "subscribe": True,
                "unsubscribe": False,
                "profile": True,
                "cleaned": True,
                "upemail": False,
                "campaign": False,
            },
            "sources": {
                "user": True,
                "admin": True,
                # Presumably this should be False to avoid
                # an infinite loop (but what if other tools
                # are updating using the API?)
                "api": False,
            },
        }
        self.client.lists.webhooks.create(
            self.list_id,
            data={"url": self.webhook_url(), **config},
        )

    def teardown_unused_webhooks(self, force=False):
        # Only teardown if forced or if no webhook behavior is enabled
        should_teardown = force or (
            not self.auto_import_enabled and not self.auto_update_enabled
        )
        if not should_teardown:
            return
        webhooks = self.get_webhooks()
        for webhook in webhooks:
            if ExternalDataSourceWebhook.base_path in webhook["url"]:
                self.client.lists.webhooks.delete(self.list_id, webhook["id"])

    def get_member_ids_from_webhook(self, webhook_payload: dict) -> list[str]:
        # Mailchimp doesn't give the full ID of the member in the Webhook payload?!
        # Can use the email instead
        if not webhook_payload:
            return []
        return [webhook_payload["data[email]"]]

    def load_field_definitions(self):
        """
        Mailchimp subscriber built-in fields.
        """
        fields = [
            self.FieldDefinition(
                label="Email address", value="email_address", editable=False
            ),
            self.FieldDefinition(label="Phone number", value="PHONE", editable=False),
            self.FieldDefinition(label="First name", value="FNAME", editable=False),
            self.FieldDefinition(label="Last name", value="LNAME", editable=False),
            self.FieldDefinition(
                label="Address", value="ADDRESS.addr1", editable=False
            ),
            self.FieldDefinition(label="Zip", value="ADDRESS.zip", editable=False),
        ]
        merge_fields = self.get_merge_fields()
        for field in merge_fields["merge_fields"]:
            if field["tag"] not in ["ADDRESS", "PHONE", "FNAME", "LNAME"]:
                fields.append(
                    self.FieldDefinition(
                        label=field["name"],
                        value=field["tag"],
                        description=field["name"],
                    )
                )
        return fields

    def get_merge_fields(self):
        try:
            return self.client.lists.merge_fields.all(self.list_id, get_all=True)
        except Exception as e:
            logger.error(f"Could not get Mailchimp merge fields: {e}")
            raise BadCredentialsError()

    async def fetch_all(self):
        # Fetches all members in a list and returns their email addresses
        list = self.client.lists.members.all(self.list_id, get_all=True)
        return list["members"]

    async def fetch_many(self, member_ids: list[str]):
        # TODO: is there a more efficient request to get many members?
        return await asyncio.gather(
            *[self.fetch_one(member_id) for member_id in member_ids]
        )

    async def fetch_one(self, member_id: str):
        # Fetches a single list member by their unique member ID
        # Mailchimp member IDs are typically the MD5 hash of the lowercase version of the member's email address
        member = self.client.lists.members.get(
            list_id=self.list_id, subscriber_hash=member_id
        )
        return member

    async def fetch_many_loader(self, keys):
        # For MailChimp, sometimes the keys are IDs, and sometimes
        # they are email addresses. So the loader has to match
        # on the ID field first, then the email field.
        # This is because the webhook payload doesn't include the ID.
        results = await self.fetch_many(keys)
        return [
            next(
                (
                    result
                    for result in results
                    if (
                        self.get_record_id(result) == key
                        or result["email_address"] == key
                    )
                ),
                None,
            )
            for key in keys
        ]

    async def update_many(self, mapped_records, **kwargs):
        for mapped_record in mapped_records:
            try:
                await self.update_one(mapped_record)
            except Exception as e:
                subscriber_hash = self.get_record_id(mapped_record["member"])
                logger.error(f"Error updating Mailchimp record {subscriber_hash}: {e}")

    async def update_one(self, mapped_record, **kwargs):
        await sync_to_async(self.capture_event)("data update", data=dict(count=1))
        subscriber_hash = self.get_record_id(mapped_record["member"])
        # Have to get the existing member to update the merge fields (the API does not patch the object)
        # TODO: save all the merge fields in our database so we don't have to do this?
        existing_member = await self.fetch_one(subscriber_hash)
        merge_fields = {
            **existing_member["merge_fields"],
            **mapped_record["update_fields"],
        }
        self.client.lists.members.update(
            list_id=self.list_id,
            subscriber_hash=subscriber_hash,
            data={"merge_fields": merge_fields},
        )

    def delete_one(self, record_id):
        return self.client.lists.members.delete(self.list_id, record_id)

    def create_one(self, record: ExternalDataSource.CUDRecord):
        merge_fields = {
            key: str(value) for key, value in record["data"].items() if key.isupper()
        }
        subscriber_hash = hashlib.md5(record["email"].encode()).hexdigest()
        data = dict(
            status="subscribed",
            email_address=record["email"],
            merge_fields={
                **merge_fields,
                "ADDRESS": (
                    {
                        "addr1": record["data"].get("addr1"),
                        "city": record["data"].get("city"),
                        "state": record["data"].get("state"),
                        "country": record["data"].get("country"),
                        "zip": record["postcode"],
                    }
                    if record["data"].get("addr1")
                    else ""
                ),
            },
        )

        mailchimp_record = False
        try:
            mailchimp_record = self.client.lists.members.get(
                self.list_id, subscriber_hash
            )
        except Exception as e:
            logger.debug(f"Could not get mailchimp member {record['email']}: {e}")

        if not mailchimp_record:
            mailchimp_record = self.client.lists.members.create(self.list_id, data=data)
        else:
            self.client.lists.members.update(self.list_id, subscriber_hash, data=data)

        tags = record.get("tags", [])
        if tags:
            self.client.lists.members.tags.update(
                self.list_id,
                subscriber_hash,
                data={"tags": [{"name": tag, "status": "active"} for tag in tags]},
            )

        return mailchimp_record

    def create_many(self, records):
        created_records = []
        for record in records:
            created_records.append(self.create_one(record))
        return created_records

    def filter(self, filter: dict) -> dict:
        list = self.client.lists.members.all(self.list_id, get_all=True)
        filtered_records = []
        for record in list["members"]:
            match = True
            for field, value in filter.items():
                if self.get_record_field(record, field) != value:
                    match = False
                    break
            if match:
                filtered_records.append(record)
        return filtered_records


class ActionNetworkSource(ExternalDataSource):
    """
    An Action Network member list.
    """

    crm_type = "actionnetwork"

    class Meta:
        verbose_name = "Action Network list"

    predefined_column_names = True
    has_webhooks = True
    automated_webhooks = False
    introspect_fields = True
    default_data_type = ExternalDataSource.DataSourceType.MEMBER
    can_forecast_job_progress = False

    defaults = dict(
        # Reports
        data_type=ExternalDataSource.DataSourceType.MEMBER,
        # Geocoding
        geography_column="postal_addresses[0].postal_code",
        geography_column_type=ExternalDataSource.GeographyTypes.POSTCODE,
        # Imports
        postcode_field="postal_addresses[0].postal_code",
        first_name_field="given_name",
        last_name_field="family_name",
        full_name_field=None,
        email_field="email_addresses[0].address",
        phone_field="phone_numbers[0].number",
        address_field="postal_addresses[0].address_lines[0]",
    )

    group_slug = models.CharField(max_length=100)
    api_key = EncryptedCharField(max_length=250)

    def remote_url(self):
        return f"https://actionnetwork.org/groups/{self.group_slug}/manage"

    @classmethod
    def get_deduplication_field_names(self) -> list[str]:
        return ["api_key"]

    @cached_property
    def client(self) -> ActionNetwork:
        client = ActionNetwork(api_token=self.api_key)
        return client

    def healthcheck(self):
        # Checks if the Action Network list is accessible
        fields = self.get_custom_fields()
        if fields is not None:
            return True
        return False

    def get_custom_fields(self):
        try:
            return self.client.get_custom_fields()
        except Exception as e:
            logger.error(f"Could not get Action Network custom fields: {e}")
            raise BadCredentialsError()

    # https://actionnetwork.org/docs/v2/#resources
    def get_record_id(self, record):
        ids: list[str] = record["identifiers"]
        for id in ids:
            if "action_network:" in id:
                return id
        if ids:
            return ids[0]

        logger.error(f"Action network record has no identifiers: {record}")
        self_link = record.get("_links", {}).get("self", {}).get("href")
        if self_link:
            return self_link

        email_addresses = record.get("email_addresses")
        email_address = email_addresses[0].get("address") if email_addresses else None
        if email_address:
            return email_address

        # TODO: what should be returned here?
        # returning None breaks a lot of downstream code...
        return hashlib.md5(json.dumps(record).encode()).hexdigest()

    def get_record_uuid(self, record):
        """
        Action Network prefixes their identifiers with "action_network:"
        but some APIs expect the UUID without the prefix.
        """
        id = self.get_record_id(record)
        return self.prefixed_id_to_uuid(id)

    def record_url_template(self) -> Optional[str]:
        """
        Get the URL template for a record in the remote system.
        """
        return f"https://actionnetwork.org/user_search/group/{self.group_slug}/{{record_uuid}}"

    def record_url(self, record_id: str, record_data: dict) -> Optional[str]:
        """
        Get the URL of a record in the remote system.
        """
        return (
            "https://actionnetwork.org/user_search/group"
            f"/{self.group_slug}/{self.prefixed_id_to_uuid(record_id)}"
        )

    def prefixed_id_to_uuid(self, id):
        return id.replace("action_network:", "")

    def uuid_to_prefixed_id(self, uuid: str):
        if uuid.startswith("action_network:"):
            return uuid
        return f"action_network:{uuid}"

    def get_record_field(self, record, field: str, field_type=None):
        return get(record, field)

    def load_field_definitions(self):
        """
        ActionNetwork activist built-in fields.
        """
        fields = [
            self.FieldDefinition(
                label="Email address",
                value="email_addresses[0].address",
                editable=False,
            ),
            self.FieldDefinition(
                label="Phone number", value="phone_numbers[0].number", editable=False
            ),
            self.FieldDefinition(
                label="Given name", value="given_name", editable=False
            ),
            self.FieldDefinition(
                label="Family name", value="family_name", editable=False
            ),
            self.FieldDefinition(
                label="Street address",
                value="postal_addresses[0].address_lines[0]",
                editable=False,
            ),
            self.FieldDefinition(
                label="City",
                value="postal_addresses[0].locality",
                description="Town, city, local council or other local administrative area.",
                editable=True,
            ),
            self.FieldDefinition(
                label="Region / state",
                value="postal_addresses[0].region",
                editable=True,
            ),
            self.FieldDefinition(
                label="Postal code",
                value="postal_addresses[0].postal_code",
                editable=False,
            ),
        ]
        custom_fields = self.get_custom_fields()
        for field in custom_fields["action_network:custom_fields"]:
            name = field["name"]
            fields.append(
                self.FieldDefinition(
                    label=field["name"],
                    value=f"custom_fields.{name}",
                    description=field.get("notes", None),
                    external_id=field["numeric_id"],
                )
            )
        return fields

    def get_member_ids_from_webhook(self, webhook_payload: list[dict]) -> list[str]:
        member_ids = []
        for item in webhook_payload:
            payloads = []
            payload_keys = [
                "action_network:action",
                "osdi:attendance",
                "osdi:submission",
                "osdi:donation",
                "osdi:outreach",
                "osdi:signature",
            ]
            for key in payload_keys:
                if item.get(key):
                    payloads.append(item.get(key))
            for payload in payloads:
                person_href = (
                    payload.get("_links", {}).get("osdi:person", {}).get("href")
                )
                if person_href:
                    id = person_href.split("/")[-1]
                    member_ids.append(self.uuid_to_prefixed_id(id))
        return member_ids

    @classmethod
    async def deferred_import_all(
        cls, external_data_source_id: str, request_id: str = None
    ):
        """
        Override Action Network import_all behavior to import page-by-page
        """
        # Drop previous materialized view as data may have changed
        external_data_source: ExternalDataSource = await cls.objects.aget(
            id=external_data_source_id
        )
        await sync_to_async(external_data_source.drop_materialized_view)()
        # TODO: how do we measure number of rows imported with this method?
        # Action Network simply doesn't seem to have a way to get the number of rows imported
        await cls.schedule_import_pages(
            external_data_source_id=external_data_source_id,
            request_id=request_id,
            priority=ProcrastinateQueuePriority.UNGUESSABLE.value,
        )
        await sync_to_async(call_command)("autoscale_render_workers")

    @classmethod
    async def deferred_refresh_all(
        cls, external_data_source_id: str, request_id: str = None
    ):
        """
        Override Action Network refresh_all behavior to import page-by-page
        """
        # TODO: how do we measure number of rows imported with this method?
        return await cls.schedule_refresh_pages(
            external_data_source_id=external_data_source_id, request_id=request_id
        )

    async def fetch_all(self):
        # returns an iterator that *should* work for big lists
        return self.client.get_people()

    async def fetch_page(self, page: int, max_page_size=500) -> tuple[list, bool]:
        """
        Returns a tuple of members and boolean to indicate if more data
        can be fetched.
        """
        has_more = True
        # Get multiple Action Network pages at a time for better performance
        an_page_size = 25
        # Use floor to handle max_page_size not being a multiple of 25
        # Means that the number of records returned will be slightly smaller
        # This works with pagination (there is a test!)
        an_page_count = math.floor(max_page_size / an_page_size)

        page_offset = an_page_count * (page - 1)  # e.g. 40 for page 3
        initial_page = page_offset + 1  # e.g. 41
        last_page = page_offset + an_page_count  # e.g. 60
        pages = range(initial_page, last_page + 1)  # e.g. 41 to 60

        members = []
        for page in pages:
            logger.debug(f"Fetching Action Network page {page} for {self}")
            response = self.client.get_people(page=page) or {}
            people = response.get("_embedded", {}).get("osdi:people", [])
            if not people:
                has_more = False
                break
            members = members + people
        return members, has_more

    async def fetch_many(self, member_ids: list[str]):
        member_ids = [self.uuid_to_prefixed_id(id) for id in list(set(member_ids))]
        member_id_batches = batched(member_ids, 25)
        members = []
        for batch in member_id_batches:
            osdi_filter_str = " or ".join(
                [f"identifier eq '{member_id}'" for member_id in batch]
            )
            members += list(self.client.get_people(filter=osdi_filter_str))
        return members

    async def fetch_one(self, member_id: str):
        # Fetches a single list member by their unique member ID
        # Mailchimp member IDs are typically the MD5 hash of the lowercase version of the member's email address
        id = self.prefixed_id_to_uuid(member_id)
        member = self.client.get_person(id)
        return member

    async def update_many(self, mapped_records, **kwargs):
        updated_records = []
        for record in mapped_records:
            if len(record.get("update_fields", {})) > 0:
                updated_records.append(await self.update_one(record, **kwargs))
        return updated_records

    async def update_one(
        self, mapped_record, action_network_background_processing=True, **kwargs
    ):
        await sync_to_async(self.capture_event)("data update", data=dict(count=1))
        if len(mapped_record.get("update_fields", {})) == 0:
            return
        id = self.get_record_uuid(mapped_record["member"])
        # TODO: also add standard UK geo data
        # Use benedict so that keys like `postal_addresses[0].postal_code`
        # are unpacked into {'postal_addresses': [{'postal_code': 0}]}
        update_fields = benedict()
        for key, value in mapped_record["update_fields"].items():
            update_fields[key] = value
        logger.debug("Updating AN record", id, update_fields)
        return self.client.update_person(
            id, action_network_background_processing, **update_fields
        )

    def delete_one(self, record_id):
        raise NotImplementedError(
            "Deleting a person is not allowed via the API. DELETE requests will return an error."
        )

    def create_one(self, record: ExternalDataSource.CUDRecord):
        record = self.client.upsert_person(
            email_address=record["email"],
            postal_addresses=[
                {
                    "address_lines": [record["data"].get("addr1")],
                    "locality": record["data"].get("city"),
                    "region": record["data"].get("state"),
                    "country": record["data"].get("country"),
                    "postal_code": record["postcode"],
                }
            ],
        )
        return record

    def create_many(self, records):
        created_records = []
        for record in records:
            created_records.append(self.create_one(record))
        return created_records

    def get_import_data(self):
        return GenericData.objects.filter(
            models.Q(data_type__data_set__external_data_source_id=self.id)
            & (
                models.Q(json__email_addresses__0__status="subscribed")
                | models.Q(json__phone_numbers__0__status="subscribed")
            )
        )


class BadCredentialsError(Exception):
    def __init__(self, *args):
        # The front-end depends on the message here
        super().__init__("Bad credentials")


class EditableGoogleSheetsSource(ExternalDataSource):
    """
    An editable Google Sheet
    """

    crm_type = "editablegooglesheets"
    oauth_credentials = EncryptedTextField(
        null=True,
        blank=True,
    )

    spreadsheet_id = models.CharField(max_length=250)
    sheet_name = models.CharField(max_length=100)

    id_field = models.CharField(max_length=100)

    has_webhooks = True
    automated_webhooks = True
    introspect_fields = True
    default_data_type = None

    SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

    class Meta:
        verbose_name = "Editable google sheet"

    @classmethod
    def oauth_flow(cls):
        return google_auth_oauthlib.flow.Flow.from_client_config(
            client_config=settings.GOOGLE_SHEETS_CLIENT_CONFIG, scopes=cls.SCOPES
        )

    @classmethod
    def redirect_success_to_oauth_credentials(cls, redirect_success_url: str) -> str:
        """
        Convert the redirect_success_url (e.g. https://mapped.tools/.../?code=...&state=...)
        into the oauth_credentials that will be used for future Google API requests.
        """
        flow = cls.oauth_flow()
        flow.redirect_uri = redirect_success_url.split("?")[0]
        token = flow.fetch_token(authorization_response=redirect_success_url)
        return json.dumps(
            {
                "access_token": token["access_token"],
                "refresh_token": token["refresh_token"],
                "client_id": flow.client_config["client_id"],
                "client_secret": flow.client_config["client_secret"],
                "scopes": token["scope"],
                "expiry": datetime.fromtimestamp(token["expires_at"]).isoformat(),
            }
        )

    @classmethod
    def get_deduplication_field_names(cls) -> list[str]:
        return ["spreadsheet_id", "sheet_name"]

    @classmethod
    def authorization_url(cls, redirect_url: str) -> str:
        flow = cls.oauth_flow()
        flow.redirect_uri = redirect_url
        authorization_url, state = flow.authorization_url(
            access_type="offline", include_granted_scopes="true", prompt="consent"
        )
        return authorization_url

    @property
    def api(self):
        # Don't cache this property, as the credentials only last 1 hour
        # so will need to be refreshed often.
        credentials = GoogleCredentials.from_authorized_user_info(
            json.loads(self.oauth_credentials)
        )
        if credentials and credentials.expired and credentials.refresh_token:
            logger.info(f"Refreshing Google token for source {self.id}")
            try:
                credentials.refresh(GoogleRequest())
            except Exception as e:
                logger.error(
                    f"Could not get credentials for EditableGoogleSheetsSource {self.id}: {e}"
                )
                raise BadCredentialsError()

            # Update instance in thread because:
            # a. self.save() doesn't work in an async context
            # b. async_to_sync(self.asave)() doesn't work in an async context
            # c. making this function async, to allow `await self.asave()`,
            #    makes downstream code too complicated.
            source_id = self.id
            oauth_credentials = json.dumps(
                {
                    "access_token": credentials.token,
                    "refresh_token": credentials.refresh_token,
                    "client_id": credentials.client_id,
                    "client_secret": credentials.client_secret,
                    "scopes": credentials.scopes,
                    "expiry": credentials.expiry.isoformat(),
                }
            )

            def thread_fn():
                EditableGoogleSheetsSource.objects.filter(id=source_id).update(
                    oauth_credentials=oauth_credentials
                )

            thread = threading.Thread(target=thread_fn)
            thread.start()
            thread.join()

            # Save the new credentials on the current in-memory instance
            self.oauth_credentials = oauth_credentials
        return googleapiclient.discovery.build("sheets", "v4", credentials=credentials)

    @property
    def spreadsheets(self) -> googleapiclient.discovery.Resource:
        return self.api.spreadsheets()

    @cached_property
    def spreadsheet(self):
        try:
            return self.spreadsheets.get(spreadsheetId=self.spreadsheet_id).execute()
        except Exception as e:
            logger.error(
                f"Could not get credentials for EditableGoogleSheetsSource {self.id}: {e}"
            )
            raise BadCredentialsError()

    @property
    def sheet(self):
        return self.get_sheet(sheet_name=self.sheet_name)

    @property
    def lookup_sheet(self):
        return self.get_sheet(sheet_name="MAPPED_LOOKUP_SHEET")

    @property
    def webhook_sheet(self):
        return self.get_sheet(sheet_name="MAPPED_WEBHOOK_SHEET")

    @cached_property
    def headers(self) -> list[str]:
        result = (
            self.spreadsheets.values()
            .get(spreadsheetId=self.spreadsheet_id, range=f"'{self.sheet_name}'!1:1")
            .execute()
        )
        return result["values"][0]

    def get_sheet(self, sheet_name: str):
        return next(
            (
                sheet
                for sheet in self.spreadsheet["sheets"]
                if sheet["properties"]["title"] == sheet_name
            ),
            None,
        )

    def remote_url(self) -> str:
        sheet = self.sheet
        url = self.spreadsheet["spreadsheetUrl"]
        params = {"gid": sheet["properties"]["sheetId"]}
        return f"{url}#{urlencode(params)}"

    def healthcheck(self):
        if self.headers:
            return True
        return False

    def load_field_definitions(self):
        header_row = self.headers
        return [
            self.FieldDefinition(label=column, value=column) for column in header_row
        ]

    def record_url_template(self):
        return self.remote_url()

    def record_url(self, record_id: str, record_data: dict):
        return self.remote_url()

    async def fetch_one(self, member_id):
        rows = await self.fetch_many([member_id])
        return rows[0] if rows else None

    async def fetch_many(self, id_list: list[str]):
        row_numbers = self.fetch_row_numbers_for_ids(id_list)
        if not row_numbers:
            return []
        return self.get_rows(row_numbers)

    async def fetch_all(self):
        return self.get_data()

    def get_data(self) -> list[dict]:
        result = (
            self.spreadsheets.values()
            .get(spreadsheetId=self.spreadsheet_id, range=self.sheet_name)
            .execute()
        )
        data = result["values"]
        headers = data[0]
        return [dict(zip(headers, row)) for row in data[1:]]

    def get_rows(self, row_numbers: list[int]) -> list[dict]:
        last_column = google_sheets.column_index_to_letters(len(self.headers) - 1)
        ranges = [
            f"'{self.sheet_name}'!A{row_number}:{last_column}{row_number}"
            for row_number in row_numbers
            if row_number
        ]
        result = (
            self.spreadsheets.values()
            .batchGet(spreadsheetId=self.spreadsheet_id, ranges=ranges)
            .execute()
        )
        rows = []
        for value_range in result["valueRanges"]:
            rows = rows + value_range["values"]

        records = [dict(zip(self.headers, row)) for row in rows]
        logger.debug(
            f"Google Sheet source {self} got rows {records} for row numbers {row_numbers}"
        )
        return records

    def fetch_row_numbers_for_ids(self, id_list: list[str]):
        """
        No API to search for rows with a column matching a value.
        Instead, create a formula on a lookup sheet, and read
        the value of that formula (!)

        Returns a list of the same length as the input, using
        None if the ID is not found.
        """
        if not self.lookup_sheet:
            self.create_sheet("MAPPED_LOOKUP_SHEET")

        id_column_index = self.headers.index(self.id_field)
        id_column = google_sheets.column_index_to_letters(id_column_index)

        result = (
            self.spreadsheets.values()
            .update(
                spreadsheetId=self.spreadsheet_id,
                range="MAPPED_LOOKUP_SHEET!A1",
                valueInputOption="USER_ENTERED",
                includeValuesInResponse=True,
                body={
                    "values": [
                        [
                            f"=MATCH(\"{id}\", '{self.sheet_name}'!{id_column}:{id_column}, 0)"
                        ]
                        for id in id_list
                    ],
                },
            )
            .execute()
        )
        row_numbers = []
        for row in result["updatedData"]["values"]:
            try:
                row_number = int(row[0])
            except ValueError:
                row_number = None
            row_numbers.append(row_number)
        if len(row_numbers) != len(id_list):
            raise ValueError(
                f"Could not get row numbers for Google Sheets source {self} and ids {id_list}: "
                "returned list did not match input list"
            )
        return row_numbers

    def create_sheet(self, sheet_name: str):
        self.spreadsheets.batchUpdate(
            spreadsheetId=self.spreadsheet_id,
            body={"requests": [{"addSheet": {"properties": {"title": sheet_name}}}]},
        ).execute()
        # Clear spreadsheet metadata after adding a sheet
        del self.spreadsheet

    def get_record_id(self, record: dict):
        return record.get(self.id_field, None)

    def get_record_dict(self, record: dict) -> dict:
        return record

    async def update_one(self, mapped_record, **kwargs):
        await sync_to_async(self.capture_event)("data update", data=dict(count=1))
        return await self.update_many([mapped_record])

    async def update_many(self, mapped_records, **kwargs):
        await sync_to_async(self.capture_event)(
            "data update", data=dict(count=len(mapped_records))
        )
        record_ids = [record["member"][self.id_field] for record in mapped_records]
        row_numbers = self.fetch_row_numbers_for_ids(record_ids)
        logger.debug(
            f"Google Sheets source {self} updating rows {row_numbers} for records {record_ids}"
        )
        value_ranges = []
        for i, mapped_record in enumerate(mapped_records):
            row_number = row_numbers[i]
            for i, header in enumerate(self.headers):
                if header not in mapped_record["update_fields"]:
                    continue
                column = google_sheets.column_index_to_letters(i)
                value = mapped_record["update_fields"][header]
                value_ranges.append(
                    {
                        "range": f"'{self.sheet_name}'!{column}{row_number}",
                        "values": [[value]],
                    }
                )

        logger.debug(
            f"Google Sheets source {self} updating google sheet {value_ranges}"
        )
        self.spreadsheets.values().batchUpdate(
            spreadsheetId=self.spreadsheet_id,
            body={"valueInputOption": "USER_ENTERED", "data": value_ranges},
        ).execute()

    def webhook_healthcheck(self):
        message = self.check_webhook_errors()
        if not message:
            return True
        raise ValueError(f"Webhook healthcheck: {message}")

    def check_webhook_errors(self):
        if not self.webhook_sheet:
            return "Not enough webhooks - no webhook sheet"
        webhook_sheet_data = (
            self.spreadsheets.values()
            .get(
                spreadsheetId=self.spreadsheet_id,
                range="MAPPED_WEBHOOK_SHEET",
                valueRenderOption="FORMULA",
            )
            .execute()
        )
        values = webhook_sheet_data["values"]
        if not values or len(values) < 2:
            return "Not enough webhooks - not enough rows"
        row_1 = values[0] or [""]
        cell_a1 = row_1[0]
        if "=COUNTIF" not in cell_a1:
            return "No row count in cell A1"
        row_2 = values[1] or ["", ""]
        cell_a2 = row_2[0]
        if not self.webhook_create_url() in cell_a2:
            return "No webhook to webhooks/create in cell A2"
        cell_b2 = row_2[1]
        if not self.webhook_url() in cell_b2:
            return "No webhook to webhooks/auto_update cell B2"
        return None

    def teardown_unused_webhooks(self, force=False):
        # Only teardown if forced or if no webhook behavior is enabled
        should_teardown = force or (
            not self.auto_import_enabled and not self.auto_update_enabled
        )
        if not should_teardown:
            return
        sheet = self.get_sheet("MAPPED_WEBHOOK_SHEET")
        if not sheet:
            return

        logger.info(f"Deleting webhook sheet for source {self}")
        self.spreadsheets.batchUpdate(
            spreadsheetId=self.spreadsheet_id,
            body={
                "requests": [
                    {"deleteSheet": {"sheetId": sheet["properties"]["sheetId"]}}
                ]
            },
        ).execute()
        # Clear spreadsheet metadata after removing a sheet
        del self.spreadsheet

    def enable_auto_import(self) -> Union[None, int]:
        """
        Override to prevent refreshing webhooks every time,
        an expensive operation for Google Sheets
        """
        self.auto_import_enabled = True
        self.setup_webhooks(refresh=False)
        self.save()

    def enable_auto_update(self) -> Union[None, int]:
        """
        Override to prevent refreshing webhooks every time,
        an expensive operation for Google Sheets
        """
        self.auto_update_enabled = True
        self.setup_webhooks(refresh=False)
        self.save()

    def setup_webhooks(self, refresh=True):
        self.teardown_unused_webhooks(force=refresh)
        # Auto-import
        logger.info(f"Setting up webhooks for source {self}")
        if not self.auto_import_enabled and not self.auto_update_enabled:
            return

        webhook_url = self.webhook_url()
        webhook_create_url = self.webhook_create_url()

        id_column_index = self.headers.index(self.id_field)
        id_column = google_sheets.column_index_to_letters(id_column_index)

        if not self.webhook_sheet:
            self.create_sheet("MAPPED_WEBHOOK_SHEET")

        # Set up webhook that fires when rows are added / removed
        # It will call this function to set up webhooks for the new rows
        logger.info(f"Creating add/remove webhook for source {self}")
        self.spreadsheets.values().update(
            spreadsheetId=self.spreadsheet_id,
            range="MAPPED_WEBHOOK_SHEET!A1",
            valueInputOption="USER_ENTERED",
            body={
                "values": [
                    [f"=COUNTIF('{self.sheet_name}'!{id_column}2:{id_column}, \"<>\")"],
                    [f'=IMPORTDATA(CONCATENATE("{webhook_create_url}?count=", A1))'],
                ],
            },
        ).execute()

        total_rows = self.sheet["properties"]["gridProperties"]["rowCount"]
        end_row = max(total_rows, 3)  # ensure at least one webhook created
        row_numbers = range(2, end_row)

        logger.info(f"Creating {total_rows} update webhooks for source {self}")

        # Only watch columns that aren't managed by Mapped
        columns_to_watch = []  # e.g. ['A', 'B', 'D']
        mapped_headers = [
            mapping["destination_column"] for mapping in self.get_update_mapping()
        ]
        for i, header in enumerate(self.headers):
            if header not in mapped_headers:
                columns_to_watch.append(google_sheets.column_index_to_letters(i))

        def get_watch_statement(row_number: int):
            """
            Return a Google Sheets expression that will change when data being watched
            changes.
            """
            cells = [
                f"'{self.sheet_name}'!{column}{row_number}"
                for column in columns_to_watch
            ]
            cells_param = ", ".join(cells)
            return f'JOIN(",", {cells_param})'

        # Set up a webhook for each row of the data that fires when any column
        # is filled / cleared
        self.spreadsheets.values().update(
            spreadsheetId=self.spreadsheet_id,
            range="MAPPED_WEBHOOK_SHEET!B2",
            valueInputOption="USER_ENTERED",
            body={
                "values": [
                    [
                        (
                            f"=IMPORTDATA(CONCATENATE("
                            f'"{webhook_url}?id=", '
                            f"ENCODEURL('{self.sheet_name}'!{id_column}{n}), "
                            '"&record=", '
                            f"ENCODEURL({get_watch_statement(n)})"
                            "))"
                        )
                    ]
                    for n in row_numbers
                ]
            },
        ).execute()

        logger.info(f"Set up webhook for source {self}")

    def get_member_ids_from_webhook(self, webhook_payload: dict) -> list[str]:
        id = webhook_payload.get("id")
        return [id] if id else []

    def delete_one(self, record_id):
        sheet_id = self.sheet["properties"]["sheetId"]
        row_numbers = self.fetch_row_numbers_for_ids([record_id])
        if not row_numbers[0]:
            return
        row_index = row_numbers[0] - 1
        return self.spreadsheets.batchUpdate(
            spreadsheetId=self.spreadsheet_id,
            body={
                "requests": [
                    {
                        "deleteDimension": {
                            "range": {
                                "sheetId": sheet_id,
                                "dimension": "ROWS",
                                "startIndex": row_index,
                                "endIndex": row_index + 1,
                            }
                        }
                    }
                ]
            },
        ).execute()

    def create_one(self, record) -> dict:
        return self.create_many([record])[0]

    def create_many(self, records):
        rows = []
        for record in records:
            row = [
                record.get(header) or record["data"].get(header, "")
                for header in self.headers
            ]
            rows.append(row)
        self.spreadsheets.values().append(
            spreadsheetId=self.spreadsheet_id,
            range=self.sheet_name,
            body={"values": rows},
            valueInputOption="USER_ENTERED",
        ).execute()
        return [dict(zip(self.headers, row)) for row in rows]


class TicketTailorSource(ExternalDataSource):
    """
    Ticket Tailor box office
    """

    crm_type = "tickettailor"

    class Meta:
        verbose_name = "Ticket Tailor box office"

    predefined_column_names = True
    has_webhooks = False
    automated_webhooks = False
    introspect_fields = True
    allow_updates = False
    default_data_type = ExternalDataSource.DataSourceType.EVENT

    defaults = dict(
        # Reports
        data_type=ExternalDataSource.DataSourceType.EVENT,
        # Geocoding
        geography_column="venue.postal_code",
        geography_column_type=ExternalDataSource.GeographyTypes.POSTCODE,
        # Imports
        postcode_field="venue.postal_code",
        title_field="name",
        description_field="description",
        image_field="images.thumbnail",
        start_time_field="start.iso",
        end_time_field="end.iso",
        public_url_field="url",
        address_field="venue.name",
    )

    api_key = EncryptedCharField(max_length=250)

    def remote_url(self) -> str:
        return "https://www.tickettailor.com/dashboard"

    @classmethod
    def get_deduplication_field_names(self) -> list[str]:
        return ["api_key"]

    @cached_property
    def client(self):
        # https://developers.tickettailor.com/#ticket-tailor-api
        auth = httpx.BasicAuth(username=self.api_key, password="")
        client = httpx.Client(
            auth=auth,
            base_url="https://api.tickettailor.com",
            headers={"Accept": "application/json"},
        )
        return client

    def healthcheck(self):
        # https://developers.tickettailor.com/#ticket-tailor-api-ping
        pong = self.client.get("/v1/ping")
        json = pong.json()
        return json.get("version", "X").startswith("1.")

    def load_field_definitions(self):
        """
        ActionNetwork activist built-in fields.
        """

        """
        » object	string	none
        » id	string	A unique identifier for the event
        » chk	string	Used for Ticket Tailor checkout chk value
        » access_code	string¦null	Code to access a protected event
        » call_to_action	string	Call to action text used on the event page
        » created_at	integer	none
        » currency	string	Information about the currency the event is configured to use
        » description	string¦null	Description of the event
        » end	object	none
        »» date	string	ISO-8601 date for the end of the event
        »» formatted	string	A formatted date string for the end of the event
        »» iso	string	ISO-8601 date and time for the end of the event
        »» time	string	Time of the end of the event
        »» timezone	string	Timezone offset for the end of the event
        »» unix	integer	Unix timestamp for for the end of the event
        » event_series_id	string	Recurring events are grouped by an event_series_id
        » hidden	string	True, if event is set to hidden
        » images	object	Images that have been uploaded to this event
        »» header	string	Image URL of the header image used on your event page
        »» thumbnail	string	Image URL of the thumbnail used on your event page
        » name	string	Name of the event
        » online_event	string	Returns whether or not the event is online
        » payment_methods	[any]	none
        »» external_id	string	A unique identifier for the payment method
        »» id	string	A unique identifier for internal payment methods
        »» type	string	The type of payment method
        »» name	string	Name of the payment method
        »» instructions	string	Instructions for the customer on how to pay. Used for offline payments.
        » private	string	Returns whether or not the event is private
        » start	object	none
        »» date	string	ISO-8601 date for the start of the event
        »» formatted	string	A formatted date string for the start of the event
        »» iso	string	ISO-8601 date and time for the start of the event
        »» time	string	Time of the start of the event
        »» timezone	string	Timezone offset for the start of the event
        »» unix	integer	Unix timestamp for the start of the event
        » status	string	Status of the event
        » ticket_groups	[any]	none
        »» id	string	A unique ticket group identifier
        »» max_per_order	integer	Maximum number of ticket types that this group can sell
        »» name	string	Name of the ticket types group
        »» sort_order	integer	Sort index of the group in the UI
        »» ticket_ids	[any]	Unique identifiers of ticket type ids that belong to this group
        »»» id	string	none
        » tickets_available	string¦null	Are there any ticket types available?
        » timezone	string	TZ format timezone string
        » total_holds	integer	Total number of holds
        » total_issued_tickets	integer	Total number of issued tickets
        » total_orders	integer	Total number of orders
        » unavailable	string	True, if event is set to unavailable
        » unavailable_status	string¦null	optional custom status message when event is set to be unavailable
        » url	string	Event page URL
        » venue	object	none
        »» name	string¦null	Name of the venue
        »» postal_code	string¦null	Postal code of the venue
        """
        fields = [
            self.FieldDefinition(label="Name", value="name", editable=False),
            self.FieldDefinition(
                label="Description", value="description", editable=False
            ),
            self.FieldDefinition(label="Start time", value="start.iso", editable=False),
            self.FieldDefinition(label="End time", value="end.iso", editable=False),
            self.FieldDefinition(label="Venue", value="venue.name", editable=False),
            self.FieldDefinition(
                label="Postal code", value="venue.postal_code", editable=False
            ),
            self.FieldDefinition(label="URL", value="url", editable=False),
            self.FieldDefinition(
                label="Thumbnail", value="images.thumbnail", editable=False
            ),
            self.FieldDefinition(label="Status", value="status", editable=False),
            self.FieldDefinition(
                label="Is online?", value="online_event", editable=False
            ),
        ]
        return fields

    async def fetch_all(self):
        response = self.client.get("/v1/events").json()
        data = response.get("data", [])
        while next := response.get("links", {}).get("next"):
            response = self.client.get(next).json()
            more_data = response.get("data", [])
            data = data + more_data
        return data

    async def fetch_many(self, member_ids: list[str]):
        all = await self.fetch_all()
        return [record for record in all if record["id"] in member_ids]

    async def fetch_one(self, member_id: str):
        return self.client.get(f"/v1/events/{member_id}").json()


class MapReport(Report, Analytics):
    layers = models.JSONField(default=list, blank=True)
    display_options = models.JSONField(default=dict, blank=True)

    class MapLayer(TypedDict):
        id: str
        name: str
        source: str
        icon_image: Optional[str] = None
        mapbox_paint: Optional[dict] = {}
        mapbox_layout: Optional[dict] = {}
        inspector_type: Optional[str] = "table"
        inspector_config: Optional[dict] = {}
        visible: Optional[bool] = True
        """
        filter: ORM filter dict for GenericData objects like { "json__status": "Published" }
        """
        filter: Optional[dict] = {}
        custom_marker_text: Optional[str] = None

    def get_layers(self) -> list[MapLayer]:
        return self.layers or []

    def get_import_data(self, layer_ids=None):
        filtered_layers = (
            self.get_layers()
            if layer_ids is None
            else [layer for layer in self.get_layers() if layer["id"] in layer_ids]
        )

        if not filtered_layers:
            return GenericData.objects.none()

        visible_layer_ids = [
            layer["source"] for layer in filtered_layers if layer.get("visible", True)
        ]
        return GenericData.objects.filter(
            models.Q(data_type__data_set__external_data_source_id__in=visible_layer_ids)
            & (
                (
                    models.Q(data__startswith="action_network")
                    & (
                        models.Q(json__email_addresses__0__status="subscribed")
                        | models.Q(json__phone_numbers__0__status="subscribed")
                    )
                )
                | (~models.Q(data__startswith="action_network"))
            )
        )

    def get_analytics_queryset(self, layer_ids=None):
        return self.get_import_data(layer_ids=layer_ids)


def generate_puck_json_content():
    return {"content": [], "root": {"props": {}}, "zones": {}}


class HubImage(AbstractImage):
    admin_form_fields = Image.admin_form_fields


class HubImageRendition(AbstractRendition):
    image = models.ForeignKey(
        HubImage, on_delete=models.CASCADE, related_name="renditions"
    )

    class Meta:
        unique_together = (("image", "filter_spec", "focal_point_key"),)


puck_wagtail_root_fields = [
    "title",
    "slug",
    "search_description",
]


class HubHomepage(Page):
    """
    An microsite that incorporates datasets and content pages,
    backed by a custom URL.
    """

    subpage_types = ["hub.HubContentPage"]

    organisation = models.ForeignKey(
        Organisation, on_delete=models.PROTECT, related_name="hubs"
    )

    layers = models.JSONField(blank=True, null=True, default=list)
    puck_json_content = models.JSONField(
        blank=True, null=False, default=generate_puck_json_content
    )
    nav_links = models.JSONField(blank=True, null=True, default=list)
    favicon_url = models.URLField(blank=True, null=True)
    seo_image = models.ForeignKey(
        "hub.HubImage",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    google_analytics_tag_id = models.CharField(max_length=100, blank=True, null=True)
    custom_css = models.TextField(blank=True, null=True)
    primary_colour = ColorField(blank=True, null=True)
    secondary_colour = ColorField(blank=True, null=True)

    page_panels = Page.content_panels + [
        FieldPanel("puck_json_content", widget=JSONEditorWidget),
        FieldPanel("nav_links", widget=JSONEditorWidget),
        NativeColorPanel("primary_colour"),
        NativeColorPanel("secondary_colour"),
        FieldPanel("custom_css", widget=CodeMirrorEditor(options={"mode": "css"})),
    ]

    data_panels = [
        FieldPanel("organisation"),
        FieldPanel("layers", widget=JSONEditorWidget),
    ]

    seo_panels = Page.promote_panels + [
        FieldPanel("favicon_url"),
        FieldPanel("seo_image"),
        FieldPanel("google_analytics_tag_id"),
    ]

    edit_handler = TabbedInterface(
        [
            ObjectList(seo_panels, heading="Hub SEO"),
            ObjectList(data_panels, heading="Hub data"),
            ObjectList(page_panels, heading="Homepage contents"),
        ]
    )

    def get_layers(self) -> list[MapReport.MapLayer]:
        return self.layers

    class HubNavLinks(TypedDict):
        label: str
        link: str

    def get_nav_links(self) -> list[HubNavLinks]:
        return self.nav_links

    @classmethod
    def create_for_user(
        cls,
        user,
        hostname,
        port=80,
        org=None,
    ):
        """
        Create a new HubHomepage for a user.
        """
        if org:
            if not isinstance(org, Organisation):
                org = Organisation.objects.get(id=org)
        else:
            org = Organisation.get_or_create_for_user(user)
        if site := Site.objects.filter(hostname=hostname, port=port).first():
            return site.root_page.specific

        hub = HubHomepage(
            title=hostname,
            slug=slugify(hostname),
            organisation=org,
        )
        # get root
        root_page = Page.get_first_root_node()
        root_page.add_child(instance=hub)
        hub.save()
        Site.objects.get_or_create(
            hostname=hostname, port=port, site_name=hostname, root_page=hub
        )
        return hub


# Signal when HubHomepage.layers changes to bust the filter cache
# used by tilserver
@receiver(models.signals.post_save, sender=HubHomepage)
def update_site_filter_cache_on_save(sender, instance: HubHomepage, *args, **kwargs):
    site = instance.get_site()
    if site:
        for layer in instance.get_layers():
            cache.set(
                site_tile_filter_dict(site.hostname, layer.get("source")),
                layer.get("filter", {}),
            )


class HubContentPage(Page):
    parent_page_type = ["hub.HubHomepage"]
    subpage_types = ["hub.HubContentPage"]
    puck_json_content = models.JSONField(
        blank=True, null=False, default=generate_puck_json_content
    )

    content_panels = Page.content_panels + [
        FieldPanel("puck_json_content", widget=JSONEditorWidget),
    ]


class APIToken(models.Model):
    """
    A model to store generated and revoked JWT tokens.
    """

    # So we can list tokens for a user
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name="tokens")
    # In case you need to copy/paste the token again
    token = EncryptedCharField(max_length=1500, default="default_value")
    expires_at = models.DateTimeField()

    # Unencrypted so we can check if the token is revoked or not
    signature = models.CharField(primary_key=True, editable=False, max_length=1500)
    revoked = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    last_update = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Revoked JWT Token {self.jti}"


def api_token_key(signature: str) -> str:
    return f"api_token:{signature}"


def refresh_tokens_cache():
    tokens = APIToken.objects.all()
    for token in tokens:
        cache.set(api_token_key(token.signature), token)


def get_api_token(signature: str) -> APIToken:
    return cache.get(api_token_key(signature))


def is_api_token_revoked(signature: str) -> APIToken:
    token = cache.get(api_token_key(signature))
    return token.revoked if token else False


# a signal that, when APIToken is created, updated, updates the apitoken cache
@receiver(models.signals.post_save, sender=APIToken)
def update_apitoken_cache_on_save(sender, instance, *args, **kwargs):
    refresh_tokens_cache()


@receiver(models.signals.post_delete, sender=APIToken)
def update_apitoken_cache_on_delete(sender, instance, *args, **kwargs):
    refresh_tokens_cache()


source_models: dict[str, Type[ExternalDataSource]] = {
    "airtable": AirtableSource,
    "mailchimp": MailchimpSource,
    "actionnetwork": ActionNetworkSource,
    "editablegooglesheets": EditableGoogleSheetsSource,
    "tickettailor": TicketTailorSource,
}


class BatchRequest(models.Model):
    # enum of request types
    class BatchRequestType(models.TextChoices):
        # User requested import of data to Mapped
        Import = "Import"
        # User requested update of data to third party data source
        Update = "Update"

    source = models.ForeignKey(
        ExternalDataSource,
        on_delete=models.SET_NULL,
        related_name="batch_requests",
        null=True,
        blank=True,
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    send_email = models.BooleanField(default=False)
    sent_email = models.BooleanField(default=False)
    status = models.CharField(max_length=32, default="todo")
    is_cancelled_by_user = models.BooleanField(default=False)
    type = TextChoicesField(choices_enum=BatchRequestType)
