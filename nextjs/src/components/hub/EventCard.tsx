import { formatDate, formatRelative, isAfter } from 'date-fns'
import { Ticket } from 'lucide-react'
import { useMemo } from 'react'

import { GetLocalDataQuery } from '@/__generated__/graphql'

import { useHubRenderContext } from './HubRenderContext'

export function EventCard({
  event,
}: {
  event: NonNullable<
    GetLocalDataQuery['postcodeSearch']['constituency']
  >['genericDataForHub'][number]
}) {
  const isFuture = useMemo(
    () => isAfter(new Date(event.startTime), new Date()),
    [event.startTime]
  )
  const ctx = useHubRenderContext()
  // The timezone must be removed, because it is not correct
  // (it is always UTC, so ends with Z or +00:00, but it is typically in Europe/London time)
  const startTimeWithoutTimezone = event.startTime
    ?.split('+')[0]
    .replace('Z', '')

  return (
    <article className="border-2 border-meepGray-200 rounded-md overflow-hidden p-4 flex flex-col gap-2">
      <header>
        <div className="text-meepGray-500">
          {formatRelative(new Date(startTimeWithoutTimezone), new Date())}
        </div>
        <h3 className="font-bold text-lg">{event.title}</h3>
      </header>
      <main className="space-y-3">
        <section>
          <div className="text-meepGray-500 text-sm">Date/Time</div>
          <div>{formatDate(startTimeWithoutTimezone, 'EE do MMM HH:mm')}</div>
        </section>
        <section>
          <div className="text-meepGray-500 text-sm">Address</div>
          <div>
            {event.address} {event.postcode}
          </div>
        </section>
        {!!event.description && (
          <section>
            <div className="text-meepGray-500 text-sm">Description</div>
            <div className="space-y-1">
              {event.description
                ?.split('\n')
                .filter(Boolean)
                .map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>
          </section>
        )}
        {event.publicUrl && (
          <a
            href={event.publicUrl}
            target={ctx.isMultitenancyMode ? '_blank' : '_top'}
            className="bg-hub-primary-200 text-hub-primary-900 px-3 py-2 text-center w-full rounded-md flex flex-row items-center justify-center gap-2"
          >
            {isFuture && <Ticket />} More info{' '}
            {isFuture && <span>&amp; register</span>}
          </a>
        )}
      </main>
    </article>
  )
}
