'use client'
import { MapReportLayersSummaryFragment } from '@/__generated__/graphql'
import { MAP_REPORT_LAYERS_SUMMARY } from '@/lib/map'
import { useFragment } from '@apollo/client'
import { useEffect } from 'react'
import { v4 } from 'uuid'
import { useReport } from './(components)/ReportProvider'

const useDataSources = () => {
  const {
    report: { id },
    updateReport,
  } = useReport()

  useEffect(() => {
    // Fetch data or perform any side effects here
    // Example:
    // fetchData(id).then(response => setData(response));
  }, [id])

  const dataSources = useFragment<MapReportLayersSummaryFragment>({
    fragment: MAP_REPORT_LAYERS_SUMMARY,
    fragmentName: 'MapReportLayersSummary',
    from: {
      __typename: 'MapReport',
      id,
    },
  })

  function removeDataSource(sourceId: string) {
    const oldDataSources = dataSources.data.layers?.map((l) => ({
      id: l!.id!,
      name: l!.name!,
      source: l!.source?.id,
    }))
    const newDataSources = oldDataSources?.filter((l) => l.source !== sourceId)
    updateReport({ layers: newDataSources })
  }

  function addDataSource(source: { name: string; id: string }) {
    const oldDataSources = dataSources.data.layers?.map((l) => ({
      id: l!.id!,
      name: l!.name!,
      source: l!.source?.id,
    }))
    const newDataSources = {
      name: source.name!,
      source: source.id,
      id: v4(),
    }
    if (!oldDataSources) return
    if (oldDataSources.find((l) => l.source === source.id)) return
    const combinedDataSources = oldDataSources?.concat([newDataSources])
    updateReport({ layers: combinedDataSources })
  }

  return { removeDataSource, addDataSource, dataSources }
}

export default useDataSources
