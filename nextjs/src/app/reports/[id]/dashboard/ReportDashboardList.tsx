import { ConstituencyStatsOverviewQuery } from '@/__generated__/graphql'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ChartCard'

export default function ReportDashboardList({
  constituencies,
}: {
  constituencies: ConstituencyStatsOverviewQuery['mapReport']['importedDataCountByConstituency']
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Constituencies</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto">
        <div className="grid gap-4">
          {constituencies?.map((constituency) => (
            <div
              key={constituency.gss}
              className="flex justify-between items-center p-2 bg-meepGray-700 rounded"
            >
              <span>{constituency.gssArea?.name}</span>
              <span>{constituency.count} members</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
