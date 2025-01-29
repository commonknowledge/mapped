import { useActiveTileset, useLoadedMap } from '@/lib/map'
import { useView } from '@/lib/map/useView'
import { useEffect, useState } from 'react'
import { BoundaryType } from './politicalTilesets'
import { ViewType } from './reportContext'

interface Area {
  gss: string
  name: string
}

export function useAreasList(boundaryType: BoundaryType | undefined) {
  const map = useLoadedMap()
  const [areas, setAreas] = useState<Area[]>([])
  const view = useView(ViewType.Map)
  const tileset = useActiveTileset(boundaryType, view.currentViewOfType)

  useEffect(() => {
    if (!map.loaded || !tileset || !map.loadedMap) return

    // Add a listener for when the source becomes available
    const checkSource = () => {
      try {
        const source = map.loadedMap?.getSource?.(tileset.mapboxSourceId)
        if (source) {
          const features = map.loadedMap?.querySourceFeatures(
            tileset.mapboxSourceId,
            {
              sourceLayer: tileset.sourceLayerId,
            }
          )

          const uniqueAreas = Array.from(
            new Set(
              features?.map((f) => f.properties?.[tileset.promoteId] ?? null) ??
                []
            )
          )
            .map((gss) => ({
              gss,
              name: features?.find(
                (f) => f.properties?.[tileset.promoteId] === gss
              )?.properties?.[tileset.labelId],
            }))
            .filter((area) => area.gss)

          setAreas(uniqueAreas)
        }
      } catch (e) {
        console.error(e)
      }
    }

    // Check immediately
    checkSource()

    // Also check when the map's style is loaded
    map.loadedMap.on('sourcedata', checkSource)

    return () => {
      map.loadedMap?.off('sourcedata', checkSource)
    }
  }, [map.loaded, map.loadedMap, tileset])

  return areas
}
