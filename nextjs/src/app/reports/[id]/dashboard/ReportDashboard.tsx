import {
  ConstituencyStatsOverviewQuery,
  ConstituencyStatsOverviewQueryVariables,
} from '@/__generated__/graphql'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { gql, useQuery } from '@apollo/client'
import { useAtom } from 'jotai'
import { CalendarIcon, FileIcon, MapPinIcon, UsersIcon } from 'lucide-react'
import { useReport } from '../(components)/ReportProvider'
import { TabTriggerClasses } from '../(components)/ReportSidebarLeft'
import { ConstituencyElectionDeepDive } from '../(components)/reportsConstituencyItem'
import { selectedBoundaryAtom } from '../useSelectBoundary'
import ReportDashboardList from './ReportDashboardList'
import ReportDashboardMPs from './ReportDashboardMPs'
import ReportDashboardMemberCount from './ReportDashboardMemberCount'
import ReportDashboardMemberList from './ReportDashboardMemberList'
import ReportDashboardMembersOverTime from './ReportDashboardMembersOverTime'

const IconClasses = 'w-4 h-4 stroke-meepGray-400 stroke-1 mr-1'

const dashboardTabItems = [
  {
    label: 'Overview',
    value: 'overview',
    bold: true,
  },
  {
    label: 'Members',
    value: 'members',
    icon: <UsersIcon className={IconClasses} />,
  },
  {
    label: 'Locations',
    value: 'locations',
    icon: <MapPinIcon className={IconClasses} />,
  },
  {
    label: 'Groups',
    value: 'groups',
    icon: <UsersIcon className={IconClasses} />,
  },
  {
    label: 'Events',
    value: 'events',
    icon: <CalendarIcon className={IconClasses} />,
  },
  {
    label: 'Articles  ',
    value: 'articles',
    icon: <FileIcon className={IconClasses} />,
  },
]

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
    <main className="flex flex-col gap-4 w-full  h-[calc(100vh-48px)] overflow-y-auto">
      <Tabs defaultValue="overview" className="col-span-4">
        <TabsList className={TabTriggerClasses.tabsList}>
          {dashboardTabItems.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className={`${TabTriggerClasses.tabsTrigger} ${
                item.bold ? 'font-bold' : 'font-normal'
              }`}
            >
              {item.icon}
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="p-4">
          <TabsContent value="overview">
            <div className="grid sm:grid-cols-2 md:grid-cols-2 grid-cols-1 gap-4 w-full">
              {constituencies && !selectedBoundary && (
                <>
                  <ReportDashboardMemberCount constituencies={constituencies} />
                  <ReportDashboardList constituencies={constituencies} />
                  <ReportDashboardMembersOverTime />
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
          <TabsContent value="members">
            <ReportDashboardMemberList />
          </TabsContent>
          <TabsContent value="locations">Foodbanks Data goes here</TabsContent>
          <TabsContent value="groups">Groups Data goes here</TabsContent>
          <TabsContent value="events">Events Data goes here</TabsContent>
          <TabsContent value="articles">Articles Data goes here</TabsContent>
        </div>
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
