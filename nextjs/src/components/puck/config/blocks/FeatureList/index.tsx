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

export type FeatureListProps = {
  items: {
    title: string
    description: string
    icon?: 'feather'
  }[]
  mode: 'flat' | 'card'
}

export const FeatureList: ComponentConfig<FeatureListProps> = {
  fields: {
    items: {
      type: 'array',
      getItemSummary: (item, i) => item.title || `Feature #${i}`,
      defaultItemProps: {
        title: 'Title',
        description: 'Description',
        icon: 'feather',
      },
      arrayFields: {
        title: { type: 'text' },
        description: { type: 'textarea' },
        icon: {
          type: 'select',
          options: iconOptions,
        },
      },
    },
    mode: {
      type: 'radio',
      options: [
        { label: 'flat', value: 'flat' },
        { label: 'card', value: 'card' },
      ],
    },
  },
  defaultProps: {
    items: [
      {
        title: 'Feature',
        description: 'Description',
        icon: 'feather',
      },
    ],
    mode: 'flat',
  },
  render: ({ items, mode }) => {
    return (
      <Section>
        <div>
          {items.map((item, i) => (
            <div key={i}>
              {/* @ts-ignore */}
              <div>{icons[item.icon]}</div>
              <div>{item.title}</div>
              <div>{item.description}</div>
            </div>
          ))}
        </div>
      </Section>
    )
  },
}
