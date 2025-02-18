import io
import logging
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional

from django.contrib.gis.db.models import Union as GisUnion
from django.contrib.gis.geos import Polygon
from django.db import connection
from django.db.models import Q

import numexpr as ne
import numpy as np
import pandas as pd
import strawberry
from sqlglot import parse_one

from hub import models
from utils.geo_reference import (
    AnalyticalAreaType,
    area_to_postcode_io_key,
    postcodes_io_key_to_lih_map,
)
from utils.py import ensure_list
from utils.statistics import (
    StatisticalDataType,
    get_materialized_view_column_name,
    get_mode,
    merge_column_types,
)

logger = logging.getLogger(__name__)


@dataclass
class AreaTypeDjangoFilter:
    name: Optional[str] = None
    area_type: Optional[str] = None
    lih_area_type: Optional[str] = None
    mapit_area_types: Optional[list[str]] = None

    @property
    def query_filter(self) -> dict[str, str]:
        return self.fk_filter()

    def fk_filter(self, field_name="") -> dict[str, str]:
        filter = {}
        prefix = f"{field_name}__" if field_name else ""
        if self.lih_area_type:
            filter[f"{prefix}area_type__code"] = self.lih_area_type
        if self.mapit_area_types:
            filter[f"{prefix}mapit_type__in"] = self.mapit_area_types
        return filter


# Provides a map from postcodes.io area type to Local Intelligence Hub
# area types, or mapit types if LIH is misaligned.
postcodeIOKeyAreaTypeLookup = {
    AnalyticalAreaType.parliamentary_constituency: AreaTypeDjangoFilter(
        lih_area_type="WMC"
    ),
    AnalyticalAreaType.parliamentary_constituency_2024: AreaTypeDjangoFilter(
        lih_area_type="WMC23"
    ),
    AnalyticalAreaType.admin_district: AreaTypeDjangoFilter(
        mapit_area_types=["LBO", "UTA", "COI", "LGD", "MTD", "DIS", "NMD"]
    ),
    AnalyticalAreaType.admin_county: AreaTypeDjangoFilter(mapit_area_types=["CTY"]),
    AnalyticalAreaType.admin_ward: AreaTypeDjangoFilter(lih_area_type="WD23"),
    AnalyticalAreaType.european_electoral_region: AreaTypeDjangoFilter(
        lih_area_type="EER"
    ),
    AnalyticalAreaType.european_electoral_region: AreaTypeDjangoFilter(
        lih_area_type="CTRY"
    ),
    AnalyticalAreaType.msoa: AreaTypeDjangoFilter(lih_area_type="MSOA"),
    AnalyticalAreaType.lsoa: AreaTypeDjangoFilter(lih_area_type="LSOA"),
    AnalyticalAreaType.output_area: AreaTypeDjangoFilter(lih_area_type="OA21"),
    AnalyticalAreaType.postcode: AreaTypeDjangoFilter(lih_area_type="PC"),
    AnalyticalAreaType.postcode_area: AreaTypeDjangoFilter(lih_area_type="PCA"),
    AnalyticalAreaType.postcode_district: AreaTypeDjangoFilter(lih_area_type="PCD"),
    AnalyticalAreaType.postcode_sector: AreaTypeDjangoFilter(lih_area_type="PCS"),
}


# enum for OLAP
@strawberry.enum
class AreaQueryMode(Enum):
    POINTS_WITHIN = "POINTS_WITHIN"
    AREA = "AREA"
    AREA_OR_CHILDREN = "AREA_OR_CHILDREN"
    AREA_OR_PARENTS = "AREA_OR_PARENTS"
    # This mode is used to find overlapping areas in the same way the current choropleth API works
    OVERLAPPING = "OVERLAPPING"


@strawberry.input
class MapBounds:
    north: float
    east: float
    south: float
    west: float


@strawberry.enum
class StatisticsReturnShape(Enum):
    Table = "Table"
    Row = "Row"
    Cell = "Cell"


@strawberry.enum
class AggregationOp(Enum):
    Sum = "Sum"
    Mean = "Mean"
    Max = "Max"
    Min = "Min"
    Count = "Count"
    Guess = "Guess"
    Mode = "Mode"


@strawberry.input
class AggregationDefinition:
    # For UI purposes
    id: Optional[str] = None
    column: str
    operation: Optional[AggregationOp] = None


