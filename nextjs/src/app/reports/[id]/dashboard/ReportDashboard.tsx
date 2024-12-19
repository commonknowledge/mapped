import {
  ConstituencyStatsOverviewQuery,
  ConstituencyStatsOverviewQueryVariables,
} from '@/__generated__/graphql'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { gql, useQuery } from '@apollo/client'
import { CogIcon } from 'lucide-react'
import { ReportDataSources } from '../(components)/ReportDataSources'
import { useReport } from '../(components)/ReportProvider'
import ReportDashboardHexMap from './ReportDashboardHexMap'
import ReportDashboardKeyStats from './ReportDashboardKeyStats'
import ReportDashboardList from './ReportDashboardList'
import ReportDashboardMPs from './ReportDashboardMPs'
import ReportDashboardMembersOverTime from './ReportDashboardMembersOverTime'
export default function ReportDashboard() {
  const {
    report: {
      id,
      displayOptions: { dataVisualisation },
    },
  } = useReport()

  const constituencyAnalytics = useQuery<
    ConstituencyStatsOverviewQuery,
    ConstituencyStatsOverviewQueryVariables
  >(CONSTITUENCY_STATS_OVERVIEW, {
    variables: {
      reportID: id,
      analyticalAreaType: dataVisualisation?.boundaryType!,
      layerIds: [dataVisualisation?.dataSource!],
    },
  })

  const constituencies =
    constituencyAnalytics.data?.mapReport.importedDataCountByConstituency
      .filter((constituency) => constituency.gssArea)
      .sort((a, b) => b.count - a.count) // Sort by count in descending order

  if (constituencyAnalytics.loading) {
    return <div>Loading...</div>
  }

  return (
    <main className="flex flex-col w-full p-4 h-[calc(100vh-48px)] overflow-y-auto">
      <div className="flex justify-between items-center w-full mb-4">
        <h1 className="text-2xl font-bold ">Dashboard</h1>
        <Dialog>
          <DialogTrigger className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity duration-200">
            <CogIcon className="w-4 h-4" /> Data Sources
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Data Sources</DialogTitle>
              <ReportDataSources />
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 grid-cols-1 gap-4 w-full ">
        {constituencies && (
          <>
            <ReportDashboardKeyStats constituencies={constituencies} />
            <ReportDashboardHexMap activeConstituencies={constituencies} />
            <ReportDashboardMembersOverTime />
            <ReportDashboardList constituencies={constituencies} />
            <ReportDashboardMPs constituencies={constituencies} />
          </>
        )}
      </div>
    </main>
  )
}

// Same query from TopConstituencies
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
          mp: person(filters: { personType: "MP" }) {
            id
            name
            photo {
              url
            }
            party: personDatum(filters: { dataType_Name: "party" }) {
              name: data
            }
          }
          lastElection {
            stats {
              date
              majority
              electorate
              firstPartyResult {
                party
                shade
                votes
              }
              secondPartyResult {
                party
                shade
                votes
              }
            }
          }
        }
      }
    }
  }
`
