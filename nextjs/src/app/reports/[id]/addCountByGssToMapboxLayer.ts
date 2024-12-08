import { MAPBOX_LOAD_INTERVAL } from '@/lib/map/useLoadedMap'
import { MapRef } from 'react-map-gl'

// GSS (Geographic Statistical System) codes are unique identifiers
// used in the UK to reference geographic areas for statistical purposes.
// The data prop needs to contain the gss code and the count
export function addCountByGssToMapboxLayer(
  data: { gss?: string | null; count: number }[],
  mapboxSourceId: string,
  sourceLayerId?: string,
  mapbox?: MapRef | null
) {
  if (!mapbox?.loaded) throw new Error('loaded map is required')
  if (!sourceLayerId) throw new Error('sourceLayerId is required')

  setTimeout(() => {
    data.map((d) => {
      if (!d.gss) return
      try {
        mapbox?.setFeatureState(
          {
            source: mapboxSourceId,
            sourceLayer: sourceLayerId,
            id: d.gss,
          },
          {
            count: d.count,
          }
        )
      } catch (e) {
        console.error(e)
      }
    })
  }, MAPBOX_LOAD_INTERVAL + 50)
}
