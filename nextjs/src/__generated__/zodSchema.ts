import { z } from 'zod'
import { ActionNetworkSourceInput, AggregationDefinition, AggregationOp, AirtableSourceInput, AnalyticalAreaType, AreaFilter, AreaQueryMode, AreaTypeFilter, CalculatedColumn, ChoroplethConfig, CommonDataLoaderFilter, CreateExternalDataSourceInput, CreateOrganisationInput, CrmType, DataSourceType, DatetimeDatetimeFilterLookup, DatetimeRangeLookup, EditableGoogleSheetsSourceInput, ExternalDataSourceFilter, ExternalDataSourceInput, GeoJsonTypes, GeographyTypes, GroupByColumn, HubPageInput, IdBaseFilterLookup, IdObject, IntComparisonFilterLookup, IntRangeLookup, MailChimpSourceInput, MapBounds, MapLayerInput, MapReportInput, OffsetPaginationInput, OneToManyInput, OperationMessageKind, OrganisationFilters, OrganisationInputPartial, PersonFilter, ProcrastinateJobStatus, QueueFilter, ReportFilter, SharingPermissionCudInput, SharingPermissionInput, StatisticsConfig, StrFilterLookup, TicketTailorSourceInput, UpdateMappingItemInput, WebhookType } from './graphql'

type Properties<T> = Required<{
  [K in keyof T]: z.ZodType<T[K], any, T[K]>;
}>;

type definedNonNullAny = {};

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny => v !== undefined && v !== null;

export const definedNonNullAnySchema = z.any().refine((v) => isDefinedNonNullAny(v));

export const AggregationOpSchema = z.nativeEnum(AggregationOp);

export const AnalyticalAreaTypeSchema = z.nativeEnum(AnalyticalAreaType);

export const AreaQueryModeSchema = z.nativeEnum(AreaQueryMode);

export const CrmTypeSchema = z.nativeEnum(CrmType);

export const DataSourceTypeSchema = z.nativeEnum(DataSourceType);

export const GeoJsonTypesSchema = z.nativeEnum(GeoJsonTypes);

export const GeographyTypesSchema = z.nativeEnum(GeographyTypes);

export const OperationMessageKindSchema = z.nativeEnum(OperationMessageKind);

export const ProcrastinateJobStatusSchema = z.nativeEnum(ProcrastinateJobStatus);

export const WebhookTypeSchema = z.nativeEnum(WebhookType);

export function ActionNetworkSourceInputSchema(): z.ZodObject<Properties<ActionNetworkSourceInput>> {
  return z.object({
    addressField: z.string().nullish(),
    apiKey: z.string(),
    autoImportEnabled: z.boolean().nullish(),
    autoUpdateEnabled: z.boolean().nullish(),
    canDisplayPointField: z.string().nullish(),
    dataType: DataSourceTypeSchema.nullish(),
    description: z.string().nullish(),
    descriptionField: z.string().nullish(),
    emailField: z.string().nullish(),
    endTimeField: z.string().nullish(),
    firstNameField: z.string().nullish(),
    fullNameField: z.string().nullish(),
    geocodingConfig: definedNonNullAnySchema.nullish(),
    geographyColumn: z.string().nullish(),
    geographyColumnType: GeographyTypesSchema.nullish(),
    groupSlug: z.string(),
    id: definedNonNullAnySchema.nullish(),
    imageField: z.string().nullish(),
    lastNameField: z.string().nullish(),
    name: z.string().nullish(),
    organisation: z.lazy(() => OneToManyInputSchema().nullish()),
    phoneField: z.string().nullish(),
    postcodeField: z.string().nullish(),
    publicUrlField: z.string().nullish(),
    socialUrlField: z.string().nullish(),
    startTimeField: z.string().nullish(),
    titleField: z.string().nullish(),
    updateMapping: z.array(z.lazy(() => UpdateMappingItemInputSchema())).nullish()
  })
}

export function AggregationDefinitionSchema(): z.ZodObject<Properties<AggregationDefinition>> {
  return z.object({
    column: z.string(),
    id: z.string().nullish(),
    operation: AggregationOpSchema.nullish()
  })
}