@strawberry.input
class CalculatedColumn:
    name: str
    expression: str
    aggregation_operation: Optional[AggregationOp] = None
    is_percentage: Optional[bool] = False
    # For UI purposes
    id: Optional[str] = None
    # Useful for toggling in UI
    ignore: Optional[bool] = False


@strawberry.input
class GroupByColumn:
    name: Optional[str] = None
    column: str
    aggregation_operation: Optional[AggregationOp] = None
    is_percentage: Optional[bool] = False
    # For UI purposes
    id: Optional[str] = None
    # Useful for toggling in UI
    ignore: Optional[bool] = False


@strawberry.input
class StatisticsConfig:
    # For debugging and caching
    query_id: Optional[str] = None
    #
    source_ids: Optional[List[str]] = None
    # Querying
    gss_codes: Optional[List[str]] = None
    area_query_mode: Optional[AreaQueryMode] = None
    # Grouping
    # Group absolutely: flatten all array items down to one, without any special transforms
    group_absolutely: Optional[bool] = False
    group_by_area: Optional[AnalyticalAreaType] = None
    group_by_columns: Optional[List[GroupByColumn]] = None
    # Values
    pre_group_by_calculated_columns: Optional[List[CalculatedColumn]] = None
    calculated_columns: Optional[List[CalculatedColumn]] = None
    aggregation_operation: Optional[AggregationOp] = None
    aggregation_operations: Optional[List[AggregationDefinition]] = None
    #
    return_columns: Optional[List[str]] = None
    exclude_columns: Optional[List[str]] = None
    format_numeric_keys: Optional[bool] = False


@strawberry.input
class ChoroplethConfig:
    category_key: Optional[str] = None
    count_key: Optional[str] = None
    is_count_key_percentage: Optional[bool] = False
    map_bounds: Optional[MapBounds] = None


