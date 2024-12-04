'use client'

import { useQuery } from '@apollo/client'
import { scaleLinear, scaleSequential } from 'd3-scale'
import { interpolateInferno } from 'd3-scale-chromatic'
import { atom, useAtom, useSetAtom } from 'jotai'
import { Fragment, useContext, useEffect } from 'react'
import Map, { Layer, Source, ViewState } from 'react-map-gl'

import {
  AnalyticalAreaType,
  MapReportLayerGeoJsonPointQuery,
  MapReportLayerGeoJsonPointQueryVariables,
} from '@/__generated__/graphql'
import { reportContext } from '@/app/reports/[id]/context'
import { PlaceholderLayer } from '@/components/PlaceholderLayer'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import { BACKEND_URL } from '@/env'
import { authenticationHeaders } from '@/lib/auth'
import {
  constituencyPanelTabAtom,
  isConstituencyPanelOpenAtom,
  selectedConstituencyAtom,
  selectedSourceMarkerAtom,
  useLoadedMap,
} from '@/lib/map'

import { getTilesets } from '../getTilesets'
import { MAP_REPORT_LAYER_POINT } from '../gql_queries'
import useAnalytics from '../useAnalytics'
import useChoropleths from '../useChoropleths'
import useMarkers from '../useMarkers'
import { ExternalDataSourcePointMarkers } from './ExternalDataSourcePointMarkers'
import MarkerPopup from './MarkerPopup'

export const MAX_REGION_ZOOM = 8
export const MAX_CONSTITUENCY_ZOOM = 10
export const MIN_MEMBERS_ZOOM = 7

const viewStateAtom = atom<Partial<ViewState>>({
  longitude: -2.296605,
  latitude: 53.593349,
  zoom: 6,
})

