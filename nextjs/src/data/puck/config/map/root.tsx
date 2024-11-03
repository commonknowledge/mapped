import { useHubRenderContext } from "@/components/hub/HubRenderContext"
import MapPage from "@/components/hub/map/MapPage"
import { ErrorBoundary } from "next/dist/client/components/error-boundary"

export function MapMockupRoot () {
  const ctx = useHubRenderContext()

  return (
    <ErrorBoundary errorComponent={() => <div>error</div>}>
      <MapPage hostname={ctx.hostname} path={ctx.path} page={ctx.page} isPuckEditing={true} />
    </ErrorBoundary>
  )
}