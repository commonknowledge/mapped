import { AddMapLayerButton } from '@/components/report/AddMapLayerButton'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronsUpDown } from 'lucide-react'
import useDataSources from '../useDataSources'
import DataSourcesList from './DataSourcesList'

export function ReportDataSources() {
  const { addDataSource } = useDataSources()
  return (
    <Collapsible defaultOpen>
      <div className="flex flex-row items-center gap-2">
        <CollapsibleTrigger asChild>
          <div className="flex flex-row gap-2 items-center my-3 cursor-pointer">
            <ChevronsUpDown className="h-4 w-4 text-white" />
            <h3 className="text-white font-bold">Data Sources</h3>
          </div>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="CollapsibleContent">
        <p className="text-meepGray-300 text-sm mb-3  ">
          Connect your own custom data sources or select data sources from our
          library.
        </p>
        <DataSourcesList />
        <div className="flex gap-2 items-center mt-1">
          <AddMapLayerButton addLayer={addDataSource} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
