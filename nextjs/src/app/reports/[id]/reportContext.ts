import {
  AnalyticalAreaType,
  MapLayer,
  MapReport,
} from '@/__generated__/graphql'
import { createContext } from 'react'
import { PoliticalTileset } from './politicalTilesets'

export enum VisualisationType {
  Choropleth = 'choropleth',
}

export enum Palette {
  Blue = 'blue',
}

export type MapReportExtended = Omit<MapReport, 'displayOptions'> & {
  displayOptions: ReportConfig
  politicalBoundaries: PoliticalTileset[]
}

export interface ReportConfig {
  dataVisualisation: {
    boundaryType?: AnalyticalAreaType
    visualisationType?: VisualisationType
    palette?: Palette
    dataSource?: MapLayer['id']
    dataSourceField?: string
  }
  display: {
    showStreetDetails?: boolean
    showMPs?: boolean
    showLastElectionData?: boolean
    showPostcodeLabels?: boolean
    boundaryOutlines?: AnalyticalAreaType[]
  }
}

export const defaultReportConfig: ReportConfig = {
  dataVisualisation: {
    boundaryType: AnalyticalAreaType.ParliamentaryConstituency_2024,
    visualisationType: VisualisationType.Choropleth,
    palette: Palette.Blue,
  },
  display: {
    showStreetDetails: false,
    showPostcodeLabels: false,
    showMPs: false,
    showLastElectionData: false,
    boundaryOutlines: [AnalyticalAreaType.ParliamentaryConstituency_2024],
  },
}

interface ReportContextProps {
  report: MapReportExtended
  deleteReport: () => void
  updateReport: (payload: {
    name?: string
    displayOptions?: Partial<ReportConfig>
    layers?: any[]
  }) => void
  refreshReportData: () => void
}

const ReportContext = createContext<ReportContextProps>({
  report: {} as MapReportExtended,
  deleteReport: () => {},
  updateReport: () => {},
  refreshReportData: () => {},
})

export default ReportContext
