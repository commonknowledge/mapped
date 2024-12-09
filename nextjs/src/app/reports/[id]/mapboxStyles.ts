import { GroupedDataCount } from '@/__generated__/graphql'
import { scaleLinear, scaleSequential } from 'd3-scale'
import { interpolateBlues } from 'd3-scale-chromatic'
import {
  FillLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from 'mapbox-gl'
import { Tileset } from './types'

export function getChoroplethFill(
  data: { count: number }[]
): FillLayerSpecification['paint'] {
  let min =
    data.reduce(
      (min, p) => (p?.count! < min ? p?.count! : min),
      data?.[0]?.count!
    ) || 0
  let max =
    data.reduce(
      (max, p) => (p?.count! > max ? p?.count! : max),
      data?.[0]?.count!
    ) || 1

  // Ensure min and max are different to fix interpolation errors
  if (min === max) {
    if (min >= 1) {
      min = min - 1
    } else {
      max = max + 1
    }
  }

  // Uses 0-1 for easy interpolation
  // go from 0-100% and return real numbers
  const legendScale = scaleLinear().domain([0, 1]).range([min, max])

  // Map real numbers to colours
  const colourScale = scaleSequential()
    .domain([min, max])
    .interpolator(interpolateBlues)

  let steps = Math.min(max, 30) // Max 30 steps
  steps = Math.max(steps, 3) // Min 3 steps (for valid Mapbox fill-color rule)
  const colourStops = new Array(steps)
    .fill(0)
    .map((_, i) => i / steps)
    .map((n) => {
      return [legendScale(n), colourScale(legendScale(n))]
    })
    .flat()

  return {
    // Shade the map by the count of imported data
    'fill-color': [
      'interpolate',
      ['linear'],
      ['to-number', ['feature-state', 'count'], 0],
      ...colourStops,
    ],
    'fill-opacity': 0.75,
  }
}

export function getChoroplethEdge(): LineLayerSpecification['paint'] {
  return {
    'line-color': 'white',
    'line-opacity': [
      'interpolate',
      ['exponential', 1],
      ['zoom'],
      //
      8,
      0.3,
      //
      12,
      1,
    ],
    'line-width': [
      'interpolate',
      ['exponential', 1],
      ['zoom'],
      //
      8,
      0.3,
      //
      12,
      2,
    ],
  }
}

export function getSelectedChoroplethEdge(): LineLayerSpecification['paint'] {
  return {
    'line-color': 'white',
    'line-width': 5,
  }
}
export const getChoroplethFillFilter = (
  data: GroupedDataCount[],
  tileset: Tileset
) => {
  return [
    'in',
    ['get', tileset.promoteId],
    ['literal', data.map((d) => d.gss || '')],
  ]
}

export const getSelectedChoroplethFillFilter = (
  tileset: Tileset,
  selectedGss: string
) => {
  return ['==', ['get', tileset.promoteId], selectedGss]
}

export function getAreaGeoJSON(data: GroupedDataCount[]) {
  return {
    type: 'FeatureCollection',
    features: data
      .filter((d) => d.gssArea?.point?.geometry)
      .map((d) => ({
        type: 'Feature',
        geometry: d.gssArea?.point?.geometry! as GeoJSON.Point,
        properties: {
          count: d.count,
          label: d.label,
        },
      })),
  }
}

function getStatsForData(data: GroupedDataCount[]) {
  let min =
    data.reduce(
      (min, p) => (p?.count! < min ? p?.count! : min),
      data?.[0]?.count!
    ) || 0
  let max =
    data.reduce(
      (max, p) => (p?.count! > max ? p?.count! : max),
      data?.[0]?.count!
    ) || 1

  // Ensure min and max are different to fix interpolation errors
  if (min === max) {
    if (min >= 1) {
      min = min - 1
    } else {
      max = max + 1
    }
  }

  const textScale = scaleLinear().domain([min, max]).range([1, 1.5])

  return { min, max, textScale }
}

export const getAreaCountLayout = (
  data: GroupedDataCount[]
): SymbolLayerSpecification['layout'] => {
  const { min, max, textScale } = getStatsForData(data)

  return {
    'symbol-spacing': 1000,
    'text-field': ['get', 'count'],
    'text-size': [
      'interpolate',
      ['linear'],
      ['get', 'count'],
      min,
      textScale(min) * 17,
      max,
      textScale(max) * 17,
    ],
    'symbol-placement': 'point',
    'text-offset': [0, -0.5],
    'text-allow-overlap': true,
    'text-ignore-placement': true,
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
  }
}

export const getAreaLabelLayout = (
  data: GroupedDataCount[]
): SymbolLayerSpecification['layout'] => {
  const { min, max, textScale } = getStatsForData(data)

  return {
    'symbol-spacing': 1000,
    'text-field': ['get', 'label'],
    'text-size': [
      'interpolate',
      ['linear'],
      ['get', 'count'],
      min,
      textScale(min) * 9,
      max,
      textScale(max) * 9,
    ],
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'symbol-placement': 'point',
    'text-offset': [0, 0.6],
  }
}
