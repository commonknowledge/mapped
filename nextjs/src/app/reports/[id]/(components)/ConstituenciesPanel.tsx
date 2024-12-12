import { useAtom, useAtomValue } from 'jotai'
import { useEffect, useRef } from 'react'

import { ConstituencyElectionDeepDive } from '@/app/reports/[id]/(components)/reportsConstituencyItem'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  constituencyPanelTabAtom,
  isConstituencyPanelOpenAtom,
} from '@/lib/map/state'

import { selectedBoundaryAtom } from '../useSelectBoundary'
import { useReport } from './ReportProvider'
import { TopConstituencies } from './TopConstituencies'

export function ConstituenciesPanel() {
  const [selectedBoundary, setSelectedConstituency] =
    useAtom(selectedBoundaryAtom)

  const isConstituencyPanelOpen = useAtomValue(isConstituencyPanelOpenAtom)
  const [tab, setTab] = useAtom(constituencyPanelTabAtom)
  const {
    report: {
      displayOptions: {
        dataVisualisation: { boundaryType: analyticalAreaType } = {},
      } = {},
    },
  } = useReport()

  const lastCons = useRef(selectedBoundary)
  useEffect(() => {
    if (selectedBoundary && selectedBoundary !== lastCons.current) {
      return setTab('selected')
    } else if (!selectedBoundary) {
      return setTab('list')
    }
  }, [selectedBoundary, setTab])

  if (!analyticalAreaType) return null
  if (!isConstituencyPanelOpen) return null

  const classes = {
    tabsTrigger:
      'pb-2 bg-transparent px-0 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b border-white rounded-none',
  }

  return (
    <Card className=" bg-meepGray-600 border-1 text-meepGray-200 border border-meepGray-700 max-h-full flex flex-col pointer-events-auto">
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex flex-col max-h-full overflow-hidden items-start justify-start"
      >
        <TabsList
          className="w-full justify-start text-white rounded-none px-4
          border border-b-meepGray-800 pt-4 pb-0 h-fit flex gap-4"
        >
          <TabsTrigger value="list" className={classes.tabsTrigger}>
            All Constituencies
          </TabsTrigger>
          {!!selectedBoundary && (
            <TabsTrigger value="selected" className={classes.tabsTrigger}>
              Selected
            </TabsTrigger>
          )}
        </TabsList>
        {/* Don't stretch, grow at most to height of window, scroll internally */}
        <div className="overflow-y-auto max-h-full w-full">
          <TabsContent value="list" className="pb-4">
            <TopConstituencies />
          </TabsContent>
          {!!selectedBoundary && (
            <TabsContent value="selected" className="pb-4 p-4">
              <ConstituencyElectionDeepDive
                gss={selectedBoundary}
                analyticalAreaType={analyticalAreaType}
              />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </Card>
  )
}
