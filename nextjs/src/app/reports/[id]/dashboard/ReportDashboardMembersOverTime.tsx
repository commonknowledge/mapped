'use client'

import { TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ChartCard'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
const chartData = [
  { month: 'July', signups: 186 },
  { month: 'August', signups: 305 },
  { month: 'September', signups: 237 },
  { month: 'October', signups: 73 },
  { month: 'November', signups: 209 },
  { month: 'December', signups: 214 },
]

const chartConfig = {
  signups: {
    label: 'Sign Ups',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

export default function ReportDashboardMembersOverTime() {
  return (
    <Card className="sm:col-span-1 col-span-1">
      <CardHeader>
        <CardTitle>Sign Ups</CardTitle>
        <CardDescription>
          Showing total sign ups for the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="signups"
              type="natural"
              fill="var(--color-signups)"
              fillOpacity={0.4}
              stroke="var(--color-signups)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              January - June 2024
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
