'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function PlaceholderReportCard() {
  return (
    <Card className="rounded-xl border border-meepGray-700 px-6 py-5 space-y-3">
      <Skeleton className="h-4 w-full max-w-[100px]" />
      <Skeleton className="h-10 w-full" />
    </Card>
  )
}
