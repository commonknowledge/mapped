import {
  AnalyticalAreaType,
  AreaExplorerSummaryQuery,
  AreaExplorerSummaryQueryVariables,
  AreaLayerDataQuery,
  AreaLayerDataQueryVariables,
  DataSourceType,
  InspectorDisplayType,
  MapLayer,
} from '@/__generated__/graphql'
import { DataSourceIcon } from '@/components/DataSourceIcon'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ExplorerAreaBreadCrumbMapping,
  ExplorerState,
  StarredState,
  useExplorerState,
  useLoadedMap,
} from '@/lib/map'
import { gql, useQuery } from '@apollo/client'
import { format } from 'd3-format'
import { sum } from 'lodash'
import { LucideLink, Star } from 'lucide-react'
import pluralize from 'pluralize'
import queryString from 'query-string'
import { Fragment, useEffect, useState } from 'react'
import { toast } from 'sonner'
import trigramSimilarity from 'trigram-similarity'
import CollapsibleSection from '../CollapsibleSection'
import { useReport } from '../ReportProvider'
import { PropertiesDisplay } from '../dashboard/PropertiesDisplay'
import { TableDisplay } from '../dashboard/TableDisplay'
export function AreaExplorer({ gss }: { gss: string }) {
  const [selectedTab, setSelectedTab] = useState('summary')

  // Query area details
  const areaData = useQuery<
    AreaExplorerSummaryQuery,
    AreaExplorerSummaryQueryVariables
  >(AREA_EXPLORER_SUMMARY, {
    variables: { gss },
    skip: !gss,
  })

  const mapbox = useLoadedMap()

  useEffect(() => {
    if (areaData.data?.area?.fitBounds) {
      mapbox.current?.fitBounds(areaData.data.area.fitBounds as any, {
        padding: 100,
      })
    }
  }, [gss, areaData.data, mapbox, mapbox.loaded, mapbox.current])

  const report = useReport()
  const isStarred = report.report.displayOptions.starred?.some(
    (item) => item.id === gss
  )
  const { addStarredItem, removeStarredItem } = report
  const starredItemData: StarredState = {
    id: gss || '',
    entity: 'area',
    showExplorer: true,
    name: areaData.data?.area?.name || '',
  }

  function toggleStarred() {
    if (isStarred) {
      removeStarredItem(starredItemData.id)
    } else {
      addStarredItem(starredItemData)
    }
  }

  return (
    <SidebarContent className="bg-meepGray-600 overflow-x-hidden h-full">
      <SidebarHeader className="!text-white p-4 mb-0">
        <>
          <AreaExplorerBreadcrumbs area={areaData.data?.area} />
          <div className="text-hMd flex flex-row gap-2 w-full items-center">
            {areaData.loading ? (
              <span className="text-meepGray-400">Loading...</span>
            ) : areaData.error || !areaData.data?.area ? (
              <span className="text-meepGray-400">???</span>
            ) : (
              <>
                <span className="mr-auto">{areaData.data?.area?.name}</span>
                <div className="flex flex-row gap-2 items-center">
                  <Star
                    onClick={toggleStarred}
                    className={`ml-auto text-meepGray-400 cursor-pointer ${
                      isStarred
                        ? 'fill-meepGray-400 hover:text-meepGray-200 hover:fill-meepGray-600'
                        : 'fill-transparent hover:text-white hover:fill-white'
                    }`}
                    size={16}
                  />
                  <LucideLink
                    onClick={copyAreaURL}
                    className="ml-auto text-meepGray-400 hover:text-meepGray-200 cursor-pointer"
                    size={16}
                  />
                </div>
              </>
            )}
          </div>
        </>
      </SidebarHeader>
      <Tabs
        defaultValue="summary"
        className="w-full"
        onValueChange={setSelectedTab}
        value={selectedTab}
      >
        <TabsList
          className="w-full justify-start text-white rounded-none px-4
        border border-b-meepGray-800 pt-4 pb-0 h-fit flex gap-4"
        >
          <TabsTrigger value="summary" className={classes.tabsTrigger}>
            Summary
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="summary"
          className="pb-24 divide-y divide-meepGray-800"
        >
          {report.report.layers?.map((layer) => (
            <div key={layer.id} className="my-4 px-4">
              <AreaLayerData
                layer={layer}
                gss={gss}
                areaName={areaData.data?.area?.name || ''}
              />
            </div>
          )) || (
            <div className="text-xl text-meepGray-400 text-center py-12 px-2">
              No summary data available
            </div>
          )}
        </TabsContent>
      </Tabs>
    </SidebarContent>
  )

  function copyAreaURL() {
    // clean URL
    const currentURL = window.location.href.split('?')[0]
    // add GSS code to URL
    const newURL = queryString.stringifyUrl({
      url: currentURL,
      query: {
        id: gss,
        entity: 'area',
        showExplorer: true,
      } satisfies ExplorerState,
    })
    // copy to clipboard
    navigator.clipboard.writeText(newURL)
    // alert the user
    toast.success('URL copied to clipboard')
  }
}

