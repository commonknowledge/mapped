from typing import TYPE_CHECKING, List, Optional, TypedDict

from django.db.models import Count, F, QuerySet, Sum, FloatField
from django.db.models.fields.json import KT
from django.db.models.functions import Cast
from django.db.models.manager import BaseManager

if TYPE_CHECKING:
    from hub.models import GenericData


# TODO: Remove the "imported_data_" prefix from all methods
# It doesn't add any value and is redundant.
class Analytics:
    def get_analytics_queryset(self) -> BaseManager["GenericData"]:
        raise NotImplementedError("Subclasses must implement this method")

    # TODO: Rename this because it's a big clash with "region" in the specific geographic sense (EERs)
    class RegionCount(TypedDict):
        label: str
        gss: Optional[str]
        count: int

    # TODO: Rename to ...by_eer
    def imported_data_count_by_region(self) -> List[RegionCount]:
        return (
            self.get_analytics_queryset()
            .annotate(
                label=F("postcode_data__european_electoral_region"),
                gss=F("postcode_data__codes__european_electoral_region"),
            )
            .values("label", "gss")
            .annotate(count=Count("label"))
            .order_by("-count")
        )

    # TODO: Rename to e.g. row_count_by_political_boundary
    def imported_data_count_by_area(
        self,
        postcode_io_key: str = None,
        operation: str = "count",
        column: str = None,
        gss: str = None,
    ) -> QuerySet[RegionCount]:
        qs = self.get_analytics_queryset()
        if postcode_io_key is None:
            return []

        if gss:
            try:
                qs = qs.filter(**{f"postcode_data__codes__{postcode_io_key}": gss})
            except Exception:
                return []
            
        if operation == "sum" and column is not None:
            return (
                qs.annotate(
                    label=F(f"postcode_data__{postcode_io_key}"),
                    gss=F(f"postcode_data__codes__{postcode_io_key}"),
                    value=Cast(KT(f"json__{column}"), FloatField()),
                )
                .values("label", "gss")
                .annotate(count=Sum("value"))
                .order_by("-count")
            )
        else:
            # count rows in the area
            return (
                qs.annotate(
                    label=F(f"postcode_data__{postcode_io_key}"),
                    gss=F(f"postcode_data__codes__{postcode_io_key}"),
                )
                .values("label", "gss")
                .annotate(count=Count("label"))
                .order_by("-count")
            )

    def imported_data_count_by_constituency(
        self, gss: str = None
    ) -> QuerySet[RegionCount]:
        qs = self.get_analytics_queryset()

        if gss:
            try:
                qs = qs.filter(postcode_data__codes__parliamentary_constituency=gss)
            except Exception:
                return []

        return (
            qs.annotate(
                label=F("postcode_data__parliamentary_constituency"),
                gss=F("postcode_data__codes__parliamentary_constituency"),
            )
            .values("label", "gss")
            .annotate(count=Count("label"))
            .order_by("-count")
        )

    def imported_data_count_by_constituency_by_source(
        self, gss: str = None
    ) -> List[RegionCount]:
        qs = self.get_analytics_queryset()

        if gss:
            try:
                qs = qs.filter(postcode_data__codes__parliamentary_constituency=gss)
            except Exception:
                return []

        return (
            qs.annotate(
                label=F("postcode_data__parliamentary_constituency"),
                gss=F("postcode_data__codes__parliamentary_constituency"),
                source_id=F("data_type__data_set__external_data_source_id"),
            )
            .values("label", "gss", "source_id")
            .annotate(count=Count("label"))
            .order_by("-count")
        )

    def imported_data_count_by_constituency_2024(
        self, gss: str = None
    ) -> List[RegionCount]:
        qs = self.get_analytics_queryset()

        if gss:
            try:
                qs = qs.filter(
                    postcode_data__codes__parliamentary_constituency_2024=gss
                )
            except Exception:
                return []

        return (
            qs.annotate(
                label=F("postcode_data__parliamentary_constituency_2024"),
                gss=F("postcode_data__codes__parliamentary_constituency_2024"),
            )
            .values("label", "gss")
            .annotate(count=Count("label"))
            .order_by("-count")
        )

    def imported_data_count_by_council(self) -> List[RegionCount]:
        return (
            self.get_analytics_queryset()
            .annotate(
                label=F("postcode_data__admin_district"),
                gss=F("postcode_data__codes__admin_district"),
            )
            .values("label", "gss")
            .annotate(count=Count("label"))
            .order_by("-count")
        )

    def imported_data_count_by_ward(self) -> List[RegionCount]:
        return (
            self.get_analytics_queryset()
            .annotate(
                label=F("postcode_data__admin_ward"),
                gss=F("postcode_data__codes__admin_ward"),
            )
            .values("label", "gss")
            .annotate(count=Count("label"))
            .order_by("-count")
        )

    def imported_data_count(self) -> int:
        count = self.get_analytics_queryset().all().count()
        if isinstance(count, int):
            return count
        return 0
