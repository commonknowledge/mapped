import { MAPBOX_LOAD_INTERVAL } from '@/lib/map/useLoadedMap'
import { MapRef } from 'react-map-gl'
import { DataByBoundary } from './useDataByBoundary'

// GSS (Geographic Statistical System) codes are unique identifiers
// used in the UK to reference geographic areas for statistical purposes.
// The data prop needs to contain the gss code and the count
export function addCountByGssToMapboxLayer(
  data: DataByBoundary,
  mapboxSourceId: string,
  sourceLayerId?: string,
  mapbox?: MapRef | null
) {
  if (!mapbox?.loaded) throw new Error('loaded map is required')
  if (!sourceLayerId) throw new Error('sourceLayerId is required')

  setTimeout(() => {
    try {
      // Remove previously set data from all areas
      if (mapbox?.getSource(mapboxSourceId)) {
        mapbox.removeFeatureState({
          source: mapboxSourceId,
          sourceLayer: sourceLayerId,
        })
      }
      data.forEach((d) => {
        if (!d.gss) return
        try {
          mapbox?.setFeatureState(
            {
              source: mapboxSourceId,
              sourceLayer: sourceLayerId,
              id: d.gss,
            },
            d
          )
        } catch (e) {
          console.error(e)
        }
      })
    } catch (e: any) {
      console.warn(e.message)
    }
  }, MAPBOX_LOAD_INTERVAL + 50)
}
