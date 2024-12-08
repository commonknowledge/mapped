import { GroupedDataCount } from '@/__generated__/graphql'
import { scaleLinear, scaleSequential } from 'd3-scale'
import { interpolateBlues } from 'd3-scale-chromatic'
import { FillLayerSpecification, LineLayerSpecification } from 'mapbox-gl'
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
    'line-gap-width': [
      'interpolate',
      ['exponential', 1],
      ['zoom'],
      8,
      0,
      12,
      3,
    ],
    'line-opacity': 0.5,
    'line-width': ['interpolate', ['exponential', 1], ['zoom'], 8, 0.1, 12, 1],
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
