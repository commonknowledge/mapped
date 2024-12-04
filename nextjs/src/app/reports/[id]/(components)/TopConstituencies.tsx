import { gql, useQuery } from '@apollo/client'
import { getYear } from 'date-fns'
import { useAtom } from 'jotai'
import { useContext, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import {
  ConstituencyStatsOverviewQuery,
  ConstituencyStatsOverviewQueryVariables,
} from '@/__generated__/graphql'
import { reportContext, useReportContext } from '@/app/reports/[id]/context'
import {
  MemberElectoralInsights,
  Person,
} from '@/components/reportsConstituencyItem'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeftIcon, Check, ChevronsUpDown, Layers, X } from 'lucide-react'

import {
  constituencyPanelTabAtom,
  selectedConstituencyAtom,
} from '@/lib/map/state'
import { useLoadedMap } from '@/lib/map/useLoadedMap'

import { MAX_CONSTITUENCY_ZOOM } from './ReportMap'

export function TopConstituencies() {
  const sortOptions = {
    totalCount: 'Total Membership',
    electoralPower: 'Electoral Power',
    populationDensity: 'Population Density',
  }
  const [sortBy, setSortBy] = useState<keyof typeof sortOptions>('totalCount')
  const {
    displayOptions: { analyticalAreaType },
  } = useReportContext()

  const { id } = useContext(reportContext)
  const constituencyAnalytics = useQuery<
    ConstituencyStatsOverviewQuery,
    ConstituencyStatsOverviewQueryVariables
  >(CONSTITUENCY_STATS_OVERVIEW, {
    variables: {
      reportID: id,
      analyticalAreaType,
    },
  })
  const [selectedConstituency, setSelectedConstituency] = useAtom(
    selectedConstituencyAtom
  )
  const [tab, setTab] = useAtom(constituencyPanelTabAtom)
  const map = useLoadedMap()
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [value, setValue] = useState('')

  const constituencies =
    constituencyAnalytics.data?.mapReport.importedDataCountByConstituency
      .filter((constituency) => constituency.gssArea)
      .sort((a, b) => {
        if (sortBy === 'totalCount') {
          return b.count - a.count
        } else if (sortBy === 'populationDensity') {
          return (
            b.count / (b?.gssArea?.lastElection?.stats?.electorate || 0) -
            a.count / (a?.gssArea?.lastElection?.stats?.electorate || 0)
          )
        } else if (sortBy === 'electoralPower') {
          return (
            b.count / (b?.gssArea?.lastElection?.stats?.majority || 0) -
            a.count / (a?.gssArea?.lastElection?.stats?.majority || 0)
          )
        }
        return 0
      })

  if (constituencyAnalytics.loading && !constituencyAnalytics.data)
    return (
      <div className="flex flex-row items-center justify-center p-4 gap-2">
        <LoadingIcon size={'20px'} className="inline-block" />
        <span>Loading constituencies...</span>
      </div>
    )

  function comboboxMapFitBounds(value: string) {
    const constituency = constituencies?.find((c) => c.gss === value)
    map.loadedMap?.fitBounds(constituency?.gssArea?.fitBounds, {
      maxZoom: MAX_CONSTITUENCY_ZOOM - 0.1,
    })
  }

  return (

    <div className="flex flex-col">
      <div className='p-4 flex flex-col gap-2 pb-2 border-b border-meepGray-600 bg-meepGray-600'>
        <div className="flex flex-row gap-4">
          <Combobox
            options={constituencies?.map(c => ({
              label: c.label!,
              value: c.gss!
            })) || []}
            setValue={(value) => {
              setSelectedConstituency(value)
              comboboxMapFitBounds(value)
            }}
            value={selectedConstituency || ''}
          />
        </div>
        <div className="flex flex-row gap-4 items-center justify-center">
          {!selectedConstituency && (
            <Select
              value={sortBy}
              onValueChange={(value) =>
                setSortBy(value as keyof typeof sortOptions)
              }
            >
              <SelectTrigger
                className={twMerge(
                  'h-7 w-full max-w-[200px] text-xs [&_svg]:h-4 [&_svg]:w-4'
                )}
              >
                <span className="text-muted-foreground">Sort by: </span>
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sortOptions).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
<<<<<<< HEAD:nextjs/src/app/reports/[id]/(components)/TopConstituencies.tsx
          </>
        )}
        {selectedConstituency && (
          <Button
            variant="link"
            className="h-7 text-xs gap-1 px-0 "
            onClick={() => setSelectedConstituency('')}
          >
            <X className="w-4 h-4" />
            Show all
          </Button>
        )}
=======
          )}
          {selectedConstituency && (
            <Button variant="link" className="h-7 text-xs gap-1 px-0 " onClick={() => setSelectedConstituency('')}>
              <X className="w-4 h-4" />
              Show all
            </Button>
          )}
        </div>
