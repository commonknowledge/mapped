'use client'

import {
  DeleteMapReportMutation,
  DeleteMapReportMutationVariables,
  UpdateMapReportMutation,
  UpdateMapReportMutationVariables,
} from '@/__generated__/graphql'
import { toastPromise } from '@/lib/toast'
import { FetchResult, useApolloClient } from '@apollo/client'
import { useSetAtom } from 'jotai'
import { merge, pick } from 'lodash'
import { useRouter } from 'next/navigation'
import { ReactNode, useContext, useEffect } from 'react'
import toSpaceCase from 'to-space-case'
import { DELETE_MAP_REPORT, UPDATE_MAP_REPORT } from '../gql_queries'
import ReportContext, {
  MapReportExtended,
  ReportConfig,
} from '../reportContext'
import { navbarTitleAtom } from './ReportNavbar'

interface ReportProviderProps {
  report: MapReportExtended
  children: ReactNode
}

const ReportProvider = ({ report, children }: ReportProviderProps) => {
  const router = useRouter()
  const client = useApolloClient()
  const setNavbarTitle = useSetAtom(navbarTitleAtom)

  useEffect(() => {
    setNavbarTitle(report.name)
  }, [report.name])

  // If the report has only one layer, set it as the data source
  useEffect(() => {
    if (report.layers.length === 1) {
      updateReport({
        displayOptions: {
          dataVisualisation: {
            dataSource: report.layers[0].id,
          },
        },
      })
    }
  }, [report.layers])

  function updateReport(payload: {
    name?: string
    displayOptions?: Partial<ReportConfig>
    layers?: any[]
  }) {
    const input: any = pick(merge({}, report, payload), [
      'id',
      'name',
      'displayOptions',
    ])
    if (payload.layers) {
      input.layers = payload.layers
    }

    const update = client.mutate<
      UpdateMapReportMutation,
      UpdateMapReportMutationVariables
    >({
      mutation: UPDATE_MAP_REPORT,
      variables: {
        input,
      },
    })
    toastPromise(update, {
      loading: 'Saving...',
      success: () => {
        return {
          title: 'Report saved',
          description: `Updated ${Object.keys(payload).map(toSpaceCase).join(', ')}`,
        }
      },
      error: `Couldn't save report`,
    }).finally(() => {
      refreshReportData()
    })
  }

  function deleteReport() {
    const deleteMutation = client.mutate<
      DeleteMapReportMutation,
      DeleteMapReportMutationVariables
    >({
      mutation: DELETE_MAP_REPORT,
      variables: {
        id: { id: report.id },
      },
    })
    toastPromise(deleteMutation, {
      loading: 'Deleting...',
      success: (d: FetchResult) => {
        router.push('/reports')
        return 'Deleted report'
      },
      error: `Couldn't delete report`,
    })
  }

  function refreshReportData() {
    // TODO: This should refresh only queries that are used by the report
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

  return (
    <ReportContext.Provider
      value={{ report, deleteReport, refreshReportData, updateReport }}
    >
      {children}
    </ReportContext.Provider>
  )
}

export default ReportProvider
export const useReport = () => useContext(ReportContext)
