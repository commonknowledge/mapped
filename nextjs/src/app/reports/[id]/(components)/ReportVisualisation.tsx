import { MapLayer } from '@/__generated__/graphql'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { startCase } from 'lodash'
import React from 'react'
import { VisualisationType } from '../reportContext'
import useDataByBoundary from '../useDataByBoundary'
import CollapsibleSection from './CollapsibleSection'
import { UpdateConfigProps } from './ReportConfiguration'
import { useReport } from './ReportProvider'

const ReportVisualisation: React.FC<UpdateConfigProps> = ({
  updateVisualisationConfig,
}) => {
  const { report } = useReport()
  const {
    layers,
    politicalBoundaries,
    displayOptions: { dataVisualisation },
  } = report
  const { fieldNames } = useDataByBoundary({
    report,
    boundaryType: dataVisualisation?.boundaryType,
  })

  const visualisationType = dataVisualisation?.visualisationType
  const dataSourceId = dataVisualisation?.dataSource
  const dataSourceField = dataVisualisation?.dataSourceField
  const selectedDataSource = layers.find((layer) => layer.id === dataSourceId)
  const selectedBoundaryLabel = politicalBoundaries.find(
    (boundary) => boundary.boundaryType === dataVisualisation?.boundaryType
  )?.label

  return (
    <CollapsibleSection id="report-visualisation" title="Data Visualisation">
      <div className="flex flex-col gap-3">
        <div>
          <Select
            onValueChange={(type) =>
              updateVisualisationConfig({
                visualisationType: type as VisualisationType,
              })
            }
            value={visualisationType}
          >
            <Label
              htmlFor="select-vis-type"
              className="text-white text-sm font-medium"
            >
              Type
            </Label>
            <SelectTrigger
              id="select-vis-type"
              className="w-full border-meepGray-100 text-meepGray-100 mt-2 font-medium"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(VisualisationType).map((type) => (
                <SelectItem className="font-medium" key={type} value={type}>
                  {startCase(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-meepGray-400 text-sm font-normal mb-3 mt-3">
            Colour shading by category
          </p>
        </div>
        {report.layers.length && (
          <div>
            <Select
              onValueChange={(type) =>
                updateVisualisationConfig({
                  dataSource: type as MapLayer['id'],
                })
              }
              value={dataSourceId}
            >
              <Label
                htmlFor="select-vis-type"
                className="text-white text-sm font-medium"
              >
                Colour by
              </Label>
              <SelectTrigger
                id="select-vis-type"
                className="w-full border-meepGray-100 text-meepGray-100 mt-2 font-medium"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {layers.map((layer) => (
                  <SelectItem
                    className="font-medium"
                    key={layer.id}
                    value={layer.id}
                  >
                    {startCase(layer.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-meepGray-400 text-sm font-normal mb-3 mt-3">
              Select which data will populate your {selectedBoundaryLabel}
            </p>
          </div>
        )}
        {selectedDataSource?.source.dataType === 'AREA_STATS' && (
          <div>
            <Select
              onValueChange={(type) =>
                updateVisualisationConfig({
                  dataSourceField: type as MapLayer['id'],
                })
              }
              value={dataSourceField}
              defaultOpen={!dataSourceField}
              required
            >
              <Label
                htmlFor="select-vis-type"
                className="text-white text-sm font-medium"
              >
                Select data field
              </Label>
              <SelectTrigger
                id="select-vis-type"
                className="w-full border-meepGray-100 text-meepGray-100 mt-2 font-medium"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldNames?.map((field) => (
                  <SelectItem className="font-medium" key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-meepGray-400 text-sm font-normal mb-3 mt-3">
              Select the field from your data source
            </p>
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}

export default ReportVisualisation