def statistics(
    conf: StatisticsConfig,
    choropleth_config: Optional[ChoroplethConfig] = None,
    as_grouped_data: bool = False,
    return_numeric_keys_only: Optional[bool] = False,
):
    choropleth_config = choropleth_config or ChoroplethConfig()

    if not conf.source_ids or len(conf.source_ids) <= 0:
        raise ValueError("At least one source id is required")

    pre_calcs = (
        [c for c in conf.pre_group_by_calculated_columns if not c.ignore]
        if conf.pre_group_by_calculated_columns
        else []
    )
    post_calcs = (
        [c for c in conf.calculated_columns if not c.ignore]
        if conf.calculated_columns
        else []
    )

    # --- Get the derived types of the JSON data ---
    sources: list[models.ExternalDataSource] = models.ExternalDataSource.objects.filter(
        id__in=conf.source_ids, last_import__isnull=False
    )

    column_types: dict[str, StatisticalDataType] = {}
    for source in sources:
        current_column_types = {}
        for column in source.field_definitions:
            try:
                data_type = StatisticalDataType(column["type"])
            except ValueError:
                data_type = StatisticalDataType.UNKNOWN
            current_column_types[column["value"]] = data_type
            merge_column_types(column_types, current_column_types)

    # --- Build the main data query ---

    # Actual SELECT statement is manually constructed below
    qs = models.GenericData.objects.values_list("id")
    if choropleth_config.map_bounds:
        map_bounds = choropleth_config.map_bounds
        bbox_coords = (
            (map_bounds.west, map_bounds.north),  # Top left
            (map_bounds.east, map_bounds.north),  # Top right
            (map_bounds.east, map_bounds.south),  # Bottom right
            (map_bounds.west, map_bounds.south),  # Bottom left
            (
                map_bounds.west,
                map_bounds.north,
            ),  # Back to start to close polygon
        )
        bbox = Polygon(bbox_coords, srid=4326)
        if conf.group_by_area:
            # If group_by_area is set, the analysis must get *all* the points within relevant Areas,
            # not just the points within the bounding box. Otherwise, data for an Area
            # might be incomplete.
            area_type_filter = postcodeIOKeyAreaTypeLookup[conf.group_by_area]
            areas = models.Area.objects.filter(**area_type_filter.query_filter).filter(
                point__within=bbox
            )
            combined_area = areas.aggregate(union=GisUnion("polygon"))["union"]
            qs = qs.filter(point__within=combined_area or bbox)
        else:
            # all geocoded GenericData should have `point` set
            qs = qs.filter(point__within=bbox)

    if conf.gss_codes:
        qs = qs.filter(
            filter_generic_data_using_gss_code(conf.gss_codes, conf.area_query_mode)
        )

    # --- Run the query in export to CSV mode for best performance (of both SQL and Pandas) ---

    df = None

    sql, params = qs.query.sql_with_params()

    # Create a map from database column name to original column name (for human readability)
    df_rename_map = {
        get_materialized_view_column_name(column): column for column in column_types
    }
    db_columns = df_rename_map.keys()

    for source in sources:
        if (
            not source.last_materialized
            or source.last_materialized < source.last_import
        ):
            source.refresh_materialized_view(column_types)

        with connection.cursor() as cursor:
            source_sql = cursor.mogrify(sql, params)
            source_sql = replace_generic_data_with_materialized_view(
                source_sql, db_columns, conf, source.id
            )
            buf = io.BytesIO()
            with cursor.copy(f"COPY ({source_sql}) TO STDOUT WITH CSV HEADER") as copy:
                for data in copy:
                    buf.write(data.tobytes())
            buf.seek(0)
            this_df = pd.read_csv(buf, header=0, low_memory=False)
            if not df:
                df = this_df
            else:
                df = pd.concat([df, this_df])

    if df is None or len(df) <= 0:
        logger.warning(
            f"Statistics requested for sources {conf.source_ids} but no imported data found."
        )
        return None

    df = df.set_index("id", drop=False)

    df["area_type"] = postcodes_io_key_to_lih_map.get(conf.group_by_area)

    df = df.rename(columns=df_rename_map)

    # Format numerics
    DEFAULT_EXCLUDE_KEYS = ["id"]
    user_exclude_keys = [c.strip("`") for c in ensure_list(conf.exclude_columns or [])]
    exclude_keys = [*DEFAULT_EXCLUDE_KEYS, *user_exclude_keys]

    numerical_keys = [
        k
        for k, t in column_types.items()
        if t.get_statistical_type() in ("numerical", "percentage")
        and k not in exclude_keys
    ]
    percentage_keys = [
        k
        for k, t in column_types.items()
        if t.get_statistical_type() == "percentage" and k not in exclude_keys
    ]

    if len(numerical_keys) > 0:
        df = add_computed_columns(df, numerical_keys)

    # Apply the row-level cols
    if pre_calcs:
        for col in pre_calcs:
            try:
                try:
                    df[col.name] = df.eval(col.expression)
                except ValueError:
                    # In case "where" is used, which pandas doesn't support
                    # https://github.com/pandas-dev/pandas/issues/34834
                    df[col.name] = ne.evaluate(col, local_dict=df)
                if col.name not in numerical_keys:
                    numerical_keys += [col.name]
                if col.is_percentage and col.name not in percentage_keys:
                    percentage_keys += [col.name]
            except Exception as e:
                logger.warning(f"Error in statistics pre_calcs: {e}")

    # --- Group by the groupby keys ---
    # respecting aggregation operations
    if conf.group_by_area:
        # Make the code an index
        # df = df.set_index("group_by_code")

        # # remove columns that aren't numerical_keys
        # df = df[numerical_keys]

        # Collect the mode of the string columns
        # strings = df.select_dtypes(include="object"
        mode_keys = ["label", "gss", "area_type"]
        df_mode = df[mode_keys].groupby("gss").agg(get_mode)

        # Aggregate the numerical columns
        no_aggregate_keys = numerical_keys + mode_keys + ["id"]
        string_keys_for_aggregation = (
            []
            if return_numeric_keys_only
            else [c for c in df.columns if c not in no_aggregate_keys]
        )
        if conf.return_columns and len(conf.return_columns) > 0:
            string_keys_for_aggregation = [
                c for c in string_keys_for_aggregation if c in conf.return_columns
            ]
        if choropleth_config.category_key:
            string_keys_for_aggregation += [choropleth_config.category_key]
        df_stats = df[
            list(
                set(
                    [
                        # We work with all numericals even if they're not in the return columns due to mathematical operations
                        *numerical_keys,
                        # But we don't need to aggregate the string columns if they're not in the return columns
                        *string_keys_for_aggregation,
                        # This is for joining back on the original data
                        "gss",
                        # And this is for counting
                        "id",
                    ]
                )
            )
        ].set_index("gss")
        agg_config = dict()
        #
        df_stats["count"] = 1
        agg_config["count"] = np.size
        #
        for key in string_keys_for_aggregation:
            agg_config[key] = get_mode
        if conf.aggregation_operations and len(conf.aggregation_operations) > 0:
            # Per-key config
            for key in numerical_keys:
                if key in percentage_keys:
                    agg_config[key] = "mean"
                else:
                    agg_config[key] = "sum"
                for op in conf.aggregation_operations:
                    if op.column == key and op.operation is not AggregationOp.Guess:
                        agg_config[key] = aggregation_op_to_agg_func(op.operation)
                        break
        else:
            # Guess
            for key in numerical_keys:
                calculated_column = (
                    next((col for col in pre_calcs if col.name == key), None)
                    if pre_calcs and len(pre_calcs) > 0
                    else None
                )
                if (
                    calculated_column
                    and calculated_column.aggregation_operation
                    and calculated_column.aggregation_operation
                    is not AggregationOp.Guess
                ):
                    agg_config[key] = aggregation_op_to_agg_func(
                        calculated_column.aggregation_operation
                    )
                elif (
                    conf.aggregation_operation
                    and conf.aggregation_operation is not AggregationOp.Guess
                ):
                    agg_config[key] = aggregation_op_to_agg_func(
                        conf.aggregation_operation
                    )
                elif key in percentage_keys:
                    agg_config[key] = "mean"
                else:
                    agg_config[key] = "sum"

        df_aggregated = df_stats.groupby("gss").agg(agg_config)

        # Merge the strings and the numericals back together
        df = df_mode.join(df_aggregated, on="gss", how="left")

    if len(numerical_keys) > 0:
        df = add_computed_columns(df, numerical_keys)

        # Apply formulas
        if post_calcs and len(post_calcs) > 0:
            for col in post_calcs:
                try:
                    try:
                        df[col.name] = df.eval(col.expression)
                    except ValueError:
                        # In case "where" is used, which pandas doesn't support
                        # https://github.com/pandas-dev/pandas/issues/34834
                        df[col.name] = ne.evaluate(col, local_dict=df)
                    if col.name not in numerical_keys:
                        numerical_keys += [col.name]
                    if col.is_percentage and col.name not in percentage_keys:
                        percentage_keys += [col.name]
                except Exception as e:
                    logger.warning(f"Error in statistics post_calcs: {e}")

            # Then recalculate based on the formula, since they may've doctored the values.
            df = add_computed_columns(df, numerical_keys)

    if choropleth_config.category_key or choropleth_config.count_key:
        if not conf.return_columns or len(conf.return_columns) == 0:
            conf.return_columns = []
        if choropleth_config.category_key:
            df["category"] = df[choropleth_config.category_key]
            conf.return_columns.append("category")
        if choropleth_config.count_key:
            df["count"] = df[choropleth_config.count_key]
            conf.return_columns.append("count")
        # dedupe
        conf.return_columns = list(set(conf.return_columns))

    # For serialisation
    df = df.replace({np.nan: 0})

    # Final grouping
    groups = (
        [g for g in conf.group_by_columns if not g.ignore]
        if conf.group_by_columns
        else []
    )
    if conf.group_absolutely:
        agg_dict = dict()
        for col in numerical_keys:
            col = str(col)
            calculated_column_aggop = next(
                (
                    c.aggregation_operation
                    for c in post_calcs
                    if c.name == col
                    and c.aggregation_operation is not AggregationOp.Guess
                ),
                None,
            ) or next(
                (
                    c.aggregation_operation
                    for c in pre_calcs
                    if c.name == col
                    and c.aggregation_operation is not AggregationOp.Guess
                ),
                None,
            )
            simple_asserted_aggop = (
                conf.aggregation_operation
                if (
                    conf.aggregation_operation
                    and conf.aggregation_operation is not AggregationOp.Guess
                )
                else None
            )
            default_aggop = (
                AggregationOp.Mean if col in percentage_keys else AggregationOp.Sum
            )
            aggop = calculated_column_aggop or simple_asserted_aggop or default_aggop
            agg_dict[col] = aggregation_op_to_agg_func(aggop)
        df_agg = df.agg(agg_dict)
        d = df_agg.to_dict()
        if conf.format_numeric_keys:
            format_dict = {}
            for key in numerical_keys:
                format_dict[key] = "{:,.0f}"
            for key in percentage_keys:
                format_dict[key] = "{:,.0%}"
            for key in format_dict:
                if key in d:
                    d[key] = format_dict[key].format(d[key])
        return [d]
    if groups and len(groups) > 0:
        agg_config = dict()
        for col in groups:
            name = col.name or col.column
            aggop = (
                col.aggregation_operation
                if (
                    col.aggregation_operation
                    and col.aggregation_operation is not AggregationOp.Guess
                )
                else (AggregationOp.Mean if col.is_percentage else AggregationOp.Sum)
            )
            agg_config.update(
                **{
                    name: pd.NamedAgg(column=col.column, aggfunc=get_mode),
                    f"{name}_{aggop.value.lower()}": pd.NamedAgg(
                        column=col.column, aggfunc=aggregation_op_to_agg_func(aggop)
                    ),
                }
            )
        df_agg = df.groupby(col.column, as_index=False).agg(**agg_config)
        if conf.format_numeric_keys:
            for key in numerical_keys:
                df_agg[key].style.format("{:,.0f}")
            for key in percentage_keys:
                df_agg[key].style.format("{:,.0%}")
        return df_agg.to_dict(orient="records")
    else:
        # Return the results in the requested format
        if conf.group_by_area:
            # Place the GSS column back on the dataframe
            df = df.reset_index(drop=False)
        if return_numeric_keys_only:
            d = df[numerical_keys].to_dict(orient="records")
        elif conf.return_columns and len(conf.return_columns) > 0:
            d = df[conf.return_columns].to_dict(orient="records")
        else:
            d = df.to_dict(orient="records")

        if as_grouped_data:
            from hub.graphql.types.model_types import GroupedDataCount

            is_percentage = (
                choropleth_config.count_key in percentage_keys
                or choropleth_config.is_count_key_percentage
            )
            return [
                GroupedDataCount(
                    row=row,
                    gss=row.get("gss", None),
                    label=row.get("label", None),
                    count=row.get("count", None),
                    category=row.get("category", None),
                    formatted_count=(
                        (
                            # pretty percentage
                            f"{row.get('count', 0):.0%}"
                        )
                        if is_percentage
                        else (
                            # comma-separated integer
                            f"{row.get('count', 0):,.0f}"
                        )
                    ),
                    is_percentage=is_percentage,
                )
                for row in d
            ]
        return d


