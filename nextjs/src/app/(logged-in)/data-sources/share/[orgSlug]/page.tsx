import { gql } from '@apollo/client'
import { Metadata } from 'next'

import {
  ShareWithOrgPageQuery,
  ShareWithOrgPageQueryVariables,
} from '@/__generated__/graphql'
import { Card } from '@/components/ui/card'
import { requireAuth } from '@/lib/server-auth'
import { getClient } from '@/lib/services/apollo-client'

import { ShareDataForm } from './ShareDataForm'

type Params = {
  orgSlug: string
}

export default async function Page({
  params: { orgSlug },
}: {
  params: Params
}) {
  await requireAuth()
  const query = await getClient().query({
    query: SHARE_WITH_ORG_PAGE,
    variables: {
      orgSlug,
    },
  })

  if (!query.data?.allOrganisations?.[0]?.name) {
    return <div>Organisation not found</div>
  }

  return (
    <div className="mx-auto max-w-md w-full">
      <Card>
        <h1 className="text-hLg text-center p-3 max-w-sm mx-auto w-full">
          <span className="text-hMd">Share campaign data with</span>
          <br />
          <span className="px-2 py-1 rounded text-brandBlue font-semibold">
            {query.data?.allOrganisations[0]?.name}
          </span>
        </h1>
        <div className="mt-4" />
        <ShareDataForm toOrgId={query.data.allOrganisations[0].id} />
      </Card>
    </div>
  )
}

export async function generateMetadata({
  params: { orgSlug },
}: {
  params: Params
}): Promise<Metadata> {
  try {
    const client = getClient()
    const query = await client.query<
      ShareWithOrgPageQuery,
      ShareWithOrgPageQueryVariables
    >({
      query: SHARE_WITH_ORG_PAGE,
      variables: {
        orgSlug,
      },
    })

    if (!query.data?.allOrganisations[0]?.name) {
      return {
        title: 'Share data',
      }
    }

    return {
      title: `Share data with ${query.data.allOrganisations?.[0]?.name}`,
    }
  } catch (e) {
    return {
      title: 'Share data',
    }
  }
}

const SHARE_WITH_ORG_PAGE = gql`
  query ShareWithOrgPage($orgSlug: String!) {
    allOrganisations(filters: { slug: $orgSlug }) {
      id
      name
    }
  }
`
