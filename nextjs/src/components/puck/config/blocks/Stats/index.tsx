/* eslint-disable @next/next/no-img-element */
import { ComponentConfig } from '@measured/puck'
import dynamicIconImports from 'lucide-react/dynamicIconImports'
import dynamic from 'next/dynamic'

import { Section } from '@/components/puck/config/components/Section'

const icons = Object.keys(dynamicIconImports).reduce((acc, iconName) => {
  // @ts-ignore
  const El = dynamic(dynamicIconImports[iconName])

  return {
    ...acc,
    [iconName]: <El />,
  }
}, {})

const iconOptions = Object.keys(dynamicIconImports).map((iconName) => ({
  label: iconName,
  value: iconName,
}))

export type StatsProps = {
  items: {
    title: string
    description: string
  }[]
}

export const Stats: ComponentConfig<StatsProps> = {
  fields: {
    items: {
      type: 'array',
      getItemSummary: (item, i) => item.title || `Feature #${i}`,
      defaultItemProps: {
        title: 'Title',
        description: 'Description',
      },
      arrayFields: {
        title: { type: 'text' },
        description: { type: 'text' },
      },
    },
  },
  defaultProps: {
    items: [
      {
        title: 'Stat',
        description: '1,000',
      },
    ],
  },
  render: ({ items }) => {
    return (
      <Section maxWidth={'916px'}>
        <div>
          {items.map((item, i) => (
            <div key={i}>
              <div>{item.title}</div>
              <div>{item.description}</div>
            </div>
          ))}
        </div>
      </Section>
    )
  },
}
