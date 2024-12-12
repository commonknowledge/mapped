import { scaleLinear, scaleSequential } from 'd3-scale'
import { interpolateBlues } from 'd3-scale-chromatic'
import {
  FillLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from 'mapbox-gl'
import { Tileset } from './types'
import { DataByBoundary } from './useDataByBoundary'

export function getChoroplethFill(
  data: { count: number }[],
  visible?: boolean
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
    .interpolator((t) => interpolateBlues(1 - t))

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
    'fill-opacity': visible ? 1 : 0,
    'fill-opacity-transition': { duration: 750 },
  }
}

export function getChoroplethEdge(
  visible?: boolean
): LineLayerSpecification['paint'] {
  return {
    'line-color': 'white',
    'line-opacity-transition': { duration: 750 },
    'line-opacity': visible
      ? [
          'interpolate',
          ['exponential', 1],
          ['zoom'],
          //
          8,
          0.3,
          //
          12,
          1,
        ]
      : 0,
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
  data: DataByBoundary,
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

export function getAreaGeoJSON(data: DataByBoundary) {
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

function getStatsForData(data: DataByBoundary) {
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
  data: DataByBoundary
): SymbolLayerSpecification['layout'] => {
  const { min, max, textScale } = getStatsForData(data)

  return {
    'symbol-spacing': 1000,
    'text-field': ['get', 'count'],
    'text-size': [
      'interpolate',
      ['linear'],
      ['zoom'],
      1,
      [
        'max',
        ['*', ['/', ['get', 'count'], max], textScale(max) * 9],
        textScale(min) * 10,
      ],
      12,
      [
        'max',
        ['*', ['/', ['get', 'count'], max], textScale(max) * 18],
        textScale(min) * 20,
      ],
    ],
    'symbol-placement': 'point',
    'text-offset': [
      'interpolate',
      ['linear'],
      ['zoom'],
      1,
      [0, -0.1],
      12,
      [0, -1],
    ],
    'text-allow-overlap': true,
    'text-ignore-placement': true,
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
  }
}

export const getAreaLabelLayout = (
  data: DataByBoundary
): SymbolLayerSpecification['layout'] => {
  const { min, max, textScale } = getStatsForData(data)

  return {
    'symbol-spacing': 1000,
    'text-field': ['get', 'label'],
    'text-size': [
      'interpolate',
      ['linear'],
      ['zoom'],
      1,
      [
        'max',
        ['*', ['/', ['get', 'count'], max], textScale(max) * 9],
        textScale(min) * 10,
      ],
      12,
      [
        'max',
        ['*', ['/', ['get', 'count'], max], textScale(max) * 18],
        textScale(min) * 20,
      ],
    ],
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'symbol-placement': 'point',
    'text-offset': [0, 0.6],
  }
}
