import { ComponentConfig } from '@measured/puck'

export type ImageProps = {
  url: string
  width?: string
  height?: string
}

export const Image: ComponentConfig<ImageProps> = {
  label: 'Image',
  fields: {
    url: {
      type: 'text',
    },
    width: {
      type: 'text',
    },
    height: {
      type: 'text',
    },
  },
  render: ({ url, width, height }) => {
    return (
      <img
        className="object-fill w-full"
        style={{
          width: width,
          height: height,
        }}
        src={url}
      />
    )
  },
}
