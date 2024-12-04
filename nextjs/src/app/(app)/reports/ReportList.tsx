'use client'

import {
  CreateMapReportMutation,
  CreateMapReportMutationVariables,
  ListReportsQuery,
  ListReportsQueryVariables,
} from '@/__generated__/graphql'
import { triggerAnalyticsEvent } from '@/app/utils/posthogutils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { currentOrganisationIdAtom } from '@/data/organisation'
import { FetchResult, gql, useApolloClient, useQuery } from '@apollo/client'
import { formatRelative } from 'date-fns'
import { useAtomValue } from 'jotai'
import { Map } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

const LIST_REPORTS = gql`
  query ListReports($currentOrganisationId: ID!) {
    reports(filters: { organisation: { pk: $currentOrganisationId } }) {
      id
      name
      lastUpdate
    }
  }
`

export default function ReportList() {
  const currentOrganisationId = useAtomValue(currentOrganisationIdAtom)
  const { loading, error, data, refetch } = useQuery<
    ListReportsQuery,
    ListReportsQueryVariables
  >(LIST_REPORTS, {
    variables: {
      currentOrganisationId,
    },
    skip: !currentOrganisationId,
  })

  useEffect(() => {
    refetch()
  }, [refetch])

  return (
    <div className="flex flex-row gap-lg">
      {loading ? (
        <section className="w-full grid gap-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-xl border border-meepGray-700 px-6 py-5 space-y-3">
            <Skeleton className="h-4 w-full max-w-[100px]" />
            <Skeleton className="h-10 w-full" />
          </article>
          <CreateReportCard />
        </section>
      ) : error ? (
        <h2>Error: {error.message}</h2>
      ) : data ? (
        <section className="w-full grid gap-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {data.reports
            ?.slice()
            .sort(
              // Most recently edited
              (a, b) =>
                b.lastUpdate && a.lastUpdate
                  ? new Date(b.lastUpdate).getTime() -
                  new Date(a.lastUpdate).getTime()
                  : 0
            )
            .map((report) => <ReportCard key={report.id} report={report} />)}
          <CreateReportCard />
        </section>
      ) : null}
    </div>
  )
}

export function PlaceholderReportCard() {
  return (
    <Card className="rounded-xl border border-meepGray-700 px-6 py-5 space-y-3">
      <Skeleton className="h-4 w-full max-w-[100px]" />
      <Skeleton className="h-10 w-full" />
    </Card>
  )
}

export function ReportCard({
  report,
}: {
  report: ListReportsQuery['reports'][0]
}) {
  return (
    <Link href={`/reports/${report.id}`}>
      <Card className="hover:bg-meepGray-700 transition-colors duration-200">
        <CardHeader className=" p-4">
          <CardContent className="">
            <Map className="w-4 text-brandBlue" />
          </CardContent>
          <CardTitle className="mb-1 ">{report.name}</CardTitle>
        </CardHeader>
        <CardDescription className="text-sm text-meepGray-400 px-5 pb-5">
          Last edited{' '}
          <span className="text-meepGray-300">
            {formatRelative(report.lastUpdate, new Date())}
          </span>
        </CardDescription>
      </Card>
    </Link>
  )
}

export function CreateReportCard() {
  const client = useApolloClient()
  const router = useRouter()
  const currentOrganisationId = useAtomValue(currentOrganisationIdAtom)

  return (
    <Card>
      <CardContent className="p-6 relative space-y-5 h-full">
        <Skeleton className="h-4 w-full max-w-[100px]" />
        <Skeleton className="h-10 w-full" />
        <div className="!m-0 absolute inset-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <Button onClick={create} variant="reverse">
            Create new report
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  function create() {
    toast.promise(
      client.mutate<CreateMapReportMutation, CreateMapReportMutationVariables>({
        mutation: CREATE_MAP_REPORT,
        variables: {
          data: {
            name: new Date().toISOString(),
            organisation: { set: currentOrganisationId },
          },
        },
      }),
      {
        loading: 'Creating report...',
        success: (d: FetchResult<CreateMapReportMutation>) => {
          if (
            !d.errors &&
            d.data?.createMapReport?.__typename === 'MapReport'
          ) {
            router.push(`/reports/${d.data.createMapReport.id}`)
            triggerAnalyticsEvent('Map report created succesfully', {})
            return 'Report created!'
          } else if (d.data?.createMapReport?.__typename === 'OperationInfo') {
            toast.error('Failed to create report', {
              description: d.data.createMapReport.messages
                .map((m) => m.message)
                .join(', '),
            })
            triggerAnalyticsEvent('Map report creation failed', {
              errorMessages: d.data.createMapReport.messages
                .map((m) => m.message)
                .join(', '),
            })
          } else {
            toast.error('Failed to create report', {
              description: d.errors?.map((e) => e.message).join(', '),
            })
            triggerAnalyticsEvent('Report creation failed', {
              errorMessages: d.errors?.map((e) => e.message).join(', '),
            })
          }
        },
        error: 'Failed to create report',
      }
    )
  }
}

const CREATE_MAP_REPORT = gql`
  mutation CreateMapReport($data: MapReportInput!) {
    createMapReport(data: $data) {
      ... on MapReport {
        id
      }
      ... on OperationInfo {
        messages {
          message
        }
      }
    }
  }
`
