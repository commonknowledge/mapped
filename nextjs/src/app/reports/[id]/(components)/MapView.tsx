'use client'

import LocalisedMap from '@/components/LocalisedMap'
import { PlaceholderLayer } from '@/components/PlaceholderLayer'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import { useActiveTileset, useMapBounds } from '@/lib/map'
import { useEffect } from 'react'
import { POLITICAL_BOUNDARIES } from '../politicalTilesets'
import { SpecificViewConfig, ViewType } from '../reportContext'
import useDataByBoundary from '../useDataByBoundary'
import PoliticalChoropleths from './MapLayers/PoliticalChoropleths'
import ReportMapChoroplethLegend from './MapLayers/ReportMapChoroplethLegend'
import ReportMapMarkers from './MapLayers/ReportMapMarkers'

export const PLACEHOLDER_LAYER_ID_CHOROPLETH = 'choropleths'
export const PLACEHOLDER_LAYER_ID_MARKERS = 'markers'

export default function MapView({
  mapView,
}: {
  mapView: SpecificViewConfig<ViewType.Map>
}) {
  const boundaryType = mapView.mapOptions.choropleth?.boundaryType
  const tilesets = POLITICAL_BOUNDARIES.find(
    (boundary) => boundary.boundaryType === boundaryType
  )?.tilesets

  const activeTileset = useActiveTileset(boundaryType, mapView)

  const { loading, fetchMore } = useDataByBoundary({
    view: mapView,
    tileset: activeTileset,
  })

  const [mapBounds] = useMapBounds()

  // Fetch more data when the map bounds change
  // This has to be here for the loading indicator to work
  // (fetchMore only triggers loading: true in its local hook)
  useEffect(() => {
    if (activeTileset.useBoundsInDataQuery) {
      fetchMore({
        variables: { mapBounds },
      })
    }
  }, [mapBounds, mapView.mapOptions, activeTileset])

  return (
    <>
      <div className="absolute w-[-webkit-fill-available] h-full flex flex-row pointer-events-none">
        <div className="w-full h-full pointer-events-auto">
          {loading && (
            <div className="absolute bottom-12 right-0 z-10 p-4">
              <LoadingIcon size={'50'} />
            </div>
          )}
          <LocalisedMap
            showStreetDetails={mapView.mapOptions.display.streetDetails}
            initViewCountry="uk"
            mapKey={mapView.id}
          >
            <PlaceholderLayer id={PLACEHOLDER_LAYER_ID_CHOROPLETH} />
            {tilesets && tilesets.length && boundaryType && (
              <PoliticalChoropleths
                key={`${boundaryType}-${tilesets[0].mapboxSourceId}`}
                view={mapView}
                boundaryType={boundaryType}
                tilesets={tilesets}
              />
            )}
            <PlaceholderLayer id={PLACEHOLDER_LAYER_ID_MARKERS} />
            <ReportMapMarkers />
          </LocalisedMap>
        </div>
      </div>
      <span className="pointer-events-auto">
        <ReportMapChoroplethLegend />
      </span>
    </>
  )
}