export function AirtableSourceInputSchema(): z.ZodObject<Properties<AirtableSourceInput>> {
  return z.object({
    addressField: z.string().nullish(),
    apiKey: z.string(),
    autoImportEnabled: z.boolean().nullish(),
    autoUpdateEnabled: z.boolean().nullish(),
    baseId: z.string(),
    canDisplayPointField: z.string().nullish(),
    dataType: DataSourceTypeSchema.nullish(),
    description: z.string().nullish(),
    descriptionField: z.string().nullish(),
    emailField: z.string().nullish(),
    endTimeField: z.string().nullish(),
    firstNameField: z.string().nullish(),
    fullNameField: z.string().nullish(),
    geocodingConfig: definedNonNullAnySchema.nullish(),
    geographyColumn: z.string().nullish(),
    geographyColumnType: GeographyTypesSchema.nullish(),
    id: definedNonNullAnySchema.nullish(),
    imageField: z.string().nullish(),
    lastNameField: z.string().nullish(),
    name: z.string().nullish(),
    organisation: z.lazy(() => OneToManyInputSchema().nullish()),
    phoneField: z.string().nullish(),
    postcodeField: z.string().nullish(),
    publicUrlField: z.string().nullish(),
    socialUrlField: z.string().nullish(),
    startTimeField: z.string().nullish(),
    tableId: z.string(),
    titleField: z.string().nullish(),
    updateMapping: z.array(z.lazy(() => UpdateMappingItemInputSchema())).nullish()
  })
}

export function AreaFilterSchema(): z.ZodObject<Properties<AreaFilter>> {
  return z.object({
    AND: AreaFilterSchema().nullish(),
    DISTINCT: z.boolean().nullish(),
    NOT: AreaFilterSchema().nullish(),
    OR: AreaFilterSchema().nullish(),
    analyticalAreaType: AnalyticalAreaTypeSchema.nullish(),
    gss: StrFilterLookupSchema().nullish(),
    id: IdBaseFilterLookupSchema().nullish(),
    mapBounds: MapBoundsSchema().nullish(),
    name: StrFilterLookupSchema().nullish()
  })
}

export function AreaTypeFilterSchema(): z.ZodObject<Properties<AreaTypeFilter>> {
  return z.object({
    AND: AreaTypeFilterSchema().nullish(),
    DISTINCT: z.boolean().nullish(),
    NOT: AreaTypeFilterSchema().nullish(),
    OR: AreaTypeFilterSchema().nullish(),
    analyticalAreaType: AnalyticalAreaTypeSchema.nullish(),
    id: IdBaseFilterLookupSchema().nullish()
  })
}

export function CalculatedColumnSchema(): z.ZodObject<Properties<CalculatedColumn>> {
  return z.object({
    aggregationOperation: AggregationOpSchema.nullish(),
    expression: z.string(),
    id: z.string().nullish(),
    ignore: z.boolean().default(false).nullish(),
    isPercentage: z.boolean().default(false).nullish(),
    name: z.string()
  })
}

export function ChoroplethConfigSchema(): z.ZodObject<Properties<ChoroplethConfig>> {
  return z.object({
    categoryKey: z.string().nullish(),
    countKey: z.string().nullish(),
    isCountKeyPercentage: z.boolean().default(false).nullish()
  })
}

export function CommonDataLoaderFilterSchema(): z.ZodObject<Properties<CommonDataLoaderFilter>> {
  return z.object({
    dataType_Name: z.string()
  })
}

export function CreateExternalDataSourceInputSchema(): z.ZodObject<Properties<CreateExternalDataSourceInput>> {
  return z.object({
    actionnetwork: z.lazy(() => ActionNetworkSourceInputSchema().nullish()),
    airtable: z.lazy(() => AirtableSourceInputSchema().nullish()),
    editablegooglesheets: z.lazy(() => EditableGoogleSheetsSourceInputSchema().nullish()),
    mailchimp: z.lazy(() => MailChimpSourceInputSchema().nullish()),
    tickettailor: z.lazy(() => TicketTailorSourceInputSchema().nullish())
  })
}

