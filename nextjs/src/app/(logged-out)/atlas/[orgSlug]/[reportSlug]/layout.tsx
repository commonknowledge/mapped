import { gql } from '@apollo/client'
import { Metadata } from 'next'

import {
  GetPublicMapReportQuery,
  GetPublicMapReportQueryVariables,
} from '@/__generated__/graphql'
import { getClient } from '@/lib/services/apollo-client'

type Params = {
  orgSlug: string
  reportSlug: string
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-dvh flex flex-col">
      <main className="h-full relative overflow-x-hidden overflow-y-hidden flex-grow">
        {children}
      </main>
    </div>
  )
}

export async function generateMetadata({
  params: { orgSlug, reportSlug },
}: {
  params: Params
}): Promise<Metadata> {
  try {
    const client = getClient()
    const query = await client.query<
      GetPublicMapReportQuery,
      GetPublicMapReportQueryVariables
    >({
      query: GET_MAP_REPORT_NAME,
      variables: { orgSlug, reportSlug },
    })

    return {
      title: query.data.publicMapReport.name,
    }
  } catch (e) {
    console.error("Couldn't generate layout", e)
    return {
      title: 'Public map',
    }
  }
}

const GET_MAP_REPORT_NAME = gql`
  query GetPublicMapReport($orgSlug: String!, $reportSlug: String!) {
    publicMapReport(orgSlug: $orgSlug, reportSlug: $reportSlug) {
      id
      name
    }
  }
`
