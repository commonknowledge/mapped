import {
  ConstituencyStatsOverviewQuery,
  ConstituencyStatsOverviewQueryVariables,
} from '@/__generated__/graphql'
import { gql, useQuery } from '@apollo/client'
import { scaleLinear } from 'd3-scale'
import { useAtom } from 'jotai'
import { useMemo, useState } from 'react'
import { HexGrid, Hexagon, Layout } from 'react-hexgrid'
import { hexData } from '../dashboard/uk-hex-data'
import { selectedBoundaryAtom } from '../useSelectBoundary'
import { useReport } from './ReportProvider'

const CONSTITUENCY_STATS_OVERVIEW = gql`
  query ConstituencyStatsOverview(
    $reportID: ID!
    $analyticalAreaType: AnalyticalAreaType!
    $layerIds: [String!]!
  ) {
    mapReport(pk: $reportID) {
      id
      importedDataCountByConstituency: importedDataCountByArea(
        analyticalAreaType: $analyticalAreaType
        layerIds: $layerIds
      ) {
        label
        gss
        count
        gssArea {
          id
          name
          fitBounds
        }
      }
    }
  }
`

interface TooltipState {
  content: string
  x: number
  y: number
}

export default function ReportDashboardHexMap() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [selectedBoundary, setSelectedBoundary] = useAtom(selectedBoundaryAtom)
  const { report } = useReport()

  const { data: constituencyAnalytics } = useQuery<
    ConstituencyStatsOverviewQuery,
    ConstituencyStatsOverviewQueryVariables
  >(CONSTITUENCY_STATS_OVERVIEW, {
    variables: {
      reportID: report.id,
      analyticalAreaType:
        report.displayOptions?.dataVisualisation?.boundaryType!,
      layerIds: [report.displayOptions?.dataVisualisation?.dataSource!],
    },
  })

  const activeConstituencies =
    constituencyAnalytics?.mapReport.importedDataCountByConstituency

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

  console.log('Constituency data:', {
    activeConstituencies: activeConstituencies?.map((c) => ({
      gss: c.gss,
      name: c.label,
      count: c.count,
    })),
    sampleHexes: Object.entries(hexData.hexes)
      .slice(0, 5)
      .map(([id, hex]) => ({
        id,
        name: hex.n,
        gss: id,
      })),
  })

  const getHexCount = (id: string) => {
    const constituency = activeConstituencies?.find((c) => c.gss === id)
    if (constituency) {
      return constituency.count
    }
    return 0
  }

  const colorScale = useMemo(() => {
    if (!activeConstituencies?.length) return () => '#262C3B'

    const counts = activeConstituencies.map((c) => c.count).filter((c) => c > 0)
    const max = Math.max(...counts)
    const min = 0

    return scaleLinear<string>()
      .domain([min, max])
      .range(['#CCEEF7', '#00A8D5'])
  }, [activeConstituencies])

  return (
    <div className="w-full h-full bg-[#262C3B]">
      <HexGrid
        width={'100%'}
        height={'100%'}
        viewBox="0 0 220 460"
        className=""
      >
        <Layout
          size={{ x: 4, y: 4 }}
          spacing={1.05}
          origin={{ x: -250, y: -150 }}
        >
          {Object.entries(hexData.hexes).map(([id, hex]) => {
            const count = getHexCount(id)
            const fillColor = count > 0 ? colorScale(count) : '#969EB0'

            return (
              <Hexagon
                key={id}
                q={hex.q}
                r={hex.r * -1}
                s={hex.q - hex.r}
                style={{ fill: fillColor }}
                className={`transition-colors duration-200 hover:brightness-125
                  ${selectedBoundary === id ? 'stroke-2 stroke-pink-700' : ''}
                  ${count > 0 ? 'opacity-100' : 'opacity-50'}
                `}
                onMouseEnter={(e) => handleMouseEnter(e, hex)}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => setSelectedBoundary?.(id)}
              />
            )
          })}
        </Layout>
      </HexGrid>

      {tooltip && (
        <div
          className="fixed z-50 bg-meepGray-600 text-popover-foreground px-3 py-1.5 text-sm rounded-md shadow-md"
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
    </div>
  )
}