export function CreateOrganisationInputSchema(): z.ZodObject<Properties<CreateOrganisationInput>> {
  return z.object({
    description: z.string().nullish(),
    name: z.string(),
    slug: z.string().nullish()
  })
}

export function DatetimeDatetimeFilterLookupSchema(): z.ZodObject<Properties<DatetimeDatetimeFilterLookup>> {
  return z.object({
    date: IntComparisonFilterLookupSchema().nullish(),
    day: IntComparisonFilterLookupSchema().nullish(),
    exact: definedNonNullAnySchema.nullish(),
    gt: definedNonNullAnySchema.nullish(),
    gte: definedNonNullAnySchema.nullish(),
    hour: IntComparisonFilterLookupSchema().nullish(),
    inList: z.array(definedNonNullAnySchema).nullish(),
    isNull: z.boolean().nullish(),
    isoWeekDay: IntComparisonFilterLookupSchema().nullish(),
    isoYear: IntComparisonFilterLookupSchema().nullish(),
    lt: definedNonNullAnySchema.nullish(),
    lte: definedNonNullAnySchema.nullish(),
    minute: IntComparisonFilterLookupSchema().nullish(),
    month: IntComparisonFilterLookupSchema().nullish(),
    quarter: IntComparisonFilterLookupSchema().nullish(),
    range: DatetimeRangeLookupSchema().nullish(),
    second: IntComparisonFilterLookupSchema().nullish(),
    time: IntComparisonFilterLookupSchema().nullish(),
    week: IntComparisonFilterLookupSchema().nullish(),
    weekDay: IntComparisonFilterLookupSchema().nullish(),
    year: IntComparisonFilterLookupSchema().nullish()
  })
}

export function DatetimeRangeLookupSchema(): z.ZodObject<Properties<DatetimeRangeLookup>> {
  return z.object({
    end: definedNonNullAnySchema.nullish(),
    start: definedNonNullAnySchema.nullish()
  })
}

export function EditableGoogleSheetsSourceInputSchema(): z.ZodObject<Properties<EditableGoogleSheetsSourceInput>> {
  return z.object({
    addressField: z.string().nullish(),
    autoImportEnabled: z.boolean().nullish(),
    autoUpdateEnabled: z.boolean().nullish(),
    canDisplayPointField: z.string().nullish(),
    dataType: DataSourceTypeSchema.nullish(),
    description: z.string().nullish(),
    descriptionField: z.string().nullish(),
    emailField: z.string().nullish(),
    endTimeField: z.string().nullish(),
    firstNameField: z.string().nullish(),
    fullNameField: z.string().nullish(),
    geocodingConfig: definedNonNullAnySchema.nullish(),
    geographyColumn: z.string().nullish(),
    geographyColumnType: GeographyTypesSchema.nullish(),
    id: definedNonNullAnySchema.nullish(),
    idField: z.string().nullish(),
    imageField: z.string().nullish(),
    lastNameField: z.string().nullish(),
    name: z.string().nullish(),
    oauthCredentials: z.string().nullish(),
    organisation: z.lazy(() => OneToManyInputSchema().nullish()),
    phoneField: z.string().nullish(),
    postcodeField: z.string().nullish(),
    publicUrlField: z.string().nullish(),
    sheetName: z.string(),
    socialUrlField: z.string().nullish(),
    spreadsheetId: z.string(),
    startTimeField: z.string().nullish(),
    titleField: z.string().nullish(),
    updateMapping: z.array(z.lazy(() => UpdateMappingItemInputSchema())).nullish()
  })
}

export function ExternalDataSourceFilterSchema(): z.ZodObject<Properties<ExternalDataSourceFilter>> {
  return z.object({
    AND: ExternalDataSourceFilterSchema().nullish(),
    DISTINCT: z.boolean().nullish(),
    NOT: ExternalDataSourceFilterSchema().nullish(),
    OR: ExternalDataSourceFilterSchema().nullish(),
    dataType: DataSourceTypeSchema.nullish(),
    geographyColumnType: GeographyTypesSchema.nullish()
  })
}

