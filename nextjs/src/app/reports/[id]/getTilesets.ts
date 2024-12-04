import { LayerProps } from 'react-map-gl'

import { MapReportRegionStatsQuery } from '@/__generated__/graphql'

import {
  MAX_CONSTITUENCY_ZOOM,
  MAX_REGION_ZOOM,
} from './(components)/ReportMap'
import useAnalytics from './useAnalytics'

// TODO: unify this and HubMap's TILESETS
export function getTilesets({
  regionAnalytics,
  constituencyAnalytics,
  wardAnalytics,
}: ReturnType<typeof useAnalytics>): Record<
  'EERs' | 'constituencies' | 'constituencies2024' | 'wards',
  {
    name: string
    singular: string
    mapboxSourceId: string
    sourceLayerId?: string
    promoteId: string
    labelId: string
    mapboxSourceProps?: { maxzoom?: number }
    mapboxLayerProps?: Omit<
      LayerProps,
      'type' | 'url' | 'id' | 'paint' | 'layout'
    >
    data: MapReportRegionStatsQuery['mapReport']['importedDataCountByRegion']
    downloadUrl?: string
  }
> {
  return {
    EERs: {
      name: 'regions',
      singular: 'region',
      mapboxSourceId: 'commonknowledge.awsfhx20',
      downloadUrl:
        'https://ckan.publishing.service.gov.uk/dataset/european-electoral-regions-december-2018-boundaries-uk-buc1/resource/b268c97f-2507-4477-9149-0a0c5d2bfbca',
      sourceLayerId: 'European_Electoral_Regions_De-bxyqod',
      promoteId: 'eer18cd',
      labelId: 'eer18nm',
      data: regionAnalytics.data?.mapReport.importedDataCountByRegion || [],
      mapboxSourceProps: {
        //   maxzoom: MAX_REGION_ZOOM
      },
      mapboxLayerProps: {
        maxzoom: MAX_REGION_ZOOM,
      },
    },
    constituencies: {
      name: 'GE2019 constituencies',
      singular: 'constituency',
      mapboxSourceId: 'commonknowledge.4xqg91lc',
      sourceLayerId: 'Westminster_Parliamentary_Con-6i1rlq',
      promoteId: 'pcon16cd',
      labelId: 'pcon16nm',
      data:
        constituencyAnalytics.data?.mapReport.importedDataCountByConstituency ||
        [],
      mapboxSourceProps: {},
      mapboxLayerProps: {
        minzoom: MAX_REGION_ZOOM,
        maxzoom: MAX_CONSTITUENCY_ZOOM,
      },
    },
    constituencies2024: {
      name: 'GE2024 constituencies',
      singular: 'constituency',
      mapboxSourceId: 'commonknowledge.39dnumdm',
      sourceLayerId: 'constituencies_2024_simplifie-7w220i',
      promoteId: 'PCON24CD',
      labelId: 'PCON24NM',
      data:
        constituencyAnalytics.data?.mapReport.importedDataCountByConstituency ||
        [],
      mapboxSourceProps: {},
      mapboxLayerProps: {
        minzoom: MAX_REGION_ZOOM,
        maxzoom: MAX_CONSTITUENCY_ZOOM,
      },
    },
    wards: {
      name: 'wards',
      singular: 'ward',
      mapboxSourceId: 'commonknowledge.0rzbo365',
      sourceLayerId: 'Wards_Dec_2023_UK_Boundaries_-7wzb6g',
      promoteId: 'WD23CD',
      labelId: 'WD23NM',
      data: wardAnalytics.data?.mapReport.importedDataCountByWard || [],
      mapboxSourceProps: {},
      mapboxLayerProps: {
        minzoom: MAX_CONSTITUENCY_ZOOM,
      },
    },
  }
}