const classes = {
  tabsTrigger:
    'pb-2 bg-transparent px-0 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b border-white rounded-none',
}

const AREA_EXPLORER_SUMMARY = gql`
  query AreaExplorerSummary($gss: String!) {
    area(gss: $gss) {
      id
      fitBounds
      name
      areaType {
        name
        description
      }
      samplePostcode {
        parliamentaryConstituency2024
        adminWard
        adminDistrict
        europeanElectoralRegion
        codes {
          adminWard
          adminDistrict
          parliamentaryConstituency2024
        }
      }
    }
  }
`

function AreaLayerData({
  layer,
  gss,
  areaName,
}: {
  layer: MapLayer
  gss: string
  areaName: string
}) {
  const data = useQuery<AreaLayerDataQuery, AreaLayerDataQueryVariables>(
    AREA_LAYER_DATA,
    {
      variables: { gss, externalDataSource: layer?.source },
      skip: !layer?.source || !gss,
    }
  )

  return (
    <CollapsibleSection title={layer.name} id={layer.id}>
      {data.loading ? (
        <div className="text-meepGray-400">
          <LoadingIcon size={'32px'} />
        </div>
      ) : data.error || !data.data ? (
        <div className="text-xl text-meepGray-400 text-center py-12 px-2">
          No data available for this area
        </div>
      ) : (
        <div className="text-meepGray-400">
          {layer.inspectorType === InspectorDisplayType.Properties ? (
            <PropertiesDisplay
              data={
                // If we're looking at an area with no single data point, use the summary data
                (!data.data?.row || !Object.keys(data.data.row).length) &&
                data.data?.summary?.aggregated
                  ? data.data?.summary?.aggregated
                  : // Else we're looking at something that has a single data point
                    data.data?.row?.aggregated &&
                      Object.keys(data.data.row).length > 0 &&
                      data.data?.points?.length
                    ? // if we have point data, use this so we can display string values
                      data.data?.points[0].json
                    : // else use the summary data
                      data.data?.row?.aggregated ||
                      data.data?.summary?.aggregated
              }
              config={layer.inspectorConfig}
            />
          ) : layer.inspectorType === InspectorDisplayType.Table ? (
            <TableDisplay
              data={
                layer.sourceData.dataType === DataSourceType.AreaStats
                  ? [data.data?.summary?.aggregated]
                  : data.data?.points.map((p) => p.json)
              }
              config={layer.inspectorConfig}
              title={layer.name}
              areaName={areaName}
            />
          ) : layer.inspectorType === InspectorDisplayType.ElectionResult ? (
            <ElectionResultsDisplay
              data={data.data?.row || data.data?.summary}
              config={layer.inspectorConfig}
            />
          ) : layer.inspectorType === InspectorDisplayType.BigNumber ? (
            <BigNumberDisplay
              count={data.data?.points.length}
              dataType={layer.sourceData.dataType}
            />
          ) : (
            <ListDisplay
              data={data.data?.points}
              config={layer.inspectorConfig}
              dataType={layer.sourceData.dataType}
            />
          )}
        </div>
      )}
      <div className="text-meepGray-400 text-sm flex flex-row items-center gap-1">
        Source:{' '}
        <DataSourceIcon
          crmType={layer.sourceData.crmType}
          className="w-5 h-5"
        />{' '}
        {layer.sourceData.name}
      </div>
    </CollapsibleSection>
  )
}

const AREA_LAYER_DATA = gql`
  query AreaLayerData($gss: String!, $externalDataSource: String!) {
    # collect point data
    points: genericDataFromSourceAboutArea(
      gss: $gss
      sourceId: $externalDataSource
    ) {
      json
      id
      startTime
      postcode
      date
      description
      fullName
      lastName
      firstName
      title
      publicUrl
    }
    # rolled up area data up to this GSS code
    summary: genericDataSummaryFromSourceAboutArea(
      gss: $gss
      sourceId: $externalDataSource
      points: false
    ) {
      aggregated
      metadata {
        first
        second
        third
        last
        total
        count
        mean
        median
      }
    }
    # for specific pieces of data for this GSS code
    row: genericDataSummaryFromSourceAboutArea(
      gss: $gss
      sourceId: $externalDataSource
      rollup: false
      points: false
    ) {
      aggregated
      metadata {
        first
        second
        third
        last
        total
        count
        mean
        median
      }
    }
  }
`

