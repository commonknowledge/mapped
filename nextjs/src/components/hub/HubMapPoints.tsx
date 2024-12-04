'use client'

import { useAtom } from 'jotai'
import { useEffect } from 'react'
import { Layer, Popup, Source } from 'react-map-gl'

import { GetHubMapDataQuery } from '@/__generated__/graphql'
import { selectedHubSourceMarkerAtom } from '@/components/hub/data'
import { BACKEND_URL } from '@/env'
import { useLoadedMap } from '@/lib/map'

import { useHubRenderContext } from './HubRenderContext'

export function HubPointMarkers({
  layer,
  index,
  beforeId,
}: {
  layer: NonNullable<GetHubMapDataQuery['hubByHostname']>['layers'][number]
  index: number
  beforeId?: string
}) {
  const mapbox = useLoadedMap()
  const context = useHubRenderContext()
  const [selectedSourceMarker, setSelectedSourceMarker] = useAtom(
    selectedHubSourceMarkerAtom
  )

  useEffect(
    function selectMarker() {
      mapbox.loadedMap?.on(
        'mouseover',
        `${layer.source.id}-marker`,
        (event) => {
          const canvas = mapbox.loadedMap?.getCanvas()
          if (!canvas) return
          canvas.style.cursor = 'pointer'
        }
      )
      mapbox.loadedMap?.on(
        'mouseleave',
        `${layer.source.id}-marker`,
        (event) => {
          const canvas = mapbox.loadedMap?.getCanvas()
          if (!canvas) return
          canvas.style.cursor = ''
        }
      )
      if (layer.type === 'events' || layer.type === 'groups') {
        mapbox.loadedMap?.on('click', `${layer.source.id}-marker`, (event) => {
          const feature = event.features?.[0]
          if (feature?.properties?.id) {
            if (layer.type === 'events') {
              context.goToEventId(feature.properties.id)
            } else {
              setSelectedSourceMarker(feature)
            }
          }
        })
      }
    },
    [mapbox.loadedMap, layer.source.id]
  )

  // @ts-ignore
  const coordinates = selectedSourceMarker?.geometry.coordinates

  return (
    <>
      {layer.type === 'members' ? (
        <Source
          id={layer.source.id}
          type="geojson"
          data={new URL(
            `/tiles/external-data-source/${layer.source.id}/geojson`,
            BACKEND_URL
          ).toString()}
          cluster={true}
          clusterMaxZoom={100}
          clusterRadius={50}
          clusterProperties={{
            sum: ['+', ['get', 'count']],
          }}
        >
          <Layer
            id={`${layer.source.id}-cluster`}
            beforeId={beforeId}
            type="circle"
            source={layer.source.id}
            filter={['has', 'sum']}
            paint={{
              'circle-color': 'rgba(24, 164, 127, 0.80)',
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10,
                30,
                15,
                60,
              ],
            }}
          />
          <Layer
            id={`${layer.source.id}-cluster-count`}
            beforeId={beforeId}
            type="symbol"
            source={layer.source.id}
            filter={['has', 'sum']}
            layout={{
              'text-field': ['get', 'sum'],
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 24,
            }}
          />
          <Layer
            id={`${layer.source.id}-circle`}
            beforeId={beforeId}
            type="circle"
            source={layer.source.id}
            filter={['all', ['!', ['has', 'sum']], ['>', ['get', 'count'], 1]]}
            paint={{
              'circle-color': 'rgba(24, 164, 127, 0.80)',
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10,
                30,
                15,
                60,
              ],
            }}
          />
          <Layer
            id={`${layer.source.id}-circle-count`}
            beforeId={beforeId}
            type="symbol"
            source={layer.source.id}
            filter={['all', ['!', ['has', 'sum']], ['>', ['get', 'count'], 1]]}
            layout={{
              'text-field': ['get', 'count'],
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 24,
            }}
          />
          <Layer
            beforeId={beforeId}
            id={`${layer.source.id}-marker`}
            source={layer.source.id}
            type="symbol"
            filter={['all', ['!', ['has', 'sum']], ['==', ['get', 'count'], 1]]}
            layout={{
              'icon-image': layer.iconImage
                ? layer.iconImage
                : `tcc-event-marker`,
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'icon-size': 0.75,
              'icon-anchor': 'bottom',
              ...(layer.mapboxLayout || {}),
            }}
            paint={layer.mapboxPaint || {}}
          />
        </Source>
      ) : (
        <Source
          id={layer.source.id}
          type="vector"
          url={new URL(
            `/tiles/external-data-source/${context.hostname}/${layer.source.id}/tiles.json`,
            BACKEND_URL
          ).toString()}
        >
          <Layer
            beforeId={beforeId}
            id={`${layer.source.id}-marker`}
            source={layer.source.id}
            source-layer={'generic_data'}
            type="symbol"
            layout={{
              'icon-image': layer.iconImage
                ? layer.iconImage
                : `tcc-event-marker`,
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'icon-size': 0.75,
              'icon-anchor': 'bottom',
              ...(layer.mapboxLayout || {}),
            }}
            paint={layer.mapboxPaint || {}}
          />
          {selectedSourceMarker ? (
            <Popup
              key={selectedSourceMarker.properties?.id}
              longitude={coordinates[0]}
              latitude={coordinates[1]}
              offset={[0, -15] as [number, number]}
              onClose={() => setSelectedSourceMarker(null)}
            >
              <h2 className="text-lg">
                {selectedSourceMarker.properties?.title}
              </h2>
              {selectedSourceMarker.properties?.public_url ? (
                <p>
                  <a
                    href={selectedSourceMarker.properties.public_url}
                    target="_blank"
                  >
                    Visit website
                  </a>
                </p>
              ) : null}
              {selectedSourceMarker.properties?.social_url ? (
                <p>
                  <a
                    href={selectedSourceMarker.properties.social_url}
                    target="_blank"
                  >
                    Get in touch
                  </a>
                </p>
              ) : null}
            </Popup>
          ) : null}
        </Source>
      )}
    </>
  )
}
