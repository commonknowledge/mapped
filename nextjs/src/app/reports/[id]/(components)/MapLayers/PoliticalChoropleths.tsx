import { MapBounds } from '@/__generated__/graphql'
import {
  MapLoader,
  useActiveTileset,
  useExplorer,
  useLoadedMap,
  useMapBounds,
  useMapZoom,
} from '@/lib/map'
import { debounce } from 'lodash'
import { FillLayerSpecification } from 'mapbox-gl'
import React, { Fragment, useEffect, useState } from 'react'
import { Layer, Source } from 'react-map-gl'
import { addCountByGssToMapboxLayer } from '../../addCountByGssToMapboxLayer'
import {
  getAreaCountLayout,
  getAreaGeoJSON,
  getAreaLabelLayout,
  getChoroplethEdge,
  getChoroplethFill,
  getSelectedChoroplethEdge,
} from '../../mapboxStyles'
import { BoundaryType } from '../../politicalTilesets'
import { SpecificViewConfig, ViewType } from '../../reportContext'
import { Tileset } from '../../types'
import useDataByBoundary from '../../useDataByBoundary'
import useHoverOverBoundaryEvents from '../../useSelectBoundary'
import { PLACEHOLDER_LAYER_ID_CHOROPLETH } from '../MapView'

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
  const activeTileset = useActiveTileset(boundaryType, view)
  const { data } = useDataByBoundary({
    view,
    tileset: activeTileset,
  })
  const dataByBoundary = data?.choroplethDataForSource || []

  const boundaryNameVisibility =
    shaderVisibility === 'visible' && view.mapOptions.display.boundaryNames
      ? 'visible'
      : 'none'

  const areasVisible =
    borderVisibility === 'visible' || shaderVisibility === 'visible'
      ? 'visible'
      : 'none'

  const map = useLoadedMap()
  const explorer = useExplorer()
  useHoverOverBoundaryEvents(areasVisible === 'visible' ? activeTileset : null)

  // Update map bounds and active tileset on pan/zoom
  const [, setMapBounds] = useMapBounds()
  useEffect(() => {
    const onMoveEnd = debounce(() => {
      const zoom = map.loadedMap?.getZoom() || 0
      setMapZoom(zoom)
      setMapBounds(getMapBounds(map))
    }, 500)
    if (map.loadedMap) {
      map.loadedMap.on('moveend', onMoveEnd)
    }
    return () => {
      map.loadedMap?.off('moveend', onMoveEnd)
    }
  }, [map.loaded])

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
      setFillsByLayer({ ...fillsByLayer, [activeTileset.mapboxSourceId]: fill })
    }
  }, [map.loaded, activeTileset, data, view.mapOptions])

  const [zoom, _] = useMapZoom()

  if (!map.loaded) return null
  if (!tilesets) return null

  return (
    <>
      {tilesets.map((tileset) => {
        const isActiveTileset =
          activeTileset.analyticalAreaType === tileset.analyticalAreaType
        return (
          <Fragment key={tileset.mapboxSourceId}>
            <Source
              id={tileset.mapboxSourceId}
              type="vector"
              url={`mapbox://${tileset.mapboxSourceId}`}
              promoteId={tileset.promoteId}
              // minzoom={tileset.minZoom}
              // maxzoom={tileset.maxZoom}
            >
              {/* Fill of the boundary */}
              <Layer
                beforeId="road-simple"
                id={`${tileset.mapboxSourceId}-fill`}
                source={tileset.mapboxSourceId}
                source-layer={tileset.sourceLayerId}
                type="fill"
                paint={fillsByLayer[tileset.mapboxSourceId] || {}}
                // minzoom={tileset.minZoom}
                // maxzoom={tileset.maxZoom}
              />
              {/* Border of the boundary */}
              <Layer
                beforeId={PLACEHOLDER_LAYER_ID_CHOROPLETH}
                id={`${tileset.mapboxSourceId}-line`}
                source={tileset.mapboxSourceId}
                source-layer={tileset.sourceLayerId}
                type="line"
                paint={getChoroplethEdge(
                  borderVisibility === 'visible',
                  isActiveTileset
                )}
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
              id={`${tileset.mapboxSourceId}-area-count`}
              type="geojson"
              data={getAreaGeoJSON(dataByBoundary)}
              // minzoom={tileset.minZoom}
              // maxzoom={tileset.maxZoom}
            >
              <Layer
                id={`${tileset.mapboxSourceId}-area-count`}
                type="symbol"
                layout={{
                  ...getAreaCountLayout(dataByBoundary),
                  visibility: boundaryNameVisibility,
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
                // minzoom={tileset.minZoom}
                // maxzoom={tileset.maxZoom}
              />

              <Layer
                id={`${tileset.mapboxSourceId}-area-label`}
                type="symbol"
                layout={{
                  ...getAreaLabelLayout(dataByBoundary),
                  visibility: boundaryNameVisibility,
                }}
                paint={{
                  'text-color': 'white',
                  'text-opacity': [
                    'interpolate',
                    ['exponential', 1],
                    ['zoom'],
                    7.5,
                    0,
                    7.8,
                    1,
                  ],
                  'text-halo-color': '#24262b',
                  'text-halo-width': 1.5,
                }}
                // minzoom={tileset.minZoom}
                // maxzoom={tileset.maxZoom}
              />
            </Source>
          </Fragment>
        )
      })}
    </>
  )
}

const getMapBounds = (map: MapLoader): MapBounds | null => {
  if (!map.loadedMap) {
    return null
  }
  const mapBounds = map.loadedMap.getBounds()
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
