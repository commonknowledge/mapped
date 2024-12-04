'use client'

import { useEffect } from 'react'

import { DisplayOptionsType } from '@/app/reports/[id]/context'
import { useLoadedMap } from '@/lib/map'

import { getTilesets } from './getTilesets'
import useAnalytics from './useAnalytics'

const useChoropleths = (
  id: string,
  analyticalAreaType: DisplayOptionsType['analyticalAreaType']
) => {
  const mapbox = useLoadedMap()
  // Get the analytics data for the report
  const { analytics, regionAnalytics, wardAnalytics, constituencyAnalytics } =
    useAnalytics(id, analyticalAreaType)

  const tilesets = getTilesets({
    analytics,
    regionAnalytics,
    constituencyAnalytics,
    wardAnalytics,
  })

  /* Add chloropleth data to the mapbox source */
  function addChloroplethDataToMapbox(
    gss: string,
    count: number,
    mapboxSourceId: string,
    sourceLayerId: string
  ) {
    mapbox.loadedMap?.setFeatureState(
      {
        source: mapboxSourceId,
        sourceLayer: sourceLayerId,
        id: gss,
      },
      {
        count: count,
      }
    )
  }

  useEffect(
    function () {
      if (!mapbox.loadedMap) return
      Object.values(tilesets)?.forEach((tileset) => {
        tileset.data?.forEach((area) => {
          if (area?.gss && area?.count && tileset.sourceLayerId) {
            try {
              addChloroplethDataToMapbox(
                area.gss,
                area.count,
                tileset.mapboxSourceId,
                tileset.sourceLayerId
              )
            } catch {
              mapbox.loadedMap?.on('load', () => {
                addChloroplethDataToMapbox(
                  area.gss!,
                  area.count,
                  tileset.mapboxSourceId,
                  tileset.sourceLayerId!
                )
              })
            }
          }
        })
      })
    },
    [
      regionAnalytics,
      constituencyAnalytics,
      wardAnalytics,
      tilesets,
      mapbox.loadedMap,
    ]
  )

  return {}
}

export default useChoropleths
