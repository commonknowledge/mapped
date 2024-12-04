'use client'

import { gql, useQuery } from '@apollo/client'
import { useAtomValue } from 'jotai'
import { useEffect } from 'react'

import {
  ListReportsQuery,
  ListReportsQueryVariables,
} from '@/__generated__/graphql'
import { Skeleton } from '@/components/ui/skeleton'
import { currentOrganisationIdAtom } from '@/lib/organisation'

import { CreateReportCard } from './CreateReportCard'
import { ReportCard } from './ReportCard'

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
