import { gql } from '@apollo/client'
import { Metadata } from 'next'

import {
  ExternalDataSourceNameQuery,
  ExternalDataSourceNameQueryVariables,
} from '@/__generated__/graphql'
import { requireAuth } from '@/lib/server-auth'
import { getClient } from '@/lib/services/apollo-client'

import InspectExternalDataSource from './InspectExternalDataSource'

type Params = {
  externalDataSourceId: string
}

export default async function Page({
  params: { externalDataSourceId },
}: {
  params: Params
}) {
  await requireAuth()
  const data = await getClient().query<
    ExternalDataSourceNameQuery,
    ExternalDataSourceNameQueryVariables
  >({
    query: EXTERNAL_DATA_SOURCE_NAME,
    variables: {
      externalDataSourceId,
    },
  })

  return (
    <InspectExternalDataSource
      externalDataSourceId={externalDataSourceId}
      {...data.data.externalDataSource}
    />
  )
}

const EXTERNAL_DATA_SOURCE_NAME = gql`
  query ExternalDataSourceName($externalDataSourceId: ID!) {
    externalDataSource(pk: $externalDataSourceId) {
      name
      crmType
      dataType
      name
      remoteUrl
    }
  }
`

export async function generateMetadata({
  params: { externalDataSourceId },
}: {
  params: Params
}): Promise<Metadata> {
  try {
    const client = getClient()
    const query = await client.query<
      ExternalDataSourceNameQuery,
      ExternalDataSourceNameQueryVariables
    >({
      query: EXTERNAL_DATA_SOURCE_NAME,
      variables: {
        externalDataSourceId,
      },
    })

    return {
      title: query.data.externalDataSource.name,
    }
  } catch (e) {
    return {
      title: 'Data Source',
    }
  }
}
