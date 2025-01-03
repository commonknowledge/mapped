'use client'

import { gql, useFragment, useQuery } from '@apollo/client'
import { Check, ChevronsUpDown, Plus, RefreshCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  GetMemberListQuery,
  MapReportLayersSummaryFragment,
} from '@/__generated__/graphql'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { SourceOption } from '@/lib/data'
import { MAP_REPORT_LAYERS_SUMMARY } from '@/lib/map'
import { cn } from '@/lib/utils'

import { useReport } from '@/app/reports/[id]/(components)/ReportProvider'
import { CRMSelection } from '@/components/CRMButtonItem'
import { FormField } from '@/components/ui/form'
import { LoadingIcon } from '@/components/ui/loadingIcon'

type Source = {
  name: string
  id: string
}

export function AddMapLayerButton({
  addLayer,
  filter,
}: {
  addLayer(layer: Source): void
  filter?: (s: SourceOption) => boolean
}) {
  const form = useForm<{ source?: Source }>()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    return () => {
      form.reset()
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={(o) => setOpen(o)}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-meepGray-400">
          <Plus className="w-4" /> add data source
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form
          onSubmit={form.handleSubmit((d) => {
            setOpen(false)
            if (!d.source) return
            addLayer(d.source)
            form.reset()
          })}
        >
          <DialogHeader>
            <DialogTitle>Add a data source</DialogTitle>
            <DialogDescription>
              Select a data source from your org or one that{"'"}s been shared
              with you.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <MapLayerSelector
                  value={field.value}
                  onChange={field.onChange}
                  filter={filter}
                />
              )}
            />
          </div>
          <DialogFooter>
            <Button type="submit">Add Data Source</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function MapLayerSelector({
  value,
  onChange,
  filter,
}: {
  value?: Source
  onChange: (value: Source) => void
  filter?: (s: SourceOption) => boolean
}) {
  const [open, setOpen] = useState(false)
  const { report } = useReport()
  const dataSources = useQuery<GetMemberListQuery>(MEMBER_LISTS, {
    variables: {
      currentOrganisationId: report.organisation.id,
    },
  })
  const router = useRouter()
  const layers = useFragment<MapReportLayersSummaryFragment>({
    fragment: MAP_REPORT_LAYERS_SUMMARY,
    fragmentName: 'MapReportLayersSummary',
    from: {
      __typename: 'MapReport',
      id: report.id,
    },
  })

  const useableSources = useMemo(() => {
    const data: Array<SourceOption> = [
      ...(dataSources.data?.myOrganisations
        .flatMap((d) => d.externalDataSources)
        .filter((d) => (filter ? filter(d) : true)) || []),
      ...(dataSources.data?.myOrganisations
        .flatMap((d) => d.sharingPermissionsFromOtherOrgs)
        .map((p) => p.externalDataSource)
        .filter((d) => (filter ? filter(d) : true)) || []),
    ]
    return data
  }, [dataSources.data, filter])

  const selectedSource = useableSources.find((s) => s.id === value?.id)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between group h-14"
        >
          {value && selectedSource ? (
            <div className="py-2 text-sm">
              <CRMSelection
                source={selectedSource}
                // @ts-ignore
                isShared={!!selectedSource.organisation}
              />
            </div>
          ) : (
            'Select data source'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ pointerEvents: 'auto' }}>
        <Command className="w-full">
          <CommandInput placeholder="Search your data sources..." />
          <CommandEmpty
            onClick={() => {
              router.push('/data-sources/create?dataType=MEMBER')
            }}
          >
            No data sources found. Click to connect.
          </CommandEmpty>
          <CommandGroup>
            {useableSources.map((source) => {
              const alreadySelected = source.id === value
              const alreadyUsed = layers.data?.layers?.some(
                (sL) => sL?.source?.id === source.id
              )
              return (
                <CommandItem
                  value={source.name}
                  key={source.id}
                  disabled={alreadySelected || alreadyUsed}
                  onSelect={() => {
                    onChange(source)
                    setOpen(false)
                  }}
                  className="flex flex-row items-center gap-1"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      alreadySelected || alreadyUsed
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  <CRMSelection
                    source={source}
                    // @ts-ignore
                    isShared={!!source.organisation}
                  />
                </CommandItem>
              )
            })}
            {dataSources.loading ? (
              <CommandItem disabled>
                <LoadingIcon className={'mr-2 h-4 w-4 inline-block'} />
                Loading...
              </CommandItem>
            ) : (
              <CommandItem
                onSelect={() => {
                  dataSources.refetch()
                }}
              >
                <RefreshCcw className={'mr-2 h-4 w-4'} />
                Reload data sources
              </CommandItem>
            )}
            <CommandItem
              onSelect={() => {
                router.push('/data-sources/create?dataType=MEMBER')
              }}
            >
              <Plus className={'mr-2 h-4 w-4'} />
              Connect a new data source
            </CommandItem>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const MEMBER_LISTS = gql`
  query GetMemberList($currentOrganisationId: ID!) {
    myOrganisations(filters: { id: $currentOrganisationId }) {
      externalDataSources {
        id
        name
        importedDataCount
        crmType
        dataType
      }
      sharingPermissionsFromOtherOrgs {
        externalDataSource {
          id
          name
          importedDataCount
          crmType
          dataType
          organisation {
            name
          }
        }
      }
    }
  }
`
