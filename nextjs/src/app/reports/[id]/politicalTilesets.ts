import { AnalyticalAreaType } from '@/__generated__/graphql'
import { Tileset } from './types'

type AvailableCountries = 'uk'

type PoliticalTileset = {
  boundaryType: AnalyticalAreaType
  label: string
  tileset: Tileset
}

const uk: PoliticalTileset[] = [
  {
    boundaryType: AnalyticalAreaType.ParliamentaryConstituency_2024,
    label: 'Parliamentary Constituencies',
    tileset: {
      name: 'Constituencies',
      singular: 'constituency',
      mapboxSourceId: 'commonknowledge.bhg1h3hj',
      sourceLayerId: 'uk_cons_2025',
      promoteId: 'gss_code',
      labelId: 'name',
    },
  },
  {
    boundaryType: AnalyticalAreaType.AdminWard,
    label: 'Wards',
    tileset: {
      name: 'Wards',
      singular: 'ward',
      mapboxSourceId: 'commonknowledge.3s92t1yc',
      sourceLayerId: 'converted_uk_wards_2025',
      promoteId: 'WD24CD',
      labelId: 'WD24NM',
    },
  },
  // [AnalyticalAreaType.LocalAuthorityDistrict]: {
  //   name: '',
  //   singular: '',
  //   mapboxSourceId: '',
  //   sourceLayerId: '',
  //   promoteId: '',
  //   labelId: '',
  // },
]

export function getPoliticalTilesetsByCountry(
  country: AvailableCountries
): PoliticalTileset[] {
  switch (country) {
    case 'uk':
      return uk
    default:
      return []
  }
}
