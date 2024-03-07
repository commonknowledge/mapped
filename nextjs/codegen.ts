import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "http://localhost:8000/graphql",
  documents: ["src/components/**/*.{ts,tsx}", "src/app/**/*.{ts,tsx}"],
  generates: {
    "./src/__generated__/": {
      preset: "client",
      plugins: ["fragment-matcher"],
      presetConfig: {
        gqlTagName: "gql",
      },
      config: {
        apolloClientVersion: 3,
        useExplicitTyping: true,
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
