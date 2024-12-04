/* eslint-disable @next/next/no-img-element */
import { ComponentConfig } from '@measured/puck'

import { Section } from '@/components/puck/config/components/Section'

export type LogosProps = {
  logos: {
    alt: string
    imageUrl: string
  }[]
}

export const Logos: ComponentConfig<LogosProps> = {
  fields: {
    logos: {
      type: 'array',
      getItemSummary: (item, i) => item.alt || `Feature #${i}`,
      defaultItemProps: {
        alt: '',
        imageUrl: '',
      },
      arrayFields: {
        alt: { type: 'text' },
        imageUrl: { type: 'text' },
      },
    },
  },
  defaultProps: {
    logos: [
      {
        alt: 'google',
        imageUrl:
          'https://logolook.net/wp-content/uploads/2021/06/Google-Logo.png',
      },
      {
        alt: 'google',
        imageUrl:
          'https://logolook.net/wp-content/uploads/2021/06/Google-Logo.png',
      },
      {
        alt: 'google',
        imageUrl:
          'https://logolook.net/wp-content/uploads/2021/06/Google-Logo.png',
      },
      {
        alt: 'google',
        imageUrl:
          'https://logolook.net/wp-content/uploads/2021/06/Google-Logo.png',
      },
      {
        alt: 'google',
        imageUrl:
          'https://logolook.net/wp-content/uploads/2021/06/Google-Logo.png',
      },
    ],
  },
  render: ({ logos }) => {
    return (
      <Section>
        <div>
          {logos.map((item, i) => (
            <div key={i}>
              <img alt={item.alt} src={item.imageUrl} height={64}></img>
            </div>
          ))}
        </div>
      </Section>
    )
  },
}
