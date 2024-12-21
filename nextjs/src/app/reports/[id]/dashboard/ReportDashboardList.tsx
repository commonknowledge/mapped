import { ConstituencyStatsOverviewQuery } from '@/__generated__/graphql'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ChartCard'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import * as React from 'react'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'

const chartConfig = {
  browser: { label: 'Constituency', color: 'hsl(var(--chart-1))' },
}

export default function ReportDashboardList({
  constituencies,
}: {
  constituencies: ConstituencyStatsOverviewQuery['mapReport']['importedDataCountByConstituency']
}) {
  const chartData = React.useMemo(() => {
    if (!constituencies) return []

    // Sort constituencies by count and take top 5
    return constituencies
      .slice(0, 40)
      .map((constituency, index) => ({
        name: constituency.gssArea?.name || 'Unknown',
        count: constituency.count,
        fill: `hsl(var(--chart-${(index % 20) + 1}))`,
      }))
      .sort((a, b) => b.count - a.count) // Sort by count descending
  }, [constituencies])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Constituencies</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] overflow-y-auto">
        <ChartContainer config={chartConfig} className={`h-[1000px] w-full`}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            height={800}
            margin={{
              left: 10,
            }}
          >
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={120}
              style={{
                fill: 'white',
              }}
            />

            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              height={100}
            />
            <XAxis dataKey="count" type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="count" layout="vertical" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
