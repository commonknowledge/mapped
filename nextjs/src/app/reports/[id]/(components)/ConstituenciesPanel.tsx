import { useAtom } from 'jotai'
import { useEffect, useRef } from 'react'

import { Card } from '@/components/ui/card'
import {
  constituencyPanelTabAtom,
  selectedConstituencyAtom,
} from '@/lib/map/state'

import { useReportContext } from '../context'
import { TopConstituencies } from './TopConstituencies'

export function ConstituenciesPanel() {
  const [selectedConstituencyId, setSelectedConstituency] = useAtom(
    selectedConstituencyAtom
  )
  const [tab, setTab] = useAtom(constituencyPanelTabAtom)
  const {
    displayOptions: { analyticalAreaType },
  } = useReportContext()

  const lastCons = useRef(selectedConstituencyId)
  useEffect(() => {
    if (selectedConstituencyId && selectedConstituencyId !== lastCons.current) {
      return setTab('selected')
    } else if (!selectedConstituencyId) {
      return setTab('list')
    }
  }, [selectedConstituencyId, setTab])

  return (
    <Card className=" bg-meepGray-800 border-1 text-meepGray-200 border border-meepGray-700 max-h-full flex flex-col pointer-events-auto">
      <div>
        <TopConstituencies />
      </div>
    </Card>
  )
}
