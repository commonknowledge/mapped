from enum import Enum
from typing import List, Optional

from django.contrib.gis.geos import MultiPolygon, Point, Polygon

import strawberry
from strawberry.scalars import JSON

#


@strawberry.enum
class GeoJSONTypes(Enum):
    Feature = "Feature"
    FeatureCollection = "FeatureCollection"
    Point = "Point"
    Polygon = "Polygon"
    MultiPolygon = "MultiPolygon"


#


@strawberry.type
class FeatureCollection:
    type: GeoJSONTypes.FeatureCollection = GeoJSONTypes.FeatureCollection
    features: List["Feature"]


#


@strawberry.interface
class Feature:
    type: GeoJSONTypes.Feature = GeoJSONTypes.Feature
    id: Optional[str] = None


#


@strawberry.type
class PointGeometry:
    type: GeoJSONTypes.Point = GeoJSONTypes.Point
    # lng, lat
    coordinates: List[float]

    @classmethod
    def from_geodjango(cls, point: Point) -> "PointGeometry":
        return PointGeometry(coordinates=[point.x, point.y])


@strawberry.type
class PointFeature(Feature):
    geometry: PointGeometry
    properties: JSON

    @classmethod
    def from_geodjango(
        cls, point: Point, properties: dict = {}, id: str = None
    ) -> "PointFeature":
        return PointFeature(
            id=str(id),
            geometry=PointGeometry.from_geodjango(point),
            properties=properties,
        )


#


@strawberry.type
class PolygonGeometry:
    type: GeoJSONTypes.Polygon = GeoJSONTypes.Polygon
    coordinates: List[List[List[float]]]

    @classmethod
    def from_geodjango(cls, polygon: Polygon) -> "PolygonGeometry":
        return cls(coordinates=polygon.coords)


@strawberry.type
class PolygonFeature(Feature):
    geometry: PolygonGeometry
    properties: JSON

    @classmethod
    def from_geodjango(
        cls, polygon: Polygon, properties: dict = {}, id: str = None
    ) -> "PolygonFeature":
        return PolygonFeature(
            id=str(id),
            geometry=PolygonGeometry.from_geodjango(polygon),
            properties=properties,
        )


@strawberry.type
class MultiPolygonGeometry:
    type: GeoJSONTypes.MultiPolygon = GeoJSONTypes.MultiPolygon
    coordinates: JSON

    @classmethod
    def from_geodjango(cls, multipolygon: MultiPolygon) -> "MultiPolygonGeometry":
        return cls(coordinates=multipolygon.coords)


@strawberry.type
class MultiPolygonFeature(Feature):
    geometry: MultiPolygonGeometry
    properties: JSON

    @classmethod
    def from_geodjango(
        cls, multipolygon: MultiPolygon, properties: dict = {}, id: str = None
    ) -> "MultiPolygonFeature":
        return MultiPolygonFeature(
            id=str(id),
            geometry=MultiPolygonGeometry.from_geodjango(multipolygon),
            properties=properties,
        )
