import { AnalyticalAreaType } from '@/__generated__/graphql'
import { useLoadedMap } from '@/lib/map'
import { useAtomValue } from 'jotai'
import React, { useEffect } from 'react'
import { Layer, Source } from 'react-map-gl'
import { addCountByGssToMapboxLayer } from '../../addCountByGssToMapboxLayer'
import {
  getAreaCountLayout,
  getAreaGeoJSON,
  getAreaLabelLayout,
  getChoroplethEdge,
  getChoroplethFill,
  getChoroplethFillFilter,
  getSelectedChoroplethEdge,
} from '../../mapboxStyles'
import { MapReportExtended } from '../../reportContext'
import { Tileset } from '../../types'
import useBoundaryAnalytics from '../../useBoundaryAnalytics'
import useSelectBoundary, {
  selectedBoundaryAtom,
} from '../../useSelectBoundary'
import { PLACEHOLDER_LAYER_ID_CHOROPLETH } from '../ReportPage'

interface PoliticalChoroplethsProps {
  tileset: Tileset
  report: MapReportExtended
  boundaryType: AnalyticalAreaType
}

const PoliticalChoropleths: React.FC<PoliticalChoroplethsProps> = ({
  report,
  boundaryType,
  tileset,
}) => {
  const countsByBoundaryType = useBoundaryAnalytics(report, boundaryType)
  const map = useLoadedMap()
  const selectedBoundary = useAtomValue(selectedBoundaryAtom)
  useSelectBoundary(tileset)

  // Show the layer only if the report is set to show the boundary type
  const visibility =
    report.displayOptions?.dataVisualisation?.boundaryType === boundaryType
      ? 'visible'
      : 'none'

  // When the map is loaded and we have the data, add the layer to the map
  useEffect(() => {
    if (map.loaded && countsByBoundaryType) {
      addCountByGssToMapboxLayer(
        countsByBoundaryType,
        tileset.mapboxSourceId,
        tileset.sourceLayerId,
        map.loadedMap
      )
    }
  }, [map.loaded, countsByBoundaryType])

  if (!map.loaded) return null
  if (!countsByBoundaryType || !tileset) return null

  return (
    <>
      <Source
        id={tileset.mapboxSourceId}
        type="vector"
        url={`mapbox://${tileset.mapboxSourceId}`}
        promoteId={tileset.promoteId}
      >
        {/* Fill of the boundary */}
        <Layer
          beforeId="road-simple"
          id={`${tileset.mapboxSourceId}-fill`}
          source={tileset.mapboxSourceId}
          source-layer={tileset.sourceLayerId}
          type="fill"
          filter={getChoroplethFillFilter(countsByBoundaryType, tileset)}
          paint={getChoroplethFill(countsByBoundaryType)}
          layout={{ visibility }}
        />
        {/* Border of the boundary */}
        <Layer
          beforeId={PLACEHOLDER_LAYER_ID_CHOROPLETH}
          id={`${tileset.mapboxSourceId}-line`}
          source={tileset.mapboxSourceId}
          source-layer={tileset.sourceLayerId}
          type="line"
          paint={getChoroplethEdge()}
          layout={{ visibility, 'line-join': 'round', 'line-round-limit': 0.1 }}
        />
        {/* Border of the selected boundary  */}
        <Layer
          beforeId={PLACEHOLDER_LAYER_ID_CHOROPLETH}
          id={`${tileset.mapboxSourceId}-selected`}
          source={tileset.mapboxSourceId}
          source-layer={tileset.sourceLayerId}
          type="line"
          paint={getSelectedChoroplethEdge()}
          filter={['==', ['get', tileset.promoteId], selectedBoundary]}
          layout={{ visibility, 'line-join': 'round', 'line-round-limit': 0.1 }}
        />
      </Source>
      <Source
        id={`${tileset.mapboxSourceId}-area-count`}
        type="geojson"
        data={getAreaGeoJSON(countsByBoundaryType)}
      >
        <Layer
          id={`${tileset.mapboxSourceId}-area-count`}
          type="symbol"
          layout={{
            ...getAreaCountLayout(countsByBoundaryType),
            visibility,
          }}
          paint={{
            'text-color': 'white',
            'text-halo-color': '#24262b',
            'text-halo-width': 1.5,
          }}
        />
        <Layer
          id={`${tileset.mapboxSourceId}-area-label`}
          type="symbol"
          layout={{
            ...getAreaLabelLayout(countsByBoundaryType),
            visibility,
          }}
          paint={{
            'text-color': 'white',
            'text-opacity': 1,
            'text-halo-color': '#24262b',
            'text-halo-width': 1.5,
          }}
        />
      </Source>
    </>
  )
}

export default PoliticalChoropleths
