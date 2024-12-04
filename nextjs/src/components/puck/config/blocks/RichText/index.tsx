import { ComponentConfig } from '@measured/puck'
import dynamic from 'next/dynamic'

import './customRichTextStyles.css'

export type RichTextProps = {
  width: string
  content: string
}

const modules = {
  toolbar: [
    [{ size: ['small', 'medium', 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
}

const formats = [
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'link',
]

const ReactQuill = dynamic(() => import('./ReactQuill'), { ssr: false })

export const RichText: ComponentConfig<RichTextProps> = {
  label: 'RichText',
  fields: {
    width: {
      type: 'radio',
      options: [
        { label: 'Standard', value: 'standard' },
        { label: 'Full', value: 'full' },
      ],
    },
    content: {
      type: 'custom',
      render: ({ onChange, value }) => {
        return (
          <ReactQuill
            value={value}
            onChange={(e: string) => onChange(e)}
            modules={modules}
            formats={formats}
          />
        )
      },
    },
  },
  defaultProps: {
    width: 'standard',
    content: '',
  },
  render: ({ width, content }) => {
    return (
      <div
        className={`${width === 'standard' ? 'max-w-[50ch]' : ''} mb-4 text-meepGray-500`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  },
}
