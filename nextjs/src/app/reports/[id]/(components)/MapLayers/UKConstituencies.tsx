import { GroupedDataCount } from '@/__generated__/graphql'
import { useLoadedMap } from '@/lib/map'
import { useEffect, useState } from 'react'
import { Layer, Source } from 'react-map-gl'
import { useReport } from '../ReportProvider'
import { addCountByGssToMapboxLayer } from './addCountByGssToMapboxLayer'
import { getChoroplethColours } from './getChoroplethColours'
import { Tileset } from './types'
import useDataSources from './useDataSources'

// https://studio.mapbox.com/tilesets/commonknowledge.bhg1h3hj
function getTileset(data: GroupedDataCount[]): Tileset {
  return {
    name: 'GE2024 constituencies',
    singular: 'constituency',
    mapboxSourceId: 'commonknowledge.bhg1h3hj',
    sourceLayerId: 'uk_cons_2025',
    promoteId: 'gss_code',
    labelId: 'name',
    data,
  }
}

const UKConstituencies = () => {
  const { report } = useReport()
  const countsByConstituency = useDataSources(
    report,
    'uk_westminster_constituencies'
  )
  const map = useLoadedMap()
  const [tileset, setTileset] = useState<Tileset | null>(null)

  useEffect(() => {
    if (map.loaded && countsByConstituency) {
      const tileset = getTileset(countsByConstituency)
      setTileset(tileset)
      addCountByGssToMapboxLayer(
        tileset.data,
        tileset.mapboxSourceId,
        tileset.sourceLayerId,
        map.loadedMap
      )
    }
  }, [map.loaded, countsByConstituency])

  if (!countsByConstituency || !tileset) return null

  const onlyDrawConstituenciesWithData = [
    'in',
    ['get', tileset.promoteId],
    ['literal', tileset.data.map((d) => d.gss || '')],
  ]
  const choroplethColours = getChoroplethColours(tileset.data)

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
          id={`${tileset.mapboxSourceId}-fill`}
          source={tileset.mapboxSourceId}
          source-layer={tileset.sourceLayerId}
          type="fill"
          filter={onlyDrawConstituenciesWithData}
          paint={choroplethColours}
        />
        {/* Border of the boundary */}
        <Layer
          id={`${tileset.mapboxSourceId}-line`}
          source={tileset.mapboxSourceId}
          source-layer={tileset.sourceLayerId}
          type="line"
          paint={{
            'line-color': 'white',
            'line-width': 0.5,
            'line-opacity': 0.5,
          }}
        />
      </Source>
    </>
  )
}

export default UKConstituencies