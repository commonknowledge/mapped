import { HubMap } from "../HubMap";
import { useHubRenderContext } from "../HubRenderContext";

export function MapLayerEditor () {
  const ctx = useHubRenderContext()

  return (
    <div className='flex flex-row h-screen overflow-hidden w-screen'>
      <div>
        <h1>Map layers</h1>
        {ctx.hubData?.layers?.map(layer => (
          <div key={layer.id}>
            <h2>{layer.name}</h2>
            <pre>{JSON.stringify(layer, null, 2)}</pre>
            {/* Checkboxes for popup, cluster */}
            {/* Layer list */}
            {/* Source selector */}
            {/* Filter options with attribute list: 
              predefinedColumnNames
              introspectFields
              fieldDefinitions
            */}
            {/* Mapbox paint JSON */}
            {/* Style-driven thing with some kind of widget for [get...] that queries the fields */}
            {/* Mapbox layout JSON */}
            {/* Style-driven thing with some kind of widget for [get...] that queries the fields */}
            {/* Mapbox type dropdown */}
          </div>
        ))}
      </div>
    </div>
  )
}