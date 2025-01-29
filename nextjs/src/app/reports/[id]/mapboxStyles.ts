import { scaleLinear, scaleSequential } from 'd3-scale'
import { max, min } from 'lodash'
import {
  FillLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from 'mapbox-gl'
import { IMapOptions, getReportPalette } from './reportContext'
import { Tileset } from './types'
import { DataByBoundary } from './useDataByBoundary'

export function getChoroplethFill(
  dataByBoundary: DataByBoundary,
  mapOptions: IMapOptions,
  visible?: boolean
): FillLayerSpecification['paint'] {
  // Get min and max counts
  let minCount = min(dataByBoundary.map((d) => d.count || 0)) || 0
  let maxCount = max(dataByBoundary.map((d) => d.count || 0)) || 1

  // ensure minCount and maxCount are different
  if (minCount === maxCount) {
    if (minCount >= 1) {
      minCount = minCount - 0.1
    } else {
      maxCount = maxCount + 0.1
    }
  }

  const interpolator = getReportPalette(mapOptions)

  // Legend scale
  const colourScale = scaleSequential()
    .domain([minCount, maxCount])
    .interpolator(interpolator)

  // Define 30 stops of colour
  let steps = 30

  // Now turn each i into an associated number in the range min-max:
  const stepsToDomainTransformer = scaleLinear()
    .domain([0, steps])
    .range([minCount, maxCount])

  const colourStops = new Array(steps)
    .fill(0)
    .map((_, step) => {
      const count = stepsToDomainTransformer(step)
      return [count, colourScale(count)]
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
  visible?: boolean,
  isFocused?: boolean
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
          isFocused ? 0.3 : 0.1,
          //
          12,
          isFocused ? 1 : 0.5,
        ]
      : 0,
    'line-width': [
      'interpolate',
      ['exponential', 1],
      ['zoom'],
      //
      8,
      isFocused ? 0.5 : 0.1,
      //
      12,
      isFocused ? 2.5 : 1,
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
          formattedCount: d.formattedCount,
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
    'text-field': ['get', 'formattedCount'],
    'text-size': [
      'interpolate',
      ['linear'],
      ['zoom'],
      1,
      [
        'max',
        ['*', ['/', ['get', 'count'], max], textScale(max) * 5],
        textScale(min) * 6,
      ],
      12,
      [
        'max',
        ['*', ['/', ['get', 'count'], max], textScale(max) * 14],
        textScale(min) * 16,
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
        ['*', ['/', ['get', 'count'], max], textScale(max) * 5],
        textScale(min) * 6,
      ],
      12,
      [
        'max',
        ['*', ['/', ['get', 'count'], max], textScale(max) * 14],
        textScale(min) * 16,
      ],
    ],
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'symbol-placement': 'point',
    'text-offset': [0, 0.6],
  }
}
