'use client'

import { Data, Render } from '@measured/puck'
import { useMemo } from 'react'

import { HubRenderContextProvider } from '@/components/hub/HubRenderContext'
import { getPuckConfigForHostname } from '@/components/puck/config/ui'

export default function RenderPuck({
  hostname,
  page,
}: {
  page: Data
  hostname: string
}) {
  const conf = useMemo(() => getPuckConfigForHostname(hostname), [hostname])

  return (
    <HubRenderContextProvider hostname={hostname}>
      <Render config={conf} data={page} />
    </HubRenderContextProvider>
  )
}