export function ExternalDataSourceInputSchema(): z.ZodObject<Properties<ExternalDataSourceInput>> {
  return z.object({
    addressField: z.string().nullish(),
    autoImportEnabled: z.boolean().nullish(),
    autoUpdateEnabled: z.boolean().nullish(),
    canDisplayPointField: z.string().nullish(),
    dataType: DataSourceTypeSchema.nullish(),
    description: z.string().nullish(),
    descriptionField: z.string().nullish(),
    emailField: z.string().nullish(),
    endTimeField: z.string().nullish(),
    firstNameField: z.string().nullish(),
    fullNameField: z.string().nullish(),
    geocodingConfig: definedNonNullAnySchema.nullish(),
    geographyColumn: z.string().nullish(),
    geographyColumnType: GeographyTypesSchema.nullish(),
    id: definedNonNullAnySchema.nullish(),
    imageField: z.string().nullish(),
    lastNameField: z.string().nullish(),
    name: z.string().nullish(),
    organisation: z.lazy(() => OneToManyInputSchema().nullish()),
    phoneField: z.string().nullish(),
    postcodeField: z.string().nullish(),
    publicUrlField: z.string().nullish(),
    socialUrlField: z.string().nullish(),
    startTimeField: z.string().nullish(),
    titleField: z.string().nullish(),
    updateMapping: z.array(z.lazy(() => UpdateMappingItemInputSchema())).nullish()
  })
}

export function GroupByColumnSchema(): z.ZodObject<Properties<GroupByColumn>> {
  return z.object({
    aggregationOperation: AggregationOpSchema.nullish(),
    column: z.string(),
    id: z.string().nullish(),
    ignore: z.boolean().default(false).nullish(),
    isPercentage: z.boolean().default(false).nullish(),
    name: z.string().nullish()
  })
}

export function HubPageInputSchema(): z.ZodObject<Properties<HubPageInput>> {
  return z.object({
    puckJsonContent: definedNonNullAnySchema.nullish(),
    slug: z.string().nullish(),
    title: z.string().nullish()
  })
}

export function IdBaseFilterLookupSchema(): z.ZodObject<Properties<IdBaseFilterLookup>> {
  return z.object({
    exact: z.string().nullish(),
    inList: z.array(z.string()).nullish(),
    isNull: z.boolean().nullish()
  })
}

export function IdObjectSchema(): z.ZodObject<Properties<IdObject>> {
  return z.object({
    id: z.string()
  })
}

export function IntComparisonFilterLookupSchema(): z.ZodObject<Properties<IntComparisonFilterLookup>> {
  return z.object({
    exact: z.number().nullish(),
    gt: z.number().nullish(),
    gte: z.number().nullish(),
    inList: z.array(z.number()).nullish(),
    isNull: z.boolean().nullish(),
    lt: z.number().nullish(),
    lte: z.number().nullish(),
    range: IntRangeLookupSchema().nullish()
  })
}

export function IntRangeLookupSchema(): z.ZodObject<Properties<IntRangeLookup>> {
  return z.object({
    end: z.number().nullish(),
    start: z.number().nullish()
  })
}

export function MailChimpSourceInputSchema(): z.ZodObject<Properties<MailChimpSourceInput>> {
  return z.object({
    addressField: z.string().nullish(),
    apiKey: z.string(),
    autoImportEnabled: z.boolean().nullish(),
    autoUpdateEnabled: z.boolean().nullish(),
    canDisplayPointField: z.string().nullish(),
    dataType: DataSourceTypeSchema.nullish(),
    description: z.string().nullish(),
    descriptionField: z.string().nullish(),
    emailField: z.string().nullish(),
    endTimeField: z.string().nullish(),
    firstNameField: z.string().nullish(),
    fullNameField: z.string().nullish(),
    geocodingConfig: definedNonNullAnySchema.nullish(),
    geographyColumn: z.string().nullish(),
    geographyColumnType: GeographyTypesSchema.nullish(),
    id: definedNonNullAnySchema.nullish(),
    imageField: z.string().nullish(),
    lastNameField: z.string().nullish(),
    listId: z.string(),
    name: z.string().nullish(),
    organisation: z.lazy(() => OneToManyInputSchema().nullish()),
    phoneField: z.string().nullish(),
    postcodeField: z.string().nullish(),
    publicUrlField: z.string().nullish(),
    socialUrlField: z.string().nullish(),
    startTimeField: z.string().nullish(),
    titleField: z.string().nullish(),
    updateMapping: z.array(z.lazy(() => UpdateMappingItemInputSchema())).nullish()
  })
}