export function ReportMap() {
  const mapbox = useLoadedMap()
  useMarkers()
  const [selectedSourceMarker, setSelectedSourceMarker] = useAtom(
    selectedSourceMarkerAtom
  )

  /* Get the report context */
  const { id, displayOptions } = useContext(reportContext)

  /* Add chloropleth data to the mapbox source */
  useChoropleths(id, displayOptions.analyticalAreaType)

  /* Get the analytics data for the report */
  const { analytics, regionAnalytics, wardAnalytics, constituencyAnalytics } =
    useAnalytics(id, displayOptions.analyticalAreaType)

  /* Get the tilesets for the report */
  const tilesets = getTilesets({
    analytics,
    regionAnalytics,
    constituencyAnalytics,
    wardAnalytics,
  })

  // Unless someone explicitly sets 2019 constituency, default to 2024 when zooming in
  const constituencyTileset =
    displayOptions.analyticalAreaType ===
    AnalyticalAreaType.ParliamentaryConstituency
      ? tilesets.constituencies
      : tilesets.constituencies2024

  const [selectedConstituency, setSelectedConstituency] = useAtom(
    selectedConstituencyAtom
  )
  const setTab = useSetAtom(constituencyPanelTabAtom)
  const setIsConstituencyPanelOpen = useSetAtom(isConstituencyPanelOpenAtom)

  useEffect(
    function selectConstituency() {
      mapbox.loadedMap?.on(
        'mouseover',
        `${constituencyTileset.mapboxSourceId}-fill`,
        () => {
          const canvas = mapbox.loadedMap?.getCanvas()
          if (!canvas) return
          canvas.style.cursor = 'pointer'
        }
      )
      mapbox.loadedMap?.on(
        'mouseleave',
        `${constituencyTileset.mapboxSourceId}-fill`,
        () => {
          const canvas = mapbox.loadedMap?.getCanvas()
          if (!canvas) return
          canvas.style.cursor = ''
        }
      )
      mapbox.loadedMap?.on(
        'click',
        `${constituencyTileset.mapboxSourceId}-fill`,
        (event: any) => {
          try {
            const feature = event.features?.[0]
            if (feature) {
              if (feature.source === constituencyTileset.mapboxSourceId) {
                const id = feature.properties?.[constituencyTileset.promoteId]
                if (id) {
                  setSelectedConstituency(id)
                  setIsConstituencyPanelOpen(true)
                  setTab('selected')
                }
              }
            }
          } catch (e) {
            console.error('Failed to select constituency', e)
          }
        }
      )
    },
    [mapbox.loadedMap, displayOptions.analyticalAreaType, constituencyTileset]
  )

  const [viewState, setViewState] = useAtom(viewStateAtom)

  const { data: selectedPointData, loading: selectedPointLoading } = useQuery<
    MapReportLayerGeoJsonPointQuery,
    MapReportLayerGeoJsonPointQueryVariables
  >(MAP_REPORT_LAYER_POINT, {
    skip: !selectedSourceMarker?.properties?.id,
    variables: {
      genericDataId: String(selectedSourceMarker?.properties?.id),
    },
  })

  const loadingLayers = [
    { execution: analytics, label: 'Report layers' },
    { execution: regionAnalytics, label: 'Regional stats' },
    { execution: constituencyAnalytics, label: 'Constituency stats' },
    { execution: wardAnalytics, label: 'Ward stats' },
  ]
  const loading =
    loadingLayers.some((query) => query.execution.loading) || !mapbox.loaded

  return (
    <>
      {loading && (
        <div className="absolute w-full h-full inset-0 z-10 pointer-events-none">
          <div className="flex flex-col items-center justify-center w-full h-full">
            <LoadingIcon />
            {loadingLayers
              .filter((query) => query.execution.loading)
              .map((query) => (
                <div key={query.label} className="text-meepGray-200 px-2">
                  Loading {query.label}
                </div>
              ))}
          </div>
        </div>
      )}
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        mapStyle={
          displayOptions.showStreetDetails
            ? 'mapbox://styles/commonknowledge/clubx087l014y01mj1bv63yg8'
            : 'mapbox://styles/commonknowledge/clty3prwh004601pr4nqn7l9s'
        }
        onClick={() => setSelectedSourceMarker(null)}
        transformRequest={(url, resourceType) => {
          if (url.includes(BACKEND_URL) && !url.includes('tiles.json')) {
            return {
              url,
              headers: authenticationHeaders(),
              method: 'GET',
            }
          }
          return { url }
        }}
      >
        {mapbox.loaded && (
          <>
            {Object.entries(tilesets).map(([key, tileset]) => {
              let min =
                tileset.data.reduce(
                  (min, p) => (p?.count! < min ? p?.count! : min),
                  tileset.data?.[0]?.count!
                ) || 0
              let max =
                tileset.data.reduce(
                  (max, p) => (p?.count! > max ? p?.count! : max),
                  tileset.data?.[0]?.count!
                ) || 1

              // Ensure min and max are different to fix interpolation errors
              if (min === max) {
                if (min >= 1) {
                  min = min - 1
                } else {
                  max = max + 1
                }
              }

              // Uses 0-1 for easy interpolation
              // go from 0-100% and return real numbers
              const legendScale = scaleLinear().domain([0, 1]).range([min, max])

              // Map real numbers to colours
              const colourScale = scaleSequential()
                .domain([min, max])
                .interpolator(interpolateInferno)

              // Text scale
              const textScale = scaleLinear().domain([min, max]).range([1, 1.5])

              const inDataFilter = [
                'in',
                ['get', tileset.promoteId],
                ['literal', tileset.data.map((d) => d.gss || '')],
              ]

              let steps = Math.min(max, 30) // Max 30 steps
              steps = Math.max(steps, 3) // Min 3 steps (for valid Mapbox fill-color rule)
              const colourStops = new Array(steps)
                .fill(0)
                .map((_, i) => i / steps)
                .map((n) => {
                  return [legendScale(n), colourScale(legendScale(n))]
                })
                .flat()

              const SOURCE_FILL = `${tileset.name}_SOURCE_FILL`
              const SOURCE_STROKE = `${tileset.name}_SOURCE_STROKE`
              const SOURCE_LABEL = `${tileset.name}_SOURCE_LABEL`
              const SOURCE_POINTS = `${tileset.name}_SOURCE_POINTS`

              return (
                <Fragment key={tileset.mapboxSourceId}>
                  <PlaceholderLayer id={SOURCE_FILL} />
                  <PlaceholderLayer id={SOURCE_STROKE} />
                  <PlaceholderLayer id={SOURCE_LABEL} />
                  <PlaceholderLayer id={SOURCE_POINTS} />
                  <Source
                    id={tileset.mapboxSourceId}
                    type="vector"
                    url={`mapbox://${tileset.mapboxSourceId}`}
                    promoteId={tileset.promoteId}
                    {...(tileset.mapboxSourceProps || {})}
                  />
                  {/* Shade area by count */}
                  <Layer
                    beforeId={SOURCE_FILL}
                    id={`${tileset.mapboxSourceId}-fill`}
                    source={tileset.mapboxSourceId}
                    source-layer={tileset.sourceLayerId}
                    type="fill"
                    {...(tileset.data ? { filter: inDataFilter } : {})}
                    paint={{
                      // Shade the map by the count of imported data
                      'fill-color': [
                        'interpolate',
                        ['linear'],
                        ['to-number', ['feature-state', 'count'], 0],
                        ...colourStops,
                      ],
                      'fill-opacity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        MAX_REGION_ZOOM,
                        0.5,
                        MAX_CONSTITUENCY_ZOOM,
                        0.2,
                      ],
                    }}
                    {...(tileset.mapboxLayerProps || {})}
                  />
                  {/* Border of the boundary */}
                  <Layer
                    beforeId={SOURCE_STROKE}
                    {...(tileset.data ? { filter: inDataFilter } : {})}
                    id={`${tileset.mapboxSourceId}-line`}
                    source={tileset.mapboxSourceId}
                    source-layer={tileset.sourceLayerId}
                    type="line"
                    paint={{
                      'line-color': 'white',
                      'line-width': 1.5,
                      'line-opacity': 0.5,
                    }}
                    {...(tileset.mapboxLayerProps || {})}
                  />
                  <Source
                    id={`${tileset.mapboxSourceId}-db-point`}
                    type="geojson"
                    data={{
                      type: 'FeatureCollection',
                      features: tileset.data
                        .filter((d) => d.gssArea?.point?.geometry)
                        .map((d) => ({
                          type: 'Feature',
                          geometry: d.gssArea?.point
                            ?.geometry! as GeoJSON.Point,
                          properties: {
                            count: d.count,
                            label: d.label,
                          },
                        })),
                    }}
                  />
                  <Layer
                    beforeId={SOURCE_LABEL}
                    id={`${tileset.mapboxSourceId}-label-count`}
                    source={`${tileset.mapboxSourceId}-db-point`}
                    type="symbol"
                    layout={{
                      'symbol-spacing': 1000,
                      'text-field': ['get', 'count'],
                      'text-size': [
                        'interpolate',
                        ['linear'],
                        ['get', 'count'],
                        min,
                        textScale(min) * 17,
                        max,
                        textScale(max) * 17,
                      ],
                      'symbol-placement': 'point',
                      'text-offset': [0, -0.5],
                      'text-allow-overlap': true,
                      'text-ignore-placement': true,
                      'text-font': [
                        'DIN Offc Pro Medium',
                        'Arial Unicode MS Bold',
                      ],
                    }}
                    paint={{
                      'text-color': 'white',
                      'text-halo-color': 'black',
                      'text-halo-width': 0.3,
                    }}
                    {...(tileset.mapboxLayerProps || {})}
                  />
                  <Layer
                    beforeId={SOURCE_LABEL}
                    id={`${tileset.mapboxSourceId}-label-name`}
                    source={`${tileset.mapboxSourceId}-db-point`}
                    type="symbol"
                    layout={{
                      'symbol-spacing': 1000,
                      'text-field': ['get', 'label'],
                      'text-size': [
                        'interpolate',
                        ['linear'],
                        ['get', 'count'],
                        min,
                        textScale(min) * 9,
                        max,
                        textScale(max) * 9,
                      ],
                      'text-font': [
                        'DIN Offc Pro Medium',
                        'Arial Unicode MS Bold',
                      ],
                      'symbol-placement': 'point',
                      'text-offset': [0, 0.6],
                    }}
                    paint={{
                      'text-color': 'white',
                      'text-opacity': 0.9,
                      'text-halo-color': 'black',
                      'text-halo-width': 0.3,
                    }}
                    {...(tileset.mapboxLayerProps || {})}
                  />
                </Fragment>
              )
            })}
            <PlaceholderLayer id={'PLACEHOLDER_SELECTION'} />
            {!!selectedConstituency && (
              <Layer
                beforeId={'PLACEHOLDER_SELECTION'}
                filter={[
                  'in',
                  ['get', constituencyTileset.promoteId],
                  ['literal', selectedConstituency],
                ]}
                id={`${constituencyTileset}-selected-line`}
                source={constituencyTileset.mapboxSourceId}
                source-layer={constituencyTileset.sourceLayerId}
                type="line"
                paint={{
                  'line-color': 'white',
                  'line-width': 4,
                  'line-opacity': 1,
                }}
              />
            )}
            <PlaceholderLayer id={'PLACEHOLDER_MARKERS'} />
            {/* Wait for all icons to load */}
            {analytics.data?.mapReport.layers.map((layer, index) => {
              return (
                <ExternalDataSourcePointMarkers
                  key={layer?.source?.id || index}
                  index={index}
                  externalDataSourceId={layer?.source?.id}
                />
              )
            })}
            <MarkerPopup />
          </>
        )}
      </Map>
    </>
  )
}
