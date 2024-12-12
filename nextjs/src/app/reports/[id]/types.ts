import { AnalyticalAreaType } from '@/__generated__/graphql'
import { LayerProps } from 'react-map-gl'

export type Tileset = {
  name: string
  singular: string
  mapboxSourceId: string
  sourceLayerId?: string
  promoteId: string
  labelId: string
  mapboxLayerProps?: Omit<
    LayerProps,
    'type' | 'url' | 'id' | 'paint' | 'layout'
  >
  downloadUrl?: string
}
export const ENABLED_ANALYTICAL_AREA_TYPES = [
  AnalyticalAreaType.ParliamentaryConstituency_2024,
  AnalyticalAreaType.AdminWard,
  AnalyticalAreaType.AdminDistrict,
]
