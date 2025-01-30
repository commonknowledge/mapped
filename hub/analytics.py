from typing import TYPE_CHECKING, List, Optional, TypedDict

from django.db.models import Count, F, QuerySet
from django.db.models.manager import BaseManager

if TYPE_CHECKING:
    from hub.models import GenericData


# TODO: Remove the "imported_data_" prefix from all methods
# It doesn't add any value and is redundant.
class Analytics:
    def get_analytics_queryset(self) -> BaseManager["GenericData"]:
        raise NotImplementedError("Subclasses must implement this method")

    # TODO: Rename this because it's a big clash with "region" in the specific geographic sense (EERs)
    class AreaCount(TypedDict):
        label: str
        gss: Optional[str]
        count: int

    class AreaStat(TypedDict):
        label: str
        gss: Optional[str]
        external_data: dict

    def imported_data_count_located(self) -> int:
        return (
            self.get_analytics_queryset().filter(postcode_data__isnull=False).count()
            or 0
        )

    def imported_data_count_unlocated(self) -> int:
        return self.get_analytics_queryset().filter(postcode_data=None).count() or 0

    def imported_data_geocoding_rate(self) -> float:
        located = self.imported_data_count_located()
        total = self.imported_data_count()
        if total == 0:
            return 0
        return (located / total) * 100

    # TODO: Rename to e.g. row_count_by_political_boundary
    def imported_data_count_by_area(
        self,
        postcode_io_key: str = None,
        gss: str = None,
        layer_ids: Optional[List[str]] = None,
    ) -> QuerySet[AreaCount]:
        qs = self.get_analytics_queryset(layer_ids=layer_ids)
        if postcode_io_key is None:
            return []

        if gss:
            try:
                qs = qs.filter(**{f"postcode_data__codes__{postcode_io_key}": gss})
            except Exception:
                return []

        return (
            qs.annotate(
                label=F(f"postcode_data__{postcode_io_key}"),
                gss=F(f"postcode_data__codes__{postcode_io_key}"),
            )
            .values("label", "gss")
            .annotate(count=Count("label"))
            .order_by("-count")
        )

    def imported_data_by_area(
        self,
        postcode_io_key: str = None,
        layer_ids: List[str] = None,
    ) -> QuerySet[AreaStat]:
        qs = self.get_analytics_queryset(layer_ids=layer_ids)
        if postcode_io_key is None:
            return []

        return qs.annotate(
            label=F(f"postcode_data__{postcode_io_key}"),
            gss=F(f"postcode_data__codes__{postcode_io_key}"),
            imported_data=F("json"),
        ).values("label", "gss", "imported_data")

    def imported_data_count(self) -> int:
        count = self.get_analytics_queryset().all().count()
        if isinstance(count, int):
            return count
        return 0
