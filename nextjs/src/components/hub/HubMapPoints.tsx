"use client";

import { layerColour, useLoadedMap } from "@/lib/map";
import { useAtom } from "jotai";
import { selectedHubSourceMarkerAtom } from "@/components/hub/data";
import { useEffect } from "react";
import { Layer, Point, Popup, Source } from "react-map-gl";
import { BACKEND_URL } from "@/env";
import { useHubRenderContext } from "./HubRenderContext";
import { DataSourceType, GetHubMapDataQuery } from "@/__generated__/graphql";

export function HubPointMarkers({
  layer,
  index,
  beforeId,
}: {
  layer: NonNullable<GetHubMapDataQuery["hubByHostname"]>["layers"][number];
  index: number;
  beforeId?: string;
}) {
  const mapbox = useLoadedMap();
  const context = useHubRenderContext();
  const [selectedSourceMarker, setSelectedSourceMarker] = useAtom(
    selectedHubSourceMarkerAtom
  );

  useEffect(
    function selectMarker() {
      mapbox.loadedMap?.on(
        "mouseover",
        `${layer.source.id}-marker`,
        (event) => {
          const canvas = mapbox.loadedMap?.getCanvas();
          if (!canvas) return;
          canvas.style.cursor = "pointer";
        }
      );
      mapbox.loadedMap?.on(
        "mouseleave",
        `${layer.source.id}-marker`,
        (event) => {
          const canvas = mapbox.loadedMap?.getCanvas();
          if (!canvas) return;
          canvas.style.cursor = "";
        }
      );

      // Popups for events, groups, locations
      if (layer.popup) {
        mapbox.loadedMap?.on("click", `${layer.source.id}-marker`, (event) => {
          console.log(event)
          const feature = event.features?.[0];
          if (feature?.properties?.id) {
            if (selectedSourceMarker?.properties?.id === feature.properties.id) {
              // Toggle off
              // setSelectedSourceMarker(null);
            } else {
              // Toggle on
              if (layer.source.dataType === DataSourceType.Event) {
                context.goToEventId(feature.properties.id);
              } else {
                setSelectedSourceMarker(feature);
              }
            }
          }
        });
      }
    },
    [mapbox.loadedMap, layer.source.id]
  );

  // @ts-ignore
  const coordinates = selectedSourceMarker?.geometry.coordinates;

  return (
    <>
      {layer.cluster ? (
        <Source
          id={layer.source.id}
          type="geojson"
          data={new URL(
            `/tiles/external-data-source/${layer.source.id}/geojson`,
            BACKEND_URL
          ).toString()}
          cluster={true}
          clusterMaxZoom={100}
          clusterRadius={50}
          clusterProperties={{
            sum: ["+", ["get", "count"]],
          }}
        >
          <Layer
            id={`${layer.source.id}-cluster`}
            beforeId={beforeId}
            type="circle"
            source={layer.source.id}
            filter={["has", "sum"]}
            paint={{
              "circle-color": "rgba(24, 164, 127, 0.80)",
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                10,
                30,
                15,
                60,
              ],
            }}
          />
          <Layer
            id={`${layer.source.id}-cluster-count`}
            beforeId={beforeId}
            type="symbol"
            source={layer.source.id}
            filter={["has", "sum"]}
            layout={{
              "text-field": ["get", "sum"],
              "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 24,
            }}
          />
          <Layer
            id={`${layer.source.id}-circle`}
            beforeId={beforeId}
            type="circle"
            source={layer.source.id}
            filter={["all", ["!", ["has", "sum"]], [">", ["get", "count"], 1]]}
            paint={{
              "circle-color": "rgba(24, 164, 127, 0.80)",
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                10,
                30,
                15,
                60,
              ],
            }}
          />
          <Layer
            id={`${layer.source.id}-circle-count`}
            beforeId={beforeId}
            type="symbol"
            source={layer.source.id}
            filter={["all", ["!", ["has", "sum"]], [">", ["get", "count"], 1]]}
            layout={{
              "text-field": ["get", "count"],
              "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 24,
            }}
          />
          <Layer
            beforeId={beforeId}
            id={`${layer.source.id}-marker`}
            source={layer.source.id}
            type={layer.mapboxType as any || "symbol"}
            filter={["all", ["!", ["has", "sum"]], ["==", ["get", "count"], 1]]}
            layout={{
              ...(layer.mapboxType === "symbol" ? {
                "icon-image": layer.iconImage
                  ? layer.iconImage
                  : `tcc-event-marker`,
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
                "icon-size": 0.75,
                "icon-anchor": "bottom",
                "symbol-z-order": "auto",
                'symbol-placement': 'point',
                'symbol-z-elevate': true,
              } : {}),
              ...(layer.mapboxLayout || {}),
            }}
            paint={layer.mapboxPaint || {}}
          />
        </Source>
      ) : (
        <Source
          id={layer.source.id}
          type="vector"
          url={new URL(
            `/tiles/external-data-source/${context.hostname}/${layer.source.id}/tiles.json`,
            BACKEND_URL
          ).toString()}
        >
          <Layer
            beforeId={beforeId}
            id={`${layer.source.id}-marker`}
            source={layer.source.id}
            source-layer={"generic_data"}
            type={layer.mapboxType as any || "symbol"}
            layout={{
              ...(layer.mapboxType === "symbol" ? {
                "icon-image": layer.iconImage
                  ? layer.iconImage
                  : `tcc-event-marker`,
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
                "icon-size": 0.75,
                "icon-anchor": "bottom",
                "symbol-z-order": "auto",
                'symbol-placement': 'point',
                'symbol-z-elevate': true,
              } : {}),
              ...(layer.mapboxLayout || {}),
            }}
            paint={layer.mapboxPaint || {}}
          />
          {!!selectedSourceMarker ? (
            <Popup
              key={selectedSourceMarker.properties?.id}
              longitude={coordinates[0]}
              latitude={coordinates[1]}
              offset={[0, -15] as [number, number]}
              onClose={() => setSelectedSourceMarker(null)}
            >
              {JSON.stringify(selectedSourceMarker, null, 2)}
              <h2 className="text-lg">
                {selectedSourceMarker.properties?.title}
              </h2>
              {selectedSourceMarker.properties?.public_url ? (
                <p>
                  <a
                    href={selectedSourceMarker.properties.public_url}
                    target="_blank"
                  >
                    Visit website
                  </a>
                </p>
              ) : null}
              {selectedSourceMarker.properties?.social_url ? (
                <p>
                  <a
                    href={selectedSourceMarker.properties.social_url}
                    target="_blank"
                  >
                    Get in touch
                  </a>
                </p>
              ) : null}
            </Popup>
          ) : null}
        </Source>
      )}
    </>
  );
}
