import { ApolloClient, FetchResult, gql } from '@apollo/client'

import {
  ImportDataMutation,
  ImportDataMutationVariables,
} from '@/__generated__/graphql'
import { toastPromise } from '@/lib/toast'

export default function importData(
  client: ApolloClient<any>,
  externalDataSourceId: string
) {
  const importJob = client.mutate<
    ImportDataMutation,
    ImportDataMutationVariables
  >({
    mutation: gql`
      mutation ImportData($id: String!) {
        importAll(externalDataSourceId: $id) {
          id
          externalDataSource {
            importedDataCount
            isImportScheduled
            importProgress {
              status
              hasForecast
              id
              total
              succeeded
              failed
              estimatedFinishTime
            }
          }
        }
      }
    `,
    variables: {
      id: externalDataSourceId,
    },
  })
  toastPromise(importJob, {
    loading: 'Scheduling data import...',
    success: (d: FetchResult) => {
      if (!d.errors) {
        return {
          title: 'Import is processing',
          description:
            'This may take a few minutes. You can check the logs for progress.',
        }
      } else {
        throw new Error("Couldn't schedule data import")
      }
    },
    error: `Couldn't schedule data import`,
  })
}
