import {
  ActiveChoroplethAreasQuery,
  ActiveChoroplethAreasQueryVariables,
  MapBounds,
} from '@/__generated__/graphql'
import {
  MapLoader,
  useActiveTileset,
  useLoadedMap,
  useMapBounds,
  useMapZoom,
} from '@/lib/map'
import { useExplorer } from '@/lib/map/useExplorer'
import { gql, useQuery } from '@apollo/client'
import { debounce } from 'lodash'
import { FillLayerSpecification } from 'mapbox-gl'
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Layer, Source } from 'react-map-gl'
import { addCountByGssToMapboxLayer } from '../../addCountByGssToMapboxLayer'
import {
  CHOROPLETH_LABEL_FIELD,
  getAreaCountLayout,
  getChoroplethEdge,
  getChoroplethFill,
  getSelectedChoroplethEdge,
} from '../../mapboxStyles'
import { BoundaryType } from '../../politicalTilesets'
import {
  SpecificViewConfig,
  StatisticalDataType,
  ViewType,
} from '../../reportContext'
import { Tileset } from '../../types'
import useDataByBoundary from '../../useDataByBoundary'
import useHoverOverBoundaryEvents from '../../useSelectBoundary'
import { PLACEHOLDER_LAYER_ID_CHOROPLETH } from '../MapView'
import { guessParty } from '../explorer/AreaExplorer'

interface PoliticalChoroplethsProps {
  tilesets: Tileset[]
  view: SpecificViewConfig<ViewType.Map>
  boundaryType: BoundaryType
}

