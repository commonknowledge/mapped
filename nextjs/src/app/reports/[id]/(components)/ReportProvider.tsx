'use client'

import {
  Exact,
  GetMapReportQuery,
  MapLayerInput,
  PatchMapReportMutation,
  PatchMapReportMutationVariables,
  Scalars,
  UpdateMapReportMutation,
  UpdateMapReportMutationVariables,
} from '@/__generated__/graphql'
import { MapReportInputSchema } from '@/__generated__/zodSchema'
import { useSidebarLeftState } from '@/lib/map'
import { cleanUpLayerReferences } from '@/lib/map/displayOptionsMigrations'
import { migrateDisplayOptions } from '@/lib/map/displayOptionsMigrations/migrate'
import { prepareMapReportForInput } from '@/lib/map/mapReportUpdate'
import { refreshReportData } from '@/lib/map/useReport'
import { toastPromise } from '@/lib/toast'
import { ApolloClient, QueryResult, useApolloClient } from '@apollo/client'
import jsonpatch from 'fast-json-patch'
import { WritableDraft, produce } from 'immer'
import { useSetAtom } from 'jotai'
import { isEqual } from 'lodash'
import { ReactNode, useEffect, useRef } from 'react'
import toSpaceCase from 'to-space-case'
import { PATCH_MAP_REPORT, UPDATE_MAP_REPORT } from '../gql_queries'
import ReportContext, {
  IDisplayOptions,
  MapReportWithTypedJSON,
  displayOptionsMigrator,
} from '../reportContext'
import { navbarTitleAtom } from './ReportNavbar'

interface ReportProviderProps {
  query: QueryResult<
    GetMapReportQuery,
    Exact<{
      id: Scalars['ID']['input']
    }>
  >
  children: ReactNode
}

