'use client'

import {
  AnalyticalAreaType,
  DataSourceType,
  MapReportLayersSummaryFragment,
} from '@/__generated__/graphql'
import importData from '@/app/(app)/data-sources/inspect/[externalDataSourceId]/importData'
import { ReportContext, useReportContext } from '@/app/reports/[id]/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  MAP_REPORT_LAYERS_SUMMARY,
  isDataConfigOpenAtom,
  layerIdColour,
} from '@/lib/map'
import { useApolloClient, useFragment } from '@apollo/client'
import { useAtom } from 'jotai'
import { ArrowRight, ClipboardCopy, Plus, Shuffle, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useContext } from 'react'
import { toast } from 'sonner'
import { v4 } from 'uuid'
import { CRMSelection } from './CRMButtonItem'
import { AddMapLayerButton } from './report/AddMapLayerButton'
import { LoadingIcon } from './ui/loadingIcon'

export default function DataConfigPanel() {
  const router = useRouter()
  const { id, report, updateReport } = useContext(ReportContext)
  const client = useApolloClient()

  const { displayOptions, setDisplayOptions } = useReportContext()

  const toggleElectionData = () => {
    setDisplayOptions({
      showLastElectionData: !displayOptions.showLastElectionData,
    })
  }

  const toggleMps = () => {
    setDisplayOptions({ showMPs: !displayOptions.showMPs })
  }

  const layers = useFragment<MapReportLayersSummaryFragment>({
    fragment: MAP_REPORT_LAYERS_SUMMARY,
    fragmentName: 'MapReportLayersSummary',
    from: {
      __typename: 'MapReport',
      id,
    },
  })
  const [open, setOpen] = useAtom(isDataConfigOpenAtom)
  const shareURL = () =>
    new URL(
      `/data-sources/share/${report?.data?.mapReport.organisation.slug}`,
      window.location.toString()
    ).toString()

  return (
    <Card className="bg-meepGray-800 border-1 text-meepGray-200 border border-meepGray-700 min-w-60 overflow-y-auto min-h-0">
      <CardHeader className="p-3 flex flex-row justify-between items-center ">
        <CardTitle className="text-hSm font-semibold">Map layers</CardTitle>
        <X
          className="w-4 cursor-pointer"
          onClick={() => {
            setOpen(false)
          }}
        />
      </CardHeader>
      <CardContent>
        <div className="p-3 flex flex-col gap-2 border-t border-meepGray-700 ">
          <span className="text-sm mb-2">Your membership lists</span>
          {layers.data.layers
            ?.filter((d) => d?.source?.dataType === DataSourceType.Member)
            .map(
              (layer, index) =>
                layer?.source && (
                  <div
                    key={layer?.source?.id || index}
                    className="flex gap-2 items-center"
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          className="border-l-4 bg-none p-3 text-sm flex flex-row items-center gap-2 text-left justify-start overflow-hidden text-nowrap text-ellipsis h-14"
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
                                onClick={() =>
                                  importData(client, layer.source!.id)
                                }
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
                                      If enabled, pins will be placed on a map
                                      for each record. If disabled, only
                                      aggregate ward / constituency / region
                                      data will be shared.
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
                            removeLayer(layer?.source?.id!)
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
          <div className="flex gap-2 items-center">
            <AddMapLayerButton
              addLayer={addLayer}
              filter={(source) => source.dataType === DataSourceType.Member}
            />
          </div>
        </div>
        <div className="p-3 pb-4 flex flex-col gap-2 border-t border-meepGray-700 ">
          <span className="label mb-2 text-labelLg">Campaign map layers</span>
          {layers.data.layers
            ?.filter((d) => d?.source?.dataType !== DataSourceType.Member)
            .map(
              (layer, index) =>
                layer?.source && (
                  <div
                    key={layer?.source?.id || index}
                    className="flex gap-2 items-center"
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          className="border-l-4 bg-none p-3 text-sm flex flex-row items-center gap-2 text-left justify-start overflow-hidden text-nowrap text-ellipsis h-14"
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
                                onClick={() =>
                                  importData(client, layer.source!.id)
                                }
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
                                      If enabled, pins will be placed on a map
                                      for each record. If disabled, only
                                      aggregate ward / constituency / region
                                      data will be shared.
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
                          onClick={() => {
                            removeLayer(layer?.source?.id!)
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
          <div className="flex gap-2 items-center">
            <AddMapLayerButton
              addLayer={addLayer}
              filter={(source) => source.dataType !== DataSourceType.Member}
            />
          </div>
        </div>
        <div className="p-3 pb-4 flex flex-col gap-2 border-t border-meepGray-700 ">
          <span className="label mb-2 text-labelLg">Map settings</span>
          {/* Choose analytical area type */}
          <div className="text-labelLg text-meepGray-200 flex items-center gap-2">
            <Switch
              checked={displayOptions.showStreetDetails}
              onCheckedChange={(showStreetDetails) => {
                setDisplayOptions({ showStreetDetails })
              }}
            />
            Street details
          </div>
        </div>
        <div className="p-3 pb-4 flex flex-col gap-2 border-t border-meepGray-700 ">
          <span className="label mb-2 text-labelLg">Westminster politics</span>
          <Select
            value={displayOptions.analyticalAreaType}
            onValueChange={(analyticalAreaType: AnalyticalAreaType) => {
              setDisplayOptions({ analyticalAreaType })
            }}
          >
            <SelectTrigger>
              <SelectValue>
                {displayOptions.analyticalAreaType ===
                AnalyticalAreaType.ParliamentaryConstituency_2024
                  ? '2024 constituencies'
                  : 'Old constituencies'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="z-100">
              <SelectGroup>
                <SelectItem
                  value={AnalyticalAreaType.ParliamentaryConstituency_2024}
                >
                  2024 constituencies
                </SelectItem>
                <SelectItem
                  value={AnalyticalAreaType.ParliamentaryConstituency}
                >
                  Old constituencies
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <div className="text-labelLg text-meepGray-200 flex items-center gap-2">
            <Switch
              checked={displayOptions.showMPs}
              onCheckedChange={toggleMps}
            />
            Current MP
          </div>
          <div className="text-labelLg text-meepGray-200 flex items-center gap-2">
            <Switch
              checked={displayOptions.showLastElectionData}
              onCheckedChange={toggleElectionData}
            />
            Last GE election results
          </div>
        </div>
      </CardContent>
      <div className="bg-meepGray-700 p-3">
        <CardHeader>
          <h2 className="text-meepGray-400 flex flex-row gap-1 items-center text-sm">
            <Shuffle className="w-4" /> Collaborative area
          </h2>
        </CardHeader>
        <CardContent>
          <p className="text-meepGray-300 text-xs py-4">
            Invite to organisations to share membership lists and collaborate on
            a campaign together.
          </p>
          <div className="flex gap-2 items-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button size={'sm'} variant="outline" className="text-sm">
                  <Plus /> Invite
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Request data from other campaigns</DialogTitle>
                  <DialogDescription>
                    Share this URL to request data from other campaigns. They
                    {"'"}ll be able to pick and choose which data sources to
                    share with you, with some data privacy options.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <Input value={shareURL()} />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(shareURL())
                      toast.success('Copied to clipboard')
                    }}
                  >
                    <ClipboardCopy />
                  </Button>
                </div>
                <DialogFooter>
                  <DialogClose
                    onClick={() => {
                      navigator.clipboard.writeText(shareURL())
                      toast.success('Copied to clipboard')
                    }}
                  >
                    Copy and close
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </div>
    </Card>
  )

  function addLayer(source: { name: string; id: string }) {
    const oldLayers = layers.data.layers?.map((l) => ({
      id: l!.id!,
      name: l!.name!,
      source: l!.source?.id,
    }))
    const newLayer = {
      name: source.name!,
      source: source.id,
      id: v4(),
    }
    if (!oldLayers) return
    if (oldLayers.find((l) => l.source === source.id)) return
    const combinedLayers = oldLayers?.concat([newLayer])
    updateReport({ layers: combinedLayers })
  }

  function removeLayer(sourceId: string) {
    const oldLayers = layers.data.layers?.map((l) => ({
      id: l!.id!,
      name: l!.name!,
      source: l!.source?.id,
    }))
    const newLayers = oldLayers?.filter((l) => l.source !== sourceId)
    updateReport({ layers: newLayers })
  }
}
