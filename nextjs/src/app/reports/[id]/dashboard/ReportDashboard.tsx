import {
  ConstituencyStatsOverviewQuery,
  ConstituencyStatsOverviewQueryVariables,
} from '@/__generated__/graphql'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { gql, useQuery } from '@apollo/client'
import { useAtom } from 'jotai'
import { useReport } from '../(components)/ReportProvider'
import { ConstituencyElectionDeepDive } from '../(components)/reportsConstituencyItem'
import { selectedBoundaryAtom } from '../useSelectBoundary'
import ReportDashboardConsSelector from './ReportDashboardConsSelector'
import ReportDashboardHexMap from './ReportDashboardHexMap'
import ReportDashboardList from './ReportDashboardList'
import ReportDashboardMPs from './ReportDashboardMPs'
import ReportDashboardMemberCount from './ReportDashboardMemberCount'
import ReportDashboardMembersOverTime from './ReportDashboardMembersOverTime'

export default function ReportDashboard() {
  const [selectedBoundary, setSelectedBoundary] = useAtom(selectedBoundaryAtom)
  const {
    report: {
      id,
      displayOptions: {
        dataVisualisation: {
          boundaryType: analyticalAreaType,
          dataSource,
        } = {},
      } = {},
    },
  } = useReport()

  const constituencyAnalytics = useQuery<
    ConstituencyStatsOverviewQuery,
    ConstituencyStatsOverviewQueryVariables
  >(CONSTITUENCY_STATS_OVERVIEW, {
    variables: {
      reportID: id,
      analyticalAreaType: analyticalAreaType!,
      layerIds: [dataSource!],
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
      <Tabs defaultValue="Overview" className="">
        <div className="flex gap-4 items-center">
          <ReportDashboardConsSelector
            constituencies={constituencies}
            selectedBoundary={selectedBoundary}
            setSelectedBoundary={setSelectedBoundary}
          />
          <TabsList>
            <TabsTrigger value="Overview">Overview</TabsTrigger>
            <TabsTrigger value="Foodbanks">Foodbanks</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="Overview">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 grid-cols-1 gap-4 w-full">
            {constituencies && !selectedBoundary && (
              <>
                <ReportDashboardMemberCount constituencies={constituencies} />
                <ReportDashboardMembersOverTime />
                <ReportDashboardHexMap activeConstituencies={constituencies} />
                <ReportDashboardList constituencies={constituencies} />
                <ReportDashboardMPs constituencies={constituencies} />
              </>
            )}
            {selectedBoundary && analyticalAreaType && (
              <div className="col-span-full">
                <ConstituencyElectionDeepDive
                  gss={selectedBoundary}
                  analyticalAreaType={analyticalAreaType}
                />
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="Foodbanks">Foodbanks Data goes here</TabsContent>
      </Tabs>
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