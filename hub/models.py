import asyncio
import hashlib
import itertools
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional, TypedDict, Union
from urllib.parse import urljoin

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractBaseUser
from django.contrib.gis.db.models import MultiPolygonField, PointField
from django.contrib.gis.geos import Point
from django.core.cache import cache
from django.db import models
from django.db.models import Avg, IntegerField, Max, Min
from django.db.models.functions import Cast, Coalesce
from django.db.utils import IntegrityError
from django.dispatch import receiver
from django.http import HttpResponse
from django.urls import reverse
from django.utils.functional import cached_property
from django.utils.text import slugify

import numpy as np
import pandas as pd
import pytz
from asgiref.sync import async_to_sync, sync_to_async
from django_choices_field import TextChoicesField
from django_cryptography.fields import encrypt
from django_jsonform.models.fields import JSONField
from mailchimp3 import MailChimp
from polymorphic.models import PolymorphicModel
from procrastinate.contrib.django.models import ProcrastinateEvent, ProcrastinateJob
from psycopg.errors import UniqueViolation
from pyairtable import Api as AirtableAPI
from pyairtable import Base as AirtableBase
from pyairtable import Table as AirtableTable
from pyairtable.models.schema import TableSchema as AirtableTableSchema
from strawberry.dataloader import DataLoader

import utils as lih_utils
from hub.analytics import Analytics
from hub.enrichment.sources import builtin_mapping_sources
from hub.fields import EncryptedCharField
from hub.filters import Filter
from hub.tasks import (
    import_all,
    import_many,
    refresh_all,
    refresh_many,
    refresh_one,
    refresh_webhooks,
)
from hub.views.mapped import ExternalDataSourceAutoUpdateWebhook
from utils.postcodesIO import PostcodesIOResult, get_bulk_postcode_geo
from utils.py import batched, ensure_list, get

User = get_user_model()

logger = logging.getLogger(__name__)


class Organisation(models.Model):
    slug = models.SlugField(max_length=100, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    logo = models.ImageField(null=True, upload_to="organisation")

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Membership(models.Model):
    class Meta:
        unique_together = ["user", "organisation"]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="memberships")
    organisation = models.ForeignKey(
        Organisation, on_delete=models.CASCADE, related_name="members"
    )
    role = models.CharField(max_length=250)

    def __str__(self):
        return f"{self.user}: {self.role} in {self.organisation}"


class UserProperties(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    organisation_name = models.TextField(null=True, blank=True)
    full_name = models.TextField(null=True, blank=True)
    email_confirmed = models.BooleanField(default=False)
    account_confirmed = models.BooleanField(default=False)
    last_seen = models.DateTimeField(null=True, blank=True)
    agreed_terms = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username


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
            "keys": {"title": {"type": "string"}, "shader": {"type": "string"}},
        },
    }

    def options_default():
        return []

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    label = models.CharField(max_length=200, blank=True, null=True)
    data_type = models.CharField(max_length=20, choices=TypeMixin.TYPE_CHOICES)
    last_update = models.DateTimeField(auto_now=True)
    source_label = models.TextField(max_length=300, blank=True, null=True)
    source = models.CharField(max_length=200)
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
    label = models.CharField(max_length=200, blank=True, null=True)
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
    json = models.JSONField(blank=True, null=True)

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
    last_update = models.DateTimeField(auto_now=True)
    point = PointField(srid=4326, blank=True, null=True)
    polygon = MultiPolygonField(srid=4326, blank=True, null=True)
    postcode_data = JSONField(blank=True, null=True)
    postcode = models.CharField(max_length=1000, blank=True, null=True)
    first_name = models.CharField(max_length=300, blank=True, null=True)
    last_name = models.CharField(max_length=300, blank=True, null=True)
    full_name = models.CharField(max_length=300, blank=True, null=True)
    email = models.EmailField(max_length=300, blank=True, null=True)
    phone = models.CharField(max_length=100, blank=True, null=True)
    address = models.CharField(max_length=1000, blank=True, null=True)

    def remote_url(self):
        return self.data_type.data_set.external_data_source.record_url(self.data)

    def __str__(self):
        if self.name:
            return self.name
        return self.data

    @property
    def name(self) -> Optional[str]:
        if self.full_name:
            return self.full_name
        elif self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name

        return None

    def get_postcode_data(self) -> Optional[PostcodesIOResult]:
        if self.postcode_data is None:
            return None

        return self.postcode_data


