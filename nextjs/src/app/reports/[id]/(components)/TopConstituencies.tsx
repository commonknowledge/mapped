import { gql, useQuery } from '@apollo/client'
import { useAtom, useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import {
  ConstituencyStatsOverviewQuery,
  ConstituencyStatsOverviewQueryVariables,
} from '@/__generated__/graphql'
import {
  MemberElectoralInsights,
  Person,
} from '@/app/reports/[id]/(components)/reportsConstituencyItem'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  constituencyPanelTabAtom,
  selectedConstituencyAtom,
} from '@/lib/map/state'
import { useLoadedMap } from '@/lib/map/useLoadedMap'

import { useReport } from './ReportProvider'

import { Button } from '@/components/ui/button'
import { isConstituencyPanelOpenAtom } from '@/lib/map'
import { ArrowLeftIcon, Layers, X } from 'lucide-react'
import { selectedBoundaryAtom } from '../useSelectBoundary'
import { Combobox } from './ContituenciesComboBox'

export function TopConstituencies() {
  const sortOptions = {
    totalCount: 'Total Membership',
    electoralPower: 'Electoral Power',
    populationDensity: 'Population Density',
  }
  const [sortBy, setSortBy] = useState<keyof typeof sortOptions>('totalCount')

  const {
    report: {
      id,
      displayOptions: { dataVisualisation },
    },
  } = useReport()
  const constituencyAnalytics = useQuery<
    ConstituencyStatsOverviewQuery,
    ConstituencyStatsOverviewQueryVariables
  >(CONSTITUENCY_STATS_OVERVIEW, {
    variables: {
      reportID: id,
      analyticalAreaType: dataVisualisation?.boundaryType!,
    },
  })
  const [selectedConstituency, setSelectedConstituency] = useAtom(
    selectedConstituencyAtom
  )
  const [tab, setTab] = useAtom(constituencyPanelTabAtom)
  const map = useLoadedMap()
  const setIsConstituencyPanelOpen = useSetAtom(isConstituencyPanelOpenAtom)
  const [selectedBoundary, setSelectedBoundary] = useAtom(selectedBoundaryAtom)

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

  function comboboxMapFitBounds(value: string) {
    const constituency = constituencies?.find((c) => c.gss === value)
    map.loadedMap?.fitBounds(constituency?.gssArea?.fitBounds, {
      maxZoom: 12,
    })
  }

  useEffect(() => {
    if (selectedConstituency && map.loadedMap) {
      const constituency = constituencies?.find(
        (c) => c.gss === selectedConstituency
      )
      if (constituency?.gssArea?.fitBounds) {
        map.loadedMap.fitBounds(constituency.gssArea.fitBounds, {
          maxZoom: 12,
        })
      }
    }
  }, [selectedConstituency, constituencies, map.loadedMap])

  if (constituencyAnalytics.loading && !constituencyAnalytics.data)
    return (
      <div className="flex flex-row items-center justify-center p-4 gap-2">
        <LoadingIcon size={'20px'} className="inline-block" />
        <span>Loading constituencies...</span>
      </div>
    )

  return (
    <div className=" flex flex-col">
      <div className="p-4 flex flex-col border-b bg-meepGray-600 gap-2 border-meepGray-800 pb-4">
        <Combobox
          options={
            constituencies?.map((c) => ({
              label: c.label!,
              value: c.gss!,
            })) || []
          }
          setValue={(value) => {
            setSelectedConstituency(value)
            comboboxMapFitBounds(value)
          }}
          value={selectedConstituency || ''}
        />

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
        </div>
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
        <div className="max-h-[70vh] overflow-y-auto divide-y divide-meepGray-500 ">
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
                  if (selectedBoundary === constituency.gss) {
                    setSelectedBoundary(null)
                    setIsConstituencyPanelOpen(false)
                  } else {
                    setSelectedBoundary(constituency.gss!)
                    setIsConstituencyPanelOpen(true)
                  }
                  map.loadedMap?.fitBounds(constituency.gssArea?.fitBounds, {
                    maxZoom: 12,
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
  const {
    report: {
      displayOptions: { display },
    },
  } = useReport()

  return (
    <div className="flex flex-col p-4 hover:bg-meepGray-700 cursor-pointer pb-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2 items-start">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0 mt-2"
            style={{
              backgroundColor:
                constituency.lastElection?.stats.firstPartyResult.shade ||
                'gray',
            }}
          ></div>
          <h2 className="text-xl">{constituency.name}</h2>
        </div>
        {!!constituency.mp?.name && display?.showMPs && (
          <div className="mb-5 mt-4">
            <Person
              name={constituency.mp?.name}
              subtitle={constituency.mp?.party?.name}
              img={constituency.mp?.photo?.url}
            />
          </div>
        )}
        {/* {!!constituency.lastElection?.stats &&
          display?.showLastElectionData && (
            <div className="grid grid-cols-2 gap-4">
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
          )} */}
        <div>
          <MemberElectoralInsights
            totalCount={count}
            electionStats={constituency.lastElection?.stats}
            bg="bg-meepGray-600 group-hover:bg-meepGray-700"
          />
        </div>
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
