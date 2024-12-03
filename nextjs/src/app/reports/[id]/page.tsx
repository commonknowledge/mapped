// page.js
'use client'

import {
  DeleteMapReportMutation,
  DeleteMapReportMutationVariables,
  GetMapReportQuery,
  GetMapReportQueryVariables,
  MapReportInput,
  UpdateMapReportMutation,
  UpdateMapReportMutationVariables,
} from '@/__generated__/graphql'
import DataConfigPanel from '@/components/dataConfig'
import { ReportMap } from '@/components/report/ReportMap'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { currentOrganisationIdAtom } from '@/data/organisation'
import { contentEditableMutation } from '@/lib/html'
import {
  MAP_REPORT_FRAGMENT,
  isConstituencyPanelOpenAtom,
  isDataConfigOpenAtom,
  selectedConstituencyAtom,
} from '@/lib/map'
import { toastPromise } from '@/lib/toast'
import { FetchResult, gql, useApolloClient, useQuery } from '@apollo/client'
import { Provider as JotaiProvider, useAtom, useAtomValue } from 'jotai'
import { merge } from 'lodash'
import {
  BarChart3,
  Layers,
  MoreVertical,
  RefreshCcw,
  Trash,
} from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useRouter } from 'next/navigation'
import { useContext, useEffect, useState } from 'react'
import { MapProvider } from 'react-map-gl'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'
import spaceCase from 'to-space-case'
import { ConstituenciesPanel } from './ConstituenciesPanel'
import {
  DisplayOptionsType,
  ReportContext,
  defaultDisplayOptions,
} from './context'

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
        <ReportContext.Provider
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
        </ReportContext.Provider>
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

function ReportPage() {
  const { report, updateReport, deleteReport, refreshReportDataQueries } =
    useContext(ReportContext)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDataConfigOpen, setDataConfigOpen] = useAtom(isDataConfigOpenAtom)
  const toggleDataConfig = () => setDataConfigOpen((b) => !b)
  const [isConstituencyPanelOpen, setConstituencyPanelOpen] = useAtom(
    isConstituencyPanelOpenAtom
  )
  const [selectedConstituency, setSelectedConstituency] = useAtom(
    selectedConstituencyAtom
  )
  const toggleConsData = () => {
    setConstituencyPanelOpen((b) => {
      if (b) {
        setSelectedConstituency(null)
      }
      return !b
    })
  }

  useEffect(() => {
    // @ts-ignore
    if (!report?.data?.mapReport?.layers?.length) {
      return setConstituencyPanelOpen(false)
    }
  }, [selectedConstituency, report])

  if (!report?.loading && report?.called && !report?.data?.mapReport) {
    return (
      <div className="absolute w-full h-full">
        <div className="flex flex-col items-center justify-center w-full h-full">
          <Card className="p-4 bg-white border-1 border-meepGray-700 text-meepGray-800">
            <CardHeader>
              <CardTitle className="text-hMd grow font-IBMPlexSansMedium">
                Report not found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                The report you are looking for does not exist.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const toggles = [
    {
      icon: Layers,
      label: 'Map layers',
      enabled: isDataConfigOpen,
      toggle: toggleDataConfig,
    },
    {
      icon: BarChart3,
      label: 'Constituency data',
      enabled: isConstituencyPanelOpen,
      toggle: toggleConsData,
    },
  ]

  return (
    <>
      <div className="absolute w-full h-full flex flex-row pointer-events-none">
        <div className="w-full h-full pointer-events-auto">
          <ReportMap />
        </div>
        {/* Layer card */}
        <aside className="absolute top-0 left-0 p-5 w-60 h-full pointer-events-auto">
          <div className="flex flex-col items-start gap-4 max-h-full">
            <Card className="min-w-60 p-3 bg-white border-1 border-meepGray-700 text-meepGray-800">
              <CardHeader className="flex flex-row items-start">
                {report?.loading && !report?.data?.mapReport ? (
                  <CardTitle className="text-hMd grow font-IBMPlexSansMedium">
                    Loading...
                  </CardTitle>
                ) : (
                  <>
                    <CardTitle
                      id="nickname"
                      className="text-hMd grow font-IBMPlexSansMedium leading-tight"
                      {...contentEditableMutation(
                        updateReport,
                        'name',
                        'Untitled Report'
                      )}
                    >
                      {report?.data?.mapReport.name}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <MoreVertical className="w-3" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start">
                        {report?.data?.mapReport && (
                          <DropdownMenuItem onClick={refreshReportDataQueries}>
                            <RefreshCcw className="w-4 mr-2" />
                            Refresh
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setDeleteOpen(true)}
                          className="text-red-400"
                        >
                          <Trash className="w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </CardHeader>
              {report?.data?.mapReport && (
                <CardContent className="mt-4 grid grid-cols-1 gap-2">
                  {toggles.map(({ icon: Icon, label, enabled, toggle }) => (
                    <div
                      key={label}
                      className="hover:bg-meepGray-100 px-0 flex flex-row gap-2 items-center overflow-hidden text-nowrap text-ellipsis cursor-pointer"
                      onClick={toggle}
                    >
                      <div
                        className={twMerge(
                          'relative rounded inline-block h-9 w-9',
                          enabled ? 'bg-meepGray-800' : 'bg-meepGray-100'
                        )}
                      >
                        <Icon
                          className={twMerge(
                            'w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                            enabled && 'text-white'
                          )}
                        />
                      </div>
                      {label}
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
            {/* Data config card */}
            {report?.data?.mapReport && isDataConfigOpen && <DataConfigPanel />}
          </div>
        </aside>
        {report?.data?.mapReport && isConstituencyPanelOpen && (
          <aside className="absolute top-0 right-0 p-5 w-[400px] h-full">
            <ConstituenciesPanel />
          </aside>
        )}
      </div>
      <AlertDialog open={deleteOpen} onOpenChange={() => setDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              This action cannot be undone. This will permanently delete this
              report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={buttonVariants({ variant: 'outline' })}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteReport()
              }}
              className={buttonVariants({ variant: 'destructive' })}
            >
              Confirm delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

const GET_MAP_REPORT = gql`
  query GetMapReport($id: ID!) {
    mapReport(pk: $id) {
      id
      name
      slug
      displayOptions
      organisation {
        id
        slug
        name
      }
      ...MapReportPage
    }
  }
  ${MAP_REPORT_FRAGMENT}
`

// Keep this fragment trim
// so that updates return fast
const UPDATE_MAP_REPORT = gql`
  mutation UpdateMapReport($input: MapReportInput!) {
    updateMapReport(data: $input) {
      id
      name
      displayOptions
      layers {
        id
        name
        source {
          id
          name
        }
      }
    }
  }
`

const DELETE_MAP_REPORT = gql`
  mutation DeleteMapReport($id: IDObject!) {
    deleteMapReport(data: $id) {
      id
    }
  }
`
