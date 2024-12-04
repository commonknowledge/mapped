'use client'

import { FetchResult, useApolloClient, useQuery } from '@apollo/client'
import { Provider as JotaiProvider, useAtomValue } from 'jotai'
import { merge } from 'lodash'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { MapProvider } from 'react-map-gl'
import { toast } from 'sonner'
import spaceCase from 'to-space-case'

import {
  DeleteMapReportMutation,
  DeleteMapReportMutationVariables,
  GetMapReportQuery,
  GetMapReportQueryVariables,
  MapReportInput,
  UpdateMapReportMutation,
  UpdateMapReportMutationVariables,
} from '@/__generated__/graphql'
import { currentOrganisationIdAtom } from '@/lib/organisation'
import { toastPromise } from '@/lib/toast'

import ReportPage from './(components)/ReportPage'
import {
  DisplayOptionsType,
  defaultDisplayOptions,
  reportContext,
} from './context'
import {
  DELETE_MAP_REPORT,
  GET_MAP_REPORT,
  UPDATE_MAP_REPORT,
} from './gql_queries'

type Params = {
  id: string
}

export default function Page({ params: { id } }: { params: Params }) {
  const client = useApolloClient()
  const router = useRouter()

  const report = useQuery<GetMapReportQuery, GetMapReportQueryVariables>(
    GET_MAP_REPORT,
    {
      variables: { id },
    }
  )
  const orgId = useAtomValue(currentOrganisationIdAtom)

  useEffect(() => {
    if (
      orgId &&
      report.data &&
      report.data.mapReport.organisation.id !== orgId
    ) {
      router.push('/reports')
    }
  }, [orgId, report, router])

  const displayOptions = merge(
    {},
    defaultDisplayOptions,
    report.data?.mapReport?.displayOptions || {}
  )

  const updateDisplayOptions = (options: Partial<DisplayOptionsType>) => {
    updateMutation({ displayOptions: { ...displayOptions, ...options } })
  }

  return (
    <JotaiProvider key={id}>
      <MapProvider>
        <reportContext.Provider
          value={{
            id,
            report,
            updateReport: updateMutation,
            deleteReport: del,
            refreshReportDataQueries,
            displayOptions,
            setDisplayOptions: updateDisplayOptions,
          }}
        >
          <ReportPage />
        </reportContext.Provider>
      </MapProvider>
    </JotaiProvider>
  )

  function refreshReportDataQueries() {
    toastPromise(
      client.refetchQueries({
        include: [
          'GetMapReport',
          'MapReportLayerAnalytics',
          'GetConstituencyData',
          'MapReportRegionStats',
          'MapReportConstituencyStats',
          'MapReportWardStats',
        ],
      }),
      {
        loading: 'Refreshing report data...',
        success: 'Report data updated',
        error: `Couldn't refresh report data`,
      }
    )
  }

  function updateMutation(input: MapReportInput) {
    const update = client.mutate<
      UpdateMapReportMutation,
      UpdateMapReportMutationVariables
    >({
      mutation: UPDATE_MAP_REPORT,
      variables: {
        input: {
          id,
          ...input,
        },
      },
    })
    toastPromise(update, {
      loading: 'Saving...',
      success: (d) => {
        if (!d.errors && d.data) {
          if ('layers' in input) {
            // If layers changed, that means
            // all the member numbers will have changed too.
            refreshReportDataQueries()
          }
          return {
            title: 'Report saved',
            description: `Updated ${Object.keys(input).map(spaceCase).join(', ')}`,
          }
        } else {
          throw new Error("Couldn't save report")
        }
      },
      error: `Couldn't save report`,
    })
  }

  function del() {
    const deleteMutation = client.mutate<
      DeleteMapReportMutation,
      DeleteMapReportMutationVariables
    >({
      mutation: DELETE_MAP_REPORT,
      variables: {
        id: { id },
      },
    })
    toast.promise(deleteMutation, {
      loading: 'Deleting...',
      success: (d: FetchResult) => {
        if (!d.errors && d.data) {
          router.push('/reports')
          return 'Deleted report'
        }
      },
      error: `Couldn't delete report`,
    })
  }
}
