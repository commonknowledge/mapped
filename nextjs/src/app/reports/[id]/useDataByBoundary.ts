import {
  StatisticsQuery,
  StatisticsQueryVariables,
  StatisticsTableQuery,
  StatisticsTableQueryVariables,
} from '@/__generated__/graphql'
import { useReport } from '@/lib/map/useReport'
import { ApolloError, gql, useQuery } from '@apollo/client'
import { atom, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import {
  SpecificViewConfig,
  StatisticalDataType,
  ViewType,
} from './reportContext'
import { Tileset } from './types'

export type DataByBoundary = StatisticsQuery['statisticsForChoropleth']

export const choroplethErrorsAtom = atom<
  Record<
    // viewID
    string,
    // Error payload
    string | ApolloError | undefined
  >
>({})

const useDataByBoundary = ({
  view,
  tileset,
}: {
  view?: SpecificViewConfig<ViewType.Map> | null
  tileset: Tileset
}) => {
  // If mapBounds is required, send dummy empty bounds on the first request
  // This is required for fetchMore() to work, which is used to add data to
  // the map when the user pans/zooms
  // Passing the actual mapBounds with useMapBounds() here resets the query
  // on every pan, which creates flicker and poor performance
  const mapBounds = tileset.useBoundsInDataQuery
    ? { east: 0, west: 0, north: 0, south: 0 }
    : null

  const statisticsQuery = useQuery<StatisticsQuery, StatisticsQueryVariables>(
    STATISTICS_QUERY,
    {
      variables: {
        config: {
          ...(view?.mapOptions?.choropleth.advancedStatisticsConfig! || {}),
          groupByArea: tileset.analyticalAreaType!,
        },
        choroplethConfig: {
          mapBounds,
          categoryKey:
            view?.mapOptions?.choropleth.dataType ===
            StatisticalDataType.Nominal
              ? view?.mapOptions?.choropleth.field
              : undefined,
          countKey:
            view?.mapOptions?.choropleth.dataType ===
            StatisticalDataType.Continuous
              ? view?.mapOptions?.choropleth.field
              : undefined,
          isCountKeyPercentage:
            view?.mapOptions?.choropleth.dataType ===
              StatisticalDataType.Continuous &&
            !!view?.mapOptions?.choropleth.field
              ? view?.mapOptions?.choropleth.fieldIsPercentage
              : undefined,
        },
      },
      skip:
        !view?.mapOptions?.choropleth.advancedStatisticsConfig ||
        !view?.mapOptions?.choropleth.advancedStatisticsConfig.sourceIds
          ?.length ||
        !tileset.analyticalAreaType,
      notifyOnNetworkStatusChange: true, // required to mark loading: true on fetchMore()
    }
  )

  const setChoroplethErrors = useSetAtom(choroplethErrorsAtom)

  useEffect(() => {
    if (view?.id) {
      if (statisticsQuery.error) {
        setChoroplethErrors((prev) => ({
          ...prev,
          [view?.id!]: statisticsQuery.error,
        }))
      } else {
        setChoroplethErrors((prev) => {
          const { [view?.id!]: _, ...rest } = prev
          return rest
        })
      }
    }
  }, [view, statisticsQuery, setChoroplethErrors])

  return statisticsQuery
}

export const useTableDataByBoundary = (
  view?: SpecificViewConfig<ViewType.Table>
) => {
  const reportManager = useReport()
  const sourceId = reportManager.getLayer(view?.tableOptions?.layerId!)?.source
  const statisticsQuery = useQuery<
    StatisticsTableQuery,
    StatisticsTableQueryVariables
  >(STATISTICS_TABLE_QUERY, {
    variables: {
      config: {
        sourceIds: [sourceId!],
        groupByArea: view?.tableOptions.groupBy.area,
      },
    },
    skip: !sourceId || !view,
    notifyOnNetworkStatusChange: true, // required to mark loading: true on fetchMore()
  })

  return statisticsQuery
}

export const STATISTICS_QUERY = gql`
  query Statistics(
    $config: StatisticsConfig!
    $choroplethConfig: ChoroplethConfig!
  ) {
    statisticsForChoropleth(
      statsConfig: $config
      choroplethConfig: $choroplethConfig
    ) {
      label
      gss
      count
      formattedCount
      category
      columns
    }
  }
`

export const STATISTICS_TABLE_QUERY = gql`
  query StatisticsTable($config: StatisticsConfig!) {
    statistics(statsConfig: $config)
  }
`

export default useDataByBoundary
