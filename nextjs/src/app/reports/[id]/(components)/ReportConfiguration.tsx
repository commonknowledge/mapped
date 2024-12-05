'use client'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronsUpDown } from 'lucide-react'
import { BoundaryTypes } from '../reportContext'
import { useReport } from './ReportProvider'
import ReportConfigLegacyControls from './_ReportConfigLegacyControls'

const ReportConfiguration: React.FC = () => {
  const { report, updateReport } = useReport()

  const {
    displayOptions: { dataVisualisation, display },
  } = report

  const updateBoundaryType = (boundaryType: string) => {
    updateReport({
      displayOptions: {
        dataVisualisation: {
          // @ts-ignore: Property 'boundaryType' does not exist on type 'DeepPartialObject'
          boundaryType,
        },
      },
    })
  }

  // TODO: Make the country part of the report configuration
  const politicalBoundaries = BoundaryTypes.uk

  return (
    <div>
      <div className="flex flex-col gap-2">
        <Collapsible defaultOpen className="mb-2">
          <CollapsibleTrigger asChild>
            <div className="flex flex-row gap-2 items-center my-3 cursor-pointer">
              <ChevronsUpDown className="h-4 w-4 text-white" />
              <h3 className="text-white font-bold">Political Boundaries</h3>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="CollapsibleContent">
            <Select
              onValueChange={updateBoundaryType}
              value={dataVisualisation?.boundaryType}
            >
              <SelectTrigger className="w-full border-meepGray-100 text-meepGray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {politicalBoundaries.map((boundary) => (
                  <SelectItem key={boundary.key} value={boundary.key}>
                    {boundary.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-meepGray-300 text-sm mb-3 mt-3">
              Includes Westminster constituencies and wards.
            </p>
          </CollapsibleContent>
        </Collapsible>
        <ReportConfigLegacyControls />
      </div>
    </div>
  )
}

export default ReportConfiguration