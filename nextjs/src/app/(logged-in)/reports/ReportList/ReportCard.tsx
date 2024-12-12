'use client'

import { formatRelative } from 'date-fns'
import Link from 'next/link'

import { ListReportsQuery } from '@/__generated__/graphql'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Map } from 'lucide-react'

export function ReportCard({
  report,
}: {
  report: ListReportsQuery['reports'][0]
}) {
  return (
    <Link href={`/reports/${report.id}`}>
      <Card className="hover:bg-meepGray-700 transition-colors duration-200">
        <CardHeader className="p-4">
          <CardContent>
            <Map className="w-4 text-brandBlue" />
          </CardContent>
          <CardTitle className="mb-1">{report.name}</CardTitle>
        </CardHeader>
        <CardDescription className="text-sm text-meepGray-400 px-5 pb-5">
          Last edited{' '}
          <span className="text-meepGray-300">
            {formatRelative(report.lastUpdate, new Date())}
          </span>
        </CardDescription>
      </Card>
    </Link>
  )
}