export function MapBoundsSchema(): z.ZodObject<Properties<MapBounds>> {
  return z.object({
    east: z.number(),
    north: z.number(),
    south: z.number(),
    west: z.number()
  })
}

export function MapLayerInputSchema(): z.ZodObject<Properties<MapLayerInput>> {
  return z.object({
    customMarkerText: z.string().nullish(),
    id: z.string(),
    inspectorConfig: definedNonNullAnySchema.nullish(),
    inspectorType: z.string().nullish(),
    mapboxLayout: definedNonNullAnySchema.nullish(),
    mapboxPaint: definedNonNullAnySchema.nullish(),
    name: z.string(),
    source: z.string(),
    visible: z.boolean().default(true).nullish()
  })
}

export function MapReportInputSchema(): z.ZodObject<Properties<MapReportInput>> {
  return z.object({
    createdAt: definedNonNullAnySchema.nullish(),
    description: z.string().nullish(),
    displayOptions: definedNonNullAnySchema.nullish(),
    id: definedNonNullAnySchema.nullish(),
    lastUpdate: definedNonNullAnySchema.nullish(),
    layers: z.array(z.lazy(() => MapLayerInputSchema())).nullish(),
    name: z.string().nullish(),
    organisation: z.lazy(() => OneToManyInputSchema().nullish()),
    slug: z.string().nullish()
  })
}

export function OffsetPaginationInputSchema(): z.ZodObject<Properties<OffsetPaginationInput>> {
  return z.object({
    limit: z.number().nullish(),
    offset: z.number().default(0)
  })
}

export function OneToManyInputSchema(): z.ZodObject<Properties<OneToManyInput>> {
  return z.object({
    set: z.string().nullish()
  })
}

export function OrganisationFiltersSchema(): z.ZodObject<Properties<OrganisationFilters>> {
  return z.object({
    AND: OrganisationFiltersSchema().nullish(),
    DISTINCT: z.boolean().nullish(),
    NOT: OrganisationFiltersSchema().nullish(),
    OR: OrganisationFiltersSchema().nullish(),
    id: z.string().nullish(),
    slug: z.string().nullish()
  })
}

export function OrganisationInputPartialSchema(): z.ZodObject<Properties<OrganisationInputPartial>> {
  return z.object({
    description: z.string().nullish(),
    id: z.string().nullish(),
    name: z.string(),
    slug: z.string().nullish()
  })
}

export function PersonFilterSchema(): z.ZodObject<Properties<PersonFilter>> {
  return z.object({
    personType: z.string()
  })
}

export function QueueFilterSchema(): z.ZodObject<Properties<QueueFilter>> {
  return z.object({
    AND: QueueFilterSchema().nullish(),
    DISTINCT: z.boolean().nullish(),
    NOT: QueueFilterSchema().nullish(),
    OR: QueueFilterSchema().nullish(),
    attempts: IntComparisonFilterLookupSchema().nullish(),
    externalDataSourceId: z.string().nullish(),
    id: IdBaseFilterLookupSchema().nullish(),
    queueName: StrFilterLookupSchema().nullish(),
    scheduledAt: DatetimeDatetimeFilterLookupSchema().nullish(),
    status: ProcrastinateJobStatusSchema,
    taskName: StrFilterLookupSchema().nullish()
  })
}

export function ReportFilterSchema(): z.ZodObject<Properties<ReportFilter>> {
  return z.object({
    AND: ReportFilterSchema().nullish(),
    DISTINCT: z.boolean().nullish(),
    NOT: ReportFilterSchema().nullish(),
    OR: ReportFilterSchema().nullish(),
    createdAt: DatetimeDatetimeFilterLookupSchema().nullish(),
    lastUpdate: DatetimeDatetimeFilterLookupSchema().nullish(),
    organisation: OrganisationFiltersSchema()
  })
}