def aggregation_op_to_agg_func(agg_op: AggregationOp, guess="sum"):
    if agg_op == AggregationOp.Mode:
        return get_mode
    elif agg_op == AggregationOp.Guess:
        return guess
    else:
        return agg_op.value.lower()


def add_computed_columns(df: pd.DataFrame, numerical_keys: list[str]) -> pd.DataFrame:
    if len(numerical_keys) > 0:
        # Provide some special variables to the col editor
        values = df[numerical_keys].values
        df["first"] = values.max(axis=1)
        # column name of "first"
        df["first_label"] = df[numerical_keys].idxmax(axis=1)
        if len(numerical_keys) > 1:
            df["total"] = values.sum(axis=1)
            try:
                df["second"] = np.partition(values, -2, axis=1)[:, -2]
                # df["second_label"] = # TODO: get the column name of the second highst value
                # df["second_label"] = df[numerical_keys].apply(lambda x: x.nlargest(2).index[-1], axis=1)
                # As above, but using numpy not pandas
                df["second_label"] = df[numerical_keys].columns[
                    df[numerical_keys].values.argsort()[:, -2]
                ]
                df["majority"] = df["first"] - df["second"]
            except Exception:
                pass
            if len(numerical_keys) > 2:
                try:
                    df["third"] = np.partition(values, -3, axis=1)[:, -3]
                except Exception:
                    pass
    return df


