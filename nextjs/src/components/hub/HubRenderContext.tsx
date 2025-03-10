import { gql, useQuery } from '@apollo/client'
import { usePathname } from 'next/navigation'
import {
  UseQueryStateReturn,
  parseAsInteger,
  parseAsString,
  useQueryState,
} from 'nuqs'
import { createContext, useContext, useMemo } from 'react'
import { getColors } from 'theme-colors'

import {
  GetHubContextQuery,
  GetHubContextQueryVariables,
} from '@/__generated__/graphql'

export const HubRenderContext = createContext<{
  hostname: string
  shouldZoomOut: boolean
  isMultitenancyMode: Boolean
  postcode: string | null
  setPostcode: UseQueryStateReturn<string, undefined>[1]
  eventId: number | null
  setEventId: UseQueryStateReturn<number, undefined>[1]
  hubData: GetHubContextQuery['hubByHostname']
}>({
  hostname: '',
  shouldZoomOut: false,
  isMultitenancyMode: true,
  postcode: null,
  eventId: null,
  // @ts-ignore
  setPostcode: (...args: any[]) => {},
  // @ts-ignore
  setEventId: (...args: any[]) => {},
  hubData: null,
})

export const useHubRenderContext = () => {
  const ctx = useContext(HubRenderContext)
  function reset() {
    ctx.setPostcode(null)
    ctx.setEventId(null)
  }
  function goToEventId(eventId: number) {
    reset()
    ctx.setEventId(eventId)
  }
  function goToPostcode(postcode: string) {
    reset()
    ctx.setPostcode(postcode)
  }
  const primaryColours = useMemo(
    () => getColors(ctx.hubData?.primaryColour || '#0f8c6c'),
    [ctx.hubData]
  )
  const secondaryColours = useMemo(
    () => getColors(ctx.hubData?.secondaryColour || '#0f8c6c'),
    [ctx.hubData]
  )
  return {
    ...ctx,
    isPeopleClimateNature:
      ctx.hostname === 'peopleclimatenature.org' ||
      ctx.hostname === 'hub.localhost',
    goToEventId,
    goToPostcode,
    reset,
    primaryColours,
    secondaryColours,
  }
}

export const HubRenderContextProvider = ({
  hostname,
  children,
}: {
  hostname: string
  children: any
}) => {
  const pathname = usePathname()
  const isMultitenancyMode = !pathname.includes('hub/render')
  const [postcode, setPostcode] = useQueryState('postcode', parseAsString)
  const [eventId, setEventId] = useQueryState('event', parseAsInteger)
  const shouldZoomOut = !postcode && !eventId
  const hubData = useQuery<GetHubContextQuery, GetHubContextQueryVariables>(
    GET_HUB_CONTEXT,
    { variables: { hostname } }
  )

  return (
    <HubRenderContext.Provider
      value={{
        hostname,
        shouldZoomOut,
        isMultitenancyMode,
        postcode,
        setPostcode,
        eventId,
        setEventId,
        hubData: hubData.data?.hubByHostname,
      }}
    >
      {children}
    </HubRenderContext.Provider>
  )
}

const GET_HUB_CONTEXT = gql`
  query GetHubContext($hostname: String!) {
    hubByHostname(hostname: $hostname) {
      id
      customCss
      primaryColour
      secondaryColour
    }
  }
`
