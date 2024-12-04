import { gql } from '@apollo/client'
import { Metadata, ResolvingMetadata } from 'next'

import {
  GetPageQuery,
  GetPageQueryVariables,
  HostAnalyticsQuery,
  HostAnalyticsQueryVariables,
} from '@/__generated__/graphql'
import ConsentRespectingGoogleAnalytics from '@/components/analytics/ConsentRespectingGoogleAnalytics'
import { ConsentRespectingPosthogAnalytics } from '@/components/analytics/ConsentRespectingPosthogAnalytics'
import { CookieConsentComponent } from '@/components/hub/CookieConsent'
import { RootCSS } from '@/components/puck/config/root'
import { getClient } from '@/lib/services/apollo-client'

import { GET_PAGE } from './query'

type Params = {
  hostname: string
  slug: string
}

export default async function Layout({
  children,
  params: { hostname },
}: {
  children: React.ReactNode
  params: Params
}) {
  const client = getClient()
  const hubQuery = await client.query<
    HostAnalyticsQuery,
    HostAnalyticsQueryVariables
  >({
    query: SSR_HUB_DATA,
    variables: { hostname },
  })
  return (
    <>
      <RootCSS
        primaryColour={hubQuery.data.hubByHostname?.primaryColour || '#555'}
        secondaryColour={hubQuery.data.hubByHostname?.secondaryColour || '#555'}
        customCss={hubQuery.data.hubByHostname?.customCss || ''}
      />
      {children}
      <CookieConsentComponent />
      <ConsentRespectingPosthogAnalytics />
      {hubQuery.data.hubByHostname?.googleAnalyticsTagId && (
        <ConsentRespectingGoogleAnalytics
          googleAnalyticsTagId={
            hubQuery.data.hubByHostname?.googleAnalyticsTagId
          }
        />
      )}
    </>
  )
}

const SSR_HUB_DATA = gql`
  query HostAnalytics($hostname: String!) {
    hubByHostname(hostname: $hostname) {
      googleAnalyticsTagId
      primaryColour
      secondaryColour
      customCss
    }
  }
`

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
    },
  })

  return {
    title: {
      absolute:
        page.data.hubPageByPath?.seoTitle || 'Mapped by Common Knowledge',
      template: `%s | ${page.data.hubPageByPath?.hub.seoTitle}`,
      default: page.data.hubPageByPath?.hub.seoTitle,
    },
    description:
      page.data.hubPageByPath?.searchDescription ||
      page.data.hubPageByPath?.hub.searchDescription,
    openGraph: page.data.hubPageByPath?.hub.seoImageUrl
      ? {
          images: page.data.hubPageByPath?.hub.seoImageUrl,
        }
      : undefined,
    icons: page.data.hubPageByPath?.hub?.faviconUrl
      ? {
          icon: [
            {
              url: page.data.hubPageByPath?.hub?.faviconUrl,
              href: page.data.hubPageByPath?.hub?.faviconUrl,
            },
          ],
        }
      : undefined,
    alternates: {
      // Ignore query params for filtering etc.
      canonical: '/',
    },
  }
}
