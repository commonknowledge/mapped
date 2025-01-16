import {
  RecordExplorerSummaryQuery,
  RecordExplorerSummaryQueryVariables,
} from '@/__generated__/graphql'
import { DataSourceIcon } from '@/components/DataSourceIcon'
import { Button } from '@/components/ui/button'
import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { dataTypeIcons } from '@/lib/data'
import {
  ExplorerState,
  StarredState,
  useExplorerState,
  useLoadedMap,
} from '@/lib/map'
import { gql, useQuery } from '@apollo/client'
import { LucideLink, Star } from 'lucide-react'
import pluralize from 'pluralize'
import queryString from 'query-string'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useReport } from '../ReportProvider'
import { PropertiesDisplay } from '../dashboard/PropertiesDisplay'
import { AreaExplorer } from './AreaExplorer'
import { exploreArea } from './utils'

export function RecordExplorer({ id }: { id: string }) {
  const [explorerState, setExplorerState] = useExplorerState()

  const [selectedTab, setSelectedTab] = useState('summary')

  // Query area details
  const data = useQuery<
    RecordExplorerSummaryQuery,
    RecordExplorerSummaryQueryVariables
  >(RECORD_EXPLORER_SUMMARY, {
    variables: { id: String(id) },
    skip: !id,
  })

  const record = data.data?.import?.record

  const mapbox = useLoadedMap()

  useEffect(() => {
    if (data.data?.import?.geometry) {
      mapbox.current?.flyTo({
        center: data.data.import.geometry.coordinates as [number, number],
        zoom: 14,
      })
      console.log('Fly to')
    }
  }, [data, mapbox])

  const contactOptions = [
    {
      value: record?.phone,
      url: `tel:${record?.phone}`,
      label: 'Copy phone number',
      onClick: () => {
        navigator.clipboard.writeText(record?.phone!)
        toast.success('Phone number copied to clipboard')
      },
    },
    {
      value: record?.email,
      url: `mailto:${record?.email}`,
      label: 'Copy email address',
      onClick: () => {
        navigator.clipboard.writeText(record?.email!)
        toast.success('Email address copied to clipboard')
      },
    },
    {
      value: record?.remoteUrl,
      url: record?.remoteUrl,
      label: (
        <>
          <DataSourceIcon
            crmType={record?.dataType.dataSet.externalDataSource.crmType}
          />{' '}
          Open profile in {record?.dataType.dataSet.externalDataSource.crmType}
        </>
      ),
      onClick: () => {
        window.open(record?.remoteUrl, '_blank')
      },
    },
  ].filter((d) => !!d.value)

  const report = useReport()
  const isStarred = report.report.displayOptions.starred?.some(
    (item) => item.id === record?.id
  )
  const { addStarredItem, removeStarredItem } = report
  const starredItemData: StarredState = {
    id: record?.id || '',
    entity: 'record',
    showExplorer: true,
    name:
      record?.title ||
      record?.fullName ||
      `${record?.firstName} ${record?.lastName}`,
    icon: record?.dataType.dataSet.externalDataSource.dataType,
  }

  function toggleStarred() {
    if (isStarred) {
      removeStarredItem(starredItemData.id)
    } else {
      addStarredItem(starredItemData)
    }
  }

  const dataType = record?.dataType.dataSet.externalDataSource.dataType
  const IconComponent = dataType ? dataTypeIcons[dataType]?.icon : null

  return (
    <div className="flex gap-2">
      <SidebarContent className="bg-meepGray-800 overflow-x-hidden absolute w-[360px] -left-[360px] top-0 h-full">
        <SidebarHeader className="!text-white p-4 mb-0">
          <>
            <div className="text-xs labels-condensed text-meepGray-400 uppercase flex flex-row gap-2 items-center">
              {IconComponent && (
                <IconComponent className="w-4 h-4 text-meepGray-400" />
              )}
              {record?.dataType.dataSet.externalDataSource.dataType
                ? pluralize(
                    record?.dataType.dataSet.externalDataSource.dataType,
                    1
                  )
                : 'Record'}
            </div>
            <div className="text-hMd flex flex-row gap-2 w-full items-center">
              {data.loading ? (
                <span className="text-meepGray-400">Loading...</span>
              ) : data.error || !record ? (
                <span className="text-meepGray-400">???</span>
              ) : (
                <div className="w-full">
                  <div className="flex flex-row gap-2 w-full items-center">
                    <span className="mr-auto">
                      {record.title ||
                        record.fullName ||
                        `${record.firstName} ${record.lastName}`}
                    </span>
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
                        onClick={copyUrl}
                        className="ml-auto text-meepGray-400 hover:text-meepGray-200 cursor-pointer"
                        size={16}
                      />
                    </div>
                  </div>
                  {record.postcodeData && (
                    <div className="mt-2 text-base text-meepGray-400">
                      in{' '}
                      <span className="text-meepGray-300">
                        <span
                          className="cursor-pointer hover:underline"
                          onClick={() =>
                            exploreArea(record.postcodeData?.codes.adminWard!)
                          }
                        >
                          {record.postcodeData.adminWard}
                        </span>
                        ,{' '}
                        <span
                          className="cursor-pointer hover:underline"
                          onClick={() =>
                            exploreArea(
                              record.postcodeData?.codes.adminDistrict!
                            )
                          }
                        >
                          {record.postcodeData.adminDistrict}
                        </span>
                        ,{' '}
                        <span>
                          {record.postcodeData.europeanElectoralRegion}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
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
        border-b border-b-meepGray-600 pt-4 pb-0 h-fit flex gap-4 bg-meepGray-800"
          >
            <TabsTrigger
              value="summary"
              className={`${classes.tabsTrigger} bg-meepGray-800`}
            >
              Summary
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="summary"
            className="pb-24 divide-y divide-meepGray-800"
          >
            {/* Contact deets */}
            {!!contactOptions.length && (
              <section className="flex flex-col gap-2 px-4 py-4">
                <div className="text-hSm text-white">Contact</div>
                <div className="flex flex-col gap-2">
                  {contactOptions.map((contact, i) => (
                    <Button
                      key={i}
                      onClick={contact.onClick}
                      className="text-white"
                    >
                      {contact.label}
                    </Button>
                  ))}
                </div>
              </section>
            )}

            {/* Raw data */}
            <section className="flex flex-col gap-2 px-4 py-4">
              <div className="text-hSm text-white">Info</div>
              <div className="flex flex-col gap-2">
                <PropertiesDisplay data={record?.json} />
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </SidebarContent>
      <AreaExplorer gss={record?.postcodeData?.codes.adminWard!} />
    </div>
  )

  function copyUrl() {
    // clean URL
    const currentURL = window.location.href.split('?')[0]
    // add GSS code to URL
    const newURL = queryString.stringifyUrl({
      url: currentURL,
      query: {
        id,
        entity: 'record',
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

const RECORD_EXPLORER_SUMMARY = gql`
  query RecordExplorerSummary($id: String!) {
    import: importedDataGeojsonPoint(genericDataId: $id) {
      id
      geometry {
        type
        coordinates
      }
      record: properties {
        id
        dataType {
          id
          name
          dataSet {
            id
            externalDataSource {
              id
              name
              organisation {
                id
                name
              }
              crmType
              dataType
            }
          }
        }
        postcode
        postcodeData {
          adminWard
          adminDistrict
          europeanElectoralRegion
          codes {
            adminWard
            adminDistrict
          }
        }
        title
        firstName
        lastName
        fullName
        email
        phone
        startTime
        endTime
        publicUrl
        address
        description
        json
        remoteUrl
      }
    }
  }
`