>>>>>>> origin/ui-clean-up/sidebar:nextjs/src/components/TopConstituencies.tsx
      </div>
      {constituencies?.length === 0 ? (
        <div className="text-left p-4 text-meepGray-300 flex items-center gap-2 bg-meepGray-700 rounded-lg">
          <ArrowLeftIcon className="w-8 h-4" />
          <p>
            Add data to the{' '}
            <span className=" bg-meepGray-500 px-2 py-1 rounded-sm">
              <Layers className="inline-block w-4 mr-1" />
              Map Layers
            </span>{' '}
            panel first to see constituency data
          </p>
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-y-auto ">
          {constituencies
            ?.filter(
              (constituency) =>
                !selectedConstituency ||
                constituency.gss === selectedConstituency
            )
            ?.map((constituency) => (
              <div
                key={constituency.gss}
                onClick={() => {
                  setSelectedConstituency(constituency.gss!)
                  setTab('selected')
                  map.loadedMap?.fitBounds(constituency.gssArea?.fitBounds, {
                    maxZoom: MAX_CONSTITUENCY_ZOOM - 0.1,
                  })
                }}
              >
                <ConstituencySummaryCard
                  constituency={constituency.gssArea!}
                  count={constituency.count}
                />
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export function ConstituencySummaryCard({
  count,
  constituency,
}: {
  constituency: NonNullable<
    ConstituencyStatsOverviewQuery['mapReport']['importedDataCountByConstituency'][0]['gssArea']
  >
  count: number
}) {
  const { displayOptions } = useReportContext()

  return (
    <div className="p-4 pt-4 pb-10 border-b border-meepGray-500 bg-none space-y-8 cursor-pointer hover:bg-meepGray-700 ">
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2 items-center">
          <div
            className={`w-4 h-4 rounded-full`}
            style={{
              backgroundColor:
                constituency.lastElection?.stats.firstPartyResult.shade ||
                'gray',
            }}
          ></div>
          <h2 className="text-2xl">{constituency.name}</h2>
        </div>

        {!!constituency.mp?.name && displayOptions.showMPs && (
          <Person
            name={constituency.mp?.name}
            subtitle={constituency.mp?.party?.name}
            img={constituency.mp?.photo?.url}
          />
        )}
      </div>

      {!!constituency.lastElection?.stats &&
        displayOptions.showLastElectionData && (
          <div className="flex flex-col gap-4 justify-between ">
            <div className="flex flex-col gap-1">
              <p className="text-dataName font-IBMPlexSansCondensed uppercase text-meepGray-300">
                1st in {getYear(constituency.lastElection.stats.date)}
              </p>
              <div className="flex items-center gap-1">
                <p className="text-dataResult font-IBMPlexMono">
                  {constituency.lastElection.stats.firstPartyResult.party.replace(
                    ' Party',
                    ''
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-dataName font-IBMPlexSansCondensed uppercase text-meepGray-300">
                2nd in {getYear(constituency.lastElection.stats.date)}
              </p>
              <div className="flex items-center gap-1">
                <p className="text-dataResult font-IBMPlexMono">
                  {constituency.lastElection.stats.secondPartyResult.party.replace(
                    ' Party',
                    ''
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      <div>
        <MemberElectoralInsights
          totalCount={count}
          electionStats={constituency.lastElection?.stats}
          bg="bg-meepGray-800 group-hover:bg-meepGray-00"
        />
      </div>
    </div>
  )
}

const CONSTITUENCY_STATS_OVERVIEW = gql`
  query ConstituencyStatsOverview(
    $reportID: ID!
    $analyticalAreaType: AnalyticalAreaType!
  ) {
    mapReport(pk: $reportID) {
      id
      importedDataCountByConstituency: importedDataCountByArea(
        analyticalAreaType: $analyticalAreaType
      ) {
        label
        gss
        count
        gssArea {
          id
          name
          fitBounds
          mp: person(filters: { personType: "MP" }) {
            id
            name
            photo {
              url
            }
            party: personDatum(filters: { dataType_Name: "party" }) {
              name: data
            }
          }
          lastElection {
            stats {
              date
              majority
              electorate
              firstPartyResult {
                party
                shade
                votes
              }
              secondPartyResult {
                party
                shade
                votes
              }
            }
          }
        }
      }
    }
  }
`
