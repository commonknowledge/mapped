import { AreaQueryMode } from '@/__generated__/graphql'
import {
  displayOptionsMigrator,
  MapReportInputWithTypedJSON,
  ViewType,
} from '@/app/reports/[id]/reportContext'
import { v4 } from 'uuid'
import { InspectorDisplayType } from '../explorer'

export function createReportForSource(
  sourceName: string,
  sourceId: string
): MapReportInputWithTypedJSON {
  const viewId = v4()
  const reportLayerId = v4()
  const displayLayerId = v4()
  return {
    name: `Map for ${sourceName}`,
    slug: v4(),
    layers: [
      {
        id: v4(),
        name: sourceName,
        source: sourceId,
      },
    ],
    displayOptions: displayOptionsMigrator.parse(
      {
        views: {
          [viewId]: {
            id: viewId,
            type: ViewType.Map,
            mapOptions: {
              choropleth: {
                advancedStatisticsConfig: {
                  sourceIds: [sourceId],
                },
              },
              layers: {
                [reportLayerId]: {
                  id: reportLayerId,
                  layerId: reportLayerId,
                },
              },
            },
          },
        },
        areaExplorer: {
          displays: {
            [displayLayerId]: {
              id: displayLayerId,
              layerId: reportLayerId,
              displayType: InspectorDisplayType.Properties,
              areaQueryMode: AreaQueryMode.Overlapping,
            },
          },
        },
      }
      // satisfies IDisplayOptions
    ),
  }
}
