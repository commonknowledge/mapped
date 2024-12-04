import { ComponentConfig } from '@measured/puck'
import IframeResizer from 'iframe-resizer-react'
import { twMerge } from 'tailwind-merge'

export type IframeProps = {
  url: string
  width?: string
  className?: string
}

export const Iframe: ComponentConfig<IframeProps> = {
  label: 'Iframe',
  fields: {
    url: {
      type: 'text',
    },
    width: {
      type: 'text',
    },
    className: {
      type: 'text',
    },
  },
  defaultProps: {
    url: 'https://google.com',
    width: '100%',
    className: '',
  },
  render: ({ url, width, className }) => {
    return (
      <IframeResizer
        className={twMerge('rounded-[20px] transition-all', className)}
        src={url}
        style={{ width: width || '100%' }}
      />
    )
  },
}
