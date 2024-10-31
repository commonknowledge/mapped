import { useHubRenderContext } from "@/components/hub/HubRenderContext"
import MapPage from "@/components/hub/map/MapPage"
import { mapPageConf } from ".."
import { DropZoneProvider } from "@measured/puck"

export function MapMockupRoot () {
  const ctx = useHubRenderContext()

  return (
    <MapPage hostname={ctx.hostname} path={ctx.path} page={ctx.page} isPuckEditing={true} />
  )
}