export function SharingPermissionCudInputSchema(): z.ZodObject<Properties<SharingPermissionCudInput>> {
  return z.object({
    externalDataSourceId: definedNonNullAnySchema.nullish(),
    id: definedNonNullAnySchema.nullish(),
    organisationId: z.string().nullish(),
    visibilityRecordCoordinates: z.boolean().nullish(),
    visibilityRecordDetails: z.boolean().nullish()
  })
}

export function SharingPermissionInputSchema(): z.ZodObject<Properties<SharingPermissionInput>> {
  return z.object({
    deleted: z.boolean().default(false).nullish(),
    externalDataSourceId: z.string(),
    id: z.string().nullish(),
    organisationId: z.string(),
    visibilityRecordCoordinates: z.boolean().default(false).nullish(),
    visibilityRecordDetails: z.boolean().default(false).nullish()
  })
}

export function StatisticsConfigSchema(): z.ZodObject<Properties<StatisticsConfig>> {
  return z.object({
    aggregationOperation: AggregationOpSchema.nullish(),
    aggregationOperations: z.array(AggregationDefinitionSchema()).nullish(),
    areaQueryMode: AreaQueryModeSchema.nullish(),
    calculatedColumns: z.array(CalculatedColumnSchema()).nullish(),
    excludeColumns: z.array(z.string()).nullish(),
    formatNumericKeys: z.boolean().default(false).nullish(),
    groupAbsolutely: z.boolean().default(false).nullish(),
    groupByArea: AnalyticalAreaTypeSchema.nullish(),
    groupByColumns: z.array(GroupByColumnSchema()).nullish(),
    gssCodes: z.array(z.string()).nullish(),
    preGroupByCalculatedColumns: z.array(CalculatedColumnSchema()).nullish(),
    queryId: z.string().nullish(),
    returnColumns: z.array(z.string()).nullish(),
    sourceIds: z.array(z.string()).nullish()
  })
}

export function StrFilterLookupSchema(): z.ZodObject<Properties<StrFilterLookup>> {
  return z.object({
    contains: z.string().nullish(),
    endsWith: z.string().nullish(),
    exact: z.string().nullish(),
    iContains: z.string().nullish(),
    iEndsWith: z.string().nullish(),
    iExact: z.string().nullish(),
    iRegex: z.string().nullish(),
    iStartsWith: z.string().nullish(),
    inList: z.array(z.string()).nullish(),
    isNull: z.boolean().nullish(),
    regex: z.string().nullish(),
    startsWith: z.string().nullish()
  })
}

export function TicketTailorSourceInputSchema(): z.ZodObject<Properties<TicketTailorSourceInput>> {
  return z.object({
    addressField: z.string().nullish(),
    apiKey: z.string(),
    autoImportEnabled: z.boolean().nullish(),
    autoUpdateEnabled: z.boolean().nullish(),
    canDisplayPointField: z.string().nullish(),
    dataType: DataSourceTypeSchema.nullish(),
    description: z.string().nullish(),
    descriptionField: z.string().nullish(),
    emailField: z.string().nullish(),
    endTimeField: z.string().nullish(),
    firstNameField: z.string().nullish(),
    fullNameField: z.string().nullish(),
    geocodingConfig: definedNonNullAnySchema.nullish(),
    geographyColumn: z.string().nullish(),
    geographyColumnType: GeographyTypesSchema.nullish(),
    id: definedNonNullAnySchema.nullish(),
    imageField: z.string().nullish(),
    lastNameField: z.string().nullish(),
    name: z.string().nullish(),
    organisation: z.lazy(() => OneToManyInputSchema().nullish()),
    phoneField: z.string().nullish(),
    postcodeField: z.string().nullish(),
    publicUrlField: z.string().nullish(),
    socialUrlField: z.string().nullish(),
    startTimeField: z.string().nullish(),
    titleField: z.string().nullish(),
    updateMapping: z.array(z.lazy(() => UpdateMappingItemInputSchema())).nullish()
  })
}

export function UpdateMappingItemInputSchema(): z.ZodObject<Properties<UpdateMappingItemInput>> {
  return z.object({
    destinationColumn: z.string(),
    source: z.string(),
    sourcePath: z.string()
  })
}
