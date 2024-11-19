'use client'

import React, { useMemo } from 'react'
import { Data, DefaultComponentProps, Render } from "@measured/puck";
import { getPuckConfigForHostname } from '@/data/puck/ui';
import { HubRenderContextProvider } from '@/components/hub/HubRenderContext';

export interface PuckData<T extends DefaultComponentProps = {}> extends Data<T, {
  isMap: boolean
  title: string
  slug: string
  search_description: string
}> {}

export default function RenderPuck({ hostname, path, page }: {
    page: PuckData;
    path: string;
    hostname: string;
}) {
  const conf = useMemo(() => getPuckConfigForHostname(hostname), [hostname]);

  return (
    <HubRenderContextProvider hostname={hostname} path={path} page={page}>
      <Render config={conf} data={page} />
    </HubRenderContextProvider>
  )
}