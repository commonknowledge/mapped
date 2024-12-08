import { Sidebar, SidebarContent } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import ReportConfiguration from './ReportConfiguration'
import { ReportDataSources } from './ReportDataSources'
import { NAVBAR_HEIGHT } from './ReportNavbar'

const classes = {
  tabsTrigger:
    'pb-2 bg-transparent px-0 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b border-white rounded-none',
}

export function ReportSidebarLeft() {
  return (
    <Sidebar
      style={{
        top: NAVBAR_HEIGHT + 'px',
      }}
      className="border border-r-meepGray-800"
    >
      <SidebarContent className="bg-meepGray-600">
        <Tabs defaultValue="data-sources" className="w-full">
          <TabsList
            className="w-full justify-start text-white rounded-none px-4
          border border-b-meepGray-800 pt-4 pb-0 h-fit flex gap-4"
          >
            <TabsTrigger value="data-sources" className={classes.tabsTrigger}>
              Data Sources
            </TabsTrigger>
            <TabsTrigger value="configuration" className={classes.tabsTrigger}>
              Configuration
            </TabsTrigger>
          </TabsList>
          <TabsContent value="data-sources" className="px-4">
            <ReportDataSources />
          </TabsContent>
          <TabsContent value="configuration" className="px-4">
            <ReportConfiguration />
          </TabsContent>
        </Tabs>
      </SidebarContent>
    </Sidebar>
  )
}
