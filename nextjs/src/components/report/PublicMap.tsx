"use client"

import Map, { ViewState } from "react-map-gl";
import { atom, useAtom } from "jotai";
import { authenticationHeaders } from "@/lib/auth";
import { ImmutableLike } from "react-map-gl/dist/esm/types";

const viewStateAtom = atom<Partial<ViewState>>({
  longitude: -2.296605,
  latitude: 53.593349,
  zoom: 6
})

export function PublicMap ({
  mapStyle
}: {
  mapStyle?: string | mapboxgl.Style | ImmutableLike<mapboxgl.Style> | undefined
}) {
  const [viewState, setViewState] = useAtom(viewStateAtom)
  // const mapbox = useLoadedMap()

  return (
    <>
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        mapStyle={mapStyle || "mapbox://styles/commonknowledge/clwqeu7rb012301nyh52n3kss"}
        transformRequest={(url, resourceType) => {
          if (
            url.includes(process.env.NEXT_PUBLIC_BACKEND_BASE_URL!) &&
            !url.includes("tiles.json")
          ) {
            return {
              url,
              headers: authenticationHeaders(),
              method: "GET",
            };
          }
          return { url };
        }}
      >
        {/* TODO */}
      </Map>
    </>
  );
}