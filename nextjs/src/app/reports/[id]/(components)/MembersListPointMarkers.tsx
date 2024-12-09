'use client'

import { BACKEND_URL } from '@/env'
import { layerColour, selectedSourceMarkerAtom, useLoadedMap } from '@/lib/map'
import { useAtom } from 'jotai'
import { useEffect } from 'react'
import { Layer, Source } from 'react-map-gl'
import MarkerPopup from './MarkerPopup'
import { PLACEHOLDER_LAYER_ID_MARKERS } from './ReportPage'

const MIN_MEMBERS_ZOOM = 10

export function MembersListPointMarkers({
  externalDataSourceId,
  index,
}: {
  externalDataSourceId: string
  index: number
}) {
  const mapbox = useLoadedMap()
  const [selectedSourceMarker, setSelectedSourceMarker] = useAtom(
    selectedSourceMarkerAtom
  )

  useEffect(
    function selectMarker() {
      mapbox.loadedMap?.on(
        'mouseover',
        `${externalDataSourceId}-marker`,
        () => {
          const canvas = mapbox.loadedMap?.getCanvas()
          if (!canvas) return
          canvas.style.cursor = 'pointer'
        }
      )
      mapbox.loadedMap?.on(
        'mouseleave',
        `${externalDataSourceId}-marker`,
        () => {
          const canvas = mapbox.loadedMap?.getCanvas()
          if (!canvas) return
          canvas.style.cursor = ''
        }
      )
      mapbox.loadedMap?.on(
        'click',
        `${externalDataSourceId}-marker`,
        (event) => {
          const feature = event.features?.[0]
          if (feature?.properties?.id) {
            setSelectedSourceMarker(feature)
          }
        }
      )
    },
    [mapbox.loadedMap, externalDataSourceId]
  )

  return (
    <>
      <Source
        id={externalDataSourceId}
        type="vector"
        url={new URL(
          `/tiles/external-data-source/${externalDataSourceId}/tiles.json`,
          BACKEND_URL
        ).toString()}
        minzoom={MIN_MEMBERS_ZOOM}
      >
        {index <= 1 ? (
          <Layer
            beforeId={PLACEHOLDER_LAYER_ID_MARKERS}
            id={`${externalDataSourceId}-marker`}
            source={externalDataSourceId}
            source-layer={'generic_data'}
            type="symbol"
            layout={{
              'icon-image': `meep-marker-${index}`,
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'icon-size': 0.75,
              'icon-anchor': 'bottom',
            }}
            minzoom={MIN_MEMBERS_ZOOM}
            {...(selectedSourceMarker?.properties?.id
              ? {
                  filter: [
                    '!=',
                    selectedSourceMarker?.properties?.id,
                    ['get', 'id'],
                  ],
                }
              : {})}
          />
        ) : (
          <Layer
            beforeId={PLACEHOLDER_LAYER_ID_MARKERS}
            id={`${externalDataSourceId}-marker`}
            source={externalDataSourceId}
            source-layer={'generic_data'}
            type="circle"
            paint={{
              'circle-radius': 5,
              'circle-color': layerColour(index, externalDataSourceId),
            }}
            minzoom={MIN_MEMBERS_ZOOM}
            {...(selectedSourceMarker?.properties?.id
              ? {
                  filter: [
                    '!=',
                    selectedSourceMarker?.properties?.id,
                    ['get', 'id'],
                  ],
                }
              : {})}
          />
        )}

        {!!selectedSourceMarker?.properties?.id && (
          <Layer
            beforeId={PLACEHOLDER_LAYER_ID_MARKERS}
            id={`${externalDataSourceId}-marker-selected`}
            source={externalDataSourceId}
            source-layer={'generic_data'}
            type="symbol"
            layout={{
              'icon-image': 'meep-marker-selected',
              'icon-size': 0.75,
              'icon-anchor': 'bottom',
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
            }}
            minzoom={MIN_MEMBERS_ZOOM}
            filter={['==', selectedSourceMarker.properties.id, ['get', 'id']]}
          />
        )}
      </Source>
      <MarkerPopup />
    </>
  )
}
