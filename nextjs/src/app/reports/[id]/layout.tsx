import { gql } from '@apollo/client'
import { Metadata } from 'next'
import { Toaster } from 'sonner'

import {
  GetMapReportNameQuery,
  GetMapReportNameQueryVariables,
} from '@/__generated__/graphql'
import Navbar from '@/components/navbar'
import { loadUser } from '@/lib/server-auth'
import { getClient } from '@/lib/services/apollo-client'

type Params = {
  id: string
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await loadUser()
  const isLoggedIn = Boolean(user)

  return (
    <div className="h-dvh flex flex-col">
      <Navbar isLoggedIn={isLoggedIn} />
      <main className="h-full relative overflow-x-hidden overflow-y-hidden flex-grow">
        {children}
      </main>
      <Toaster />
    </div>
  )
}

export async function generateMetadata({
  params: { id },
}: {
  params: Params
}): Promise<Metadata> {
  try {
    const client = getClient()
    const query = await client.query<
      GetMapReportNameQuery,
      GetMapReportNameQueryVariables
    >({
      query: GET_MAP_REPORT_NAME,
      variables: {
        id,
      },
    })

    return {
      title: query.data.mapReport.name,
    }
  } catch (e) {
    console.error("Couldn't generate layout", e)
    return {
      title: 'Report',
    }
  }
}

const GET_MAP_REPORT_NAME = gql`
  query GetMapReportName($id: ID!) {
    mapReport(pk: $id) {
      id
      name
    }
  }
`
