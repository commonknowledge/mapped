'use client'

import { gql, useQuery } from '@apollo/client'
import { format } from 'd3-format'
import { getYear } from 'date-fns'
import { AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import pluralize from 'pluralize'
import { twMerge } from 'tailwind-merge'

import {
  AnalyticalAreaType,
  GetConstituencyDataQuery,
  GetConstituencyDataQueryVariables,
} from '@/__generated__/graphql'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ChartCard'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { BACKEND_URL } from '@/env'
import { layerColour } from '@/lib/map'

import { useReport } from '@/app/reports/[id]/(components)/ReportProvider'
import { OverlapIcon } from '@/components/icons/OverlapIcon'
import { LoadingIcon } from '@/components/ui/loadingIcon'

type Party = {
  name: string
  shade: string
}

type DeepNullable<T> = {
  [K in keyof T]: DeepNullable<T[K]> | null
}

export const ConstituencyElectionDeepDive = ({
  gss,
  analyticalAreaType = AnalyticalAreaType.ParliamentaryConstituency_2024,
}: {
  gss: string
  analyticalAreaType: AnalyticalAreaType
}) => {
  const {
    report: {
      id,
      displayOptions: { display: { showMPs, showLastElectionData } = {} },
    },
  } = useReport()
  const { data, loading, error } = useQuery<
    GetConstituencyDataQuery,
    GetConstituencyDataQueryVariables
  >(CONSTITUENCY_DATA, {
    variables: { gss, reportID: id, analyticalAreaType },
  })

  if (!loading && error) return <div>Error loading constituency {gss}</div>
  if (!data?.constituency || !data.mapReport)
    return (
      <div className="flex flex-row items-center justify-center p-4 gap-2">
        <LoadingIcon size={'20px'} className="inline-block" />
        <span>Loading constituency...</span>
      </div>
    )

  const layersInThisConstituency = data.mapReport.layers
    .map((l, index) => ({ ...l, index }))
    .filter((l) => !!l.source.importedDataCountForConstituency?.count)

  return (
    <Card key={data.constituency.id} className="divide-y space-y-4">
      <CardHeader>
        <CardTitle>{data.constituency.name}</CardTitle>
        <CardDescription>
          {data.mapReport.importedDataCountForConstituency?.count ? (
            <>
              {format(',')(
                data.mapReport.importedDataCountForConstituency?.count
              )}{' '}
              {pluralize(
                'member',
                data.mapReport.importedDataCountForConstituency?.count || 0
              )}
            </>
          ) : (
            <div>You have no member data in this constituency</div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.constituency.mp && showMPs && (
          <section className="mb-8">
            <div className="uppercase font-IBMPlexMono text-xs text-meepGray-400 mb-1">
              MP
            </div>
            <Person
              img={data.constituency.mp.photo?.url}
              name={data.constituency.mp.name}
              subtitle={data.constituency.mp.party?.name}
            />
          </section>
        )}
        {!!data.constituency.lastElection && showLastElectionData && (
          <section className="font-IBMPlexMono mb-10">
            <section>
              {/* First and second parties */}
              <article className="relative z-10 space-y-1">
                <div className="uppercase text-xs text-meepGray-400">
                  1st in {getYear(data.constituency.lastElection.stats.date)}
                </div>
                <div>
                  {data.constituency.lastElection.stats.firstPartyResult.party}
                </div>
                <div
                  className="rounded w-full h-4"
                  style={{
                    backgroundColor:
                      data.constituency.lastElection.stats.firstPartyResult
                        .shade,
                  }}
                />
              </article>
              <article className="relative z-10 pt-6">
                <div
                  aria-roledescription="Margin between first and second party votes"
                  className="bg-meepGray-700 border-l border-r border-meepGray-400 absolute right-0 top-0 h-full z-0"
                  style={{
                    width: format('.0%')(
                      1 -
                        data.constituency.lastElection.stats.secondPartyResult
                          .votes /
                          data.constituency.lastElection.stats.firstPartyResult
                            .votes
                    ),
                  }}
                />
                <div className="relative z-10 space-y-1">
                  <div className="uppercase text-xs text-meepGray-400">
                    2nd in {getYear(data.constituency.lastElection.stats.date)}
                  </div>
                  <div>
                    {
                      data.constituency.lastElection.stats.secondPartyResult
                        .party
                    }
                  </div>
                  <div
                    className="rounded h-4"
                    style={{
                      backgroundColor:
                        data.constituency.lastElection.stats.secondPartyResult
                          .shade,
                      width: format('.0%')(
                        data.constituency.lastElection.stats.secondPartyResult
                          .votes /
                          data.constituency.lastElection.stats.firstPartyResult
                            .votes
                      ),
                    }}
                  />
                </div>
              </article>
            </section>
            <section className="grid grid-cols-2 gap-6 mt-8">
              {/* Voting stats */}
              <article>
                <div className="uppercase text-xs text-meepGray-400">
                  Majority
                </div>
                <div>
                  {format(',')(data.constituency.lastElection.stats.majority)}
                </div>
              </article>
              <article>
                <div className="uppercase text-xs text-meepGray-400">
                  Swing to lose
                </div>
                <div>
                  {format('.2%')(
                    data.constituency.lastElection.stats.majority /
                      data.constituency.lastElection.stats.electorate
                  )}
                </div>
              </article>
              <article>
                <div className="uppercase text-xs text-meepGray-400">
                  Electorate
                </div>
                <div>
                  {format(',')(data.constituency.lastElection.stats.electorate)}
                </div>
              </article>
              <article>
                <div className="uppercase text-xs text-meepGray-400">
                  Turnout
                </div>
                <div>
                  {format('.2%')(
                    data.constituency.lastElection.stats.validVotes /
                      data.constituency.lastElection.stats.electorate
                  )}
                </div>
              </article>
            </section>
          </section>
        )}
        {!!data.mapReport.importedDataCountForConstituency && (
          <MemberElectoralInsights
            totalCount={data.mapReport.importedDataCountForConstituency.count}
            layersInThisConstituency={layersInThisConstituency}
            electionStats={data.constituency.lastElection?.stats}
          />
        )}
      </CardContent>
    </Card>
  )
}

export function MemberElectoralInsights({
  totalCount,
  electionStats,
  layersInThisConstituency,
  bg = 'bg-meepGray-800',
}: {
  bg?: string
  totalCount: number
  electionStats?: {
    date: string
    majority: number
    firstPartyResult: {
      votes: number
    }
  }
  layersInThisConstituency?: Array<{
    name: string
    index: any
    source: {
      id: any
      importedDataCountForConstituency?: {
        count: number | null
      } | null
    }
  }>
}) {
  const maxCount = Math.max(
    // Member count
    totalCount,
    // First party votes
    electionStats?.firstPartyResult.votes || 0
  )
  const {
    report: {
      displayOptions: { display: { showLastElectionData } = {} },
    },
  } = useReport()

  return (
    <section className="border border-meepGray-500 rounded relative p-2 mt-2">
      <div
        className={twMerge(
          'absolute -top-2 left-2 px-1 text-meepGray-400 uppercase text-xs inline-flex flex-row items-center gap-1',
          bg
        )}
      >
        <OverlapIcon /> Member insights
      </div>
      <div className="space-y-3 pt-2 pb-1">
        <article className="relative z-10 space-y-1">
          <div className="text-xs">
            {format(',')(totalCount)} {pluralize('member', totalCount)} in this
            report
          </div>
          {layersInThisConstituency?.length ? (
            <div className="flex flex-row">
              {layersInThisConstituency.map((layer) => (
                <TooltipProvider key={layer.source.id}>
                  <Tooltip delayDuration={250}>
                    <TooltipTrigger asChild>
                      <div
                        className="rounded h-4"
                        style={{
                          width: format('.0%')(
                            Math.min(
                              Math.max((totalCount || 0) / maxCount, 0.04),
                              1
                            )
                          ),
                          backgroundColor: layerColour(
                            layer.index,
                            layer.source.id
                          ),
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {format(',')(totalCount || 0)}{' '}
                        {pluralize('member', totalCount || 0)} in {layer.name}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          ) : totalCount ? (
            <div
              className="rounded h-4 bg-brandBlue"
              style={{
                width: format('.0%')(
                  Math.min(Math.max(totalCount / maxCount, 0.04), 1)
                ),
              }}
            />
          ) : (
            <div>No member data in this constituency</div>
          )}
        </article>
        {electionStats && (
          <>
            {showLastElectionData && (
              <article className="relative z-10 space-y-1">
                <div className="text-xs">
                  {format(',')(electionStats?.majority)} winning margin in{' '}
                  {getYear(new Date(electionStats?.date))}
                </div>
                <div
                  className="rounded w-full h-4 bg-meepGray-200"
                  style={{
                    width: format('.0%')(
                      Math.min(
                        Math.max(electionStats?.majority / maxCount, 0.04),
                        1
                      )
                    ),
                  }}
                />
              </article>
            )}
            {showLastElectionData &&
              totalCount > 0.75 * electionStats.majority && (
                <div className="uppercase font-IBMPlexMono bg-meepGray-700 rounded flex flex-row items-center justify-center text-xs py-2 px-2 gap-1">
                  <AlertTriangle className="w-4 h-4" /> High impact constituency
                </div>
              )}
          </>
        )}
      </div>
    </section>
  )
}

export function Person({
  img,
  name,
  subtitle,
}: {
  img?: string
  name: string
  subtitle?: string
}) {
  return (
    <div className="flex flex-row items-center gap-2">
      {!!img && (
        <img
          src={new URL(img, BACKEND_URL).toString()}
          alt={name}
          width={41}
          height={41}
          className="rounded-full"
        />
      )}
      <div className="font-IBMPlexMono -space-y-1">
        <div>{name}</div>
        {!!subtitle && <div className="text-meepGray-400">{subtitle}</div>}
      </div>
    </div>
  )
}

export const ConstituencyElectionCard = ({
  name,
  firstParty2019,
  secondParty2019,
  mpName,
  mpImgUrl,
}: {
  name: string
  firstParty2019?: Partial<DeepNullable<Party>> | null
  secondParty2019?: Partial<DeepNullable<Party>> | null
  mpName?: string
  mpImgUrl?: string
}) => {
  return (
    <Card className="p-4 bg-meepGray-700 text-white">
      <CardHeader>
        <CardTitle className="font-PPRightGrotesk text-hLgPP mb-4 ">
          {name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex gap-6">
          {!!firstParty2019 && (
            <div className="flex flex-col gap-1">
              <p className="text-dataName font-IBMPlexSansCondensed uppercase text-meepGray-300">
                First in 2019
              </p>
              <div className="flex items-center gap-1">
                <div
                  className={`w-3 h-3 rounded-full`}
                  style={{
                    backgroundColor: firstParty2019.shade || 'gray',
                  }}
                ></div>
                <p className="text-dataResult font-IBMPlexMono">
                  {firstParty2019.name}
                </p>
              </div>
            </div>
          )}
          {!!firstParty2019 && !!secondParty2019 && (
            <div className="flex flex-col gap-1">
              <p className="text-dataName font-IBMPlexSansCondensed uppercase text-meepGray-300">
                Second in 2019
              </p>
              <div className="flex items-center gap-1">
                <div
                  className={`w-3 h-3 rounded-full`}
                  style={{
                    backgroundColor: secondParty2019.shade || 'gray',
                  }}
                ></div>
                <p className="text-dataResult font-IBMPlexMono">
                  {secondParty2019.name}
                </p>
              </div>
            </div>
          )}
        </div>
        {mpName && (
          <div className="flex flex-col gap-1">
            <p className="text-dataName font-IBMPlexSansCondensed uppercase text-meepGray-300 mb-2">
              Member of Parliment
            </p>
            <div className="flex items-center gap-1">
              {mpImgUrl && (
                <Image
                  className="rounded-full"
                  src={mpImgUrl}
                  width="50"
                  height="50"
                  alt=""
                />
              )}
              <div className="flex flex-col gap-1">
                <p className="text-dataResult font-IBMPlexMono">{mpName}</p>
                <p className="text-xs Name font-IBMPlexMono uppercase text-meepGray-400">
                  {firstParty2019?.name}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}

const CONSTITUENCY_DATA = gql`
  query GetConstituencyData(
    $analyticalAreaType: AnalyticalAreaType!
    $gss: String!
    $reportID: ID!
  ) {
    constituency: area(gss: $gss, analyticalAreaType: $analyticalAreaType) {
      id
      name
      mp: person(filters: { personType: "MP" }) {
        id
        name
        photo {
          url
        }
        party: personDatum(filters: { dataType_Name: "party" }) {
          name: data
          shade
        }
      }
      lastElection {
        stats {
          date
          electorate
          validVotes
          majority
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
    mapReport(pk: $reportID) {
      id
      importedDataCountForConstituency: importedDataCountForArea(
        analyticalAreaType: $analyticalAreaType
        gss: $gss
      ) {
        gss
        count
      }
      layers {
        id
        name
        source {
          id
          importedDataCountForConstituency: importedDataCountForArea(
            analyticalAreaType: $analyticalAreaType
            gss: $gss
          ) {
            gss
            count
          }
        }
      }
    }
  }
`