class Area(models.Model):
    mapit_id = models.CharField(max_length=30)
    gss = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=200)
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
        try:
            area = cls.objects.get(name__iexact=name, area_type__code=area_type)
        except cls.DoesNotExist:
            area = None

        return area

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
    name = models.CharField(max_length=200)
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
    postcodesIO: DataLoader
    fetch_record: DataLoader
    source_loaders: dict[str, DataLoader]


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


class ExternalDataSource(PolymorphicModel, Analytics):
    """
    A third-party data source that can be read and optionally written back to.
    E.g. Google Sheet or an Action Network table.
    This class is to be subclassed by specific data source types.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
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

    class DataSourceType(models.TextChoices):
        MEMBER = "member", "Members or supporters"
        REGION = "region", "Areas or regions"
        OTHER = "other", "Other"

    data_type = TextChoicesField(
        choices_enum=DataSourceType, default=DataSourceType.OTHER
    )
    name = models.CharField(max_length=250)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_update = models.DateTimeField(auto_now=True)
    automated_webhooks = False
    introspect_fields = False
    # Geocoding data

    class PostcodesIOGeographyTypes(models.TextChoices):
        POSTCODE = "postcode", "Postcode"
        WARD = "ward", "Ward"
        CONSTITUENCY = "parliamentary_constituency", "Constituency"
        COUNCIL = "admin_district", "Council"
        CONSTITUENCY_2025 = "parliamentary_constituency_2025", "Constituency (2024)"

    geography_column_type = TextChoicesField(
        choices_enum=PostcodesIOGeographyTypes,
        default=PostcodesIOGeographyTypes.POSTCODE,
    )
    geography_column = models.CharField(max_length=250, blank=True, null=True)

    # Useful for explicit querying and interacting with members in the UI
    postcode_field = models.CharField(max_length=250, blank=True, null=True)
    first_name_field = models.CharField(max_length=250, blank=True, null=True)
    last_name_field = models.CharField(max_length=250, blank=True, null=True)
    full_name_field = models.CharField(max_length=250, blank=True, null=True)
    email_field = models.CharField(max_length=250, blank=True, null=True)
    phone_field = models.CharField(max_length=250, blank=True, null=True)
    address_field = models.CharField(max_length=250, blank=True, null=True)

    import_fields = [
        "postcode_field",
        "first_name_field",
        "last_name_field",
        "full_name_field",
        "email_field",
        "phone_field",
        "address_field",
    ]

    def save(self, *args, **kwargs):
        # Always keep these two in sync
        if (
            self.geography_column is not None
            and self.geography_column_type == self.PostcodesIOGeographyTypes.POSTCODE
        ):
            self.postcode_field = self.geography_column
        super().save(*args, **kwargs)

    def as_mapping_source(self):
        return {
            "slug": self.id,
            "name": self.name,
            "author": self.organisation.name,
            "description": self.description,
            "source_paths": self.field_definitions(),
            "external_data_source": self,
        }

    class FieldDefinition(TypedDict):
        value: str
        label: Optional[str]
        description: Optional[str]
        external_id: Optional[str]

    fields = JSONField(blank=True, null=True, default=list)
    # Auto-updates

    update_mapping = JSONField(blank=True, null=True, default=list)
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

    def get_scheduled_import_job(self):
        return self.get_scheduled_parent_job(
            dict(task_name__contains="hub.tasks.import")
        )

    def get_scheduled_update_job(self):
        return self.get_scheduled_parent_job(
            dict(task_name__contains="hub.tasks.refresh")
        )

    def get_scheduled_batch_job_progress(self, parent_job: ProcrastinateJob):
        request_id = parent_job.args.get("request_id")

        if request_id is None:
            return None

        jobs = self.event_log_queryset().filter(args__request_id=request_id).all()

        total = 2
        statuses = dict()

        for job in jobs:
            job_count = len(job.args.get("member_ids", []))
            total += job_count
            if statuses.get(job.status, None) is not None:
                statuses[job.status] += job_count
            else:
                statuses[job.status] = job_count

        done = (
            int(
                statuses.get("succeeded", 0)
                + statuses.get("failed", 0)
                + statuses.get("doing", 0)
            )
            + 1
        )
        remaining = total - done
        time_started = (
            ProcrastinateEvent.objects.filter(job_id=parent_job.id)
            .order_by("at")
            .first()
            .at.replace(tzinfo=pytz.utc)
        )
        time_so_far = datetime.now(pytz.utc) - time_started
        duration_per_record = time_so_far / done
        time_remaining = duration_per_record * remaining
        estimated_finish_time = datetime.now() + time_remaining

        return dict(
            status="todo" if parent_job.status == "todo" else "doing",
            id=request_id,
            started_at=time_started,
            estimated_seconds_remaining=time_remaining,
            estimated_finish_time=estimated_finish_time,
            seconds_per_record=duration_per_record.seconds,
            total=total - 2,
            done=done - 1,
            remaining=remaining - 1,
            succeeded=statuses.get("succeeded", 0),
            failed=statuses.get("failed", 0),
            doing=statuses.get("doing", 0),
        )

    def get_update_mapping(self) -> list[UpdateMapping]:
        return ensure_list(self.update_mapping)

    def delete(self, *args, **kwargs):
        self.disable_auto_update()
        return super().delete(*args, **kwargs)

    # CRM methods
    # to be implemented by subclasses

    def healthcheck(self):
        """
        Check the connection to the API.
        """
        raise NotImplementedError(
            "Healthcheck not implemented for this data source type."
        )

    def field_definitions(self) -> list[FieldDefinition]:
        """
        Get the fields for the data source.
        """
        return ensure_list(self.fields)

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

    def remote_url(self) -> Optional[str]:
        """
        Get the URL of the data source in the remote system.
        """
        return None

    def setup_webhooks(self):
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
        expected_webhooks = 0
        if self.auto_update_enabled:
            expected_webhooks += 1
        if self.auto_import_enabled:
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

    def auto_update_webhook_url(self):
        return urljoin(
            settings.BASE_URL,
            reverse("external_data_source_auto_update_webhook", args=[self.id]),
        )

    def get_member_ids_from_webhook(self, payload: dict) -> list[str]:
        """
        Get the member ID from the webhook payload.
        """
        raise NotImplementedError(
            "Get member ID not implemented for this data source type."
        )

    async def import_many(self, member_ids: list[str]):
        """
        Copy data to this database for use in dashboarding features.
        """
        data = await self.fetch_many(member_ids)

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

        def get_update_data(record):
            update_data = {
                "json": self.get_record_dict(record),
            }

            for field in self.import_fields:
                if getattr(self, field, None) is not None:
                    update_data[field.removesuffix("_field")] = self.get_record_field(
                        record, getattr(self, field)
                    )

            return update_data

        if (
            self.geography_column
            and self.geography_column_type == self.PostcodesIOGeographyTypes.POSTCODE
        ):
            loaders = await self.get_loaders()

            async def create_import_record(record):
                """
                Converts a record fetched from the API into
                a GenericData record in the MEEP db.

                Used to batch-import data.
                """
                structured_data = get_update_data(record)
                postcode_data: PostcodesIOResult = await loaders["postcodesIO"].load(
                    self.get_record_field(record, self.geography_column)
                )
                update_data = {
                    **structured_data,
                    "postcode_data": postcode_data,
                    "point": Point(
                        postcode_data["longitude"],
                        postcode_data["latitude"],
                    )
                    if (
                        postcode_data is not None
                        and "latitude" in postcode_data
                        and "longitude" in postcode_data
                    )
                    else None,
                }

                await GenericData.objects.aupdate_or_create(
                    data_type=data_type,
                    data=self.get_record_id(record),
                    defaults=update_data,
                )

            await asyncio.gather(*[create_import_record(record) for record in data])
        else:
            # To allow us to lean on LIH's geo-analytics features,
            # TODO: Re-implement this data as `AreaData`, linking each datum to an Area/AreaType as per `self.geography_column` and `self.geography_column_type`.
            # This will require importing other AreaTypes like admin_district, Ward
            for record in data:
                update_data = get_update_data(record)
                data, created = await GenericData.objects.aupdate_or_create(
                    data_type=data_type,
                    data=self.get_record_id(record),
                    defaults=update_data,
                )

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

    async def fetch_all(self):
        """
        Get all members from the data source.
        """
        raise NotImplementedError("Get all not implemented for this data source type.")

    MappedMember = TypedDict(
        "MatchedMember", {"member": dict, "update_fields": dict[str, any]}
    )

    async def update_one(self, mapped_record: MappedMember):
        """
        Append data for one member to the table.
        """
        raise NotImplementedError(
            "Update one not implemented for this data source type."
        )

    async def update_many(self, mapped_records: list[MappedMember]):
        """
        Append mapped data to the table.
        """
        raise NotImplementedError(
            "Update many not implemented for this data source type."
        )

    def get_record_id(self, record):
        """
        Get the ID for a record.
        """
        raise NotImplementedError("Get ID not implemented for this data source type.")

    def get_record_field(self, record: dict, field: str):
        """
        Get a field from a record.
        """
        raise NotImplementedError(
            "Get field not implemented for this data source type."
        )

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

    @classmethod
    def _get_import_data(self, id: str):
        """
        For use by views to query data without having to instantiate the class / query the database for the CRM first
        """
        print(f"getting import data where external data source id is {id}")
        return GenericData.objects.filter(
            data_type__data_set__external_data_source_id=id
        )

    def get_import_data(self):
        return self._get_import_data(self.id)

    def get_analytics_queryset(self):
        return self.get_import_data()

    def get_imported_dataframe(self):
        json_list = [
            {
                **(d.postcode_data if d.postcode_data else {}),
                **(d.json if d.json else {}),
            }
            for d in self.get_import_data()
        ]
        print(f"building imported data frame from {json_list}")
        enrichment_df = pd.DataFrame.from_records(json_list)
        print(f"got imported data frame with {len(json_list)} rows: \n {enrichment_df}")
        return enrichment_df

    def data_loader_factory(self):
        async def fetch_enrichment_data(keys: List[EnrichmentLookup]) -> list[str]:
            return_data = []
            enrichment_df = await sync_to_async(self.get_imported_dataframe)()
            for key in keys:
                print(
                    f"loading enrichment data for key {key['member_id']} {key['source_id']} {key['source_path']}"
                )
                try:
                    if key.get("postcode_data", None) is None:
                        print(
                            f"returning none for key {key['member_id']} because postcode data is none"
                        )
                        return_data.append(None)
                        continue
                    relevant_member_geography = get(
                        key["postcode_data"], self.geography_column_type, ""
                    )
                    # Backup check if the geography refers to the GSS codes, not the name
                    if (
                        relevant_member_geography == ""
                        or relevant_member_geography is None
                    ):
                        relevant_member_geography = get(
                            key["postcode_data"]["codes"],
                            self.geography_column_type,
                            "",
                        )
                    if (
                        relevant_member_geography == ""
                        or relevant_member_geography is None
                    ):
                        print(
                            f"returning none for key {key['member_id']} because {relevant_member_geography}"
                        )
                        return_data.append(None)
                        continue
                    else:
                        print(
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
                                print(
                                    f"missing data for {key['member_id']} {key['source_path']}"
                                )
                                return_data.append(None)
                            else:
                                print(
                                    f"picked {enrichment_value} for {key['member_id']} {key['source_path']}"
                                )
                                return_data.append(enrichment_value)
                        else:
                            print(
                                f"missing data for {key['member_id']} {key['source_path']}"
                            )
                            return_data.append(None)
                except Exception as e:
                    print(f"loader exception {e}")
                    return_data.append(None)

            return return_data

        def cache_key_fn(key: EnrichmentLookup) -> str:
            return f"{key['member_id']}_{key['source_id']}_{key['source_path']}"

        return DataLoader(load_fn=fetch_enrichment_data, cache_key_fn=cache_key_fn)

    async def get_loaders(self) -> Loaders:
        loaders = Loaders(
            postcodesIO=DataLoader(load_fn=get_bulk_postcode_geo),
            fetch_record=DataLoader(load_fn=self.fetch_many_loader, cache=False),
            source_loaders={
                str(source.id): source.data_loader_factory()
                async for source in ExternalDataSource.objects.filter(
                    organisation=self.organisation_id,
                    geography_column__isnull=False,
                    geography_column_type__isnull=False,
                ).all()
            },
        )

        return loaders

    async def map_one(
        self,
        member: Union[str, dict],
        loaders: Loaders,
        mapping: list[UpdateMapping] = [],
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
            return self.MappedMember(member=member, update_fields={})

        update_fields = {}
        try:
            print(f"mapping member {member.get('id')}")
            postcode_data = None
            if self.geography_column_type == self.PostcodesIOGeographyTypes.POSTCODE:
                # Get postcode from member
                postcode = self.get_record_field(member, self.geography_column)
                # Get relevant config data for that postcode
                postcode_data: PostcodesIOResult = await loaders["postcodesIO"].load(
                    postcode
                )
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
                        print(f"mapping exception {e}")
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
                        print(f"setting {source_path} {destination_column} to {loaded}")
                        update_fields[destination_column] = loaded
                        continue
                except Exception as e:
                    print(f"mapping exception {e}")
                    continue
            # Return the member and config data
            print(f"mapped member {member.get('id')} {update_fields}")
            return self.MappedMember(member=member, update_fields=update_fields)
        except TypeError:
            # Error fetching postcode data
            return self.MappedMember(member=member, update_fields={})

    async def map_many(
        self, members: list[Union[str, any]], loaders: Loaders
    ) -> list[MappedMember]:
        """
        Match many members to records in the data source.
        """
        mapping = self.get_update_mapping()
        return await asyncio.gather(
            *[self.map_one(member, loaders, mapping=mapping) for member in members]
        )

    async def refresh_one(self, member_id: Union[str, any]):
        if len(self.get_update_mapping()) == 0:
            return
        loaders = await self.get_loaders()
        mapping = self.get_update_mapping()
        mapped_record = await self.map_one(member_id, loaders, mapping=mapping)
        return await self.update_one(mapped_record=mapped_record)

    async def refresh_many(self, member_ids: list[Union[str, any]]):
        if len(self.get_update_mapping()) == 0:
            return
        loaders = await self.get_loaders()
        mapped_records = await self.map_many(member_ids, loaders)
        return await self.update_many(mapped_records=mapped_records)

    # UI

    def enable_auto_update(self) -> Union[None, int]:
        if self.automated_webhooks:
            self.refresh_webhooks()
            # And schedule a cron to keep doing it
            refresh_webhooks.defer(
                external_data_source_id=str(self.id),
            )
        self.auto_update_enabled = True
        self.save()

    def disable_auto_update(self):
        self.auto_update_enabled = False
        self.save()
        if self.automated_webhooks and hasattr(self, "teardown_webhooks"):
            self.teardown_webhooks()

    # Webhooks

    def handle_update_webhook_view(self, body):
        if not self.auto_update_enabled:
            return HttpResponse(status=200)

        member_ids = self.get_member_ids_from_webhook(body)
        if len(member_ids) == 1:
            async_to_sync(self.schedule_refresh_one)(member_id=member_ids[0])
        else:
            async_to_sync(self.schedule_refresh_many)(member_ids=member_ids)
        return HttpResponse(status=200)

    # Scheduling

    @classmethod
    async def deferred_refresh_one(cls, external_data_source_id: str, member_id: str):
        external_data_source: ExternalDataSource = await cls.objects.aget(
            id=external_data_source_id
        )
        await external_data_source.refresh_one(member_id=member_id)

    @classmethod
    async def deferred_refresh_many(
        cls, external_data_source_id: str, member_ids: list[str], request_id: str = None
    ):
        external_data_source: ExternalDataSource = await cls.objects.aget(
            id=external_data_source_id
        )
        await external_data_source.refresh_many(member_ids=member_ids)

    @classmethod
    async def deferred_refresh_all(
        cls, external_data_source_id: str, request_id: str = None
    ):
        external_data_source: ExternalDataSource = await cls.objects.aget(
            id=external_data_source_id
        )

        members = await external_data_source.fetch_all()
        batches = batched(members, settings.IMPORT_UPDATE_ALL_BATCH_SIZE)
        for batch in batches:
            member_ids = [
                external_data_source.get_record_id(member) for member in batch
            ]
            await external_data_source.schedule_refresh_many(member_ids, request_id)

    @classmethod
    async def deferred_refresh_webhooks(cls, external_data_source_id: str):
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
    async def deferred_import_many(
        cls, external_data_source_id: str, member_ids: list[str], request_id: str = None
    ):
        external_data_source: ExternalDataSource = await cls.objects.aget(
            id=external_data_source_id
        )
        await external_data_source.import_many(member_ids=member_ids)

    @classmethod
    async def deferred_import_all(
        cls, external_data_source_id: str, request_id: str = None
    ):
        external_data_source: ExternalDataSource = await cls.objects.aget(
            id=external_data_source_id
        )

        members = await external_data_source.fetch_all()
        batches = batched(members, settings.IMPORT_UPDATE_ALL_BATCH_SIZE)
        for batch in batches:
            member_ids = [
                external_data_source.get_record_id(member) for member in batch
            ]
            await external_data_source.schedule_import_many(
                member_ids, request_id=request_id
            )

    async def schedule_refresh_one(self, member_id: str) -> int:
        try:
            return await refresh_one.configure(
                # Dedupe `update_many` jobs for the same config
                # https://procrastinate.readthedocs.io/en/stable/howto/queueing_locks.html
                queueing_lock=f"update_one_{str(self.id)}_{str(member_id)}",
                schedule_in={"seconds": settings.SCHEDULED_UPDATE_SECONDS_DELAY},
            ).defer_async(external_data_source_id=str(self.id), member_id=member_id)
        except (UniqueViolation, IntegrityError):
            pass

    async def schedule_refresh_many(
        self, member_ids: list[str], request_id: str = None
    ) -> int:
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
                member_ids=member_ids,
            )
        except (UniqueViolation, IntegrityError):
            pass

    async def schedule_refresh_all(self, request_id: str = None) -> int:
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
        self, member_ids: list[str], request_id: str = None
    ) -> int:
        member_ids_hash = hashlib.md5("".join(sorted(member_ids)).encode()).hexdigest()
        try:
            return await import_many.configure(
                # Dedupe `import_many` jobs for the same config
                # https://procrastinate.readthedocs.io/en/stable/howto/queueing_locks.html
                queueing_lock=f"import_many_{str(self.id)}_{member_ids_hash}",
                schedule_in={"seconds": settings.SCHEDULED_UPDATE_SECONDS_DELAY},
            ).defer_async(
                external_data_source_id=str(self.id),
                member_ids=member_ids,
                request_id=request_id,
            )
        except (UniqueViolation, IntegrityError):
            pass

    async def schedule_import_all(self, request_id: str = None) -> int:
        try:
            return await import_all.configure(
                # Dedupe `import_all` jobs for the same config
                # https://procrastinate.readthedocs.io/en/stable/howto/queueing_locks.html
                queueing_lock=f"import_all_{str(self.id)}",
                schedule_in={"seconds": settings.SCHEDULED_UPDATE_SECONDS_DELAY},
            ).defer_async(external_data_source_id=str(self.id), request_id=request_id)
        except (UniqueViolation, IntegrityError):
            pass

    class CUDRecord(TypedDict):
        """
        Used for tests
        """

        email = str
        postcode = str
        data = dict

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
        can_display_points: bool
        can_display_details: bool

    @classmethod
    def user_permissions(
        cls,
        user: Union[AbstractBaseUser, str],
        external_data_source: Union["ExternalDataSource", str],
    ) -> DataPermissions:
        if user is None or external_data_source is None:
            return cls.DataPermissions(
                can_display_points=False,
                can_display_details=False,
            )
        external_data_source_id = (
            external_data_source
            if not isinstance(external_data_source, ExternalDataSource)
            else str(external_data_source.id)
        )
        user_id = user if not hasattr(user, "id") else str(user.id)
        if user_id is None or external_data_source_id is None:
            return cls.DataPermissions(
                can_display_points=False,
                can_display_details=False,
            )

        # Check for cached permissions on this source
        permission_cache_key = SharingPermission._get_cache_key(external_data_source_id)
        permissions_dict = cache.get(permission_cache_key)
        if permissions_dict is None:
            permissions_dict = {}

        # If cached permissions exist, look for this user's permissions
        elif permissions_dict.get(user_id, None) is not None:
            return permissions_dict[user_id]

        # Calculate permissions for this source
        if not isinstance(external_data_source, ExternalDataSource):
            external_data_source = cls.objects.get(pk=external_data_source)
            if external_data_source is None:
                return cls.DataPermissions(
                    can_display_points=False,
                    can_display_details=False,
                )
        # If the user's org owns the source, they can see everything
        if user_id is None or external_data_source.organisation is None:
            return cls.DataPermissions(
                can_display_points=False,
                can_display_details=False,
            )
        else:
            can_display_points = external_data_source.organisation.members.filter(
                user=user_id
            ).exists()
            can_display_details = can_display_points
        # Otherwise, check if their org has sharing permissions at any granularity
        if not can_display_points:
            permission = SharingPermission.objects.filter(
                external_data_source=external_data_source,
                organisation__members__user=user_id,
            ).first()
            if permission is not None:
                if permission.visibility_record_coordinates:
                    can_display_points = True
                    if permission.visibility_record_details:
                        can_display_details = True

        permissions_dict[user_id] = cls.DataPermissions(
            can_display_points=can_display_points,
            can_display_details=can_display_details,
        )

        cache.set(
            permission_cache_key,
            permissions_dict,
            # Cached permissions for this source will be reset on save/delete
            # so we can set the timeout to something fairly generous.
            timeout=60 * 60,
        )

        return permissions_dict[user_id]

    def filter(self, filter: dict) -> dict:
        """
        Look up a record by a value in a column.
        """
        raise NotImplementedError("Lookup not implemented for this data source type.")


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
    automated_webhooks = True
    introspect_fields = True

    class Meta:
        verbose_name = "Airtable table"
        unique_together = ["base_id", "table_id", "api_key"]

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
        return self.table.schema()

    def remote_url(self) -> str:
        return f"https://airtable.com/{self.base_id}/{self.table_id}?blocks=hide"

    def healthcheck(self):
        record = self.table.first()
        if record:
            return True
        return False

    def field_definitions(self):
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
            for field in self.table.schema().fields
        ]

    def remote_name(self):
        return self.schema.name

    def record_url_template(self):
        return f"https://airtable.com/{self.base_id}/{self.table_id}/{{record_id}}"

    def record_url(self, record_id: str):
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
        return record["id"]

    def get_record_field(self, record, field):
        return record["fields"].get(str(field))

    def get_record_dict(self, record):
        return record["fields"]

    async def update_one(self, mapped_record):
        return self.table.update(
            mapped_record["member"]["id"], mapped_record["update_fields"]
        )

    async def update_many(self, mapped_records):
        return self.table.batch_update(
            [
                {
                    "id": mapped_record["member"]["id"],
                    "fields": mapped_record["update_fields"],
                }
                for mapped_record in mapped_records
            ]
        )

    def auto_update_webhook_specification(self):
        if self.geography_column is None:
            raise ValueError("A geography column is required for auto-updates to work.")
        # DOCS: https://airtable.com/developers/web/api/model/webhooks-specification
        return {
            "options": {
                "filters": {
                    "recordChangeScope": self.table_id,
                    "watchDataInFieldIds": [
                        # Listen for any geography changes
                        self.table.schema()
                        .field(self.geography_column)
                        .id
                    ],
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
        auto_update_webhook_url = self.auto_update_webhook_url()
        return [
            webhook
            for webhook in list
            if webhook.notification_url == auto_update_webhook_url
        ]

    def extra_webhook_healthcheck(self, webhooks):
        for webhook in webhooks:
            if not webhook.is_hook_enabled:
                print("Webhook healthcheck: a webhook expired")
                return False
        return True

    def teardown_webhooks(self):
        list = self.base.webhooks()
        url = self.auto_update_webhook_url()
        for webhook in list:
            if ExternalDataSourceAutoUpdateWebhook.base_path in url:
                # Update the webhook in case the spec changed,
                # which will also refresh the 7 day expiration date
                webhook.delete()

    def setup_webhooks(self):
        self.teardown_webhooks()
        # Auto-update
        self.base.add_webhook(
            self.auto_update_webhook_url(), self.auto_update_webhook_specification()
        )

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
            for table_id, deets in payload.changed_tables_by_id.items():
                if table_id == self.table_id:
                    member_ids += deets.changed_records_by_id.keys()
                    member_ids += deets.created_records_by_id.keys()
        webhook_object.save()
        member_ids = list(sorted(set(member_ids)))
        print("Webhook member result", webhook_object.cursor, member_ids)
        return member_ids

    def delete_one(self, record_id):
        return self.table.delete(record_id)

    def create_one(self, record):
        record = self.table.create(
            {
                **record["data"],
                self.postcode_field: record["postcode"],
                self.email_field: record["email"],
            }
        )
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
    slug = models.SlugField(max_length=250, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_update = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class MailchimpSource(ExternalDataSource):
    """
    A Mailchimp list.
    """

    crm_type = "mailchimp"
    api_key = EncryptedCharField(
        max_length=250, help_text="Mailchimp API key.", null=True, blank=True
    )
    list_id = models.CharField(
        max_length=250,
        help_text="The unique identifier for the Mailchimp list.",
    )

    automated_webhooks = True
    introspect_fields = True

    class Meta:
        verbose_name = "Mailchimp list"
        unique_together = ["list_id", "api_key"]

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
        return record["id"]

    def get_record_field(self, record, field: str):
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

    def get_webhooks(self):
        webhooks = self.client.lists.webhooks.all(self.list_id)["webhooks"]
        return [
            webhook
            for webhook in webhooks
            if webhook["url"] == self.auto_update_webhook_url()
        ]

    def setup_webhooks(self):
        self.teardown_webhooks()
        # Update external data webhook
        self.client.lists.webhooks.create(
            self.list_id,
            data={
                "url": self.auto_update_webhook_url(),
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
            },
        )

    def teardown_webhooks(self):
        webhooks = self.get_webhooks()
        for webhook in webhooks:
            self.client.lists.webhooks.delete(self.list_id, webhook["id"])

    def get_member_ids_from_webhook(self, webhook_payload: dict) -> list[str]:
        # Mailchimp doesn't give the full ID of the member in the Webhook payload?!
        # Can use the email instead
        if not webhook_payload:
            return []
        return [webhook_payload["data[email]"]]

    def field_definitions(self):
        """
        Mailchimp subscriber built-in fields.
        """
        fields = [
            self.FieldDefinition(
                label="Email address",
                value="email_address",
                description="Email address",
            ),
            self.FieldDefinition(
                label="Phone number",
                value="PHONE",
                description="Phone number",
            ),
            self.FieldDefinition(
                label="First name",
                value="FNAME",
                description="First name",
            ),
            self.FieldDefinition(
                label="Last name",
                value="LNAME",
                description="Last name",
            ),
            self.FieldDefinition(
                label="Address",
                value="ADDRESS.addr1",
                description="Address first line",
            ),
            self.FieldDefinition(
                label="Zip",
                value="ADDRESS.zip",
                description="Zipcode or Postcode",
            ),
        ]
        merge_fields = self.client.lists.merge_fields.all(self.list_id, get_all=True)
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
                    if (result["id"] == key or result["email_address"] == key)
                ),
                None,
            )
            for key in keys
        ]

    async def update_many(self, mapped_records):
        for mapped_record in mapped_records:
            try:
                await self.update_one(mapped_record)
            except Exception as e:
                subscriber_hash = mapped_record["member"]["id"]
                logger.error(f"Error updating Mailchimp record {subscriber_hash}: {e}")

    async def update_one(self, mapped_record):
        subscriber_hash = mapped_record["member"]["id"]
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
        record = self.client.lists.members.create(
            self.list_id,
            data=dict(
                status="subscribed",
                email_address=record["email"],
                merge_fields={
                    "ADDRESS": {
                        "addr1": record["data"].get("addr1"),
                        "city": record["data"].get("city"),
                        "state": record["data"].get("state"),
                        "country": record["data"].get("country"),
                        "zip": record["postcode"],
                    }
                    if record["data"].get("addr1")
                    else ""
                },
            ),
        )
        return record

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


class MapReport(Report, Analytics):
    layers = models.JSONField(blank=True, null=True, default=list)
    display_options = models.JSONField(blank=True, null=True, default=dict)

    class MapLayer(TypedDict):
        name: str
        source: str
        visible: Optional[bool]

    def get_layers(self) -> list[MapLayer]:
        return self.layers

    def get_import_data(self):
        visible_layer_ids = [
            layer["source"] for layer in self.get_layers() if layer.get("visible", True)
        ]
        return GenericData.objects.filter(
            data_type__data_set__external_data_source_id__in=visible_layer_ids
        )

    def get_analytics_queryset(self):
        return self.get_import_data()


class APIToken(models.Model):
    """
    A model to store generated and revoked JWT tokens.
    """

    # So we can list tokens for a user
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name="tokens")
    # In case you need to copy/paste the token again
    token = encrypt(models.CharField(max_length=1500))
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
