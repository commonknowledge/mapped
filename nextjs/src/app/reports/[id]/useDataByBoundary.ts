import {
  AnalyticalAreaType,
  MapReportCountByAreaQuery,
  MapReportCountByAreaQueryVariables,
  MapReportDataByAreaQuery,
  MapReportDataByAreaQueryVariables,
} from '@/__generated__/graphql'
import { useQuery } from '@apollo/client'
import {
  MAP_REPORT_COUNT_BY_AREA,
  MAP_REPORT_DATA_BY_AREA,
} from './gql_queries'
import { MapReportExtended } from './reportContext'
import { ENABLED_ANALYTICAL_AREA_TYPES } from './types'

export type DataByBoundary =
  MapReportCountByAreaQuery['mapReport']['importedDataCountByArea']
export type ExternalDataByBoundary =
  MapReportDataByAreaQuery['mapReport']['importedDataByArea']

const useDataByBoundary = ({
  report,
  boundaryType,
}: {
  report?: MapReportExtended | undefined
  boundaryType?: AnalyticalAreaType
  // Source fields are the numeric data columns from the external data source
  getSourceFieldNames?: boolean
}): { data: DataByBoundary; fieldNames?: string[] } => {
  if (boundaryType && !ENABLED_ANALYTICAL_AREA_TYPES.includes(boundaryType)) {
    throw new Error('Invalid boundary type')
  }

  const selectedDataSource = report?.layers?.find(
    (layer) =>
      layer.id === report?.displayOptions?.dataVisualisation?.dataSource
  )

  const queryForExternalData =
    selectedDataSource?.source.dataType === 'AREA_STATS'

  const queryForCounts = selectedDataSource?.source.dataType === 'MEMBER'

  const externalDataByBoundary = useQuery<
    MapReportDataByAreaQuery,
    MapReportDataByAreaQueryVariables
  >(MAP_REPORT_DATA_BY_AREA, {
    variables: {
      reportID: report?.id,
      analyticalAreaType: boundaryType!,
      layerIds: selectedDataSource?.id ? [selectedDataSource.id] : [],
    },
    skip: !boundaryType || !report || !queryForExternalData,
  })

  const countsByBoundary = useQuery<
    MapReportCountByAreaQuery,
    MapReportCountByAreaQueryVariables
  >(MAP_REPORT_COUNT_BY_AREA, {
    variables: {
      reportID: report?.id,
      analyticalAreaType: boundaryType!,
      layerIds: selectedDataSource?.id ? [selectedDataSource.id] : [],
    },
    skip: !boundaryType || !report || !queryForCounts,
  })

  let fieldNames: string[] | undefined

  if (queryForCounts) {
    return {
      data: countsByBoundary.data?.mapReport.importedDataCountByArea || [],
    }
  } else if (queryForExternalData) {
    const data = externalDataByBoundary.data?.mapReport.importedDataByArea
    fieldNames = data && getNumericFieldsFromDataSource(data)

    // Data source logic
    // TODO: later here is where we do arithmetic operations with data from multiple sources
    const dataSourceField =
      report?.displayOptions?.dataVisualisation?.dataSourceField

    // The added count field is the value of the dataSourceField
    // The mapbox layer code expects a field called "count" to visualise numeric data
    if (data && dataSourceField) {
      const dataWithCounts = data.map((row) => {
        const value = row.importedData[dataSourceField]
        return {
          ...row,
          count: value,
        }
      }) as DataByBoundary

      // Delete rows where the import geocoding has failed (no GSS code)
      const filteredDataWithCounts = dataWithCounts.filter(
        (row) => row.gss !== null && row.count > 0
      )

      // Sum the counts for each GSS code. This allows us traverse boundary types using the
      // same data source and have the counts summed up for the GSS codes
      const summedByGss = filteredDataWithCounts.reduce((acc, row) => {
        const existing = acc.find((item) => item.gss === row.gss)
        if (existing) {
          existing.count += row.count
        } else {
          acc.push({ ...row })
        }
        return acc
      }, [] as DataByBoundary)

      return {
        data: summedByGss,
        fieldNames,
      }
    } else {
      return { fieldNames, data: [] }
    }
  }

  return { data: [] }
}

export default useDataByBoundary

export function getNumericFieldsFromDataSource(data: ExternalDataByBoundary) {
  if (!data || data.length === 0) return []
  const firstRow = data[0].importedData

  return Object.keys(firstRow).filter((key) => {
    const value = firstRow[key]
    return typeof value === 'number'
  })
}
