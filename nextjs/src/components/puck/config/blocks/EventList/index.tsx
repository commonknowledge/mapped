/* eslint-disable @next/next/no-img-element */
import { gql, useQuery } from '@apollo/client'
import { ComponentConfig } from '@measured/puck'
import { compareAsc, formatDate, isBefore } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'

import ArrowTopRight from '@public/hub/arrow-top-right.svg'
import CirclePattern from '@public/hub/circle-pattern.svg'

import { FieldDefinition } from '@/__generated__/graphql'
import { makeFrontEndClient } from '@/components/ApolloWrapper'
import { LoadingIcon } from '@/components/ui/loadingIcon'

import { PuckText } from '../../components/PuckText'

export type EventListProps = {
  displayEventTitles: boolean
  displayEventDescriptions: boolean
  eventDataSource?: {
    name: string
    count: number
    id: string
    fieldDefinitions: FieldDefinition[]
  }
  noUpcomingEventsMessage: string
  customFilters: Array<{
    fieldToCheck: string
    comparison: string
    comparisonValue: string
  }>
}

const TypeBadge = ({ type }: { type: string }) => {
  return (
    <div>
      <div className=" uppercase inline-block text-hub-primary-700 bg-hub-primary-100 font-normal rounded-full py-1 px-3">
        {type}
      </div>
    </div>
  )
}

export const EventList: ComponentConfig<EventListProps> = {
  resolveFields(data, { fields }) {
    return {
      displayEventTitles: {
        type: 'radio',
        options: [
          { label: 'Show', value: true },
          { label: 'Hide', value: false },
        ],
      },
      displayEventDescriptions: {
        type: 'radio',
        options: [
          { label: 'Show', value: true },
          { label: 'Hide', value: false },
        ],
      },
      eventDataSource: {
        type: 'external',
        fetchList: async () => {
          // Get external data sources for user's org of type EVENT
          const client = makeFrontEndClient()
          const { data } = await client.query({
            query: gql`
              query GetEventSources {
                externalDataSources(filters: { dataType: EVENT }) {
                  name
                  id
                  eventCount: importedDataCount
                  # For custom filtering
                  fieldDefinitions {
                    label
                    value
                  }
                }
              }
            `,
          })
          return data.externalDataSources.map((source: any) => ({
            name: source.name,
            count: source.eventCount,
            id: source.id,
            fieldDefinitions: source.fieldDefinitions,
          }))
        },
      },
      noUpcomingEventsMessage: {
        type: 'text',
      },
      customFilters: {
        type: 'array',
        arrayFields: {
          fieldToCheck: {
            type: 'select',
            options:
              data.props.eventDataSource?.fieldDefinitions?.map(
                (f: FieldDefinition) => ({
                  label: f.label || f.value,
                  value: f.value,
                })
              ) || [],
          },
          comparison: {
            type: 'select',
            options: [
              { label: 'Equals', value: 'equal' },
              { label: "Doesn't Equal", value: 'notEqual' },
              { label: 'Contains', value: 'contains' },
              { label: "Doesn't Contain", value: 'notContains' },
              { label: 'Starts with', value: 'startsWith' },
              { label: "Doesn't Start with", value: 'notStartsWith' },
              { label: 'Ends with', value: 'endsWith' },
              { label: "Doesn't End with", value: 'notEndsWith' },
            ],
          },
          comparisonValue: {
            type: 'text',
          },
        },
      },
    }
  },
  defaultProps: {
    displayEventTitles: false,
    displayEventDescriptions: false,
    eventDataSource: undefined,
    noUpcomingEventsMessage: "There aren't any upcoming events",
    customFilters: [],
  },
  render: (props) => {
    return <RenderEventList {...props} />
  },
}

type EventData = {
  id: string
  title: string
  description: string
  startTime: string
  endTime?: string
  publicUrl: string
  json: Record<string, any>
}

function RenderEventList({
  eventDataSource,
  displayEventTitles,
  displayEventDescriptions,
  noUpcomingEventsMessage,
  customFilters,
}: EventListProps) {
  const eventData = useQuery<{ genericDataByExternalDataSource: EventData[] }>(
    gql`
      query GetEventList($sourceId: String!) {
        genericDataByExternalDataSource(externalDataSourceId: $sourceId) {
          id
          title
          description
          startTime
          endTime
          publicUrl
          json
        }
      }
    `,
    {
      variables: {
        sourceId: eventDataSource?.id,
      },
      skip: !eventDataSource,
    }
  )

  if (eventData.loading)
    return (
      <div className="py-4">
        <LoadingIcon />
      </div>
    )

  const events =
    eventData.data?.genericDataByExternalDataSource
      ?.filter((e) => {
        if (isBefore(new Date(e.startTime), new Date())) {
          return false
        }
        if (customFilters.length) {
          return customFilters.every(
            ({ fieldToCheck, comparison, comparisonValue }) => {
              const value = e.json[fieldToCheck]
              switch (comparison) {
                case 'equal':
                  return value === comparisonValue
                case 'notEqual':
                  return value !== comparisonValue
                case 'contains':
                  return value?.includes(comparisonValue)
                case 'notContains':
                  return !value?.includes(comparisonValue)
                case 'startsWith':
                  return value?.startsWith(comparisonValue)
                case 'notStartsWith':
                  return !value?.startsWith(comparisonValue)
                case 'endsWith':
                  return value?.endsWith(comparisonValue)
                case 'notEndsWith':
                  return !value?.endsWith(comparisonValue)
              }
            }
          )
        }
        return true
      })
      .sort((a, b) => {
        return compareAsc(new Date(a.startTime), new Date(b.startTime))
      }) || []

  if (!events.length)
    return (
      <div className="py-4">
        <PuckText text={noUpcomingEventsMessage} />
      </div>
    )

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          displayEventTitles={displayEventTitles}
          displayEventDescriptions={displayEventDescriptions}
        />
      ))}
    </section>
  )
}

function EventCard({
  event,
  displayEventTitles,
  displayEventDescriptions,
}: {
  event: EventData
  displayEventTitles: boolean
  displayEventDescriptions: boolean
}) {
  const content = (
    <div className="w-full h-full aspect-square overflow-clip rounded-[20px] flex flex-col gap-5 hover:shadow-hover transition-all">
      <div className="p-5 bg-hub-primary-600 text-white h-full relative flex flex-col gap-4 align-bottom">
        <Image
          src={ArrowTopRight}
          width={30}
          alt="arrow"
          className="relative z-10"
        />
        <h2 className="lg:text-hub2xl text-hubxl tracking-tight relative z-10">
          {displayEventTitles
            ? event.title
            : `${formatDate(new Date(event.startTime), 'eeee do MMMM, h:mmaaa')}${event.endTime ? `-${formatDate(new Date(event.endTime), 'h:mmaaa')}` : ''}`}
        </h2>
        {displayEventDescriptions && !!event.description && (
          <div className="text-white line-clamp-6 relative z-10">
            <PuckText text={event.description} />
          </div>
        )}
        <div className="mt-auto relative z-10">
          <TypeBadge type="EVENT" />
        </div>
        <Image
          className="object-cover rounded-[40px] absolute top-0 left-0"
          src={CirclePattern}
          width={500}
          alt="hero image"
        />
      </div>
    </div>
  )

  if (event.publicUrl) {
    return <Link href={event.publicUrl}>{content}</Link>
  }

  return content
}
