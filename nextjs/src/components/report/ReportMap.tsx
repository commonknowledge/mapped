'use client'

import {
  AnalyticalAreaType,
  MapReportConstituencyStatsQuery,
  MapReportConstituencyStatsQueryVariables,
  MapReportLayerAnalyticsQuery,
  MapReportLayerAnalyticsQueryVariables,
  MapReportLayerGeoJsonPointQuery,
  MapReportLayerGeoJsonPointQueryVariables,
  MapReportRegionStatsQuery,
  MapReportRegionStatsQueryVariables,
  MapReportWardStatsQuery,
  MapReportWardStatsQueryVariables,
} from '@/__generated__/graphql'
import { ReportContext } from '@/app/reports/[id]/context'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import { BACKEND_URL } from '@/env'
import { authenticationHeaders } from '@/lib/auth'
import {
  PlaceholderLayer,
  constituencyPanelTabAtom,
  isConstituencyPanelOpenAtom,
  layerColour,
  selectedConstituencyAtom,
  selectedSourceMarkerAtom,
  useLoadedMap,
  useMapIcons,
} from '@/lib/map'
import { gql, useQuery } from '@apollo/client'
import { scaleLinear, scaleSequential } from 'd3-scale'
import { interpolateInferno } from 'd3-scale-chromatic'
import { Point } from 'geojson'
import { atom, useAtom } from 'jotai'
import { ErrorBoundary } from 'next/dist/client/components/error-boundary'
import { Fragment, useContext, useEffect } from 'react'
import Map, { Layer, LayerProps, Popup, Source, ViewState } from 'react-map-gl'

const MAX_REGION_ZOOM = 8
export const MAX_CONSTITUENCY_ZOOM = 10
const MIN_MEMBERS_ZOOM = 7

const viewStateAtom = atom<Partial<ViewState>>({
  longitude: -2.296605,
  latitude: 53.593349,
  zoom: 6,
})

