import { ConstituencyStatsOverviewQuery } from '@/__generated__/graphql'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ChartCard'
import { useMemo, useState } from 'react'
import { HexGrid, Hexagon, Layout } from 'react-hexgrid'
import { hexData } from './uk-hex-data'

interface TooltipState {
  content: string
  x: number
  y: number
}

export default function ReportDashboardHexMap({
  activeConstituencies,
}: {
  activeConstituencies?: ConstituencyStatsOverviewQuery['mapReport']['importedDataCountByConstituency']
}) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const activeGssCodes = useMemo(
    () => new Set(activeConstituencies?.map((c) => c.gss)),
    [activeConstituencies]
  )

  const handleMouseEnter = (
    event: React.MouseEvent,
    hex: (typeof hexData.hexes)[keyof typeof hexData.hexes]
  ) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setTooltip({
      content: hex.n,
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
  }

  return (
    <Card className="w-full row-span-2 relative">
      <CardHeader>
        <CardTitle>Constituency Map </CardTitle>
        <CardDescription>Regional Distribution</CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-7xl text-muted-foreground text-right absolute top-2 right-2">
          {activeConstituencies?.length}
          <p className="text-sm text-muted-foreground"> constituencies</p>
        </div>
        <HexGrid
          width={'100%'}
          height={'100%'}
          viewBox="0 0 220 410"
          className=""
        >
          <Layout
            size={{ x: 4, y: 4 }}
            spacing={1.05}
            origin={{ x: -250, y: -190 }}
          >
            {Object.entries(hexData.hexes).map(([id, hex]) => (
              <Hexagon
                key={id}
                q={hex.q}
                r={hex.r * -1}
                s={hex.q - hex.r}
                fill={
                  activeGssCodes?.has(id)
                    ? `hsl(var(--chart-1))`
                    : `hsl(var(--chart-2))`
                }
                className={`fill-white transition-colors duration-200 hover:opacity-75 ${
                  activeGssCodes?.has(id) ? 'opacity-100' : 'opacity-50'
                }`}
                onMouseEnter={(e) => handleMouseEnter(e, hex)}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </Layout>
        </HexGrid>

        {tooltip && (
          <div
            className="fixed z-50 bg-popover text-popover-foreground px-3 py-1.5 text-sm rounded-md shadow-md"
            style={{
              left: tooltip.x,
              top: tooltip.y - 40,
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}
          >
            {tooltip.content}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
