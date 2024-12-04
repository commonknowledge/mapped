import { ComponentConfig, FieldLabel } from '@measured/puck'
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/themes/prism.css'
//Example style, you can use another
import Editor from 'react-simple-code-editor'

export type HTMLEmbedProps = {
  code: string
}

export const HTMLEmbed: ComponentConfig<HTMLEmbedProps> = {
  label: 'HTMLEmbed',
  fields: {
    code: {
      type: 'custom',
      render: ({ name, onChange, value }) => (
        <FieldLabel label="HTML code">
          <Editor
            value={value}
            onValueChange={(code) => onChange(code)}
            highlight={(code) =>
              highlight(
                code || '<!-- code goes here -->',
                languages.html,
                'HTML'
              )
            }
            padding={10}
            style={{
              fontFamily: '"Fira code", "Fira Mono", monospace',
              fontSize: 12,
            }}
          />
        </FieldLabel>
      ),
    },
  },
  render: ({ code }) => {
    return <div dangerouslySetInnerHTML={{ __html: code }} />
  },
}
