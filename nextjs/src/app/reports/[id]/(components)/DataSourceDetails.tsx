'use client'
import { MapReport } from '@/__generated__/graphql'
import importData from '@/app/(logged-in)/data-sources/inspect/[externalDataSourceId]/importData'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import { useApolloClient } from '@apollo/client'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { useReport } from './ReportProvider'

interface DataSourceDetailsProps {
  dataSource: MapReport['layers'][0]
}

const DataSourceDetails: React.FC<DataSourceDetailsProps> = ({
  dataSource,
}) => {
  const client = useApolloClient()
  const { updateReport, report } = useReport()

  return (
    <div>
      {!!dataSource?.source?.id &&
        (!dataSource.sharingPermission ? (
          <>
            <div>
              {dataSource.source.importedDataCount || 0} records imported
            </div>
            <Link
              href={`/data-sources/inspect/${dataSource?.source?.id}`}
              className="underline py-2 text-sm"
            >
              Inspect data source <ArrowRight />
            </Link>
            <Button
              disabled={dataSource.source.isImportScheduled}
              onClick={() => importData(client, dataSource.source!.id)}
            >
              {!dataSource.source.isImportScheduled ? (
                'Import data'
              ) : (
                <span className="flex flex-row gap-2 items-center">
                  <LoadingIcon size={'18'} />
                  <span>Importing...</span>
                </span>
              )}
            </Button>
          </>
        ) : (
          <div className="text-sm">
            <div>
              This data source is managed by{' '}
              {dataSource.source.organisation?.name}.
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex flex-row gap-1 uppercase font-semibold text-sm text-meepGray-400">
                <span>Their share settings</span>
              </div>
              <div className="flex flex-row gap-1 items-start">
                <Checkbox
                  checked={
                    !!dataSource.sharingPermission?.visibilityRecordCoordinates
                  }
                  disabled
                />
                <label className="-mt-1">
                  <span>Precise record locations</span>
                  <p className="text-meepGray-400 text-xs">
                    If enabled, pins will be placed on a map for each record. If
                    disabled, only aggregate ward / constituency / region data
                    will be shared.
                  </p>
                </label>
              </div>
              <div className="flex flex-row gap-1 items-start">
                <Checkbox
                  checked={
                    !!dataSource.sharingPermission?.visibilityRecordDetails
                  }
                  disabled
                />
                <label className="-mt-1">
                  <span>Record details</span>
                  <p className="text-meepGray-400 text-xs">
                    Specific data like {'"'}name{'"'}
                  </p>
                </label>
              </div>
            </div>
          </div>
        ))}
      <Button
        className="ml-1"
        onClick={() => {
          removeDataSource(dataSource?.source?.id!)
        }}
        variant="destructive"
      >
        Remove layer
      </Button>
    </div>
  )

  function removeDataSource(sourceId: string) {
    const oldDataSources = report.layers?.map((l) => ({
      id: l!.id!,
      name: l!.name!,
      source: l!.source?.id,
    }))
    const newDataSources = oldDataSources?.filter((l) => l.source !== sourceId)
    updateReport({ layers: newDataSources })
  }
}

export default DataSourceDetails
