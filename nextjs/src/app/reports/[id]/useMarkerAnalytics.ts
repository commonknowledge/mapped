import {
  MapReportLayerAnalyticsQuery,
  MapReportLayerAnalyticsQueryVariables,
} from '@/__generated__/graphql'
import { useQuery } from '@apollo/client'
import { useReport } from './(components)/ReportProvider'
import { MAP_REPORT_LAYER_ANALYTICS } from './gql_queries'

const useMarkerAnalytics = () => {
  const { report } = useReport()

  const analytics = useQuery<
    MapReportLayerAnalyticsQuery,
    MapReportLayerAnalyticsQueryVariables
  >(MAP_REPORT_LAYER_ANALYTICS, {
    variables: {
      reportID: report.id,
    },
  })

  return analytics
}

export default useMarkerAnalytics
