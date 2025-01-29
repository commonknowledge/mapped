import { AnalyticalAreaType } from '@/__generated__/graphql'
import { Tileset } from './types'

type AvailableCountries = 'uk'

export enum BoundaryType {
  // values are the same as AnalyticalAreaType where possible
  // for back compatibility
  PARLIAMENTARY_CONSTITUENCIES = 'parliamentary_constituency_2024',
  WARDS = 'admin_ward',
  EUROPEAN_ELECTORAL_REGIONS = 'european_electoral_region',
  LOCAL_AUTHORITIES = 'admin_district',
  CENSUS_OUTPUT_AREAS = 'census_output_areas',
}

export function dbAreaTypeToBoundaryType(id: string): BoundaryType | undefined {
  const boundaryType = BoundaryType[id as keyof typeof BoundaryType]
  if (boundaryType) {
    return boundaryType
  }
  switch (id) {
    case 'WMC23': // Westminster Parliamentary Constituencies
      return BoundaryType.PARLIAMENTARY_CONSTITUENCIES
    case 'STC': // Local Authority Districts
    case 'DIS': // Local Authority Districts
      return BoundaryType.LOCAL_AUTHORITIES
    case 'WD23': // Wards
      return BoundaryType.WARDS
    case 'EER':
      return BoundaryType.EUROPEAN_ELECTORAL_REGIONS
    // All census area types should become census output areas
    case 'MSOA':
    case 'LSOA':
    case 'OA21':
      return BoundaryType.CENSUS_OUTPUT_AREAS
  }
}

export type PoliticalTileset = {
  boundaryType: BoundaryType
  label: string
  tilesets: Tileset[]
}

export const MAX_VALID_ZOOM = 24

const uk: PoliticalTileset[] = [
  // {
  //   boundaryType: AnalyticalAreaType.Country,
  //   label: 'Countries',
  //   tileset: {
  //     name: 'Countries',
  //     singular: 'country',
  //     mapboxSourceId: 'commonknowledge.48bu0oj9',
  //     sourceLayerId: 'converted_uk_countries_2023',
  //     promoteId: 'CTRY23CD',
  //     labelId: 'CTRY23NM',
  //   },
  // },
  {
    label: 'European Electoral Regions',
    boundaryType: BoundaryType.EUROPEAN_ELECTORAL_REGIONS,
    tilesets: [
      {
        analyticalAreaType: AnalyticalAreaType.EuropeanElectoralRegion,
        name: 'European Electoral Regions',
        singular: 'European Electoral Region',
        mapboxSourceId: 'commonknowledge.awsfhx20',
        sourceLayerId: 'European_Electoral_Regions_De-bxyqod',
        promoteId: 'eer18cd',
        labelId: 'eer18nm',
        minZoom: 0,
        maxZoom: MAX_VALID_ZOOM,
      },
    ],
  },
  {
    label: 'Parliamentary Constituencies',
    boundaryType: BoundaryType.PARLIAMENTARY_CONSTITUENCIES,
    tilesets: [
      {
        analyticalAreaType: AnalyticalAreaType.ParliamentaryConstituency_2024,
        name: 'Constituencies',
        singular: 'constituency',
        mapboxSourceId: 'commonknowledge.bhg1h3hj',
        sourceLayerId: 'uk_cons_2025',
        promoteId: 'gss_code',
        labelId: 'name',
        minZoom: 0,
        maxZoom: 10,
      },
      {
        analyticalAreaType: AnalyticalAreaType.AdminWard,
        name: 'Wards',
        singular: 'ward',
        mapboxSourceId: 'commonknowledge.3s92t1yc',
        sourceLayerId: 'converted_uk_wards_2025',
        promoteId: 'WD24CD',
        labelId: 'WD24NM',
        minZoom: 10,
        maxZoom: MAX_VALID_ZOOM,
      },
    ],
  },
  {
    label: 'Local Authority Districts',
    boundaryType: BoundaryType.LOCAL_AUTHORITIES,
    tilesets: [
      {
        analyticalAreaType: AnalyticalAreaType.AdminDistrict,
        name: 'Local Authority Districts',
        singular: 'Local Authority District',
        mapboxSourceId: 'commonknowledge.2p1squ75',
        sourceLayerId: 'lads_2023geo',
        promoteId: 'LAD23CD',
        labelId: 'LAD23NM',
        minZoom: 0,
        maxZoom: 10,
      },
      {
        analyticalAreaType: AnalyticalAreaType.AdminWard,
        name: 'Wards',
        singular: 'ward',
        mapboxSourceId: 'commonknowledge.3s92t1yc',
        sourceLayerId: 'converted_uk_wards_2025',
        promoteId: 'WD24CD',
        labelId: 'WD24NM',
        minZoom: 10,
        maxZoom: MAX_VALID_ZOOM,
      },
    ],
  },
  {
    label: 'Wards',
    boundaryType: BoundaryType.WARDS,
    tilesets: [
      {
        analyticalAreaType: AnalyticalAreaType.AdminWard,
        name: 'Wards',
        singular: 'ward',
        mapboxSourceId: 'commonknowledge.3s92t1yc',
        sourceLayerId: 'converted_uk_wards_2025',
        promoteId: 'WD24CD',
        labelId: 'WD24NM',
        minZoom: 10,
        maxZoom: MAX_VALID_ZOOM,
      },
    ],
  },
  {
    label: 'Census Output Areas',
    boundaryType: BoundaryType.CENSUS_OUTPUT_AREAS,
    tilesets: [
      {
        analyticalAreaType: AnalyticalAreaType.Msoa,
        name: 'Census MSOAs',
        singular: 'Census MSOA',
        mapboxSourceId: 'commonknowledge.bjml5p4d',
        sourceLayerId:
          'Middle_layer_Super_Output_Areas_December_2021_Boundaries_EW_BGC',
        promoteId: 'MSOA21CD',
        labelId: 'MSOA21NM',
        minZoom: 0,
        maxZoom: 10,
      },
      {
        analyticalAreaType: AnalyticalAreaType.Lsoa,
        name: 'Census LSOAs',
        singular: 'Census LSOA',
        mapboxSourceId: 'commonknowledge.ctau2qzr',
        sourceLayerId: 'Lower_layer_Super_Output_Area-cm5w9g',
        promoteId: 'LSOA21CD',
        labelId: 'LSOA21NM',
        minZoom: 10,
        maxZoom: 15,
        useBoundsInDataQuery: true,
      },
      {
        analyticalAreaType: AnalyticalAreaType.OutputArea,
        name: 'Census Output Areas',
        singular: 'Census Output Area',
        mapboxSourceId: 'commonknowledge.3pgj1hgo',
        sourceLayerId: 'output_areas_latlng-8qk00p',
        promoteId: 'OA21CD',
        labelId: 'OA21CD',
        minZoom: 15,
        maxZoom: MAX_VALID_ZOOM,
        useBoundsInDataQuery: true,
      },
    ],
  },
]

export const POLITICAL_BOUNDARIES = uk

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