const ReportProvider = ({ query, children }: ReportProviderProps) => {
  const queriedReport = query.data?.mapReport
  const setNavbarTitle = useSetAtom(navbarTitleAtom)
  const client = useApolloClient()

  useEffect(() => {
    if (queriedReport) {
      setNavbarTitle(queriedReport?.name)
    }
  }, [queriedReport?.name])

  const leftSidebarState = useSidebarLeftState()
  const autoOpenedSidebar = useRef(false)

  useEffect(() => {
    // If there are no layers, open the left sidepanel
    if (!queriedReport?.layers.length && !autoOpenedSidebar.current) {
      leftSidebarState.set(true)
      autoOpenedSidebar.current = true
    }
  }, [query.data, queriedReport, autoOpenedSidebar])

  const displayOptionsParser = displayOptionsMigrator.safeParse(
    queriedReport?.displayOptions
  )

  const report: MapReportWithTypedJSON | undefined = queriedReport
    ? displayOptionsParser.data
      ? {
          ...queriedReport,
          displayOptions: displayOptionsParser.data,
        }
      : undefined
    : undefined

  useEffect(() => {
    if (!queriedReport) return
    const migratedReport = migrateDisplayOptions(queriedReport)
    const cleanedUpReport = cleanUpLayerReferences(migratedReport)

    if (
      !isEqual(queriedReport.displayOptions, cleanedUpReport.displayOptions)
    ) {
      console.log('Saving display options', { cleanedUpReport })
      const update = updateReport((d) => {
        d.displayOptions = cleanedUpReport.displayOptions
      })
      toastPromise(update, {
        loading: 'Updating...',
        success: 'Updated report',
        error: `Couldn't save report`,
      }).finally(() => {
        refreshReportData(client)
      })
    }
  }, [queriedReport])

  if (!queriedReport) {
    return null
  }

  if (!report || !displayOptionsParser.success) {
    return (
      <div className="overflow-auto max-w-3xl mx-auto items-center justify-center h-full text-white">
        <h1 className="text-3xl font-bold">Report error</h1>
        <p className="text-lg">This report has an invalid configuration.</p>
        <pre className="text-sm text-gray-400 mt-4">
          {JSON.stringify(displayOptionsParser?.error, null, 2)}
        </pre>
        <pre className="text-sm text-gray-400 mt-4">
          {JSON.stringify(queriedReport?.displayOptions, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <ReportContext.Provider value={{ report, updateReport }}>
      {children}
    </ReportContext.Provider>
  )

  async function updateReport(
    cb: (
      draft: WritableDraft<
        Omit<MapReportWithTypedJSON, 'layers'> & { layers: MapLayerInput[] }
      >
    ) => void,
    retryCount: number = 0
  ) {
    if (!queriedReport || (!!retryCount && retryCount >= 3)) return
    const updatedReport = produce(report || queriedReport, cb)
    // Split out displayOptions and handle them separately
    const { displayOptions: newDisplayOptions, ...newReport } = updatedReport
    if (newReport) {
      // Handle report DB field updates using update
      // and await it, so that patches can be applied to the new `layer` object
      await updateReportDBFields(newReport)
    }
    if (newDisplayOptions) {
      // Handle displayOptions using patch
      await patchReportDisplayOptions(newDisplayOptions, queriedReport)
    }
  }

  function updateReportDBFields(
    newReport: Omit<MapReportWithTypedJSON, 'layers' | 'displayOptions'> & {
      layers: MapLayerInput[]
    }
  ) {
    if (!report) return
    const { displayOptions, ...oldReport } = report
    if (isEqual(oldReport, newReport)) return

    const input = prepareMapReportForInput(newReport)
    if (!Object.keys(input).length) {
      console.warn('No changes to report')
      return
    }

    const update = updateMapReport({ input }, client)

    return toastPromise(update, {
      loading: 'Saving...',
      success: () => {
        return {
          title: 'Report saved',
          description: `Updated ${Object.keys(input).map(toSpaceCase).join(', ')}`,
        }
      },
      error: `Couldn't save report`,
    }).finally(() => {
      refreshReportData(client)
    })
  }

  async function patchReportDisplayOptions(
    inputDisplayOptions: IDisplayOptions,
    reportObjectForDiffingAgainst: GetMapReportQuery['mapReport'],
    retryCount: number = 0
  ) {
    if (!reportObjectForDiffingAgainst || (!!retryCount && retryCount >= 3))
      return
    // Validate + make self-consistent
    // using displayOptionsMigrator's transform operations
    const {
      data: validatedDisplayOptions,
      success,
      error,
    } = displayOptionsMigrator.safeParse(inputDisplayOptions)
    if (!success || error || !validatedDisplayOptions) {
      console.error('Invalid report config', error)
      return
    }
    // Remove any layer references that don't exist
    const migratedReport = migrateDisplayOptions({
      ...reportObjectForDiffingAgainst,
      displayOptions: validatedDisplayOptions,
    })
    const newReport = cleanUpLayerReferences({
      ...reportObjectForDiffingAgainst,
      displayOptions: migratedReport.displayOptions,
    })
    // Then prep the patch that would be applied to report.displayOptions in the DB
    const patch = jsonpatch.compare(
      reportObjectForDiffingAgainst.displayOptions,
      newReport.displayOptions
    )
    if (!patch.length) {
      console.warn('No patches to apply')
      return
    }
    try {
      // Mutate
      const update = client.mutate<
        PatchMapReportMutation,
        PatchMapReportMutationVariables
      >({
        mutation: PATCH_MAP_REPORT,
        variables: {
          patch,
          reportId: reportObjectForDiffingAgainst.id,
        },
        // TODO: figure out how to re-enable this
        // See bugs here: https://linear.app/commonknowledge/issue/MAP-1032/restore-setup-and-development-environment-to-working-order#comment-5acecc96
        // optimisticResponse: {
        //   __typename: 'Mutation',
        //   patchMapReportDisplayOptions: {
        //     __typename: 'MapReport',
        //     ...reportObjectForDiffingAgainst,
        //     displayOptions: newReport.displayOptions,
        //   },
        // },
      })
      return toastPromise(update, {
        loading: false,
        success: () => {
          return false
          // return {
          //   title: 'Report saved',
          //   description:
          //     // Print out JSON patch changes in a human readable format, using spaceCase
          //     patch
          //       .map((p) => {
          //         const { op, path } = p
          //         const changedDataPath = path.split('/').map(toSpaceCase).pop()
          //         const humanReadableOp = op
          //           .replace('replace', 'Set')
          //           .replace('add', 'Set')
          //           .replace('remove', 'Reset')
          //         return `${capitalize(humanReadableOp)} ${changedDataPath}`
          //       })
          //       .join(', ') || 'No changes',
          // }
        },
        error: `Couldn't save report`,
      })
    } catch (e) {
      // Something's gone wrong; the displayOptions object is out of sync with the client
      // so refetch the report and try making a new patch.
      // Up to three attempts.
      const res = await query.refetch()
      patchReportDisplayOptions(
        inputDisplayOptions,
        res.data?.mapReport,
        retryCount + 1
      )
    }
  }

  function updateMapReport(
    variables: UpdateMapReportMutationVariables,
    client: ApolloClient<object>
  ) {
    const parseResult = MapReportInputSchema().safeParse(variables.input)
    if (parseResult.success) {
      return client.mutate<
        UpdateMapReportMutation,
        UpdateMapReportMutationVariables
      >({
        mutation: UPDATE_MAP_REPORT,
        variables: { input: parseResult.data },
      })
    } else {
      console.error('Invalid input for updateMapReport', parseResult.error)
      return Promise.reject(parseResult.error)
    }
  }
}

export default ReportProvider
