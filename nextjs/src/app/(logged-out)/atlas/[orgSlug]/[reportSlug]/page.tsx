'use client'

import { gql, useQuery } from '@apollo/client'
import { Provider as JotaiProvider } from 'jotai'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapProvider } from 'react-map-gl'

import {
  GetPublicMapReportForLayoutQuery,
  GetPublicMapReportForLayoutQueryVariables,
} from '@/__generated__/graphql'
import { PublicMap } from '@/components/report/PublicMap'
import { LoadingIcon } from '@/components/ui/loadingIcon'

type Params = {
  orgSlug: string
  reportSlug: string
}

export default function Page({
  params: { orgSlug, reportSlug },
}: {
  params: Params
}) {
  const report = useQuery<
    GetPublicMapReportForLayoutQuery,
    GetPublicMapReportForLayoutQueryVariables
  >(GET_PUBLIC_MAP_REPORT, {
    variables: { orgSlug, reportSlug },
  })

  return (
    <MapProvider>
      <JotaiProvider>
        <div className="absolute w-full h-full flex flex-row pointer-events-none">
          <div className="w-full h-full pointer-events-auto">
            <PublicMap />
          </div>
          {!report.data ? (
            <div className="absolute w-full h-full inset-0 z-10 pointer-events-none">
              <div className="flex flex-col items-center justify-center w-full h-full">
                <LoadingIcon />
              </div>
            </div>
          ) : (
            <aside className="absolute top-5 left-5 right-0 w-0 pointer-events-auto">
              <div className="w-[150px] rounded-md bg-meepGray-700 text-white p-4">
                <h1 className="text-lg font-bold mb-1 leading-tight">
                  {report.data?.publicMapReport.name}
                </h1>
                <p className="text-sm">
                  By {report.data?.publicMapReport.organisation.name}
                </p>
              </div>
            </aside>
          )}
        </div>
      </JotaiProvider>
    </MapProvider>
  )
}

const GET_PUBLIC_MAP_REPORT = gql`
  query GetPublicMapReportForLayout($orgSlug: String!, $reportSlug: String!) {
    publicMapReport(orgSlug: $orgSlug, reportSlug: $reportSlug) {
      id
      name
      displayOptions
      organisation {
        id
        slug
        name
      }
      layers {
        id
        name
      }
    }
  }
`
