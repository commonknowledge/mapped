import { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'https://api.mapped.commonknowledge.coop/graphql',
  documents: [
    'src/components/**/*.{ts,tsx}',
    'src/app/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    'src/lib/**/*.{ts,tsx}',
    'src/data/**/*.{ts,tsx}',
    'src/graphql/**/*.{ts,tsx}',
  ],
  generates: {
    './src/__generated__/': {
      preset: 'client',
      plugins: ['fragment-matcher'],
      presetConfig: {
        gqlTagName: 'gql',
        fragmentMasking: false,
      },
      config: {
        apolloClientVersion: 3,
        useExplicitTyping: true,
      },
    },
  },
  ignoreNoDocuments: true,
}

export default config
