from typing import TYPE_CHECKING, List, Optional, TypedDict

from django.db.models import Count, F, QuerySet
from django.db.models.manager import BaseManager

if TYPE_CHECKING:
    from hub.models import GenericData


class Analytics:
    def get_analytics_queryset(self) -> BaseManager["GenericData"]:
        raise NotImplementedError("Subclasses must implement this method")

    class RegionCount(TypedDict):
        label: str
        gss: Optional[str]
        count: int

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
                    postcode_data__codes__parliamentary_constituency_2025=gss
                )
            except Exception:
                return []

        return (
            qs.annotate(
                label=F("postcode_data__parliamentary_constituency_2025"),
                gss=F("postcode_data__codes__parliamentary_constituency_2025"),
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
