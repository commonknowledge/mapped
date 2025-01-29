import {
  AnalyticalAreaType,
  AreaQueryMode,
  ChoroplethMode,
  DataSourceType,
  GetMapReportQuery,
  MapLayerInput,
} from '@/__generated__/graphql'
import { InspectorDisplayType } from '@/lib/explorer'
import { starredSchema } from '@/lib/map'
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
}

export const PALETTE: Record<
  Palette,
  {
    label: string
    interpolator: (t: number) => string
  }
> = {
  [Palette.Blue]: {
    label: 'Blue',
    // Reversed so that black is the lowest value
    interpolator: (t) => interpolateBlues(1 - t),
  },
  [Palette.Red]: {
    label: 'Red',
    interpolator: (t) => interpolateReds(1 - t),
  },
  [Palette.Purple]: {
    label: 'Purple',
    interpolator: (t) => interpolatePurples(1 - t),
  },
  [Palette.Orange]: {
    label: 'Orange',
    interpolator: (t) => interpolateOranges(1 - t),
  },
  [Palette.Green]: {
    label: 'Green',
    interpolator: (t) => interpolateGreens(1 - t),
  },
  [Palette.Inferno]: {
    label: 'Inferno',
    interpolator: interpolateInferno,
  },
  [Palette.DivergentRedGreen]: {
    label: 'Red/Green',
    interpolator: interpolateRdYlGn,
  },
  [Palette.DivergentBlueRed]: {
    label: 'Blue/Red',
    interpolator: interpolateRdYlBu,
  },
  [Palette.DivergentBrBg]: {
    label: 'Brown/Beige',
    interpolator: interpolateBrBG,
  },
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

export enum DataDisplayMode {
  Aggregated = 'Aggregated',
  RawData = 'RawData',
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
  dataSourceType: z
    .nativeEnum(DataSourceType)
    .optional()
    .describe('Ask the display to present the data as if it was another type.'),
  bigNumberField: z.string().optional(),
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
  markerSize: z.number().optional().describe('Size of markers in pixels.'),
  visible: z.boolean().optional().default(true),
})

const mapOptionsSchema = z.object({
  choropleth: z
    .object({
      boundaryType: z
        .nativeEnum(BoundaryType)
        .default(BoundaryType.PARLIAMENTARY_CONSTITUENCIES)
        .describe('Boundary hierarchy'),
      lockedOnAnalyticalAreaType: z
        .nativeEnum(AnalyticalAreaType)
        .optional()
        .describe('Specific boundary'),
      palette: z.nativeEnum(Palette).default(Palette.Inferno),
      isPaletteReversed: z.boolean().optional(),
      layerId: z.string().uuid().optional(),
      mode: z.nativeEnum(ChoroplethMode).default(ChoroplethMode.Count),
      field: z.string().optional(),
      formula: z.string().optional(),
    })
    .optional()
    .default({}),
  // TODO: Validate lockOn
  // .transform((data) => {
  //   // Ensure that analyticalAreaType is a valid key for the boundaryType
  //   const boundaryHierarchy = POLITICAL_BOUNDARIES.find(
  //     (b) => b.boundaryType === data.boundaryType
  //   )
  //   if (
  //     boundaryHierarchy &&
  //     !boundaryHierarchy.tilesets.some(
  //       (t) => t.analyticalAreaType === data.analyticalAreaType
  //     )
  //   ) {
  //     data.analyticalAreaType = undefined
  //   }
  //   return data
  // }),
  display: z
    .object({
      choropleth: z.boolean().default(true),
      borders: z.boolean().default(true),
      boundaryNames: z.boolean().default(true),
      streetDetails: z.boolean().optional(),
    })
    .default({}),
  layers: z
    .record(z.string().uuid().describe('View layer ID'), mapLayerSchema)
    .default({}),
})

export type IMapOptions = z.infer<typeof mapOptionsSchema>

const tableOptionsSchema = z.object({})

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

const CURRENT_MIGRATION_VERSION = '2025-01-25'

const defaultViewId = uuid.v4()

export const displayOptionsSchema = z.object({
  version: z.string().default(CURRENT_MIGRATION_VERSION),
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
