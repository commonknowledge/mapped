import { GeographyTypes } from '@/__generated__/graphql'

export const locationTypeOptions = [
  {
    value: GeographyTypes.Postcode,
    label: 'Postcode',
  },
  {
    value: GeographyTypes.Address,
    label: 'Address',
  },
  {
    value: GeographyTypes.Ward,
    label: 'Ward',
  },
  {
    value: GeographyTypes.AdminDistrict,
    label: 'Council',
  },
  {
    value: GeographyTypes.ParliamentaryConstituency_2024,
    label: 'Constituency',
  },
  // {
  //   value: GeographyTypes.ParliamentaryConstituency_2024,
  //   label: 'Constituency (2024)',
  // },
  {
    value: GeographyTypes.OutputArea,
    label: 'Output Area',
  },
]