function ElectionResultsDisplay({
  data,
  config,
}: {
  data: AreaLayerDataQuery['summary']
  config: {
    voteCountFields: string[]
  }
}) {
  if (!data?.aggregated) {
    return (
      <div className="text-xl text-meepGray-400 text-center py-12 px-2">
        No election data available
      </div>
    )
  }

  const total =
    data?.metadata.total || sum(Object.values(data?.aggregated || {})) || 0

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 my-4">
        {/* Total votes */}
        <div className="flex flex-col gap-1">
          <div className="text-xs uppercase text-meepGray-400">Majority</div>
          <div className="text-2xl text-white">
            {!!data?.metadata.first && !!data?.metadata.second
              ? format(',.0f')(data?.metadata.first - data?.metadata.second)
              : '???'}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-xs uppercase text-meepGray-400">Total votes</div>
          <div className="text-2xl text-white">
            {data?.metadata.total
              ? format(',.0f')(data?.metadata.total)
              : '???'}
          </div>
        </div>
      </div>
      <div>
        {Object.entries(data?.aggregated || {})
          .filter(([_, n]) => (n as number) >= 1)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .map(([party, votes]) => {
            const percent = format('.0%')((votes as number) / total)
            return (
              <div key={party} className="flex flex-col gap-2 my-2">
                {/* Bar with relative progress */}
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex flex-row justify-between items-center text-xs">
                    <div className="text-white">{party}</div>
                    <div className="flex flex-row gap-2 items-center">
                      <span>
                        {format(',.0f')(votes as number)}{' '}
                        {pluralize('vote', votes as number)}
                      </span>
                      <span className="text-white">{percent}</span>
                    </div>
                  </div>
                  <div className="flex flex-row gap-2 items-center">
                    <div
                      className="h-[15px] rounded"
                      style={{
                        width: percent,
                        backgroundColor: guessPartyColour(party),
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

function guessPartyColour(key: string) {
  // trigramSimilarity each party name to the keys in the map
  // return the colour of the most similar party
  const similarities = Object.keys(partyColourMap)
    .map((partyKey) => ({
      partyKey,
      // @ts-ignore
      similarity: key === partyKey ? 1 : trigramSimilarity(key, partyKey),
    }))
    .sort((a, b) => b.similarity - a.similarity)

  const guessedPartyKey = similarities[0].partyKey

  // @ts-ignore
  return partyColourMap[guessedPartyKey] || partyColourMap.Other
}

const partyColourMap = {
  Conservative: '#0087DC',
  Con: '#0087DC',
  Labour: '#DC241f',
  Lab: '#DC241f',
  LibDem: '#FAA61A',
  LDem: '#FAA61A',
  SNP: '#FFF95D',
  Green: '#6AB023',
  Grn: '#6AB023',
  'Plaid Cymru': '#008142',
  PC: '#008142',
  UKIP: '#70147A',
  Brexit: '#12B6CF',
  Independent: 'gray',
  Ind: 'gray',
  Reform: '#12B6CF',
  Ref: '#12B6CF',
  Other: 'gray',
  Oth: 'gray',
}

function BigNumberDisplay({
  count,
  dataType,
}: {
  count: number
  dataType: DataSourceType
}) {
  return (
    <div className="py-2">
      <div className="uppercase text-xs text-meepGray-400">
        {pluralize(dataType || 'record', 2)}
      </div>
      <div className="text-white text-3xl">{format(',')(count)}</div>
    </div>
  )
}

function ListDisplay({
  data,
  config,
  dataType,
}: {
  data: AreaLayerDataQuery['points']
  config: {
    columns: string[]
  }
  dataType: DataSourceType
}) {
  function getListValuesBasedOnDataType(item: any) {
    type ListValues = {
      primary: string[]
      secondary: string[]
    }

    switch (dataType) {
      case DataSourceType.Member:
        return {
          primary: [item.firstName || item.lastName || item.fullName],
          secondary: [item.postcode],
        } satisfies ListValues
      case DataSourceType.Event: {
        return {
          primary: [item.title],
          secondary: [item.startTime || item.date || item.postcode],
        } satisfies ListValues
      }
      case DataSourceType.Group: {
        return {
          primary: [item.name],
          secondary: [item.date],
        } satisfies ListValues
      }
      case DataSourceType.AreaStats: {
        return {
          primary: [item.name],
          secondary: [item.date],
        } satisfies ListValues
      }
      case DataSourceType.Location: {
        return {
          primary: [item.name],
          secondary: [item.date],
        } satisfies ListValues
      }
      case DataSourceType.Other: {
        return {
          primary: [item.name],
          secondary: [item.date],
        } satisfies ListValues
      }
      case DataSourceType.Story: {
        return {
          primary: [item.name],
          secondary: [item.date],
        } satisfies ListValues
      }
    }
  }

  const [explorerState, setExplorerState] = useExplorerState()

  return (
    <div className="bg-meepGray-700 rounded-md max-h-[30vh] overflow-y-auto">
      {data?.map((item: any) => {
        const { primary, secondary } = getListValuesBasedOnDataType(item)
        const isActive =
          explorerState.entity === 'record' && explorerState.id === item.id

        return (
          <div
            key={item.id}
            className={`text-meepGray-200 justify-between flex font-mono text-sm hover:bg-meepGray-800 p-2 cursor-pointer border-b border-meepGray-800 ${
              isActive ? 'bg-white text-meepGray-800 hover:bg-white' : ''
            }`}
            onClick={() => {
              setExplorerState({
                entity: 'record',
                id: item.id,
                showExplorer: true,
              })
            }}
          >
            <div className="flex flex-col gap-1">{primary}</div>
            <div className="flex flex-col gap-1 text-meepGray-400">
              {secondary}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AreaExplorerBreadcrumbs({
  area,
}: {
  area: AreaExplorerSummaryQuery['area']
}) {
  const [explorerState, setExplorerState] = useExplorerState()

  const { updateReport } = useReport()

  const {
    europeanElectoralRegion,
    parliamentaryConstituency2024,
    adminDistrict,
    adminWard,
    codes,
  } = area?.samplePostcode || {}

  const selectedAreaType = area?.areaType?.name

  const ExplorerAreaBreadCrumbMapping: Record<
    string,
    ExplorerAreaBreadCrumbMapping
  > = {
    europeanElectoralRegion: {
      value: europeanElectoralRegion,
      code: undefined,
      type: AnalyticalAreaType.EuropeanElectoralRegion,
    },
    adminDistrict: {
      value: adminDistrict,
      code: codes?.adminDistrict,
      type: AnalyticalAreaType.AdminDistrict,
    },
    parliamentaryConstituency2024: {
      value: parliamentaryConstituency2024,
      code: codes?.parliamentaryConstituency2024,
      type: AnalyticalAreaType.ParliamentaryConstituency_2024,
    },
  }

  // Define breadcrumb hierarchies for different area types
  const breadcrumbConfigs = {
    'Single Tier Councils': [
      ExplorerAreaBreadCrumbMapping.europeanElectoralRegion,
    ],
    '2023 Parliamentary Constituency': [
      ExplorerAreaBreadCrumbMapping.europeanElectoralRegion,
      ExplorerAreaBreadCrumbMapping.adminDistrict,
    ],
    Wards: [
      ExplorerAreaBreadCrumbMapping.europeanElectoralRegion,
      ExplorerAreaBreadCrumbMapping.adminDistrict,
      ExplorerAreaBreadCrumbMapping.parliamentaryConstituency2024,
    ],
  }

  const activeBreadcrumbs =
    breadcrumbConfigs[selectedAreaType as keyof typeof breadcrumbConfigs] || []

  function handleBreadcrumbClick(crumb: {
    value: any
    code: string
    type: AnalyticalAreaType
  }) {
    setExplorerState({
      id: crumb.code,
      entity: 'area',
      showExplorer: true,
    })

    updateReport((draft) => {
      draft.displayOptions.dataVisualisation.boundaryType = crumb.type
    })
  }

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex gap-2 text-meepGray-400 overflow-x-auto whitespace-nowrap max-w-[320px] no-scrollbar">
        <div className="flex gap-2 items-center">
          {activeBreadcrumbs.map((crumb, index) => (
            <Fragment key={index}>
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="max-w-28 truncate cursor-pointer"
                  onClick={() =>
                    handleBreadcrumbClick({
                      value: crumb.value,
                      code: crumb.code || '',
                      type: crumb.type,
                    })
                  }
                >
                  {crumb.value}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </Fragment>
          ))}
          <div className="text-xs labels-condensed text-meepGray-200 uppercase">
            {selectedAreaType ? pluralize(selectedAreaType, 1) : 'Area'}
          </div>
        </div>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
