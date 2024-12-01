import { Section } from '@/components/puck/config/components/Section'
import { ComponentConfig } from '@measured/puck'

export type HeadingProps = {
  align: 'left' | 'center' | 'right'
  text?: string
  level?: string
  size: string
  padding?: string
}

const sizeOptions = [
  { value: 'xxxl', label: 'XXXL' },
  { value: 'xxl', label: 'XXL' },
  { value: 'xl', label: 'XL' },
  { value: 'l', label: 'L' },
  { value: 'm', label: 'M' },
  { value: 's', label: 'S' },
  { value: 'xs', label: 'XS' },
]

const levelOptions = [
  { label: '', value: '' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
]

export const Heading: ComponentConfig<HeadingProps> = {
  fields: {
    text: { type: 'text' },
    size: {
      type: 'select',
      options: sizeOptions,
    },
    level: {
      type: 'select',
      options: levelOptions,
    },
    align: {
      type: 'radio',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
    },
    padding: { type: 'text' },
  },
  defaultProps: {
    align: 'left',
    text: 'Heading',
    padding: '24px',
    size: 'm',
  },
  render: ({ align, text, size, level, padding }) => {
    return (
      <Section padding={padding}>
        {/* TODO: size={size} rank={level as any} */}
        <div>
          <span style={{ display: 'block', textAlign: align, width: '100%' }}>
            {text}
          </span>
        </div>
      </Section>
    )
  },
}