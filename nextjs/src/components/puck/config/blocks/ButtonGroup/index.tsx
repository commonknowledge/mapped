/* eslint-disable @next/next/no-img-element */
import { ComponentConfig } from '@measured/puck'

import { Section } from '@/components/puck/config/components/Section'
import { Button } from '@/components/ui/button'

export type ButtonGroupProps = {
  align?: string
  buttons: { label: string; href: string; variant: 'default' | 'secondary' }[]
}

export const ButtonGroup: ComponentConfig<ButtonGroupProps> = {
  label: 'Button Group',
  fields: {
    buttons: {
      type: 'array',
      getItemSummary: (item) => item.label || 'Button',
      arrayFields: {
        label: { type: 'text' },
        href: { type: 'text' },
        variant: {
          type: 'radio',
          options: [
            { label: 'primary', value: 'default' },
            { label: 'secondary', value: 'secondary' },
          ],
        },
      },
      defaultItemProps: {
        label: 'Button',
        href: '#',
        variant: 'default',
      },
    },
    align: {
      type: 'radio',
      options: [
        { label: 'left', value: 'left' },
        { label: 'center', value: 'center' },
      ],
    },
  },
  defaultProps: {
    buttons: [{ label: 'Learn more', href: '#', variant: 'default' }],
  },
  render: ({ align, buttons }) => {
    return (
      <Section>
        <div>
          {buttons.map((button, i) => (
            <Button
              key={i}
              // TODO:
              // href={button.href}
              variant={button.variant}
              size="lg"
            >
              {button.label}
            </Button>
          ))}
        </div>
      </Section>
    )
  },
}
