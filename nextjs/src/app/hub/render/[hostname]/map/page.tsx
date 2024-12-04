'use client'

import { useQuery } from '@apollo/client'
import { Provider as JotaiProvider } from 'jotai'
import 'mapbox-gl/dist/mapbox-gl.css'
import React, { useState } from 'react'
import { MapProvider } from 'react-map-gl'

import {
  GetEventDataQuery,
  GetEventDataQueryVariables,
  GetHubMapDataQuery,
  GetHubMapDataQueryVariables,
  GetLocalDataQuery,
  GetLocalDataQueryVariables,
} from '@/__generated__/graphql'
import { ConstituencyView } from '@/components/hub/ConstituencyView'
import { HubMap } from '@/components/hub/HubMap'
import {
  HubRenderContextProvider,
  useHubRenderContext,
} from '@/components/hub/HubRenderContext'
import { SIDEBAR_WIDTH } from '@/components/hub/data'
import Root from '@/components/puck/config/root'
import { useBreakpoint } from '@/lib/hooks/css'

import { SearchPanel } from './SearchPanel'
import { GET_EVENT_DATA, GET_HUB_MAP_DATA, GET_LOCAL_DATA } from './queries'

type Params = {
  hostname: string
}

export default function Page(props: { params: Params }) {
  const hub = useQuery<GetHubMapDataQuery, GetHubMapDataQueryVariables>(
    GET_HUB_MAP_DATA,
    {
      variables: { hostname: props.params.hostname },
    }
  )

  const isDesktop = useBreakpoint('md')

  const [postcode, setPostcode] = useState('')

  return (
    <JotaiProvider>
      <HubRenderContextProvider hostname={props.params.hostname}>
        <Root
          renderCSS={false}
          fullScreen={true}
          navLinks={hub.data?.hubByHostname?.navLinks || []}
        >
          <MapProvider>
            <PageContent
              {...props}
              isDesktop={isDesktop}
              hub={hub.data}
              postcode={postcode}
              setPostcode={setPostcode}
            />
          </MapProvider>
        </Root>
      </HubRenderContextProvider>
    </JotaiProvider>
  )
}

function PageContent({
  params: { hostname },
  isDesktop,
  hub,
  postcode,
  setPostcode,
}: {
  params: Params
  isDesktop: boolean
  hub?: GetHubMapDataQuery
  postcode: string
  setPostcode: React.Dispatch<React.SetStateAction<string>>
}) {
  const hubContext = useHubRenderContext()

  const localData = useQuery<GetLocalDataQuery, GetLocalDataQueryVariables>(
    GET_LOCAL_DATA,
    {
      variables: { postcode: hubContext.postcode!, hostname },
      skip: !hubContext.postcode,
    }
  )

  const eventData = useQuery<GetEventDataQuery, GetEventDataQueryVariables>(
    GET_EVENT_DATA,
    {
      variables: { eventId: hubContext.eventId?.toString()!, hostname },
      skip: !hubContext.eventId,
    }
  )

  return (
    <main className="h-full relative overflow-x-hidden flex-grow md:overflow-y-hidden">
      <div className="absolute h-full w-full flex pointer-events-none flex-col md:flex-row">
        <div className="h-full w-full pointer-events-auto flex-shrink-0">
          <HubMap
            layers={hub?.hubByHostname?.layers}
            currentConstituency={
              !hubContext.shouldZoomOut
                ? localData.data?.postcodeSearch.constituency ||
                  eventData.data?.importedDataGeojsonPoint?.properties
                    ?.constituency
                : undefined
            }
            localDataLoading={localData.loading || eventData.loading}
          />
        </div>
        {!localData.loading && (
          <aside
            className="pointer-events-none shadow-hub-muted -mt-[7rem] z-10 md:mt-0 md:absolute md:top-5 md:left-5 md:right-0 md:max-w-full md:h-full md:h-[calc(100%-40px)] md:max-h-full md:overflow-y-hidden"
            style={isDesktop ? { width: SIDEBAR_WIDTH } : {}}
          >
            <div className="max-w-[100vw] rounded-[20px] bg-white max-h-full overflow-y-auto  pointer-events-auto">
              {!isDesktop && (
                <div className="text-center mt-2 -mb-4">
                  <span className="inline-block w-[4rem] h-2 bg-meepGray-300 rounded-full" />
                </div>
              )}
              {hubContext.eventId && eventData.data ? (
                <ConstituencyView
                  data={
                    eventData.data?.importedDataGeojsonPoint?.properties
                      ?.constituency
                  }
                  postcode={postcode}
                />
              ) : !localData.data ? (
                <SearchPanel
                  onSearch={(postcode) => hubContext.goToPostcode(postcode)}
                  isLoading={localData.loading}
                  postcode={postcode}
                  setPostcode={setPostcode}
                />
              ) : (
                <ConstituencyView
                  data={localData.data?.postcodeSearch.constituency}
                  postcode={postcode}
                />
              )}
            </div>
          </aside>
        )}
      </div>
    </main>
  )
}
