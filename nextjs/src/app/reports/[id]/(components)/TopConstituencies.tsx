import { gql, useQuery } from '@apollo/client'
import { getYear } from 'date-fns'
import { useAtom } from 'jotai'
import { useState } from 'react'
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

  return (
    // List of them here
    <div className="grid grid-cols-1 gap-4">
      <div className="text-meepGray-400 text-xs">
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
      </div>
      {constituencies?.map((constituency) => (
        <div
          key={constituency.gss}
          onClick={() => {
            setSelectedConstituency(constituency.gss!)
            setTab('selected')
            map.loadedMap?.fitBounds(constituency.gssArea?.fitBounds)
          }}
          className="cursor-pointer bg-meepGray-700 group hover:bg-meepGray-600 rounded-lg"
        >
          <ConstituencySummaryCard
            constituency={constituency.gssArea!}
            count={constituency.count}
          />
        </div>
      ))}
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
    <div className="p-3 ">
      <h2 className="font-PPRightGrotesk text-hLgPP mb-3">
        {constituency.name}
      </h2>
      {!!constituency.mp?.name && display?.showMPs && (
        <div className="mb-5 mt-4">
          <Person
            name={constituency.mp?.name}
            subtitle={constituency.mp?.party?.name}
            img={constituency.mp?.photo?.url}
          />
        </div>
      )}
      {!!constituency.lastElection?.stats && display?.showLastElectionData && (
        <div className="flex justify-between mb-6">
          <div className="flex flex-col gap-1">
            <p className="text-dataName font-IBMPlexSansCondensed uppercase text-meepGray-300">
              1st in {getYear(constituency.lastElection.stats.date)}
            </p>
            <div className="flex items-center gap-1">
              <div
                className={`w-3 h-3 rounded-full`}
                style={{
                  backgroundColor:
                    constituency.lastElection.stats.firstPartyResult.shade ||
                    'gray',
                }}
              ></div>
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
              <div
                className={`w-3 h-3 rounded-full`}
                style={{
                  backgroundColor:
                    constituency.lastElection.stats.secondPartyResult.shade ||
                    'gray',
                }}
              ></div>
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
          bg="bg-meepGray-700 group-hover:bg-meepGray-600"
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
