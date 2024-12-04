'use client'

import { FetchResult, gql, useApolloClient } from '@apollo/client'
import { useAtomValue } from 'jotai'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import {
  CreateMapReportMutation,
  CreateMapReportMutationVariables,
} from '@/__generated__/graphql'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { currentOrganisationIdAtom } from '@/lib/organisation'
import { triggerAnalyticsEvent } from '@/lib/posthogutils'

export function CreateReportCard() {
  const client = useApolloClient()
  const router = useRouter()
  const currentOrganisationId = useAtomValue(currentOrganisationIdAtom)

  return (
    <Card>
      <CardContent className="p-6 relative space-y-5 h-full">
        <Skeleton className="h-4 w-full max-w-[100px]" />
        <Skeleton className="h-10 w-full" />
        <div className="!m-0 absolute inset-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <Button onClick={create} variant="reverse">
            Create new report
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  function create() {
    toast.promise(
      client.mutate<CreateMapReportMutation, CreateMapReportMutationVariables>({
        mutation: CREATE_MAP_REPORT,
        variables: {
          data: {
            name: new Date().toISOString(),
            organisation: { set: currentOrganisationId },
          },
        },
      }),
      {
        loading: 'Creating report...',
        success: (d: FetchResult<CreateMapReportMutation>) => {
          if (
            !d.errors &&
            d.data?.createMapReport?.__typename === 'MapReport'
          ) {
            router.push(`/reports/${d.data.createMapReport.id}`)
            triggerAnalyticsEvent('Map report created succesfully', {})
            return 'Report created!'
          } else if (d.data?.createMapReport?.__typename === 'OperationInfo') {
            toast.error('Failed to create report', {
              description: d.data.createMapReport.messages
                .map((m) => m.message)
                .join(', '),
            })
            triggerAnalyticsEvent('Map report creation failed', {
              errorMessages: d.data.createMapReport.messages
                .map((m) => m.message)
                .join(', '),
            })
          } else {
            toast.error('Failed to create report', {
              description: d.errors?.map((e) => e.message).join(', '),
            })
            triggerAnalyticsEvent('Report creation failed', {
              errorMessages: d.errors?.map((e) => e.message).join(', '),
            })
          }
        },
        error: 'Failed to create report',
      }
    )
  }
}

const CREATE_MAP_REPORT = gql`
  mutation CreateMapReport($data: MapReportInput!) {
    createMapReport(data: $data) {
      ... on MapReport {
        id
      }
      ... on OperationInfo {
        messages {
          message
        }
      }
    }
  }
`
