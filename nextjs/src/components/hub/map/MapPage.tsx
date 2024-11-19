"use client";

import React, { ReactNode, useEffect, useState } from 'react'

import "mapbox-gl/dist/mapbox-gl.css";
import { useQuery } from "@apollo/client";
import { Provider as JotaiProvider, useAtomValue } from "jotai";
import { MapProvider } from "react-map-gl";
import { HubMap } from "@/components/hub/HubMap";
import { ConstituencyView } from "@/components/hub/ConstituencyView";
import { GetEventDataQuery, GetEventDataQueryVariables, GetHubMapDataQuery, GetHubMapDataQueryVariables, GetLocalDataQuery, GetLocalDataQueryVariables, GetPageQuery, GetPageQueryVariables } from "@/__generated__/graphql";
import { SIDEBAR_WIDTH, selectedHubSourceMarkerAtom } from "@/components/hub/data";
import { usePathname, useParams } from 'next/navigation' 
import { SearchPanel } from './SearchPanel';
import Root from '@/data/puck/config/root';
import { useBreakpoint } from '@/hooks/css';
import { GET_EVENT_DATA, GET_HUB_MAP_DATA, GET_LOCAL_DATA } from './queries';
import { HubRenderContextProvider, useHubRenderContext } from '@/components/hub/HubRenderContext';
import { twMerge } from 'tailwind-merge';
import { PuckData } from '@/app/hub/render/[hostname]/RenderPuck';
import { GET_PAGE } from '@/app/hub/render/[hostname]/query';
import { DropZone, DropZoneProvider, usePuck } from '@measured/puck';
import { mapPageConf } from '@/data/puck/config';

export default function MapPage(props: {
  hostname: string;
  path: string;
  page: PuckData;
  isPuckEditing?: boolean;
}) {
  const hub = useQuery<GetHubMapDataQuery, GetHubMapDataQueryVariables>(GET_HUB_MAP_DATA, {
    variables: { hostname: props.hostname },
  });

  const isDesktop = useBreakpoint("md");

  const [postcode, setPostcode] = useState("");

  const view = (
    <JotaiProvider>
      <HubRenderContextProvider hostname={props.hostname} path={props.path} page={props.page}>
        <Root renderCSS={!props.isPuckEditing} customHeight={props.isPuckEditing ? "min-h-[auto] self-stretch h-auto" : undefined} fullScreen={!props.isPuckEditing} navLinks={hub.data?.hubByHostname?.navLinks || []}>
          <MapProvider>
            <PageContent {...props} isDesktop={isDesktop} hub={hub.data} postcode={postcode} setPostcode={setPostcode} />
          </MapProvider>
        </Root>
      </HubRenderContextProvider>
    </JotaiProvider>
  );

  // Render
  if (!props.isPuckEditing) {
    return (
      <DropZoneProvider value={{
        data: props.page,
        config: mapPageConf,
        mode: "render"
      }}>
        {view}
      </DropZoneProvider>
    )
  }

  return view
}

function PageContent ({ hostname, path, isDesktop, hub, postcode, setPostcode, page, isPuckEditing }: { hostname: string, path: string, isDesktop: boolean, hub?: GetHubMapDataQuery, postcode: string, setPostcode: React.Dispatch<React.SetStateAction<string>>, page: PuckData, isPuckEditing?: boolean }) {
  const hubContext = useHubRenderContext();

  const localData = useQuery<GetLocalDataQuery, GetLocalDataQueryVariables>(GET_LOCAL_DATA, {
    variables: { postcode: hubContext.postcode!, hostname },
    skip: !hubContext.postcode
  });

  const eventData = useQuery<GetEventDataQuery, GetEventDataQueryVariables>(GET_EVENT_DATA, {
    variables: { eventId: hubContext.eventId?.toString()!, hostname },
    skip: !hubContext.eventId
  });

  // const pageLayout = useQuery<GetPageQuery, GetPageQueryVariables>(GET_PAGE, {
  //   variables: { path: `/${path}`, hostname }
  // });

  const pageProps: (typeof page.root.props & {
    introTitle?: string
    cta?: "search" | "default",
    mapStyle?: string
    mapBounds?: {
      minLat: number
      minLng: number
      maxLat: number
      maxLng: number
    }
  }) | undefined = page.root.props
  
  const [collapsed, setCollapsed] = useState(false);
  
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
            mapBounds={pageProps?.mapBounds ? [
              [pageProps.mapBounds?.minLng, pageProps.mapBounds?.minLat],
              [pageProps.mapBounds?.maxLng, pageProps.mapBounds?.maxLat]
            ] : undefined}
            mapStyle={pageProps?.mapStyle || "mapbox://styles/commonknowledge/cm2xf8ju900r301pm89skcpg4"}
          />
        </div>
        {!localData.loading && (
          <aside
            className="pointer-events-none shadow-hub-muted -mt-[7rem] z-10 md:mt-0 md:absolute md:top-5 md:left-5 md:right-0 md:max-w-full md:h-full md:h-[calc(100%-40px)] md:max-h-full md:overflow-y-hidden"
            style={isDesktop ? { width: SIDEBAR_WIDTH } : {}}
          >
            <div className="max-w-[100vw] rounded-[20px] bg-white max-h-full overflow-y-auto  pointer-events-auto">
              {!isDesktop && (
                <div className='text-center mt-2 -mb-4'>
                  <span className="inline-block w-[4rem] h-2 bg-meepGray-300 rounded-full"/>
                </div>
              )}
              {pageProps?.cta === "search" ? (
                hubContext.eventId && eventData.data ? (
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
                    title={pageProps?.introTitle}
                  />
                ) : (
                  <ConstituencyView
                    data={localData.data?.postcodeSearch.constituency}
                    postcode={postcode}
                  />
                )
              ) : (
                <div className="flex flex-col gap-4 p-6">
                  <h1 className='text-2xl md:text-4xl tracking-tight mb-4 text-hub-primary-500 cursor-pointer' onClick={() => setCollapsed(b => !b)}>
                    {pageProps?.introTitle}
                  </h1>
                  {!collapsed && (
                    <DropZone
                      zone="introPanel"
                      // @ts-ignore
                      // allow={mapPageConf.categories.intro}
                    />
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}
