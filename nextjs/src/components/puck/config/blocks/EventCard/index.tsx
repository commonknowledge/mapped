/* eslint-disable @next/next/no-img-element */
import { ComponentConfig } from '@measured/puck'

export type EventCardProps = {
  type: string
}

export const EventCard: ComponentConfig<EventCardProps> = {
  fields: {
    type: {
      type: 'select',
      options: [
        { label: 'Event 1', value: 'event1' },
        { label: 'Event 2', value: 'event2' },
        { label: 'Event 3', value: 'event3' },
      ],
    },
  },
  defaultProps: {
    type: 'resource',
  },
  render: ({ type }) => {
    return (
      <div className="p-5 w-full h-full overflow-clip rounded-[20px] flex flex-col gap-5 justify-between hover:shadow-hover transition-all">
        <h2 className="text-hub4xl tracking-tight">Test</h2>
      </div>
    )
  },
}