export function ReportMap() {
  const { id, displayOptions } = useContext(ReportContext)
  const analytics = useQuery<
    MapReportLayerAnalyticsQuery,
    MapReportLayerAnalyticsQueryVariables
  >(MAP_REPORT_LAYER_ANALYTICS, {
    variables: {
      reportID: id,
    },
  })

  const regionAnalytics = useQuery<
    MapReportRegionStatsQuery,
    MapReportRegionStatsQueryVariables
  >(MAP_REPORT_REGION_STATS, {
    variables: {
      reportID: id,
    },
  })

  const constituencyAnalytics = useQuery<
    MapReportConstituencyStatsQuery,
    MapReportConstituencyStatsQueryVariables
  >(MAP_REPORT_CONSTITUENCY_STATS, {
    variables: {
      reportID: id,
      analyticalAreaType: displayOptions.analyticalAreaType,
    },
  })

  const wardAnalytics = useQuery<
    MapReportWardStatsQuery,
    MapReportWardStatsQueryVariables
  >(MAP_REPORT_WARD_STATS, {
    variables: {
      reportID: id,
    },
  })

  const mapbox = useLoadedMap()

  // TODO: unify this and HubMap's TILESETS
  const TILESETS: Record<
    'EERs' | 'constituencies' | 'constituencies2024' | 'wards',
    {
      name: string
      singular: string
      mapboxSourceId: string
      sourceLayerId?: string
      promoteId: string
      labelId: string
      mapboxSourceProps?: { maxzoom?: number }
      mapboxLayerProps?: Omit<
        LayerProps,
        'type' | 'url' | 'id' | 'paint' | 'layout'
      >
      data: MapReportRegionStatsQuery['mapReport']['importedDataCountByRegion']
      downloadUrl?: string
    }
  > = {
    EERs: {
      name: 'regions',
      singular: 'region',
      mapboxSourceId: 'commonknowledge.awsfhx20',
      downloadUrl:
        'https://ckan.publishing.service.gov.uk/dataset/european-electoral-regions-december-2018-boundaries-uk-buc1/resource/b268c97f-2507-4477-9149-0a0c5d2bfbca',
      sourceLayerId: 'European_Electoral_Regions_De-bxyqod',
      promoteId: 'eer18cd',
      labelId: 'eer18nm',
      data: regionAnalytics.data?.mapReport.importedDataCountByRegion || [],
      mapboxSourceProps: {
        //   maxzoom: MAX_REGION_ZOOM
      },
      mapboxLayerProps: {
        maxzoom: MAX_REGION_ZOOM,
      },
    },
    constituencies: {
      name: 'GE2019 constituencies',
      singular: 'constituency',
      mapboxSourceId: 'commonknowledge.4xqg91lc',
      sourceLayerId: 'Westminster_Parliamentary_Con-6i1rlq',
      promoteId: 'pcon16cd',
      labelId: 'pcon16nm',
      data:
        constituencyAnalytics.data?.mapReport.importedDataCountByConstituency ||
        [],
      mapboxSourceProps: {},
      mapboxLayerProps: {
        minzoom: MAX_REGION_ZOOM,
        maxzoom: MAX_CONSTITUENCY_ZOOM,
      },
    },
    constituencies2024: {
      name: 'GE2024 constituencies',
      singular: 'constituency',
      mapboxSourceId: 'commonknowledge.39dnumdm',
      sourceLayerId: 'constituencies_2024_simplifie-7w220i',
      promoteId: 'PCON24CD',
      labelId: 'PCON24NM',
      data:
        constituencyAnalytics.data?.mapReport.importedDataCountByConstituency ||
        [],
      mapboxSourceProps: {},
      mapboxLayerProps: {
        minzoom: MAX_REGION_ZOOM,
        maxzoom: MAX_CONSTITUENCY_ZOOM,
      },
    },
    wards: {
      name: 'wards',
      singular: 'ward',
      mapboxSourceId: 'commonknowledge.0rzbo365',
      sourceLayerId: 'Wards_Dec_2023_UK_Boundaries_-7wzb6g',
      promoteId: 'WD23CD',
      labelId: 'WD23NM',
      data: wardAnalytics.data?.mapReport.importedDataCountByWard || [],
      mapboxSourceProps: {},
      mapboxLayerProps: {
        minzoom: MAX_CONSTITUENCY_ZOOM,
      },
    },
  }

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

  // Unless someone explicitly sets 2019 constituency, default to 2024 when zooming in
  const constituencyTileset =
    displayOptions.analyticalAreaType ===
      AnalyticalAreaType.ParliamentaryConstituency
      ? TILESETS.constituencies
      : TILESETS.constituencies2024

  useEffect(
    function setFeatureState() {
      if (!mapbox.loadedMap) return
      Object.values(TILESETS)?.forEach((tileset) => {
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
      TILESETS,
      mapbox.loadedMap,
    ]
  )

  const requiredImages = [
    {
      url: () =>
        new URL('/markers/default.png', window.location.href).toString(),
      name: 'meep-marker-0',
    },
    {
      url: () =>
        new URL('/markers/default-2.png', window.location.href).toString(),
      name: 'meep-marker-1',
    },
    {
      url: () =>
        new URL('/markers/selected.png', window.location.href).toString(),
      name: 'meep-marker-selected',
    },
  ]

  const loadedImages = useMapIcons(requiredImages, mapbox)

  const [selectedSourceMarker, setSelectedSourceMarker] = useAtom(
    selectedSourceMarkerAtom
  )
  const [selectedConstituency, setSelectedConstituency] = useAtom(
    selectedConstituencyAtom
  )
  const [tab, setTab] = useAtom(constituencyPanelTabAtom)
  const [isConstituencyPanelOpen, setIsConstituencyPanelOpen] = useAtom(
    isConstituencyPanelOpenAtom
  )

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
        (event) => {
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
            {Object.entries(TILESETS).map(([key, tileset]) => {
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
            {!!selectedSourceMarker?.properties?.id && (
              <ErrorBoundary errorComponent={() => <></>}>
                <Popup
                  key={selectedSourceMarker.properties.id}
                  longitude={
                    (selectedSourceMarker.geometry as Point)
                      ?.coordinates?.[0] || 0
                  }
                  latitude={
                    (selectedSourceMarker.geometry as Point)?.coordinates[1] ||
                    0
                  }
                  closeOnClick={false}
                  className="text-black [&>.mapboxgl-popup-content]:p-0 [&>.mapboxgl-popup-content]:overflow-auto w-[150px] [&>.mapboxgl-popup-tip]:!border-t-meepGray-200"
                  closeButton={false}
                  closeOnMove={false}
                  anchor="bottom"
                  offset={[0, -35] as any}
                >
                  {selectedPointLoading ? (
                    <div className="font-IBMPlexMono p-2 space-y-1 bg-white">
                      <div className="-space-y-1">
                        <div className="text-meepGray-400">LOADING</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="font-IBMPlexMono p-2 space-y-1 bg-white">
                        {!!selectedPointData?.importedDataGeojsonPoint
                          ?.properties?.name && (
                            <div className="-space-y-1">
                              <div className="text-meepGray-400">NAME</div>
                              <div>
                                {
                                  selectedPointData?.importedDataGeojsonPoint
                                    .properties.name
                                }
                              </div>
                            </div>
                          )}
                        {!!selectedPointData?.importedDataGeojsonPoint
                          ?.properties?.postcodeData?.postcode && (
                            <div className="-space-y-1">
                              <div className="text-meepGray-400">POSTCODE</div>
                              <pre>
                                {
                                  selectedPointData?.importedDataGeojsonPoint
                                    .properties.postcodeData.postcode
                                }
                              </pre>
                            </div>
                          )}
                      </div>
                      {(analytics.data?.mapReport.layers.length || 0) > 1 && (
                        <footer className="pb-2 px-2 text-meepGray-400 font-IBMPlexMono text-xs">
                          From{' '}
                          {
                            selectedPointData?.importedDataGeojsonPoint
                              ?.properties?.dataType.dataSet.externalDataSource
                              .name
                          }
                        </footer>
                      )}
                      <footer className="flex-divide-x bg-meepGray-200 text-meepGray-500 flex flex-row justify-around w-full py-1 px-2 text-center">
                        {!!selectedPointData?.importedDataGeojsonPoint
                          ?.properties?.phone && (
                            <a
                              href={`tel:${selectedPointData?.importedDataGeojsonPoint?.properties?.phone}`}
                              target="_blank"
                            >
                              Call
                            </a>
                          )}
                        {!!selectedPointData?.importedDataGeojsonPoint
                          ?.properties?.phone && (
                            <a
                              href={`sms:${selectedPointData?.importedDataGeojsonPoint?.properties?.phone}`}
                              target="_blank"
                            >
                              SMS
                            </a>
                          )}
                        {!!selectedPointData?.importedDataGeojsonPoint
                          ?.properties?.email && (
                            <a
                              href={`mailto:${selectedPointData?.importedDataGeojsonPoint?.properties.email}`}
                              target="_blank"
                            >
                              Email
                            </a>
                          )}
                        {!!selectedPointData?.importedDataGeojsonPoint
                          ?.properties?.remoteUrl && (
                            <a
                              href={`${selectedPointData?.importedDataGeojsonPoint?.properties?.remoteUrl}`}
                              target="_blank"
                            >
                              Link
                            </a>
                          )}
                      </footer>
                    </>
                  )}
                </Popup>
              </ErrorBoundary>
            )}
          </>
        )}
      </Map>
    </>
  )
}

function ExternalDataSourcePointMarkers({
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
            beforeId={'PLACEHOLDER_MARKERS'}
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
            beforeId={'PLACEHOLDER_MARKERS'}
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
            beforeId={'PLACEHOLDER_MARKERS'}
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
    </>
  )
}

const MAP_REPORT_LAYER_POINT = gql`
  query MapReportLayerGeoJSONPoint($genericDataId: String!) {
    importedDataGeojsonPoint(genericDataId: $genericDataId) {
      id
      type
      geometry {
        type
        coordinates
      }
      properties {
        id
        lastUpdate
        name
        phone
        email
        postcodeData {
          postcode
        }
        address
        json
        remoteUrl
        dataType {
          dataSet {
            externalDataSource {
              name
            }
          }
        }
      }
    }
  }
`

export const MAP_REPORT_LAYER_ANALYTICS = gql`
  query MapReportLayerAnalytics($reportID: ID!) {
    mapReport(pk: $reportID) {
      id
      layers {
        id
        name
        source {
          id
          organisation {
            name
          }
        }
      }
    }
  }
`

const MAP_REPORT_REGION_STATS = gql`
  query MapReportRegionStats($reportID: ID!) {
    mapReport(pk: $reportID) {
      id
      importedDataCountByRegion {
        label
        gss
        count
        gssArea {
          point {
            id
            type
            geometry {
              type
              coordinates
            }
          }
        }
      }
    }
  }
`

const MAP_REPORT_CONSTITUENCY_STATS = gql`
  query MapReportConstituencyStats(
    $reportID: ID!
    $analyticalAreaType: AnalyticalAreaType!
  ) {
    mapReport(pk: $reportID) {
      id
      importedDataCountByConstituency: importedDataCountByArea(
        analyticalAreaType: $analyticalAreaType
      ) {
        label
        gss
        count
        gssArea {
          point {
            id
            type
            geometry {
              type
              coordinates
            }
          }
        }
      }
    }
  }
`

const MAP_REPORT_WARD_STATS = gql`
  query MapReportWardStats($reportID: ID!) {
    mapReport(pk: $reportID) {
      id
      importedDataCountByWard {
        label
        gss
        count
        gssArea {
          point {
            id
            type
            geometry {
              type
              coordinates
            }
          }
        }
      }
    }
  }
`
