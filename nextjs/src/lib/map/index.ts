'use client'

import { gql } from '@apollo/client'
import ColorHash from 'color-hash'
import { MapRef } from 'react-map-gl/dist/esm/mapbox/create-ref'

var colorHash = new ColorHash()

export const MAP_REPORT_LAYERS_SUMMARY = gql`
  fragment MapReportLayersSummary on MapReport {
    layers {
      id
      name
      sharingPermission {
        visibilityRecordDetails
        visibilityRecordCoordinates
        organisation {
          name
        }
      }
      source {
        id
        name
        isImportScheduled
        importedDataCount
        crmType
        dataType
        organisation {
          name
        }
      }
    }
  }
`

export const MAP_REPORT_FRAGMENT = gql`
  fragment MapReportPage on MapReport {
    id
    name
    ...MapReportLayersSummary
  }
  ${MAP_REPORT_LAYERS_SUMMARY}
`

export const layerColour = (index: any, id?: any) => {
  const arr = ['hsl(222, 69%, 65%)', 'hsl(305, 50%, 48%)']
  if (
    typeof index === 'number' &&
    Number.isInteger(index) &&
    index < arr.length
  ) {
    return arr[index]
  }
  return colorHash.hex(id || index)
}

export function layerIdColour(id: string) {
  return colorHash.hex(id)
}

// The @ts-ignore lines here are because the mapboxgl.Map
// type and the react-map-gl MapInstance types have
// slight (erroneous) inconsistencies.
export type MapLoader = {
  // @ts-ignore
  loadedMap: MapRef<mapboxgl.Map> | null | undefined
  loaded: boolean
  // @ts-ignore
  current?: MapRef<mapboxgl.Map> | undefined
}

export type MapboxImageSource = {
  url: () => string
  name: string
}

export * from './state'
export { useLoadedMap } from './useLoadedMap'
export { useMapIcons } from './useMapIcons'
