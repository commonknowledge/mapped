import { Metadata, ResolvingMetadata } from 'next'

import { GetPageQuery, GetPageQueryVariables } from '@/__generated__/graphql'
import { getClient } from '@/lib/services/apollo-client'

import RenderPuck from '../RenderPuck'
import { Params } from '../params'
import { GET_PAGE } from '../query'

export default async function Page({
  params: { hostname, slug },
}: {
  params: Params
}) {
  const client = getClient()
  const page = await client.query<GetPageQuery, GetPageQueryVariables>({
    query: GET_PAGE,
    variables: {
      hostname,
      path: slug,
    },
  })

  return (
    <RenderPuck
      hostname={hostname}
      page={page.data?.hubPageByPath?.puckJsonContent}
    />
  )
}

// nextjs metadata function — page title from GetPageQuery
export async function generateMetadata(
  {
    params,
  }: {
    params: Params
  },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Fetch the page data
  const client = getClient()
  const page = await client.query<GetPageQuery, GetPageQueryVariables>({
    query: GET_PAGE,
    variables: {
      hostname: params.hostname,
      path: params.slug,
    },
  })

  return {
    title: page.data.hubPageByPath?.seoTitle,
  }
}
