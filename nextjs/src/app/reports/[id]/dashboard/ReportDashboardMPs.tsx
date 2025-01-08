import { ConstituencyStatsOverviewQuery } from '@/__generated__/graphql'
import { Person } from '@/app/reports/[id]/(components)/reportsConstituencyItem'
import {
  Card,
  CardContent,
  CardDescription,
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
        <CardDescription>Showing the top 5 MPs by constituency</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {constituencies?.map(
            (constituency, index) =>
              index < 5 && (
                <div key={constituency.gss}>
                  <Person
                    name={constituency.gssArea?.mp?.name ?? ''}
                    subtitle={constituency.gssArea?.mp?.party?.name ?? ''}
                    img={constituency.gssArea?.mp?.photo?.url ?? ''}
                  />
                  <p className="text-sm opacity-80 rounded-md">
                    ({constituency.gssArea?.name})
                  </p>
                </div>
              )
          )}
        </div>
      </CardContent>
    </Card>
  )
}
