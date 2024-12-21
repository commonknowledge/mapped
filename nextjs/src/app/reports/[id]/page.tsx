'use client'

import { useQuery } from '@apollo/client'
import { Provider as JotaiProvider, useAtomValue } from 'jotai'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { MapProvider } from 'react-map-gl'

import {
  GetMapReportQuery,
  GetMapReportQueryVariables,
} from '@/__generated__/graphql'
import { currentOrganisationIdAtom } from '@/lib/organisation'

import { SidebarProvider } from '@/components/ui/sidebar'
import { merge } from 'lodash'
import ReportNavbar from './(components)/ReportNavbar'
import ReportPage from './(components)/ReportPage'
import ReportProvider from './(components)/ReportProvider'
import { GET_MAP_REPORT } from './gql_queries'
import { getPoliticalTilesetsByCountry } from './politicalTilesets'
import { defaultReportConfig, MapReportExtended } from './reportContext'

type Params = {
  id: string
}

export default function Page({ params: { id } }: { params: Params }) {
  const router = useRouter()
  const report = useQuery<GetMapReportQuery, GetMapReportQueryVariables>(
    GET_MAP_REPORT,
    { variables: { id } }
  )
  const orgId = useAtomValue(currentOrganisationIdAtom)

  // TODO: Implement multi tenancy at the database level
  // TODO: Move this logic to middleware (add orgIds as a custom data array on the user's JWT)
  useEffect(() => {
    if (
      orgId &&
      report.data &&
      report.data.mapReport.organisation.id !== orgId
    ) {
      router.push('/reports')
    }
  }, [orgId, report, router])

  // Really important to check if the report is null before rendering the page
  // The ReportProvider component needs to be able to provide a report to its children
  if (!report.data?.mapReport) return null
  const mapReport = merge(
    {
      displayOptions: defaultReportConfig,
      politicalBoundaries: getPoliticalTilesetsByCountry('uk'),
    },
    report.data.mapReport
  ) as unknown as MapReportExtended

  return (
    <JotaiProvider key={id}>
      <MapProvider>
        <ReportProvider report={mapReport}>
          <SidebarProvider
            style={
              {
                '--sidebar-width': '360px',
              } as React.CSSProperties
            }
          >
            <ReportNavbar />
            <ReportPage />
          </SidebarProvider>
        </ReportProvider>
      </MapProvider>
    </JotaiProvider>
  )
}