const PoliticalChoropleths: React.FC<PoliticalChoroplethsProps> = ({
  view,
  boundaryType,
  tilesets,
}) => {
  // Show the layer only if the report is set to show the boundary type and the VisualisationType is choropleth
  const borderVisibility = view.mapOptions.display.borders ? 'visible' : 'none'
  const shaderVisibility =
    view.mapOptions.choropleth?.boundaryType === boundaryType &&
    view.mapOptions.display?.choropleth
      ? 'visible'
      : 'none'

  // Store the choropleth fills when they are calculated for a layer
  // to avoid flicker when zooming in and out.
  const [fillsByLayer, setFillsByLayer] = useState<
    Record<string, FillLayerSpecification['paint']>
  >({})

  const [, setMapZoom] = useMapZoom()
  const activeTileset = useActiveTileset(boundaryType)
  const { data } = useDataByBoundary({
    view,
    tileset: activeTileset,
  })
  const dataByBoundary = data?.statisticsForChoropleth || []

  const boundaryNameVisibility = view.mapOptions.display.boundaryNames

  const choroplethValueLabelsVisibility =
    shaderVisibility === 'visible' &&
    view.mapOptions.display.choroplethValueLabels

  const areasVisible =
    borderVisibility === 'visible' || shaderVisibility === 'visible'
      ? 'visible'
      : 'none'

  const map = useLoadedMap()
  const explorer = useExplorer()
  useHoverOverBoundaryEvents(areasVisible === 'visible' ? activeTileset : null)

  // Update map bounds and active tileset on pan/zoom
  const [mapBounds, setMapBounds] = useMapBounds()
  useEffect(() => {
    const onMoveEnd = debounce(() => {
      const zoom = map.loadedMap?.getZoom() || 0
      setMapZoom(zoom)
      setMapBounds(getMapBounds(map.loadedMap))
    }, 500)
    if (map.loadedMap) {
      map.loadedMap.on('moveend', onMoveEnd)
    }
    return () => {
      map.loadedMap?.off('moveend', onMoveEnd)
    }
  }, [map.loadedMap, setMapZoom, setMapBounds])

  // When the map is loaded and we have the data, add the data to the boundaries
  useEffect(() => {
    if (map.loaded && dataByBoundary) {
      addCountByGssToMapboxLayer(
        dataByBoundary,
        activeTileset.mapboxSourceId,
        activeTileset.sourceLayerId,
        map.loadedMap
      )
      // Calculate the choropleth fill for the layer and store it,
      // to reduce flicker when zooming between layers
      const fill = getChoroplethFill(
        dataByBoundary,
        view.mapOptions,
        !!data && shaderVisibility === 'visible'
      )
      setFillsByLayer((fillsByLayer) => ({
        ...fillsByLayer,
        [activeTileset.mapboxSourceId]: fill,
      }))
    }
  }, [
    map.loaded,
    map.loadedMap,
    activeTileset,
    data,
    view.mapOptions,
    shaderVisibility,
  ])

  const activeAreasQuery = useQuery<
    ActiveChoroplethAreasQuery,
    ActiveChoroplethAreasQueryVariables
  >(AREA_QUERY, {
    variables: {
      areaType: activeTileset.analyticalAreaType,
      mapBounds: activeTileset.useBoundsInDataQuery ? mapBounds : undefined,
    },
    errorPolicy: 'all',
  })

  const labelForArea = useCallback(
    (d: (typeof dataByBoundary)[0]) => {
      const value =
        (view.mapOptions.choropleth.dataType === StatisticalDataType.Nominal
          ? view.mapOptions.choropleth.isElectoral
            ? d.category
              ? guessParty(d.category).shortName
              : d.category
            : d.category || '?'
          : (view.mapOptions.choropleth.displayRawField
              ? d.count
              : d.formattedCount) ||
            d.formattedCount ||
            d.count ||
            0) || ''
      const valueIsNull = value === undefined || value === null || value === ''
      if (valueIsNull) {
        return ''
      }
      if (boundaryNameVisibility && choroplethValueLabelsVisibility) {
        return `${d.label}:\n${value}`
      } else if (boundaryNameVisibility) {
        return d.label || ''
      } else if (choroplethValueLabelsVisibility) {
        return value
      } else {
        return ''
      }
    },
    [view.mapOptions.choropleth, view.mapOptions.display]
  )

  const labelsForAreas =
    useMemo((): GeoJSON.FeatureCollection<GeoJSON.Point> => {
      // For each area, collect data from the dataByBoundary
      // and return a list of points with label and count
      const features =
        activeAreasQuery.data?.areas
          .reduce<GeoJSON.Feature<GeoJSON.Point>[]>((acc, a) => {
            if (!a.point) return acc
            const data = dataByBoundary.find((d) => d.gss === a.gss)
            return [
              ...acc,
              {
                type: 'Feature',
                geometry: a.point.geometry as GeoJSON.Point,
                properties: {
                  ...a,
                  data,
                  [CHOROPLETH_LABEL_FIELD]: view.mapOptions.display.choropleth
                    ? data
                      ? labelForArea(data)
                      : boundaryNameVisibility &&
                          view.mapOptions.display.labelsForAllAreas
                        ? a.name
                        : undefined
                    : boundaryNameVisibility
                      ? a.name
                      : undefined,
                },
              },
            ]
          }, [] as GeoJSON.Feature<GeoJSON.Point>[])
          .filter(Boolean) || []

      return {
        type: 'FeatureCollection',
        features,
      }
    }, [
      activeAreasQuery.data,
      activeTileset.analyticalAreaType,
      dataByBoundary,
      labelForArea,
      boundaryNameVisibility,
      view.mapOptions.display.labelsForAllAreas,
    ])

  if (!map.loaded) return null
  if (!tilesets) return null

  return (
    <>
      {tilesets.map((tileset) => (
        <Fragment key={tileset.mapboxSourceId}>
          <Source
            id={tileset.mapboxSourceId}
            type="vector"
            url={`mapbox://${tileset.mapboxSourceId}`}
            promoteId={tileset.promoteId}
            minzoom={tileset.minZoom}
            maxzoom={tileset.maxZoom}
          >
            {/* Fill of the boundary */}
            <Layer
              beforeId="road-simple"
              id={`${tileset.mapboxSourceId}-fill`}
              source={tileset.mapboxSourceId}
              source-layer={tileset.sourceLayerId}
              type="fill"
              paint={fillsByLayer[tileset.mapboxSourceId] || {}}
              minzoom={tileset.minZoom}
              maxzoom={tileset.maxZoom}
            />
            {/* Border of the boundary */}
            <Layer
              beforeId={PLACEHOLDER_LAYER_ID_CHOROPLETH}
              id={`${tileset.mapboxSourceId}-line`}
              source={tileset.mapboxSourceId}
              source-layer={tileset.sourceLayerId}
              type="line"
              paint={getChoroplethEdge(borderVisibility === 'visible')}
              layout={{
                'line-join': 'round',
                'line-round-limit': 0.1,
              }}
            />
            {/* Border of the selected boundary  */}
            <Layer
              beforeId={PLACEHOLDER_LAYER_ID_CHOROPLETH}
              id={`${tileset.mapboxSourceId}-selected`}
              source={tileset.mapboxSourceId}
              source-layer={tileset.sourceLayerId}
              type="line"
              paint={getSelectedChoroplethEdge()}
              filter={[
                '==',
                ['get', tileset.promoteId],
                explorer.state.entity === 'area'
                  ? explorer.state.id
                  : 'sOmE iMpOsSiBle iD tHaT wIlL uPdAtE mApBoX',
              ]}
              layout={{
                visibility: areasVisible,
                'line-join': 'round',
                'line-round-limit': 0.1,
              }}
            />
          </Source>
          <Source
            id={`${tileset.mapboxSourceId}-area-label`}
            type="geojson"
            data={labelsForAreas}
            minzoom={tileset.minZoom}
            maxzoom={tileset.maxZoom}
          >
            <Layer
              id={`${tileset.mapboxSourceId}-area-label`}
              type="symbol"
              layout={{
                ...getAreaCountLayout(dataByBoundary),
                visibility:
                  choroplethValueLabelsVisibility || boundaryNameVisibility
                    ? 'visible'
                    : 'none',
              }}
              paint={{
                'text-opacity': [
                  'interpolate',
                  ['exponential', 1],
                  ['zoom'],
                  7.5,
                  0,
                  7.8,
                  1,
                ],
                'text-color': 'white',
                'text-halo-color': '#24262b',
                'text-halo-width': 1.5,
              }}
              minzoom={tileset.minZoom}
              maxzoom={tileset.maxZoom}
            />
          </Source>
        </Fragment>
      ))}
    </>
  )
}

const getMapBounds = (map: MapLoader['loadedMap']): MapBounds | null => {
  if (!map) {
    return null
  }
  const mapBounds = map.getBounds()
  if (!mapBounds) {
    return null
  }
  return {
    west: mapBounds.getWest(),
    east: mapBounds.getEast(),
    north: mapBounds.getNorth(),
    south: mapBounds.getSouth(),
  }
}

export default PoliticalChoropleths

const AREA_QUERY = gql`
  query ActiveChoroplethAreas(
    $areaType: AnalyticalAreaType!
    $mapBounds: MapBounds
  ) {
    areas(filters: { analyticalAreaType: $areaType, mapBounds: $mapBounds }) {
      id
      name
      gss
      point {
        type
        geometry {
          type
          coordinates
        }
      }
    }
  }
`
