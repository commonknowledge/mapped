'use client'

import { useAtom, useAtomValue } from 'jotai'
import { useContext, useEffect } from 'react'

import {
  isConstituencyPanelOpenAtom,
  selectedConstituencyAtom,
} from '@/lib/map/state'

import { reportContext } from '../context'
import { ConstituenciesPanel } from './ConstituenciesPanel'
import LayersCard from './LayersCard'
import { NotFound } from './NotFound'
import { ReportMap } from './ReportMap'

export default function ReportPage() {
  const { report } = useContext(reportContext)
  const [isConstituencyPanelOpen, setConstituencyPanelOpen] = useAtom(
    isConstituencyPanelOpenAtom
  )
  const selectedConstituency = useAtomValue(selectedConstituencyAtom)

  useEffect(() => {
    if (!report?.data?.mapReport?.layers?.length) {
      return setConstituencyPanelOpen(false)
    }
  }, [selectedConstituency, report])

  if (!report?.loading && report?.called && !report?.data?.mapReport) {
    return NotFound()
  }

  if (report?.loading && !report?.data?.mapReport) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <>
      <div className="absolute w-full h-full flex flex-row pointer-events-none">
        <div className="w-full h-full pointer-events-auto">
          <ReportMap />
        </div>
        <aside className="absolute top-0 left-0 p-5 w-60 h-full pointer-events-auto">
          <LayersCard />
        </aside>
        {report?.data?.mapReport && isConstituencyPanelOpen && (
          <aside className="absolute top-0 right-0 p-5 w-[400px] h-full">
            <ConstituenciesPanel />
          </aside>
        )}
      </div>
    </>
  )
}
