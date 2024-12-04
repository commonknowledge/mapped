import { useQuery } from '@apollo/client'
import { Point } from 'geojson'
import { useAtom } from 'jotai'
import { ErrorBoundary } from 'next/dist/client/components/error-boundary'
import React, { useContext } from 'react'
import { Popup } from 'react-map-gl'

import {
  MapReportLayerGeoJsonPointQuery,
  MapReportLayerGeoJsonPointQueryVariables,
} from '@/__generated__/graphql'
import { selectedSourceMarkerAtom } from '@/lib/map'

import { reportContext } from '../context'
import { MAP_REPORT_LAYER_POINT } from '../gql_queries'
import useAnalytics from '../useAnalytics'

const MarkerPopup: React.FC = () => {
  /* Get the report context */
  const { id, displayOptions } = useContext(reportContext)

  /* Add c 
  
    /* Get the analytics data for the report */
  const { analytics } = useAnalytics(id, displayOptions.analyticalAreaType)

  const [selectedSourceMarker, setSelectedSourceMarker] = useAtom(
    selectedSourceMarkerAtom
  )

  const { data: selectedPointData, loading: selectedPointLoading } = useQuery<
    MapReportLayerGeoJsonPointQuery,
    MapReportLayerGeoJsonPointQueryVariables
  >(MAP_REPORT_LAYER_POINT, {
    skip: !selectedSourceMarker?.properties?.id,
    variables: {
      genericDataId: String(selectedSourceMarker?.properties?.id),
    },
  })

  if (!selectedSourceMarker?.properties?.id) return null
  return (
    <ErrorBoundary errorComponent={() => <></>}>
      <Popup
        key={selectedSourceMarker.properties.id}
        longitude={
          (selectedSourceMarker.geometry as Point)?.coordinates?.[0] || 0
        }
        latitude={(selectedSourceMarker.geometry as Point)?.coordinates[1] || 0}
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
              {!!selectedPointData?.importedDataGeojsonPoint?.properties
                ?.name && (
                <div className="-space-y-1">
                  <div className="text-meepGray-400">NAME</div>
                  <div>
                    {
                      selectedPointData?.importedDataGeojsonPoint.properties
                        .name
                    }
                  </div>
                </div>
              )}
              {!!selectedPointData?.importedDataGeojsonPoint?.properties
                ?.postcodeData?.postcode && (
                <div className="-space-y-1">
                  <div className="text-meepGray-400">POSTCODE</div>
                  <pre>
                    {
                      selectedPointData?.importedDataGeojsonPoint.properties
                        .postcodeData.postcode
                    }
                  </pre>
                </div>
              )}
            </div>
            {(analytics.data?.mapReport.layers.length || 0) > 1 && (
              <footer className="pb-2 px-2 text-meepGray-400 font-IBMPlexMono text-xs">
                From{' '}
                {
                  selectedPointData?.importedDataGeojsonPoint?.properties
                    ?.dataType.dataSet.externalDataSource.name
                }
              </footer>
            )}
            <footer className="flex-divide-x bg-meepGray-200 text-meepGray-500 flex flex-row justify-around w-full py-1 px-2 text-center">
              {!!selectedPointData?.importedDataGeojsonPoint?.properties
                ?.phone && (
                <a
                  href={`tel:${selectedPointData?.importedDataGeojsonPoint?.properties?.phone}`}
                  target="_blank"
                >
                  Call
                </a>
              )}
              {!!selectedPointData?.importedDataGeojsonPoint?.properties
                ?.phone && (
                <a
                  href={`sms:${selectedPointData?.importedDataGeojsonPoint?.properties?.phone}`}
                  target="_blank"
                >
                  SMS
                </a>
              )}
              {!!selectedPointData?.importedDataGeojsonPoint?.properties
                ?.email && (
                <a
                  href={`mailto:${selectedPointData?.importedDataGeojsonPoint?.properties.email}`}
                  target="_blank"
                >
                  Email
                </a>
              )}
              {!!selectedPointData?.importedDataGeojsonPoint?.properties
                ?.remoteUrl && (
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
  )
}

export default MarkerPopup
