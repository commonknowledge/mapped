import {
  AnalyticalAreaType,
  AreaQueryMode,
  DataSourceType,
  GetMapReportQuery,
  MapLayerInput,
  MapReportInput,
} from '@/__generated__/graphql'
import { StatisticsConfigSchema } from '@/__generated__/zodSchema'
import { InspectorDisplayType } from '@/lib/explorer'
import { explorerStateSchema } from '@/lib/map/useExplorer'
import {
  interpolateBlues,
  interpolateBrBG,
  interpolateGreens,
  interpolateInferno,
  interpolateOranges,
  interpolatePurples,
  interpolateRdYlBu,
  interpolateRdYlGn,
  interpolateReds,
} from 'd3-scale-chromatic'
import { WritableDraft } from 'immer'
import { createContext } from 'react'
import stringToColour from 'string-to-color'
import * as uuid from 'uuid'
import * as z from 'zod'
import { BoundaryType } from './politicalTilesets'

export enum ViewType {
  Map = 'Map',
  Table = 'Table',
}

export enum Palette {
  Blue = 'blue',
  Red = 'Red',
  Purple = 'Purple',
  Orange = 'Orange',
  Green = 'Green',
  Inferno = 'Inferno',
  DivergentRedGreen = 'DivergentRedGreen',
  DivergentBlueRed = 'DivergentBlueRed',
  DivergentBrBg = 'DivergentBrBg',
  ValueStringToColour = 'ValueStringToColour',
}

export enum StatisticalDataType {
  // Discrete = "Discrete", // integers — e.g. counts
  Continuous = 'Continuous', // floats — e.g. measures
  // Ordinal = "Ordinal", // the categories can be ranked from high to low
  Nominal = 'Nominal', // the categories cannot be ranked from high to low — e.g. parties
}

export const PALETTE: Record<
  Palette,
  {
    label: string
    dataType: StatisticalDataType
    interpolator: (t: number) => string
  }
> = {
  [Palette.Blue]: {
    label: 'Blue',
    dataType: StatisticalDataType.Continuous,
    // Reversed so that black is the lowest value
    interpolator: (t) => interpolateBlues(1 - t),
  },
  [Palette.Red]: {
    label: 'Red',
    dataType: StatisticalDataType.Continuous,
    interpolator: (t) => interpolateReds(1 - t),
  },
  [Palette.Purple]: {
    label: 'Purple',
    dataType: StatisticalDataType.Continuous,
    interpolator: (t) => interpolatePurples(1 - t),
  },
  [Palette.Orange]: {
    label: 'Orange',
    dataType: StatisticalDataType.Continuous,
    interpolator: (t) => interpolateOranges(1 - t),
  },
  [Palette.Green]: {
    label: 'Green',
    dataType: StatisticalDataType.Continuous,
    interpolator: (t) => interpolateGreens(1 - t),
  },
  [Palette.Inferno]: {
    label: 'Inferno',
    dataType: StatisticalDataType.Continuous,
    interpolator: interpolateInferno,
  },
  [Palette.DivergentRedGreen]: {
    label: 'Red/Green',
    dataType: StatisticalDataType.Continuous,
    interpolator: interpolateRdYlGn,
  },
  [Palette.DivergentBlueRed]: {
    label: 'Blue/Red',
    dataType: StatisticalDataType.Continuous,
    interpolator: interpolateRdYlBu,
  },
  [Palette.DivergentBrBg]: {
    label: 'Brown/Beige',
    dataType: StatisticalDataType.Continuous,
    interpolator: interpolateBrBG,
  },
  [Palette.ValueStringToColour]: {
    label: 'Tableau 10',
    dataType: StatisticalDataType.Nominal,
    interpolator: (t: unknown) => {
      return stringToColour(String(t))
    },
  },
}

export function getReportInterpolatorFromPalette(
  palette: Palette,
  isReversed?: boolean
) {
  const interpolator = PALETTE[palette].interpolator
  if (isReversed) {
    return (t: number) => interpolator(1 - t)
  }
  return interpolator
}

export function getReportPalette(mapOptions: IMapOptions) {
  const interpolator =
    PALETTE[mapOptions.choropleth?.palette || Palette.Blue].interpolator
  if (mapOptions.choropleth?.isPaletteReversed) {
    return (t: number) => interpolator(1 - t)
  }
  return interpolator
}

export type MapReportWithoutJSON = Omit<
  GetMapReportQuery['mapReport'],
  'displayOptions'
>

export type MapReportWithTypedJSON = MapReportWithoutJSON & {
  displayOptions: IDisplayOptions
}

export type MapReportInputWithTypedJSON = Omit<
  MapReportInput,
  'displayOptions'
> & {
  displayOptions: IDisplayOptions
}

