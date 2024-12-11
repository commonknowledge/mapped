import { ErrorBoundary } from '@sentry/nextjs'
import { format } from 'd3-format'
import { formatRelative } from 'date-fns'
import { MessageCircleHeart, MessageCircleWarning } from 'lucide-react'

import {
  BatchJobProgress,
  ProcrastinateJobStatus,
} from '@/__generated__/graphql'
import { Progress } from '@/components/ui/progress'

import { LoadingIcon } from './ui/loadingIcon'

export function BatchJobProgressReport({
  batchJobProgress,
  pastTenseVerb = 'Completed',
}: {
  pastTenseVerb: string
  batchJobProgress?: Pick<
    BatchJobProgress,
    | 'status'
    | 'total'
    | 'succeeded'
    | 'estimatedFinishTime'
    | 'hasForecast'
    | 'actualFinishTime'
  > | null
}) {
  if (!batchJobProgress) {
    return
  }
  if (batchJobProgress.actualFinishTime) {
    const secondsSinceActualFinishTime =
      new Date().getTime() -
      new Date(batchJobProgress.actualFinishTime).getTime()
    if (secondsSinceActualFinishTime > 30000) {
      return
    }
  }
  return (
    <ErrorBoundary>
      {batchJobProgress.status === ProcrastinateJobStatus.Succeeded ? (
        <div className="flex flex-row gap-2 items-center">
          <MessageCircleHeart />
          <div className="text-meepGray-300 text-sm">{pastTenseVerb}</div>
        </div>
      ) : batchJobProgress.status === ProcrastinateJobStatus.Failed ? (
        <div className="flex flex-row gap-2 items-center">
          <MessageCircleWarning />
          <div className="text-meepGray-300 text-sm">Job failed</div>
        </div>
      ) : batchJobProgress.status === ProcrastinateJobStatus.Todo ? (
        <div className="flex flex-row gap-2 items-center">
          <LoadingIcon size="15" />
          <div className="text-meepGray-300 text-sm">
            Waiting in the job queue
          </div>
        </div>
      ) : batchJobProgress.hasForecast &&
        batchJobProgress.succeeded !== null &&
        batchJobProgress.succeeded !== undefined ? (
        // Progress bar
        <>
          <Progress
            value={batchJobProgress.succeeded ?? 0}
            max={batchJobProgress.total ?? 0}
          />
          <div className="text-meepGray-300 text-sm">
            Completed{' '}
            <span className="text-meepGray-100">
              {format(',')(batchJobProgress.succeeded)}
            </span>{' '}
            of{' '}
            <span className="text-meepGray-100">
              {batchJobProgress.total !== null &&
              batchJobProgress.total !== undefined
                ? format(',')(batchJobProgress.total)
                : 0}
            </span>
            . Estimated done{' '}
            <span className="text-meepGray-100">
              {formatRelative(batchJobProgress.estimatedFinishTime, new Date())}
            </span>
          </div>
        </>
      ) : (
        // Progress spinner
        <div className="flex flex-row gap-2 items-center justify-center">
          <LoadingIcon size="15" />
          <div className="text-meepGray-300 text-sm">In progress</div>
        </div>
      )}
    </ErrorBoundary>
  )
}
