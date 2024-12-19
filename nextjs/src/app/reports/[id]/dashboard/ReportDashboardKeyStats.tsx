'use client'
import { ConstituencyStatsOverviewQuery } from '@/__generated__/graphql'
import * as React from 'react'
import { Label, Pie, PieChart } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ChartCard'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

export default function ReportDashboardKeyStats({
  constituencies,
}: {
  constituencies: ConstituencyStatsOverviewQuery['mapReport']['importedDataCountByConstituency']
}) {
  const chartData = React.useMemo(() => {
    if (!constituencies) return []

    // Create a map to store totals by data source
    const sourceTotals = new Map<string, number>()

    constituencies.forEach((constituency) => {
      const source = constituency.gssArea?.name || 'Unknown'
      const currentTotal = sourceTotals.get(source) || 0
      sourceTotals.set(source, currentTotal + constituency.count)
    })

    // Convert to chart format
    return Array.from(sourceTotals.entries()).map(([source, count], index) => ({
      source: source,
      members: count,
      fill: `hsl(var(--chart-${index + 1}))`,
    }))
  }, [constituencies])

  const totalMembers = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.members, 0)
  }, [chartData])

  const chartConfig = {
    members: {
      label: 'Members',
    },
    // Add config for each data source
    ...Object.fromEntries(
      chartData.map((item, index) => [
        item.source,
        {
          label: item.source,
          color: `hsl(var(--chart-${index + 1}))`,
        },
      ])
    ),
  } satisfies ChartConfig

  return (
    <>
      {/* Pie Chart */}
      <TotalMembersChart
        chartConfig={chartConfig}
        chartData={chartData}
        totalMembers={totalMembers}
      />
      <TotalConstituencyChart
        chartConfig={chartConfig}
        chartData={chartData}
        totalMembers={totalMembers}
      />
    </>
  )
}

function TotalMembersChart({
  chartConfig,
  chartData,
  totalMembers,
}: {
  chartConfig: ChartConfig
  chartData: any[]
  totalMembers: number
}) {
  return (
    <Card>
      <CardHeader className="items-center">
        <CardTitle>Total Members</CardTitle>
        <CardDescription>Distribution by Constituency</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="members"
              nameKey="source"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-white"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalMembers.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="text-white "
                        >
                          Members
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function TotalConstituencyChart({
  chartConfig,
  chartData,
  totalMembers,
}: {
  chartConfig: ChartConfig
  chartData: any[]
  totalMembers: number
}) {
  // Calculate total number of constituencies
  const totalConstituencies = React.useMemo(() => {
    return chartData.length
  }, [chartData])

  return (
    <Card>
      <CardHeader className="items-center">
        <CardTitle>Total Constituencies reached</CardTitle>
        <CardDescription>Total constituency distribution</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-white text-7xl font-bold">
              {totalConstituencies.toLocaleString()}
            </p>
            <p className="text-white text-sm">Constituencies</p>
          </div>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
