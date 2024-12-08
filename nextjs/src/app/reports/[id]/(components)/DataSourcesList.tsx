'use client'
import importData from '@/app/(logged-in)/data-sources/inspect/[externalDataSourceId]/importData'
import { CRMSelection } from '@/components/CRMButtonItem'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { layerIdColour } from '@/lib/map'
import { useApolloClient } from '@apollo/client'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import useDataSources from '../useDataSources'

const DataSourcesList: React.FC = () => {
  const client = useApolloClient()
  const { dataSources, removeDataSource } = useDataSources()

  return (
    <>
      <div className="flex flex-col gap-2">
        {dataSources?.data?.layers?.map(
          (layer, index) =>
            layer?.source && (
              <div
                key={layer?.source?.id || index}
                className="flex gap-2 items-center"
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      className="border-l-4 bg-meepGray-800 hover:bg-black p-3 text-sm flex flex-row items-center gap-2 text-left 
                      justify-start overflow-hidden text-nowrap text-ellipsis h-14 w-full"
                      style={{
                        borderColor: layerIdColour(layer?.source?.id),
                      }}
                    >
                      <CRMSelection
                        // @ts-ignore: Property 'id' is optional in type 'DeepPartialObject - a silly Fragment typing
                        source={layer.source}
                        isShared={!!layer.sharingPermission}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="space-y-4">
                    {!!layer?.source?.id &&
                      (!layer.sharingPermission ? (
                        <>
                          <div>
                            {layer.source.importedDataCount || 0} records
                            imported
                          </div>
                          <Link
                            href={`/data-sources/inspect/${layer?.source?.id}`}
                            className="underline py-2 text-sm"
                          >
                            Inspect data source <ArrowRight />
                          </Link>
                          <Button
                            disabled={layer.source.isImportScheduled}
                            onClick={() => importData(client, layer.source!.id)}
                          >
                            {!layer.source.isImportScheduled ? (
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
                            {layer.source.organisation?.name}.
                          </div>
                          <div className="flex flex-col gap-2 mt-4">
                            <div className="flex flex-row gap-1 uppercase font-semibold text-sm text-meepGray-400">
                              <span>Their share settings</span>
                            </div>
                            <div className="flex flex-row gap-1 items-start">
                              <Checkbox
                                checked={
                                  !!layer.sharingPermission
                                    ?.visibilityRecordCoordinates
                                }
                                disabled
                              />
                              <label className="-mt-1">
                                <span>Precise record locations</span>
                                <p className="text-meepGray-400 text-xs">
                                  If enabled, pins will be placed on a map for
                                  each record. If disabled, only aggregate ward
                                  / constituency / region data will be shared.
                                </p>
                              </label>
                            </div>
                            <div className="flex flex-row gap-1 items-start">
                              <Checkbox
                                checked={
                                  !!layer.sharingPermission
                                    ?.visibilityRecordDetails
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
                        removeDataSource(layer?.source?.id!)
                      }}
                      variant="destructive"
                    >
                      Remove layer
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
            )
        )}
      </div>
    </>
  )
}

export default DataSourcesList
