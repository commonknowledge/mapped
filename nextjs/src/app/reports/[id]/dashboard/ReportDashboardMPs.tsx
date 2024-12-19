import { ConstituencyStatsOverviewQuery } from '@/__generated__/graphql'
import { Person } from '@/app/reports/[id]/(components)/reportsConstituencyItem'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ChartCard'
export default function ReportDashboardMPs({
  constituencies,
}: {
  constituencies: ConstituencyStatsOverviewQuery['mapReport']['importedDataCountByConstituency']
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Key MPs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {constituencies?.map((constituency) => (
            <Person
              key={constituency.gss}
              name={constituency.gssArea?.mp?.name ?? ''}
              subtitle={constituency.gssArea?.mp?.party?.name ?? ''}
              img={constituency.gssArea?.mp?.photo?.url ?? ''}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