def filter_generic_data_using_gss_code(
    gss_codes: str | list[str], area_query_mode: AreaQueryMode
) -> Q:
    gss_codes = ensure_list(gss_codes)
    filters = Q()
    area_qs = models.Area.objects.filter(gss__in=gss_codes)
    example_area = area_qs.first()
    if len(area_qs) == 0:
        return filters
    if len(area_qs) == 1:
        search_polygon = area_qs.first().polygon
    else:
        search_polygon = area_qs.aggregate(union=GisUnion("polygon"))["union"]

    if search_polygon and area_query_mode is AreaQueryMode.POINTS_WITHIN:
        # We filter on area=None so we don't pick up statistical area data
        # since a super-area may have a point within this area, skewing the results
        filters |= Q(point__within=search_polygon) & Q(area=None)

    if area_query_mode is AreaQueryMode.AREA:
        if search_polygon:
            # Find only data specifically related to this GSS area — not about its children
            filters |= Q(area__gss__in=gss_codes)
        # if area_type_filter:
        #     # Find only data specifically related to this area type
        #     filters |= Q(**area_type_filter.fk_filter("area"))

    elif area_query_mode is AreaQueryMode.AREA_OR_CHILDREN:
        if search_polygon:
            filters |= Q(area__gss__in=gss_codes)
            # Or find GenericData tagged with area that is fully contained by this area's polygon
            postcode_io_key = area_to_postcode_io_key(example_area)
            if postcode_io_key:
                subclause = Q()
                # See if there's a matched postcode data field for this area
                subclause &= Q(
                    **{f"postcode_data__codes__{postcode_io_key.value}__in": gss_codes}
                )
                # And see if the area is SMALLER than the current area — i.e. a child
                subclause &= Q(area__polygon__within=search_polygon)
                filters |= subclause
        # if area_type_filter:
        #     filters |= Q(**area_type_filter.fk_filter("area"))

    elif area_query_mode is AreaQueryMode.AREA_OR_PARENTS:
        if search_polygon:
            filters |= Q(area__gss__in=gss_codes)
            # Or find GenericData tagged with area that fully contains this area's polygon
            postcode_io_key = area_to_postcode_io_key(example_area)
            if postcode_io_key:
                subclause = Q()
                # See if there's a matched postcode data field for this area
                subclause &= Q(
                    **{f"postcode_data__codes__{postcode_io_key.value}__in": gss_codes}
                )
                # And see if the area is LARGER than the current area — i.e. a parent
                subclause &= Q(area__polygon__contains=search_polygon)
                filters |= subclause
        # if area_type_filter:
        #     filters |= Q(**area_type_filter.fk_filter("area"))

    elif area_query_mode is AreaQueryMode.OVERLAPPING:
        if gss_codes:
            filters |= Q(area__gss__in=gss_codes)
            # Or find GenericData tagged with area that overlaps this area's polygon
            postcode_io_key = area_to_postcode_io_key(example_area)
            if postcode_io_key:
                filters |= Q(
                    **{f"postcode_data__codes__{postcode_io_key.value}__in": gss_codes}
                )
        if search_polygon:
            filters |= Q(area__polygon__contains=search_polygon)

    return filters


