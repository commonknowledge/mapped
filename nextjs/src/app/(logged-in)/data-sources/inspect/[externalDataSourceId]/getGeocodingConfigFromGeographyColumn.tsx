'use client'
import { GeographyTypes } from '@/__generated__/graphql'
import { HubAreaType } from '@/app/reports/[id]/politicalTilesets'

export function getGeocodingConfigFromGeographyColumn(
  geographyColumn: string,
  geographyColumnType: GeographyTypes
):
  | {
      type: 'AREA'
      components: [
        {
          type: 'area_code'
          field: string
          value: ''
          metadata: { lih_area_type__code: HubAreaType[] }
        },
      ]
    }
  | {} {
  const geocodingConfig = {
    type: 'AREA',
    components: [
      {
        type: 'area_code',
        field: geographyColumn,
        value: '',
        metadata: { lih_area_type__code: [''] },
      },
    ],
  }

  if (geographyColumnType === 'PARLIAMENTARY_CONSTITUENCY_2024') {
    geocodingConfig.components[0].metadata.lih_area_type__code = ['WMC23']
    return geocodingConfig
  } else if (geographyColumnType === 'WARD') {
    geocodingConfig.components[0].metadata.lih_area_type__code = ['WD23']
    return geocodingConfig
  } else if (geographyColumnType === 'ADMIN_DISTRICT') {
    geocodingConfig.components[0].metadata.lih_area_type__code = ['DIS', 'STC']
    return geocodingConfig
  } else if (geographyColumnType === 'POSTCODE') {
    return {}
  } else if (geographyColumnType === 'ADDRESS') {
    return {}
  } else if (geographyColumnType === 'OUTPUT_AREA') {
    geocodingConfig.components[0].metadata.lih_area_type__code = [
      'LSOA',
      'MSOA',
      'OA21',
    ]
    return geocodingConfig
  } else return {}
}
