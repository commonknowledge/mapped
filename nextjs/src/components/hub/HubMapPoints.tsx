"use client"

import { layerColour, useLoadedMap } from "@/lib/map"
import { useAtom } from "jotai"
import { selectedHubSourceMarkerAtom } from "@/components/hub/data"
import { useEffect } from "react"
import { Layer, Source } from "react-map-gl"

export function HubPointMarkers ({ externalDataSourceId, index }: { externalDataSourceId: string, index: number }) {
  const mapbox = useLoadedMap()
  const [selectedSourceMarker, setSelectedSourceMarker] =  useAtom(selectedHubSourceMarkerAtom)

  useEffect(function selectMarker() {
    mapbox.loadedMap?.on('mouseover', `${externalDataSourceId}-marker`, () => {
      const canvas = mapbox.loadedMap?.getCanvas()
      if (!canvas) return
      canvas.style.cursor = 'pointer'
    })
    mapbox.loadedMap?.on('mouseleave', `${externalDataSourceId}-marker`, () => {
      const canvas = mapbox.loadedMap?.getCanvas()
      if (!canvas) return
      canvas.style.cursor = ''
    })
    mapbox.loadedMap?.on('click', `${externalDataSourceId}-marker`, event => {
      const feature = event.features?.[0]
      if (feature?.properties?.id) {
        setSelectedSourceMarker(feature)
      }
    })
  }, [mapbox.loadedMap, externalDataSourceId])
  
  return (
    <>
      <Source
        id={externalDataSourceId}
        type="vector"
        url={`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/tiles/external-data-source/${externalDataSourceId}/tiles.json`}
      >
        {/* {index <= 1 ? ( */}
          <Layer
            beforeId={"PLACEHOLDER_MARKERS"}
            id={`${externalDataSourceId}-marker`}
            source={externalDataSourceId}
            source-layer={"generic_data"}
            type="symbol"
            layout={{
              "icon-image": `tcc-event-marker`,
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "icon-size": 0.75,
              "icon-anchor": "bottom"
            }}
            // {...(
            //   selectedSourceMarker?.properties?.id
            //   ? { filter: ["!=", selectedSourceMarker?.properties?.id, ["get", "id"]] }
            //   : {}
            // )}
          />
        {/* ) : (
          // In case extra layers are added.
          <Layer
            beforeId={"PLACEHOLDER_MARKERS"}
            id={`${externalDataSourceId}-marker`}
            source={externalDataSourceId}
            source-layer={"generic_data"}
            type="circle"
            paint={{
              "circle-radius": 5,
              "circle-color": layerColour(index, externalDataSourceId),
            }}
            {...(
              selectedSourceMarker?.properties?.id
              ? { filter: ["!=", selectedSourceMarker?.properties?.id, ["get", "id"]] }
              : {}
            )}
          />
        )}
        {!!selectedSourceMarker?.properties?.id && (
          <Layer
            beforeId={"PLACEHOLDER_MARKERS"}
            id={`${externalDataSourceId}-marker-selected`}
            source={externalDataSourceId}
            source-layer={"generic_data"}
            type="symbol"
            layout={{
              "icon-image": "meep-marker-selected",
              "icon-size": 0.75,
              "icon-anchor": "bottom",
              "icon-allow-overlap": true,
              "icon-ignore-placement": true
            }}
            filter={["==", selectedSourceMarker.properties.id, ["get", "id"]]}
          />
        )} */}
      </Source>
    </>
  )
}