export enum DataDisplayMode {
  Aggregated = 'Aggregated',
  RawData = 'RawData',
}

export enum ElectionSystem {
  FPTP = 'FPTP',
  Majority = 'Majority',
}

export const explorerDisplaySchema = z.object({
  id: z.string().uuid().default(uuid.v4),
  layerId: z.string().uuid(),
  name: z.string().optional(),
  displayType: z
    .nativeEnum(InspectorDisplayType)
    .default(InspectorDisplayType.Properties),
  areaQueryMode: z.nativeEnum(AreaQueryMode).default(AreaQueryMode.Overlapping),
  dataDisplayMode: z.nativeEnum(DataDisplayMode).optional(),
  formatNumericKeys: z.boolean().optional(),
  dataSourceType: z
    .nativeEnum(DataSourceType)
    .optional()
    .describe('Ask the display to present the data as if it was another type.'),
  bigNumberField: z.string().optional(),
  bigNumberFields: z
    .array(z.string())
    .optional()
    .describe('Use this to display multiple big fields via the same query'),
  isPercentage: z.boolean().optional(),
  isElectoral: z.boolean().optional(),
  electionSystem: z.nativeEnum(ElectionSystem).optional(),
  appendChoroplethStatistics: z
    .boolean()
    .optional()
    .describe('Include configured variables so that visualisations match up'),
  useAdvancedStatistics: z.boolean().optional(),
  advancedStatisticsConfig: StatisticsConfigSchema()
    .optional()
    .describe('Configuring this will add arguments to the statistics query'),
  hideTitle: z.boolean().optional(),
})

export type IExplorerDisplay = z.infer<typeof explorerDisplaySchema>

export const viewSchema = z.object({
  id: z.string().uuid().default(uuid.v4),
  name: z.string().optional(),
  type: z.nativeEnum(ViewType),
  description: z.string().optional(),
  icon: z.string().optional(),
  colour: z.string().optional(),
})

export type IView = z.infer<typeof viewSchema>

export const mapLayerSchema = z.object({
  // TODO: these could all be a union of simple or conditional styling
  id: z.string().uuid().default(uuid.v4).describe('View layer ID'),
  name: z.string().optional().describe('Name of the map marker layer'),
  layerId: z
    .string()
    .uuid()
    .describe('Reference to the report layer ID that it gets its data from'),
  colour: z
    .string()
    .optional()
    .describe('Standard colour for markers, highlighting, and so on.'),
  circleRadius: z
    .number()
    .min(1)
    .max(30)
    .default(6)
    .optional()
    .describe('Size of markers in pixels.'),
  minZoom: z
    .number()
    .min(1)
    .max(24)
    .default(10)
    .optional()
    .describe('Minimum zoom level to show markers.'),
  markerSize: z.number().optional().describe('Size of markers in pixels.'),
  visible: z.boolean().default(true),
})

export type IMapLayer = z.infer<typeof mapLayerSchema>

export enum StatisticsMode {
  Advanced = 'Advanced',
  Formula = 'Formula',
  Count = 'Count',
  Field = 'Field',
}

export const mapChoroplethOptionsSchema = z.object({
  boundaryType: z
    .nativeEnum(BoundaryType)
    .default(BoundaryType.PARLIAMENTARY_CONSTITUENCIES),
  palette: z.nativeEnum(Palette).default(Palette.Inferno),
  isPaletteReversed: z.boolean().optional(),
  mode: z.nativeEnum(StatisticsMode).default(StatisticsMode.Count),
  field: z.string().optional(),
  advancedStatisticsConfig: StatisticsConfigSchema().default({}),
  dataType: z
    .nativeEnum(StatisticalDataType)
    .default(StatisticalDataType.Continuous),
  isElectoral: z
    .boolean()
    .optional()
    .describe('If categorical data should be interpreted using party colours.'),
  fieldIsPercentage: z.boolean().optional(),
  displayRawField: z.boolean().optional(),
})

const mapOptionsSchema = z.object({
  choropleth: mapChoroplethOptionsSchema.default({}),
  display: z
    .object({
      choropleth: z.boolean().default(true),
      borders: z.boolean().default(true),
      choroplethValueLabels: z.boolean().default(true),
      boundaryNames: z.boolean().default(true),
      streetDetails: z.boolean().optional(),
      labelsForAllAreas: z.boolean().default(false),
    })
    .default({}),
  layers: z
    .record(z.string().uuid().describe('View layer ID'), mapLayerSchema)
    .default({}),
})

export type IMapOptions = z.infer<typeof mapOptionsSchema>

export enum TableGroupByMode {
  // 'None' = 'None',
  'Area' = 'Area',
}

