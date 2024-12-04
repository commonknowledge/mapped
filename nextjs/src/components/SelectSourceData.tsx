import { useAtomValue } from 'jotai'
import { ExternalLink } from 'lucide-react'
import * as React from 'react'
import { twMerge } from 'tailwind-merge'

import {
  AutoUpdateConfig,
  EnrichmentLayersQuery,
} from '@/__generated__/graphql'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SourcePath } from '@/lib/data'
import useFuse from '@/lib/hooks/filter'
import { currentOrganisationIdAtom } from '@/lib/organisation'

import { CRMSelection } from './CRMButtonItem'
import { DataSourceFieldLabel, DataSourceIcon } from './DataSourceIcon'
import { Input } from './ui/input'
import { LoadingIcon } from './ui/loadingIcon'

type Source = EnrichmentLayersQuery['mappingSources'][0]

export function SourcePathSelector({
  sources,
  loading,
  value,
  setValue,
  focusOnMount = false,
}: {
  sources: Array<Source>
  loading: Boolean
  value: Pick<AutoUpdateConfig, 'source' | 'sourcePath'>
  setValue: (
    source: AutoUpdateConfig['source'],
    sourcePath: AutoUpdateConfig['sourcePath']
  ) => void
  focusOnMount?: boolean
}) {
  const [open, setOpen] = React.useState(focusOnMount)

  function labelForSourcePath(source: string, sourcePath: SourcePath): string {
    const sourceDict = sources.find((s) => s.slug === source)
    if (!sourceDict) return label(sourcePath)
    const sourcePathDict = sourceDict.sourcePaths.find(
      (s) => val(s) === sourcePath
    )
    if (!sourcePathDict) return label(sourcePath)
    return label(sourcePathDict)
  }

  const selectedValueSource = sources.find((s) => s.slug === value.source)

  const scrollElId = React.useId()

  const [searchTerm, setSearchTerm] = React.useState('')
  const filteredSources = useFuse(sources, searchTerm, {
    keys: ['name', 'slug', 'sourcePaths.label', 'sourcePaths.value'],
  })

  return (
    <div
      className={twMerge(
        'flex w-full flex-col items-start justify-between rounded-md border py-2 px-3 sm:flex-row sm:items-center cursor-pointer hover:bg-meepGray-700 text-ellipsis overflow-hidden text-nowrap h-[40px]',
        selectedValueSource?.externalDataSource?.crmType && 'pl-1'
      )}
    >
      <div
        onClick={() => setOpen(true)}
        className="w-full text-ellipsis overflow-hidden text-nowrap text-sm"
      >
        {value && value.source && value.sourcePath ? (
          selectedValueSource?.externalDataSource?.crmType ? (
            <span className="inline-flex flex-row items-center gap-2">
              <DataSourceFieldLabel
                label={value.sourcePath}
                crmType={selectedValueSource.externalDataSource?.crmType}
              />
              <span className="text-xs text-meepGray-400">
                {sourceName(value.source)}
              </span>
            </span>
          ) : (
            <span className="flex flex-row gap-2 items-center">
              <span>{labelForSourcePath(value.source, value.sourcePath)}</span>
              <span className="text-xs text-meepGray-400">
                {sourceName(value.source)}
              </span>
            </span>
          )
        ) : (
          'Click to select data'
        )}
      </div>
      <Dialog open={open} onOpenChange={() => setOpen(false)}>
        <DialogContent className="grid grid-cols-4 grid-rows-[auto,1fr] max-w-full w-[80vw] h-[80vh] overflow-hidden">
          <DialogHeader className="col-span-4">
            <DialogTitle>Data sources</DialogTitle>
            <DialogDescription>
              Pick a data source and a field to import to your membership list.
            </DialogDescription>
          </DialogHeader>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <div className="overflow-y-auto">
                <div className="mb-6">
                  <Input
                    type="text"
                    placeholder="Search sources"
                    className="w-full p-2 rounded-md border border-meepGray-600 bg-meepGray-800 text-meepGray-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
                {sources ? <SourceList /> : <LoadingIcon />}
              </div>
              <div id={scrollElId} className="col-span-3 overflow-y-auto">
                <SourceListDetails />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )

  function SourceList() {
    const orgId = useAtomValue(currentOrganisationIdAtom)
    return (
      <div className="flex flex-col gap-3">
        {/* List of sources - click to scroll to the source's fields */}
        {sources.map((source, i, arr) => (
          <div key={source.slug} className="cursor-pointer">
            <div
              onClick={() => {
                document
                  .getElementById(`${scrollElId}-${source.slug}`)
                  ?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
              }}
              className="flex flex-row cursor-pointer items-center gap-2 text-xs text-meepGray-300"
            >
              {source.externalDataSource?.crmType ? (
                <CRMSelection
                  source={{
                    // We don't need to waste DB queries fetching an unused count
                    // but CRMSelection expects it and making it optional is a pain
                    importedDataCount: 0,
                    ...source.externalDataSource,
                  }}
                  displayCount={false}
                  isShared={
                    source.externalDataSource?.organisation.id !== orgId
                  }
                />
              ) : (
                <div>{source.name || source.slug}</div>
              )}
            </div>
            {source.name || source.slug}
          </div>
        ))}
      </div>
    )
  }

  function SourceListDetails() {
    return (
      <div className="grid gap-12">
        {/* Full list of sources and fields */}
        {!filteredSources?.filteredList?.length &&
          (searchTerm ? (
            <div className="text-meepGray-300 text-lg p-12 text-center">
              No data found for {"'"}
              {searchTerm}
              {"'"}
            </div>
          ) : (
            <div className="text-meepGray-300 text-lg p-12 text-center">
              Loading data sources...
            </div>
          ))}
        {filteredSources?.filteredList?.map((source, i, arr) => (
          <div key={source.slug} id={`${scrollElId}-${source.slug}`}>
            <header className="mb-6">
              <div className="flex flex-row gap-2 text-2xl font-semibold items-center">
                <DataSourceIcon
                  crmType={source.externalDataSource?.crmType}
                  className="w-7 h-7"
                />
                &nbsp;
                {source.name || source.slug}
              </div>
              {source.author && (
                <div className="text-sm my-2">Provided by {source.author}</div>
              )}
              {source.description && (
                <p className="text-sm text-meepGray-300">
                  {source.description}
                </p>
              )}
              {source.descriptionUrl && (
                <a
                  className="underline text-meepGray-300 text-sm flex flex-row items-center"
                  href={source.descriptionUrl}
                  target="_blank"
                >
                  <span>Learn more</span>{' '}
                  <span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              )}
            </header>
            <div className="grid grid-cols-2 gap-2">
              <FilteredSourcePaths
                source={source}
                selectSourcePath={(sourcePath) => {
                  setValue(source.slug, sourcePath)
                  setOpen(false)
                }}
                searchTerm={searchTerm}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  function sourceName(source: string) {
    const sourceDict = sources.find((s) => s.slug === source)
    return sourceDict ? sourceDict.name : source
  }
}

function FilteredSourcePaths({
  searchTerm = '',
  source,
  selectSourcePath,
}: {
  searchTerm?: string
  source: Source
  selectSourcePath: (sourcePath: string) => void
}) {
  const filteredSourcePaths = useFuse(source.sourcePaths, searchTerm, {
    keys: ['label', 'value', { name: 'description', weight: 0.25 }],
  })
  return (
    <>
      {filteredSourcePaths?.filteredList?.map((sourcePath) => (
        <div
          key={val(sourcePath)}
          className="cursor-pointer hover:bg-meepGray-700 rounded-md p-4 border border-meepGray-600"
          onClick={() => {
            selectSourcePath(val(sourcePath))
          }}
        >
          <div>
            <div className="mb-2">
              {source.externalDataSource?.crmType ? (
                <DataSourceFieldLabel
                  label={label(sourcePath)}
                  crmType={source.externalDataSource?.crmType}
                />
              ) : (
                label(sourcePath)
              )}
            </div>
            <p className="text-xs text-meepGray-400">
              {description(sourcePath)}
            </p>
          </div>
        </div>
      ))}
    </>
  )
}

function label(d: SourcePath) {
  return typeof d === 'string' ? d : d.label || d.value
}

function val(d: SourcePath) {
  return typeof d === 'string' ? d : d.value
}

function description(d: SourcePath) {
  return typeof d === 'string' ? '' : d.description
}
