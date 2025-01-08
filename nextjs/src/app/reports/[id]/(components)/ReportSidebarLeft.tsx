import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Sidebar, SidebarContent } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDebounce } from '@uidotdev/usehooks'
import { useState } from 'react'
import useReportUiHelpers from '../useReportUiHelpers'
import InactivateOnLoading from './InactivateOnLoading'
import ReportConfiguration from './ReportConfiguration'
import { ReportDataSources } from './ReportDataSources'
import { NAVBAR_HEIGHT } from './ReportNavbar'
import { useReport } from './ReportProvider'

export const TabTriggerClasses = {
  tabsList:
    'w-full justify-start text-white rounded-none px-4 border border-b-meepGray-800 pt-4 pb-0 h-fit flex gap-6 overflow-x-auto scroll',
  tabsTrigger:
    'pb-2 bg-transparent px-0 data-[state=active]:bg-transparent  text-meepGray-400 border-b border-b-meepGray-600 data-[state=active]:text-white data-[state=active]:border-b-meepGray-200 hover:border-b hover:border-meepGray-400 rounded-none',
}

export function ReportSidebarLeft() {
  const { userJourneyHelpers, updateUserJourneyHelpers } = useReportUiHelpers()
  const { dataLoading: undebouncedDataLoading } = useReport()
  const [selectedTab, setSelectedTab] = useState('data-sources')
  const dataLoading = useDebounce(undebouncedDataLoading, 300)

  return (
    <Sidebar
      style={{
        top: NAVBAR_HEIGHT + 'px',
      }}
      className="border border-r-meepGray-800 "
    >
      <SidebarContent className="bg-meepGray-600">
        <Tabs
          defaultValue="data-sources"
          className="w-full"
          onValueChange={setSelectedTab}
        >
          <TabsList className={TabTriggerClasses.tabsList}>
            <TabsTrigger
              value="data-sources"
              className={TabTriggerClasses.tabsTrigger}
              disabled={dataLoading}
            >
              Data Sources {}
            </TabsTrigger>

            <HoverCard
              open={
                userJourneyHelpers?.visualiseYourData.open &&
                selectedTab === 'data-sources'
              }
              onOpenChange={() =>
                updateUserJourneyHelpers('visualiseYourData', false)
              }
            >
              <HoverCardTrigger>
                <TabsTrigger
                  value="configuration"
                  className={TabTriggerClasses.tabsTrigger}
                  disabled={dataLoading}
                >
                  Configuration
                </TabsTrigger>
              </HoverCardTrigger>
              <HoverCardContent align="start" className="font-normal">
                Click on "Configuration" to visualise your data
              </HoverCardContent>
            </HoverCard>
          </TabsList>
          <TabsContent value="data-sources" className="px-4 pb-24">
            <InactivateOnLoading>
              <ReportDataSources />
            </InactivateOnLoading>
          </TabsContent>
          <TabsContent value="configuration" className="px-4 pb-24">
            <InactivateOnLoading>
              <ReportConfiguration />
            </InactivateOnLoading>
          </TabsContent>
        </Tabs>
      </SidebarContent>
    </Sidebar>
  )
}
