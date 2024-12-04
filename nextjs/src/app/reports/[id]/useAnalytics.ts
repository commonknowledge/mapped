'use client'

import { useQuery } from '@apollo/client'

import {
  MapReportConstituencyStatsQuery,
  MapReportConstituencyStatsQueryVariables,
  MapReportLayerAnalyticsQuery,
  MapReportLayerAnalyticsQueryVariables,
  MapReportRegionStatsQuery,
  MapReportRegionStatsQueryVariables,
  MapReportWardStatsQuery,
  MapReportWardStatsQueryVariables,
} from '@/__generated__/graphql'
import { DisplayOptionsType } from '@/app/reports/[id]/context'

import {
  MAP_REPORT_CONSTITUENCY_STATS,
  MAP_REPORT_LAYER_ANALYTICS,
  MAP_REPORT_REGION_STATS,
  MAP_REPORT_WARD_STATS,
} from './gql_queries'

const useAnalytics = (
  id: string,
  analyticalAreaType: DisplayOptionsType['analyticalAreaType']
) => {
  const analytics = useQuery<
    MapReportLayerAnalyticsQuery,
    MapReportLayerAnalyticsQueryVariables
  >(MAP_REPORT_LAYER_ANALYTICS, {
    variables: {
      reportID: id,
    },
  })

  const regionAnalytics = useQuery<
    MapReportRegionStatsQuery,
    MapReportRegionStatsQueryVariables
  >(MAP_REPORT_REGION_STATS, {
    variables: {
      reportID: id,
    },
  })

  const constituencyAnalytics = useQuery<
    MapReportConstituencyStatsQuery,
    MapReportConstituencyStatsQueryVariables
  >(MAP_REPORT_CONSTITUENCY_STATS, {
    variables: {
      reportID: id,
      analyticalAreaType,
    },
  })

  const wardAnalytics = useQuery<
    MapReportWardStatsQuery,
    MapReportWardStatsQueryVariables
  >(MAP_REPORT_WARD_STATS, {
    variables: {
      reportID: id,
    },
  })

  return {
    analytics,
    regionAnalytics,
    constituencyAnalytics,
    wardAnalytics,
  }
}

export default useAnalytics
