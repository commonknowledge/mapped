'use client'

import {
  UploadCoverImageToReportMutation,
  UploadCoverImageToReportMutationVariables,
} from '@/__generated__/graphql'
import LocalisedMap from '@/components/LocalisedMap'
import { PlaceholderLayer } from '@/components/PlaceholderLayer'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import { SECONDS_BETWEEN_SCREENSHOT_UPDATES } from '@/env'
import { useActiveTileset, useLoadedMap, useMapBounds } from '@/lib/map'
import { useReport } from '@/lib/map/useReport'
import { useInterval } from '@/lib/useInterval'
import { gql, useMutation } from '@apollo/client'
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

  const activeTileset = useActiveTileset(boundaryType)

  const { loading, fetchMore } = useDataByBoundary({
    view: mapView,
    tileset: activeTileset,
  })

  const [mapBounds] = useMapBounds()
  const map = useLoadedMap()
  const report = useReport()
  const [uploadCoverImage, coverImageMutation] = useMutation<
    UploadCoverImageToReportMutation,
    UploadCoverImageToReportMutationVariables
  >(UPLOAD_COVER_IMAGE_TO_REPORT_MUTATION)

  // Regularly update the report's cover image using a screenshot of the map
  useInterval(async function updateReportCoverImage() {
    try {
      const file = await map.getImageFile('automatic_screenshot')
      if (file) {
        await uploadCoverImage({
          variables: {
            reportId: report.report.id,
            file,
          },
        })
      }
    } catch (error) {
      console.error('Error updating report cover image', error)
    }
  }, SECONDS_BETWEEN_SCREENSHOT_UPDATES * 1000)

  // Fetch more data when the map bounds change
  // This has to be here for the loading indicator to work
  // (fetchMore only triggers loading: true in its local hook)
  useEffect(() => {
    if (activeTileset.useBoundsInDataQuery) {
      fetchMore({ variables: { mapBounds } })
    }
  }, [mapBounds, mapView.mapOptions, activeTileset, fetchMore])

  return (
    <>
      <div className="absolute w-[-webkit-fill-available] w-[-moz-available] w-full h-full flex flex-row pointer-events-none">
        <div className="w-full h-full pointer-events-auto">
          {loading && (
            <div className="absolute bottom-12 right-0 z-10 p-4">
              <LoadingIcon size={'50'} />
            </div>
          )}
          <LocalisedMap
            // TODO: fix MAP-846
            // showStreetDetails={mapView.mapOptions.display.streetDetails}
            showStreetDetails={false}
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

const UPLOAD_COVER_IMAGE_TO_REPORT_MUTATION = gql`
  mutation UploadCoverImageToReport($reportId: String!, $file: Upload!) {
    uploadCoverImageToReport(reportId: $reportId, file: $file) {
      id
      coverImageAbsoluteUrl
    }
  }
`