const tableOptionsSchema = z.object({
  layerId: z.string().uuid().optional(),
  sorting: z
    .array(
      // ColumnSort
      z.object({
        id: z.string(),
        desc: z.boolean(),
      })
    )
    .optional()
    .default([]),
  groupBy: z
    .object({
      mode: z.nativeEnum(TableGroupByMode).default(TableGroupByMode.Area),
      area: z
        .nativeEnum(AnalyticalAreaType)
        .default(AnalyticalAreaType.ParliamentaryConstituency_2024),
    })
    .default({}),
})

export const mapViewSchema = viewSchema.extend({
  type: z.literal(ViewType.Map),
  mapOptions: mapOptionsSchema.default({}),
})

export const tableViewSchema = viewSchema.extend({
  type: z.literal(ViewType.Table),
  tableOptions: tableOptionsSchema.default({}),
})

export const viewUnionSchema = z.discriminatedUnion('type', [
  mapViewSchema,
  tableViewSchema,
])

export type ViewConfig = z.infer<typeof viewUnionSchema>

// Make a version of the ViewConfig type which is generic so that providing <ViewType> asserts the union type:
export type SpecificViewConfig<ViewType> = ViewConfig & { type: ViewType }

export const DisplayOptionsVersion = {
  FIRST: 'FIRST',
  '20250125': '20250125',
  '2025-01-25': '2025-01-25',
  '2025-02-08': '2025-02-08',
}

export const CURRENT_MIGRATION_VERSION = DisplayOptionsVersion['2025-02-08']

const defaultViewId = uuid.v4()

export const starredSchema = explorerStateSchema.extend({
  id: z.string(),
  name: z.string().optional(),
  icon: z.nativeEnum(DataSourceType).optional(),
})

export type StarredState = z.infer<typeof starredSchema>

export type StarredStateUnique = Pick<StarredState, 'entity' | 'id'>

export function starId(starredState: StarredStateUnique): string {
  return `ENTITY:${starredState.entity}::ID:${starredState.id}`
}

export const displayOptionsSchema = z.object({
  version: z
    .literal(CURRENT_MIGRATION_VERSION)
    .default(CURRENT_MIGRATION_VERSION),
  starred: z.record(z.string(), starredSchema).default({}),
  areaExplorer: z
    .object({
      displays: z.record(z.string().uuid(), explorerDisplaySchema).default({}),
      displaySortOrder: z
        .array(z.string().uuid())
        .describe(
          'List of display IDs to manage sort order. Separated from display dictionary to avoid JSON patch array operation problems.'
        )
        .default([]),
    })
    .default({}),
  recordExplorer: z
    .object({
      includeProperties: z
        .array(z.string())
        .optional()
        .describe('List of properties to show in the record explorer.'),
    })
    .default({}),
  views: z
    .record(z.string().uuid(), viewUnionSchema)
    .refine(
      (data) => Object.keys(data).length > 0,
      'Required at least one view required'
    )
    .default({
      [defaultViewId]: viewUnionSchema.parse({
        id: defaultViewId,
        type: ViewType.Map,
        mapOptions: mapOptionsSchema.parse({}),
      }),
    }),
  viewSortOrder: z
    .array(z.string().uuid())
    .describe(
      'List of view IDs to manage sort order. Separated from view dictionary to avoid JSON patch array operation problems.'
    )
    .default([]),
})

export const displayOptionsMigrator = displayOptionsSchema.transform((data) => {
  // Ensure displaySortOrder includes all displays
  const displayIds = Object.keys(data.areaExplorer.displays)
  data.areaExplorer.displaySortOrder = cleanupSortOrder(
    data.areaExplorer.displaySortOrder,
    displayIds
  )
  // Ensure viewSortOrder includes all views
  const viewIds = Object.keys(data.views)
  data.viewSortOrder = cleanupSortOrder(data.viewSortOrder, viewIds)
  return data
})

function cleanupSortOrder(array: string[], extantIds: string[]) {
  return Array.from(
    new Set([
      // Kick out values that no longer exist
      ...array.filter((id) => extantIds.includes(id)),
      // And bring in values that do exist
      ...extantIds.filter((id) => !array.includes(id)),
    ])
  )
}

export type IDisplayOptions = z.infer<typeof displayOptionsSchema>

export const defaultIDisplayOptions: IDisplayOptions =
  displayOptionsSchema.parse({})

export type AddSourcePayload = {
  name: string
  id: string
  dataType: DataSourceType
}

export interface ReportContextProps {
  report: MapReportWithTypedJSON
  updateReport: (
    cb: (
      draft: WritableDraft<
        Omit<MapReportWithTypedJSON, 'layers'> & {
          layers: MapLayerInput[]
        }
      >
    ) => void
  ) => Promise<void>
}

const ReportContext = createContext<ReportContextProps>({
  report: {} as MapReportWithTypedJSON,
  updateReport: async () => {},
})

export default ReportContext