def replace_generic_data_with_materialized_view(
    sql: str,
    db_columns: list[str],
    conf: StatisticsConfig,
    source_id: str,
):
    """
    Modify the SQL generated by the Django ORM to use the materialized view for the data source,
    instead of the GenericData table.
    """

    # Use the GenericData table name as the alias of the materialized view
    # to avoid breaking any existing expressions
    table_alias = models.GenericData._meta.db_table
    parsed_sql = parse_one(sql, dialect="postgres").from_(
        f'"{source_id}_json" AS {table_alias}'
    )

    # Add each data column to the SELECT
    for db_column in db_columns:
        parsed_sql = parsed_sql.select(f'{table_alias}."{db_column}"', append=True)

    # Add postcode_data columns if necessary
    if conf.group_by_area:
        parsed_sql = parsed_sql.select(
            "postcode_data_label", "postcode_data_gss", append=True
        )

    # Convert to SQL then fix the postcode_data columns, as sqlglot
    # mangles the `->` and `->>` operators into slower functions
    sql = parsed_sql.sql(dialect="postgres")
    if conf.group_by_area:
        sql = sql.replace(
            "postcode_data_label",
            f"{table_alias}.postcode_data->>'{conf.group_by_area.value}' AS label",
        ).replace(
            "postcode_data_gss",
            f"{table_alias}.postcode_data->'codes'->>'{conf.group_by_area.value}' AS gss",
        )

    return sql
