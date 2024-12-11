/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** Date (isoformat) */
  Date: { input: any; output: any; }
  /** Date with time (isoformat) */
  DateTime: { input: any; output: any; }
  /**
   *
   *      Errors messages and codes mapped to
   *     fields or non fields errors.
   *     Example:
   *     {
   *         field_name: [
   *             {
   *                 "message": "error message",
   *                 "code": "error_code"
   *             }
   *         ],
   *         other_field: [
   *             {
   *                 "message": "error message",
   *                 "code": "error_code"
   *             }
   *         ],
   *         nonFieldErrors: [
   *             {
   *                 "message": "error message",
   *                 "code": "error_code"
   *             }
   *         ]
   *     }
   *
   */
  ExpectedError: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](https://ecma-international.org/wp-content/uploads/ECMA-404_2nd_edition_december_2017.pdf). */
  JSON: { input: any; output: any; }
  UUID: { input: any; output: any; }
  /** Represents NULL values */
  Void: { input: any; output: any; }
};

/** A model to store generated and revoked JWT tokens. */
export type ApiToken = {
  __typename?: 'APIToken';
  createdAt: Scalars['DateTime']['output'];
  expiresAt: Scalars['DateTime']['output'];
  revoked: Scalars['Boolean']['output'];
  signature: Scalars['ID']['output'];
  token: Scalars['String']['output'];
};

/** An Action Network member list. */
export type ActionNetworkSource = Analytics & {
  __typename?: 'ActionNetworkSource';
  addressField?: Maybe<Scalars['String']['output']>;
  allowUpdates: Scalars['Boolean']['output'];
  apiKey: Scalars['String']['output'];
  autoImportEnabled: Scalars['Boolean']['output'];
  autoUpdateEnabled: Scalars['Boolean']['output'];
  automatedWebhooks: Scalars['Boolean']['output'];
  canDisplayPointField?: Maybe<Scalars['String']['output']>;
  connectionDetails: AirtableSourceMailchimpSourceActionNetworkSourceEditableGoogleSheetsSourceTicketTailorSource;
  createdAt: Scalars['DateTime']['output'];
  crmType: CrmType;
  dataType: DataSourceType;
  defaultDataType?: Maybe<Scalars['String']['output']>;
  defaults: Scalars['JSON']['output'];
  description?: Maybe<Scalars['String']['output']>;
  descriptionField?: Maybe<Scalars['String']['output']>;
  emailField?: Maybe<Scalars['String']['output']>;
  endTimeField?: Maybe<Scalars['String']['output']>;
  fieldDefinitions?: Maybe<Array<FieldDefinition>>;
  firstNameField?: Maybe<Scalars['String']['output']>;
  fullNameField?: Maybe<Scalars['String']['output']>;
  geographyColumn?: Maybe<Scalars['String']['output']>;
  geographyColumnType: GeographyTypes;
  groupSlug: Scalars['String']['output'];
  hasWebhooks: Scalars['Boolean']['output'];
  healthcheck: Scalars['Boolean']['output'];
  id: Scalars['UUID']['output'];
  imageField?: Maybe<Scalars['String']['output']>;
  importProgress?: Maybe<BatchJobProgress>;
  importedDataCount: Scalars['Int']['output'];
  importedDataCountByArea: Array<GroupedDataCount>;
  importedDataCountByConstituency: Array<GroupedDataCount>;
  importedDataCountByConstituency2024: Array<GroupedDataCount>;
  importedDataCountByConstituencyBySource: Array<GroupedDataCountWithBreakdown>;
  importedDataCountByCouncil: Array<GroupedDataCount>;
  importedDataCountByRegion: Array<GroupedDataCount>;
  importedDataCountByWard: Array<GroupedDataCount>;
  importedDataCountForArea?: Maybe<GroupedDataCount>;
  importedDataCountForConstituency?: Maybe<GroupedDataCount>;
  importedDataCountForConstituency2024?: Maybe<GroupedDataCount>;
  introspectFields: Scalars['Boolean']['output'];
  isImportScheduled: Scalars['Boolean']['output'];
  isUpdateScheduled: Scalars['Boolean']['output'];
  jobs: Array<QueueJob>;
  lastImportJob?: Maybe<QueueJob>;
  lastNameField?: Maybe<Scalars['String']['output']>;
  lastUpdate: Scalars['DateTime']['output'];
  lastUpdateJob?: Maybe<QueueJob>;
  name: Scalars['String']['output'];
  oauthCredentials?: Maybe<Scalars['String']['output']>;
  organisation: Organisation;
  organisationId: Scalars['String']['output'];
  orgsWithAccess: Array<Organisation>;
  phoneField?: Maybe<Scalars['String']['output']>;
  postcodeField?: Maybe<Scalars['String']['output']>;
  predefinedColumnNames: Scalars['Boolean']['output'];
  publicUrlField?: Maybe<Scalars['String']['output']>;
  recordUrlTemplate?: Maybe<Scalars['String']['output']>;
  remoteName?: Maybe<Scalars['String']['output']>;
  remoteUrl?: Maybe<Scalars['String']['output']>;
  sharingPermissions: Array<SharingPermission>;
  socialUrlField?: Maybe<Scalars['String']['output']>;
  startTimeField?: Maybe<Scalars['String']['output']>;
  titleField?: Maybe<Scalars['String']['output']>;
  updateMapping?: Maybe<Array<AutoUpdateConfig>>;
  updateProgress?: Maybe<BatchJobProgress>;
  webhookHealthcheck: Scalars['Boolean']['output'];
  webhookUrl: Scalars['String']['output'];
};


/** An Action Network member list. */
export type ActionNetworkSourceImportedDataCountByAreaArgs = {
  analyticalAreaType: AnalyticalAreaType;
  column?: InputMaybe<Scalars['String']['input']>;
  operation?: InputMaybe<Scalars['String']['input']>;
};


/** An Action Network member list. */
export type ActionNetworkSourceImportedDataCountByConstituencyBySourceArgs = {
  gss: Scalars['String']['input'];
};


/** An Action Network member list. */
export type ActionNetworkSourceImportedDataCountForAreaArgs = {
  analyticalAreaType: AnalyticalAreaType;
  gss: Scalars['String']['input'];
};


/** An Action Network member list. */
export type ActionNetworkSourceImportedDataCountForConstituencyArgs = {
  gss: Scalars['String']['input'];
};


/** An Action Network member list. */
export type ActionNetworkSourceImportedDataCountForConstituency2024Args = {
  gss: Scalars['String']['input'];
};


/** An Action Network member list. */
export type ActionNetworkSourceJobsArgs = {
  filters?: InputMaybe<QueueFilter>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


/** An Action Network member list. */
export type ActionNetworkSourceOrgsWithAccessArgs = {
  filters?: InputMaybe<OrganisationFilters>;
};

/** An Action Network member list. */
export type ActionNetworkSourceInput = {
  addressField?: InputMaybe<Scalars['String']['input']>;
  apiKey: Scalars['String']['input'];
  autoImportEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  autoUpdateEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  canDisplayPointField?: InputMaybe<Scalars['String']['input']>;
  dataType?: InputMaybe<DataSourceType>;
  description?: InputMaybe<Scalars['String']['input']>;
  descriptionField?: InputMaybe<Scalars['String']['input']>;
  emailField?: InputMaybe<Scalars['String']['input']>;
  endTimeField?: InputMaybe<Scalars['String']['input']>;
  firstNameField?: InputMaybe<Scalars['String']['input']>;
  fullNameField?: InputMaybe<Scalars['String']['input']>;
  geographyColumn?: InputMaybe<Scalars['String']['input']>;
  geographyColumnType?: InputMaybe<GeographyTypes>;
  groupSlug: Scalars['String']['input'];
  id?: InputMaybe<Scalars['UUID']['input']>;
  imageField?: InputMaybe<Scalars['String']['input']>;
  lastNameField?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  organisation?: InputMaybe<OneToManyInput>;
  phoneField?: InputMaybe<Scalars['String']['input']>;
  postcodeField?: InputMaybe<Scalars['String']['input']>;
  publicUrlField?: InputMaybe<Scalars['String']['input']>;
  socialUrlField?: InputMaybe<Scalars['String']['input']>;
  startTimeField?: InputMaybe<Scalars['String']['input']>;
  titleField?: InputMaybe<Scalars['String']['input']>;
  updateMapping?: InputMaybe<Array<UpdateMappingItemInput>>;
};

/** An Airtable table. */
export type AirtableSource = Analytics & {
  __typename?: 'AirtableSource';
  addressField?: Maybe<Scalars['String']['output']>;
  allowUpdates: Scalars['Boolean']['output'];
  /** Personal access token. Requires the following 4 scopes: data.records:read, data.records:write, schema.bases:read, webhook:manage */
  apiKey: Scalars['String']['output'];
  autoImportEnabled: Scalars['Boolean']['output'];
  autoUpdateEnabled: Scalars['Boolean']['output'];
  automatedWebhooks: Scalars['Boolean']['output'];
  baseId: Scalars['String']['output'];
  canDisplayPointField?: Maybe<Scalars['String']['output']>;
  connectionDetails: AirtableSourceMailchimpSourceActionNetworkSourceEditableGoogleSheetsSourceTicketTailorSource;
  createdAt: Scalars['DateTime']['output'];
  crmType: CrmType;
  dataType: DataSourceType;
  defaultDataType?: Maybe<Scalars['String']['output']>;
  defaults: Scalars['JSON']['output'];
  description?: Maybe<Scalars['String']['output']>;
  descriptionField?: Maybe<Scalars['String']['output']>;
  emailField?: Maybe<Scalars['String']['output']>;
  endTimeField?: Maybe<Scalars['String']['output']>;
  fieldDefinitions?: Maybe<Array<FieldDefinition>>;
  firstNameField?: Maybe<Scalars['String']['output']>;
  fullNameField?: Maybe<Scalars['String']['output']>;
  geographyColumn?: Maybe<Scalars['String']['output']>;
  geographyColumnType: GeographyTypes;
  hasWebhooks: Scalars['Boolean']['output'];
  healthcheck: Scalars['Boolean']['output'];
  id: Scalars['UUID']['output'];
  imageField?: Maybe<Scalars['String']['output']>;
  importProgress?: Maybe<BatchJobProgress>;
  importedDataCount: Scalars['Int']['output'];
  importedDataCountByArea: Array<GroupedDataCount>;
  importedDataCountByConstituency: Array<GroupedDataCount>;
  importedDataCountByConstituency2024: Array<GroupedDataCount>;
  importedDataCountByConstituencyBySource: Array<GroupedDataCountWithBreakdown>;
  importedDataCountByCouncil: Array<GroupedDataCount>;
  importedDataCountByRegion: Array<GroupedDataCount>;
  importedDataCountByWard: Array<GroupedDataCount>;
  importedDataCountForArea?: Maybe<GroupedDataCount>;
  importedDataCountForConstituency?: Maybe<GroupedDataCount>;
  importedDataCountForConstituency2024?: Maybe<GroupedDataCount>;
  introspectFields: Scalars['Boolean']['output'];
  isImportScheduled: Scalars['Boolean']['output'];
  isUpdateScheduled: Scalars['Boolean']['output'];
  jobs: Array<QueueJob>;
  lastImportJob?: Maybe<QueueJob>;
  lastNameField?: Maybe<Scalars['String']['output']>;
  lastUpdate: Scalars['DateTime']['output'];
  lastUpdateJob?: Maybe<QueueJob>;
  name: Scalars['String']['output'];
  oauthCredentials?: Maybe<Scalars['String']['output']>;
  organisation: Organisation;
  organisationId: Scalars['String']['output'];
  orgsWithAccess: Array<Organisation>;
  phoneField?: Maybe<Scalars['String']['output']>;
  postcodeField?: Maybe<Scalars['String']['output']>;
  predefinedColumnNames: Scalars['Boolean']['output'];
  publicUrlField?: Maybe<Scalars['String']['output']>;
  recordUrlTemplate?: Maybe<Scalars['String']['output']>;
  remoteName?: Maybe<Scalars['String']['output']>;
  remoteUrl?: Maybe<Scalars['String']['output']>;
  sharingPermissions: Array<SharingPermission>;
  socialUrlField?: Maybe<Scalars['String']['output']>;
  startTimeField?: Maybe<Scalars['String']['output']>;
  tableId: Scalars['String']['output'];
  titleField?: Maybe<Scalars['String']['output']>;
  updateMapping?: Maybe<Array<AutoUpdateConfig>>;
  updateProgress?: Maybe<BatchJobProgress>;
  webhookHealthcheck: Scalars['Boolean']['output'];
  webhookUrl: Scalars['String']['output'];
};


/** An Airtable table. */
export type AirtableSourceImportedDataCountByAreaArgs = {
  analyticalAreaType: AnalyticalAreaType;
  column?: InputMaybe<Scalars['String']['input']>;
  operation?: InputMaybe<Scalars['String']['input']>;
};


/** An Airtable table. */
export type AirtableSourceImportedDataCountByConstituencyBySourceArgs = {
  gss: Scalars['String']['input'];
};


/** An Airtable table. */
export type AirtableSourceImportedDataCountForAreaArgs = {
  analyticalAreaType: AnalyticalAreaType;
  gss: Scalars['String']['input'];
};


/** An Airtable table. */
export type AirtableSourceImportedDataCountForConstituencyArgs = {
  gss: Scalars['String']['input'];
};


/** An Airtable table. */
export type AirtableSourceImportedDataCountForConstituency2024Args = {
  gss: Scalars['String']['input'];
};


/** An Airtable table. */
export type AirtableSourceJobsArgs = {
  filters?: InputMaybe<QueueFilter>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


/** An Airtable table. */
export type AirtableSourceOrgsWithAccessArgs = {
  filters?: InputMaybe<OrganisationFilters>;
};

/** An Airtable table. */
export type AirtableSourceInput = {
  addressField?: InputMaybe<Scalars['String']['input']>;
  /** Personal access token. Requires the following 4 scopes: data.records:read, data.records:write, schema.bases:read, webhook:manage */
  apiKey: Scalars['String']['input'];
  autoImportEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  autoUpdateEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  baseId: Scalars['String']['input'];
  canDisplayPointField?: InputMaybe<Scalars['String']['input']>;
  dataType?: InputMaybe<DataSourceType>;
  description?: InputMaybe<Scalars['String']['input']>;
  descriptionField?: InputMaybe<Scalars['String']['input']>;
  emailField?: InputMaybe<Scalars['String']['input']>;
  endTimeField?: InputMaybe<Scalars['String']['input']>;
  firstNameField?: InputMaybe<Scalars['String']['input']>;
  fullNameField?: InputMaybe<Scalars['String']['input']>;
  geographyColumn?: InputMaybe<Scalars['String']['input']>;
  geographyColumnType?: InputMaybe<GeographyTypes>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  imageField?: InputMaybe<Scalars['String']['input']>;
  lastNameField?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  organisation?: InputMaybe<OneToManyInput>;
  phoneField?: InputMaybe<Scalars['String']['input']>;
  postcodeField?: InputMaybe<Scalars['String']['input']>;
  publicUrlField?: InputMaybe<Scalars['String']['input']>;
  socialUrlField?: InputMaybe<Scalars['String']['input']>;
  startTimeField?: InputMaybe<Scalars['String']['input']>;
  tableId: Scalars['String']['input'];
  titleField?: InputMaybe<Scalars['String']['input']>;
  updateMapping?: InputMaybe<Array<UpdateMappingItemInput>>;
};

export type AirtableSourceMailchimpSourceActionNetworkSourceEditableGoogleSheetsSourceTicketTailorSource = ActionNetworkSource | AirtableSource | EditableGoogleSheetsSource | MailchimpSource | TicketTailorSource;

export enum AnalyticalAreaType {
  AdminDistrict = 'admin_district',
  AdminWard = 'admin_ward',
  ParliamentaryConstituency = 'parliamentary_constituency',
  ParliamentaryConstituency_2024 = 'parliamentary_constituency_2024'
}

export type Analytics = {
  importedDataCount: Scalars['Int']['output'];
  importedDataCountByArea: Array<GroupedDataCount>;
  importedDataCountByConstituency: Array<GroupedDataCount>;
  importedDataCountByConstituency2024: Array<GroupedDataCount>;
  importedDataCountByConstituencyBySource: Array<GroupedDataCountWithBreakdown>;
  importedDataCountByCouncil: Array<GroupedDataCount>;
  importedDataCountByRegion: Array<GroupedDataCount>;
  importedDataCountByWard: Array<GroupedDataCount>;
  importedDataCountForArea?: Maybe<GroupedDataCount>;
  importedDataCountForConstituency?: Maybe<GroupedDataCount>;
  importedDataCountForConstituency2024?: Maybe<GroupedDataCount>;
};


export type AnalyticsImportedDataCountByAreaArgs = {
  analyticalAreaType: AnalyticalAreaType;
  column?: InputMaybe<Scalars['String']['input']>;
  operation?: InputMaybe<Scalars['String']['input']>;
};


export type AnalyticsImportedDataCountByConstituencyBySourceArgs = {
  gss: Scalars['String']['input'];
};


export type AnalyticsImportedDataCountForAreaArgs = {
  analyticalAreaType: AnalyticalAreaType;
  gss: Scalars['String']['input'];
};


export type AnalyticsImportedDataCountForConstituencyArgs = {
  gss: Scalars['String']['input'];
};


export type AnalyticsImportedDataCountForConstituency2024Args = {
  gss: Scalars['String']['input'];
};

/** Area(id, mapit_id, gss, name, area_type, geometry, polygon, point) */
export type Area = {
  __typename?: 'Area';
  areaType: AreaType;
  data: Array<AreaData>;
  datum?: Maybe<AreaData>;
  fitBounds?: Maybe<Scalars['JSON']['output']>;
  genericDataForHub: Array<GenericData>;
  geometry?: Maybe<Scalars['String']['output']>;
  gss: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastElection?: Maybe<ConstituencyElectionResult>;
  mapitId: Scalars['String']['output'];
  name: Scalars['String']['output'];
  overlaps: Array<DjangoModelType>;
  people: Array<Person>;
  person?: Maybe<Person>;
  point?: Maybe<PointFeature>;
  polygon?: Maybe<MultiPolygonFeature>;
  samplePostcode?: Maybe<PostcodesIoResult>;
};


/** Area(id, mapit_id, gss, name, area_type, geometry, polygon, point) */
export type AreaDataArgs = {
  filters?: InputMaybe<CommonDataLoaderFilter>;
};


/** Area(id, mapit_id, gss, name, area_type, geometry, polygon, point) */
export type AreaDatumArgs = {
  filters?: InputMaybe<CommonDataLoaderFilter>;
};


/** Area(id, mapit_id, gss, name, area_type, geometry, polygon, point) */
export type AreaGenericDataForHubArgs = {
  hostname: Scalars['String']['input'];
};


/** Area(id, mapit_id, gss, name, area_type, geometry, polygon, point) */
export type AreaPeopleArgs = {
  filters?: InputMaybe<PersonFilter>;
};


/** Area(id, mapit_id, gss, name, area_type, geometry, polygon, point) */
export type AreaPersonArgs = {
  filters?: InputMaybe<PersonFilter>;
};


/** Area(id, mapit_id, gss, name, area_type, geometry, polygon, point) */
export type AreaPointArgs = {
  withParentData?: Scalars['Boolean']['input'];
};


/** Area(id, mapit_id, gss, name, area_type, geometry, polygon, point) */
export type AreaPolygonArgs = {
  withParentData?: Scalars['Boolean']['input'];
};

/** AreaData(id, data_type, data, date, float, int, json, area) */
export type AreaData = CommonData & {
  __typename?: 'AreaData';
  area: Area;
  data: Scalars['String']['output'];
  dataType: DataType;
  date?: Maybe<Scalars['DateTime']['output']>;
  float?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  int?: Maybe<Scalars['Int']['output']>;
  json?: Maybe<Scalars['JSON']['output']>;
  shade?: Maybe<Scalars['String']['output']>;
};

/** AreaType(id, name, code, area_type, description) */
export type AreaType = {
  __typename?: 'AreaType';
  areaType: Scalars['String']['output'];
  code: Scalars['String']['output'];
  dataTypes: Array<DataType>;
  description: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type AuthenticatedPostcodeQueryResponse = {
  __typename?: 'AuthenticatedPostcodeQueryResponse';
  constituency?: Maybe<Area>;
  constituency2024?: Maybe<Area>;
  customSourceData?: Maybe<Scalars['String']['output']>;
  electoralCommission?: Maybe<ElectoralCommissionPostcodeLookup>;
  postcode: Scalars['String']['output'];
  postcodesIO?: Maybe<PostcodesIoResult>;
};


export type AuthenticatedPostcodeQueryResponseCustomSourceDataArgs = {
  source: Scalars['String']['input'];
  sourcePath: Scalars['String']['input'];
};


export type AuthenticatedPostcodeQueryResponseElectoralCommissionArgs = {
  addressSlug?: InputMaybe<Scalars['String']['input']>;
};

export type AutoUpdateConfig = {
  __typename?: 'AutoUpdateConfig';
  destinationColumn: Scalars['String']['output'];
  source: Scalars['String']['output'];
  sourcePath: Scalars['String']['output'];
};

export type BatchJobProgress = {
  __typename?: 'BatchJobProgress';
  doing?: Maybe<Scalars['Int']['output']>;
  done?: Maybe<Scalars['Int']['output']>;
  estimatedFinishTime?: Maybe<Scalars['DateTime']['output']>;
  estimatedSecondsRemaining?: Maybe<Scalars['Float']['output']>;
  failed?: Maybe<Scalars['Int']['output']>;
  hasForecast: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  remaining?: Maybe<Scalars['Int']['output']>;
  secondsPerRecord?: Maybe<Scalars['Float']['output']>;
  startedAt: Scalars['DateTime']['output'];
  status: ProcrastinateJobStatus;
  succeeded?: Maybe<Scalars['Int']['output']>;
  total?: Maybe<Scalars['Int']['output']>;
};

export type CommonData = {
  data: Scalars['String']['output'];
  dataType: DataType;
  date?: Maybe<Scalars['DateTime']['output']>;
  float?: Maybe<Scalars['Float']['output']>;
  int?: Maybe<Scalars['Int']['output']>;
  json?: Maybe<Scalars['JSON']['output']>;
  shade?: Maybe<Scalars['String']['output']>;
};

export type CommonDataLoaderFilter = {
  dataType_Name: Scalars['String']['input'];
};

export type ConstituencyElectionResult = {
  __typename?: 'ConstituencyElectionResult';
  date: Scalars['String']['output'];
  results: Array<PartyResult>;
  stats: ConstituencyElectionStats;
};

export type ConstituencyElectionStats = {
  __typename?: 'ConstituencyElectionStats';
  constituencyName: Scalars['String']['output'];
  constituencyType: Scalars['String']['output'];
  countryName: Scalars['String']['output'];
  countyName: Scalars['String']['output'];
  date: Scalars['String']['output'];
  declarationTime: Scalars['String']['output'];
  electorate: Scalars['Int']['output'];
  firstParty: Scalars['String']['output'];
  firstPartyResult: PartyResult;
  invalidVotes: Scalars['Int']['output'];
  majority: Scalars['Int']['output'];
  memberFirstName: Scalars['String']['output'];
  memberGender: Scalars['String']['output'];
  memberSurname: Scalars['String']['output'];
  onsRegionId: Scalars['String']['output'];
  regionName: Scalars['String']['output'];
  result: Scalars['String']['output'];
  secondParty: Scalars['String']['output'];
  secondPartyResult: PartyResult;
  validVotes: Scalars['Int']['output'];
};

export type CreateExternalDataSourceInput = {
  actionnetwork?: InputMaybe<ActionNetworkSourceInput>;
  airtable?: InputMaybe<AirtableSourceInput>;
  editablegooglesheets?: InputMaybe<EditableGoogleSheetsSourceInput>;
  mailchimp?: InputMaybe<MailChimpSourceInput>;
  tickettailor?: InputMaybe<TicketTailorSourceInput>;
};

export type CreateExternalDataSourceOutput = {
  __typename?: 'CreateExternalDataSourceOutput';
  code: Scalars['Int']['output'];
  errors: Array<MutationError>;
  result?: Maybe<ExternalDataSource>;
};

export type CreateMapReportPayload = MapReport | OperationInfo;

export type CreateOrganisationInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  slug?: InputMaybe<Scalars['String']['input']>;
};

export enum CrmType {
  Actionnetwork = 'actionnetwork',
  Airtable = 'airtable',
  Editablegooglesheets = 'editablegooglesheets',
  Mailchimp = 'mailchimp',
  Tickettailor = 'tickettailor'
}

/** DataSet(id, name, description, label, data_type, last_update, source_label, source, source_type, data_url, release_date, is_upload, is_range, featured, order, category, subcategory, table, comparators, options, default_value, is_filterable, is_shadable, is_public, fill_blanks, exclude_countries, unit_type, unit_distribution, external_data_source) */
export type DataSet = {
  __typename?: 'DataSet';
  areasAvailable: Array<DjangoModelType>;
  category?: Maybe<Scalars['String']['output']>;
  dataType: DataType;
  dataUrl?: Maybe<Scalars['String']['output']>;
  defaultValue?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  externalDataSource: ExternalDataSource;
  featured: Scalars['Boolean']['output'];
  fillBlanks: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  isFilterable: Scalars['Boolean']['output'];
  isPublic: Scalars['Boolean']['output'];
  isRange: Scalars['Boolean']['output'];
  isShadable: Scalars['Boolean']['output'];
  isUpload: Scalars['Boolean']['output'];
  label?: Maybe<Scalars['String']['output']>;
  lastUpdate: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  options: Array<DataSetOption>;
  order?: Maybe<Scalars['Int']['output']>;
  releaseDate?: Maybe<Scalars['String']['output']>;
  source: Scalars['String']['output'];
  sourceLabel?: Maybe<Scalars['String']['output']>;
  sourceType?: Maybe<Scalars['String']['output']>;
  subcategory?: Maybe<Scalars['String']['output']>;
  table?: Maybe<Scalars['String']['output']>;
  unitDistribution?: Maybe<Scalars['String']['output']>;
  unitType?: Maybe<Scalars['String']['output']>;
};

export type DataSetOption = {
  __typename?: 'DataSetOption';
  shader: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export enum DataSourceType {
  AreaStats = 'AREA_STATS',
  Event = 'EVENT',
  Group = 'GROUP',
  Location = 'LOCATION',
  Member = 'MEMBER',
  Other = 'OTHER',
  Story = 'STORY'
}

/** DataType(id, data_set, name, data_type, last_update, average, maximum, minimum, label, description, order, area_type, auto_converted, auto_converted_text) */
export type DataType = {
  __typename?: 'DataType';
  areaType?: Maybe<DjangoModelType>;
  /** True if this has been auto converted from an area with overlapping geometry */
  autoConverted: Scalars['Boolean']['output'];
  autoConvertedText?: Maybe<Scalars['String']['output']>;
  average?: Maybe<Scalars['Float']['output']>;
  dataSet: DataSet;
  dataType: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  label?: Maybe<Scalars['String']['output']>;
  lastUpdate: Scalars['DateTime']['output'];
  maximum?: Maybe<Scalars['Float']['output']>;
  minimum?: Maybe<Scalars['Float']['output']>;
  name: Scalars['String']['output'];
  order?: Maybe<Scalars['Int']['output']>;
};

export type DatetimeFilterLookup = {
  contains?: InputMaybe<Scalars['DateTime']['input']>;
  endsWith?: InputMaybe<Scalars['DateTime']['input']>;
  exact?: InputMaybe<Scalars['DateTime']['input']>;
  gt?: InputMaybe<Scalars['DateTime']['input']>;
  gte?: InputMaybe<Scalars['DateTime']['input']>;
  iContains?: InputMaybe<Scalars['DateTime']['input']>;
  iEndsWith?: InputMaybe<Scalars['DateTime']['input']>;
  iExact?: InputMaybe<Scalars['DateTime']['input']>;
  iRegex?: InputMaybe<Scalars['String']['input']>;
  iStartsWith?: InputMaybe<Scalars['DateTime']['input']>;
  inList?: InputMaybe<Array<Scalars['DateTime']['input']>>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  lt?: InputMaybe<Scalars['DateTime']['input']>;
  lte?: InputMaybe<Scalars['DateTime']['input']>;
  range?: InputMaybe<Array<Scalars['DateTime']['input']>>;
  regex?: InputMaybe<Scalars['String']['input']>;
  startsWith?: InputMaybe<Scalars['DateTime']['input']>;
};

export type DjangoImageType = {
  __typename?: 'DjangoImageType';
  height: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  path: Scalars['String']['output'];
  size: Scalars['Int']['output'];
  url: Scalars['String']['output'];
  width: Scalars['Int']['output'];
};

export type DjangoModelFilterInput = {
  pk: Scalars['ID']['input'];
};

export type DjangoModelType = {
  __typename?: 'DjangoModelType';
  pk: Scalars['ID']['output'];
};

/** An editable Google Sheet */
export type EditableGoogleSheetsSource = Analytics & {
  __typename?: 'EditableGoogleSheetsSource';
  addressField?: Maybe<Scalars['String']['output']>;
  allowUpdates: Scalars['Boolean']['output'];
  autoImportEnabled: Scalars['Boolean']['output'];
  autoUpdateEnabled: Scalars['Boolean']['output'];
  automatedWebhooks: Scalars['Boolean']['output'];
  canDisplayPointField?: Maybe<Scalars['String']['output']>;
  connectionDetails: AirtableSourceMailchimpSourceActionNetworkSourceEditableGoogleSheetsSourceTicketTailorSource;
  createdAt: Scalars['DateTime']['output'];
  crmType: CrmType;
  dataType: DataSourceType;
  defaultDataType?: Maybe<Scalars['String']['output']>;
  defaults: Scalars['JSON']['output'];
  description?: Maybe<Scalars['String']['output']>;
  descriptionField?: Maybe<Scalars['String']['output']>;
  emailField?: Maybe<Scalars['String']['output']>;
  endTimeField?: Maybe<Scalars['String']['output']>;
  fieldDefinitions?: Maybe<Array<FieldDefinition>>;
  firstNameField?: Maybe<Scalars['String']['output']>;
  fullNameField?: Maybe<Scalars['String']['output']>;
  geographyColumn?: Maybe<Scalars['String']['output']>;
  geographyColumnType: GeographyTypes;
  hasWebhooks: Scalars['Boolean']['output'];
  healthcheck: Scalars['Boolean']['output'];
  id: Scalars['UUID']['output'];
  imageField?: Maybe<Scalars['String']['output']>;
  importProgress?: Maybe<BatchJobProgress>;
  importedDataCount: Scalars['Int']['output'];
  importedDataCountByArea: Array<GroupedDataCount>;
  importedDataCountByConstituency: Array<GroupedDataCount>;
  importedDataCountByConstituency2024: Array<GroupedDataCount>;
  importedDataCountByConstituencyBySource: Array<GroupedDataCountWithBreakdown>;
  importedDataCountByCouncil: Array<GroupedDataCount>;
  importedDataCountByRegion: Array<GroupedDataCount>;
  importedDataCountByWard: Array<GroupedDataCount>;
  importedDataCountForArea?: Maybe<GroupedDataCount>;
  importedDataCountForConstituency?: Maybe<GroupedDataCount>;
  importedDataCountForConstituency2024?: Maybe<GroupedDataCount>;
  introspectFields: Scalars['Boolean']['output'];
  isImportScheduled: Scalars['Boolean']['output'];
  isUpdateScheduled: Scalars['Boolean']['output'];
  jobs: Array<QueueJob>;
  lastImportJob?: Maybe<QueueJob>;
  lastNameField?: Maybe<Scalars['String']['output']>;
  lastUpdate: Scalars['DateTime']['output'];
  lastUpdateJob?: Maybe<QueueJob>;
  name: Scalars['String']['output'];
  oauthCredentials?: Maybe<Scalars['String']['output']>;
  organisation: Organisation;
  organisationId: Scalars['String']['output'];
  orgsWithAccess: Array<Organisation>;
  phoneField?: Maybe<Scalars['String']['output']>;
  postcodeField?: Maybe<Scalars['String']['output']>;
  predefinedColumnNames: Scalars['Boolean']['output'];
  publicUrlField?: Maybe<Scalars['String']['output']>;
  recordUrlTemplate?: Maybe<Scalars['String']['output']>;
  remoteName?: Maybe<Scalars['String']['output']>;
  remoteUrl?: Maybe<Scalars['String']['output']>;
  sharingPermissions: Array<SharingPermission>;
  sheetName: Scalars['String']['output'];
  socialUrlField?: Maybe<Scalars['String']['output']>;
  spreadsheetId: Scalars['String']['output'];
  startTimeField?: Maybe<Scalars['String']['output']>;
  titleField?: Maybe<Scalars['String']['output']>;
  updateMapping?: Maybe<Array<AutoUpdateConfig>>;
  updateProgress?: Maybe<BatchJobProgress>;
  webhookHealthcheck: Scalars['Boolean']['output'];
  webhookUrl: Scalars['String']['output'];
};


/** An editable Google Sheet */
export type EditableGoogleSheetsSourceImportedDataCountByAreaArgs = {
  analyticalAreaType: AnalyticalAreaType;
  column?: InputMaybe<Scalars['String']['input']>;
  operation?: InputMaybe<Scalars['String']['input']>;
};


/** An editable Google Sheet */
export type EditableGoogleSheetsSourceImportedDataCountByConstituencyBySourceArgs = {
  gss: Scalars['String']['input'];
};


/** An editable Google Sheet */
export type EditableGoogleSheetsSourceImportedDataCountForAreaArgs = {
  analyticalAreaType: AnalyticalAreaType;
  gss: Scalars['String']['input'];
};


/** An editable Google Sheet */
export type EditableGoogleSheetsSourceImportedDataCountForConstituencyArgs = {
  gss: Scalars['String']['input'];
};


/** An editable Google Sheet */
export type EditableGoogleSheetsSourceImportedDataCountForConstituency2024Args = {
  gss: Scalars['String']['input'];
};


/** An editable Google Sheet */
export type EditableGoogleSheetsSourceJobsArgs = {
  filters?: InputMaybe<QueueFilter>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


/** An editable Google Sheet */
export type EditableGoogleSheetsSourceOrgsWithAccessArgs = {
  filters?: InputMaybe<OrganisationFilters>;
};

/** An editable Google Sheet */
export type EditableGoogleSheetsSourceInput = {
  addressField?: InputMaybe<Scalars['String']['input']>;
  autoImportEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  autoUpdateEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  canDisplayPointField?: InputMaybe<Scalars['String']['input']>;
  dataType?: InputMaybe<DataSourceType>;
  description?: InputMaybe<Scalars['String']['input']>;
  descriptionField?: InputMaybe<Scalars['String']['input']>;
  emailField?: InputMaybe<Scalars['String']['input']>;
  endTimeField?: InputMaybe<Scalars['String']['input']>;
  firstNameField?: InputMaybe<Scalars['String']['input']>;
  fullNameField?: InputMaybe<Scalars['String']['input']>;
  geographyColumn?: InputMaybe<Scalars['String']['input']>;
  geographyColumnType?: InputMaybe<GeographyTypes>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  idField?: InputMaybe<Scalars['String']['input']>;
  imageField?: InputMaybe<Scalars['String']['input']>;
  lastNameField?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  oauthCredentials?: InputMaybe<Scalars['String']['input']>;
  organisation?: InputMaybe<OneToManyInput>;
  phoneField?: InputMaybe<Scalars['String']['input']>;
  postcodeField?: InputMaybe<Scalars['String']['input']>;
  publicUrlField?: InputMaybe<Scalars['String']['input']>;
  sheetName: Scalars['String']['input'];
  socialUrlField?: InputMaybe<Scalars['String']['input']>;
  spreadsheetId: Scalars['String']['input'];
  startTimeField?: InputMaybe<Scalars['String']['input']>;
  titleField?: InputMaybe<Scalars['String']['input']>;
  updateMapping?: InputMaybe<Array<UpdateMappingItemInput>>;
};

export type ElectionDate = {
  __typename?: 'ElectionDate';
  advanceVotingStation?: Maybe<Scalars['Void']['output']>;
  ballots: Array<ElectoralCommissionBallot>;
  date: Scalars['DateTime']['output'];
  pollingStation: PollingStation;
};

export type ElectoralCommissionBallot = {
  __typename?: 'ElectoralCommissionBallot';
  ballotPaperId: Scalars['String']['output'];
  ballotTitle: Scalars['String']['output'];
  cancellationReason?: Maybe<Scalars['Void']['output']>;
  cancelled: Scalars['Boolean']['output'];
  candidates: Array<ElectoralCommissionCandidate>;
  candidatesVerified: Scalars['Boolean']['output'];
  electedRole: Scalars['String']['output'];
  electionId: Scalars['String']['output'];
  electionName: Scalars['String']['output'];
  metadata?: Maybe<Scalars['Void']['output']>;
  pollOpenDate: Scalars['DateTime']['output'];
  postName: Scalars['String']['output'];
  replacedBy?: Maybe<Scalars['Void']['output']>;
  replaces?: Maybe<Scalars['Void']['output']>;
  requiresVoterId: Scalars['String']['output'];
  seatsContested: Scalars['Int']['output'];
  votingSystem: ElectoralCommissionVotingSystem;
};

export type ElectoralCommissionCandidate = {
  __typename?: 'ElectoralCommissionCandidate';
  party: ElectoralCommissionParty;
  person: ElectoralCommissionPerson;
};

export type ElectoralCommissionParty = {
  __typename?: 'ElectoralCommissionParty';
  partyId: Scalars['String']['output'];
  partyName: Scalars['String']['output'];
};

export type ElectoralCommissionPerson = {
  __typename?: 'ElectoralCommissionPerson';
  name: Scalars['String']['output'];
  ynrId: Scalars['Int']['output'];
};

export type ElectoralCommissionPostcodeLookup = {
  __typename?: 'ElectoralCommissionPostcodeLookup';
  addressPicker: Scalars['Boolean']['output'];
  addresses: Scalars['JSON']['output'];
  dates: Array<ElectionDate>;
  electoralServices: ElectoralServices;
  postcodeLocation: ElectoralCommissionStation;
  registration: ElectoralServices;
};

export type ElectoralCommissionStation = {
  __typename?: 'ElectoralCommissionStation';
  geometry: PointGeometry;
  id?: Maybe<Scalars['String']['output']>;
  properties?: Maybe<ElectoralCommissionStationProperties>;
  type: Scalars['String']['output'];
};

export type ElectoralCommissionStationProperties = {
  __typename?: 'ElectoralCommissionStationProperties';
  address: Scalars['String']['output'];
  postcode: Scalars['String']['output'];
};

export type ElectoralCommissionVotingSystem = {
  __typename?: 'ElectoralCommissionVotingSystem';
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  usesPartyLists: Scalars['Boolean']['output'];
};

export type ElectoralServices = {
  __typename?: 'ElectoralServices';
  address: Scalars['String']['output'];
  councilId: Scalars['String']['output'];
  email: Scalars['String']['output'];
  identifiers: Array<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  nation: Scalars['String']['output'];
  phone: Scalars['String']['output'];
  postcode: Scalars['String']['output'];
  website: Scalars['String']['output'];
};

/**
 * A third-party data source that can be read and optionally written back to.
 * E.g. Google Sheet or an Action Network table.
 * This class is to be subclassed by specific data source types.
 */
export type ExternalDataSource = Analytics & {
  __typename?: 'ExternalDataSource';
  addressField?: Maybe<Scalars['String']['output']>;
  allowUpdates: Scalars['Boolean']['output'];
  autoImportEnabled: Scalars['Boolean']['output'];
  autoUpdateEnabled: Scalars['Boolean']['output'];
  automatedWebhooks: Scalars['Boolean']['output'];
  canDisplayPointField?: Maybe<Scalars['String']['output']>;
  connectionDetails: AirtableSourceMailchimpSourceActionNetworkSourceEditableGoogleSheetsSourceTicketTailorSource;
  createdAt: Scalars['DateTime']['output'];
  crmType: CrmType;
  dataType: DataSourceType;
  defaultDataType?: Maybe<Scalars['String']['output']>;
  defaults: Scalars['JSON']['output'];
  description?: Maybe<Scalars['String']['output']>;
  descriptionField?: Maybe<Scalars['String']['output']>;
  emailField?: Maybe<Scalars['String']['output']>;
  endTimeField?: Maybe<Scalars['String']['output']>;
  fieldDefinitions?: Maybe<Array<FieldDefinition>>;
  firstNameField?: Maybe<Scalars['String']['output']>;
  fullNameField?: Maybe<Scalars['String']['output']>;
  geographyColumn?: Maybe<Scalars['String']['output']>;
  geographyColumnType: GeographyTypes;
  hasWebhooks: Scalars['Boolean']['output'];
  healthcheck: Scalars['Boolean']['output'];
  id: Scalars['UUID']['output'];
  imageField?: Maybe<Scalars['String']['output']>;
  importProgress?: Maybe<BatchJobProgress>;
  importedDataCount: Scalars['Int']['output'];
  importedDataCountByArea: Array<GroupedDataCount>;
  importedDataCountByConstituency: Array<GroupedDataCount>;
  importedDataCountByConstituency2024: Array<GroupedDataCount>;
  importedDataCountByConstituencyBySource: Array<GroupedDataCountWithBreakdown>;
  importedDataCountByCouncil: Array<GroupedDataCount>;
  importedDataCountByRegion: Array<GroupedDataCount>;
  importedDataCountByWard: Array<GroupedDataCount>;
  importedDataCountForArea?: Maybe<GroupedDataCount>;
  importedDataCountForConstituency?: Maybe<GroupedDataCount>;
  importedDataCountForConstituency2024?: Maybe<GroupedDataCount>;
  introspectFields: Scalars['Boolean']['output'];
  isImportScheduled: Scalars['Boolean']['output'];
  isUpdateScheduled: Scalars['Boolean']['output'];
  jobs: Array<QueueJob>;
  lastImportJob?: Maybe<QueueJob>;
  lastNameField?: Maybe<Scalars['String']['output']>;
  lastUpdate: Scalars['DateTime']['output'];
  lastUpdateJob?: Maybe<QueueJob>;
  name: Scalars['String']['output'];
  oauthCredentials?: Maybe<Scalars['String']['output']>;
  organisation: Organisation;
  organisationId: Scalars['String']['output'];
  orgsWithAccess: Array<Organisation>;
  phoneField?: Maybe<Scalars['String']['output']>;
  postcodeField?: Maybe<Scalars['String']['output']>;
  predefinedColumnNames: Scalars['Boolean']['output'];
  publicUrlField?: Maybe<Scalars['String']['output']>;
  recordUrlTemplate?: Maybe<Scalars['String']['output']>;
  remoteName?: Maybe<Scalars['String']['output']>;
  remoteUrl?: Maybe<Scalars['String']['output']>;
  sharingPermissions: Array<SharingPermission>;
  socialUrlField?: Maybe<Scalars['String']['output']>;
  startTimeField?: Maybe<Scalars['String']['output']>;
  titleField?: Maybe<Scalars['String']['output']>;
  updateMapping?: Maybe<Array<AutoUpdateConfig>>;
  updateProgress?: Maybe<BatchJobProgress>;
  webhookHealthcheck: Scalars['Boolean']['output'];
  webhookUrl: Scalars['String']['output'];
};


/**
 * A third-party data source that can be read and optionally written back to.
 * E.g. Google Sheet or an Action Network table.
 * This class is to be subclassed by specific data source types.
 */
export type ExternalDataSourceImportedDataCountByAreaArgs = {
  analyticalAreaType: AnalyticalAreaType;
  column?: InputMaybe<Scalars['String']['input']>;
  operation?: InputMaybe<Scalars['String']['input']>;
};


/**
 * A third-party data source that can be read and optionally written back to.
 * E.g. Google Sheet or an Action Network table.
 * This class is to be subclassed by specific data source types.
 */
export type ExternalDataSourceImportedDataCountByConstituencyBySourceArgs = {
  gss: Scalars['String']['input'];
};


/**
 * A third-party data source that can be read and optionally written back to.
 * E.g. Google Sheet or an Action Network table.
 * This class is to be subclassed by specific data source types.
 */
export type ExternalDataSourceImportedDataCountForAreaArgs = {
  analyticalAreaType: AnalyticalAreaType;
  gss: Scalars['String']['input'];
};


/**
 * A third-party data source that can be read and optionally written back to.
 * E.g. Google Sheet or an Action Network table.
 * This class is to be subclassed by specific data source types.
 */
export type ExternalDataSourceImportedDataCountForConstituencyArgs = {
  gss: Scalars['String']['input'];
};


/**
 * A third-party data source that can be read and optionally written back to.
 * E.g. Google Sheet or an Action Network table.
 * This class is to be subclassed by specific data source types.
 */
export type ExternalDataSourceImportedDataCountForConstituency2024Args = {
  gss: Scalars['String']['input'];
};


/**
 * A third-party data source that can be read and optionally written back to.
 * E.g. Google Sheet or an Action Network table.
 * This class is to be subclassed by specific data source types.
 */
export type ExternalDataSourceJobsArgs = {
  filters?: InputMaybe<QueueFilter>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


/**
 * A third-party data source that can be read and optionally written back to.
 * E.g. Google Sheet or an Action Network table.
 * This class is to be subclassed by specific data source types.
 */
export type ExternalDataSourceOrgsWithAccessArgs = {
  filters?: InputMaybe<OrganisationFilters>;
};

export type ExternalDataSourceAction = {
  __typename?: 'ExternalDataSourceAction';
  externalDataSource: ExternalDataSource;
  id: Scalars['ID']['output'];
};

/**
 * A third-party data source that can be read and optionally written back to.
 * E.g. Google Sheet or an Action Network table.
 * This class is to be subclassed by specific data source types.
 */
export type ExternalDataSourceFilter = {
  AND?: InputMaybe<ExternalDataSourceFilter>;
  NOT?: InputMaybe<ExternalDataSourceFilter>;
  OR?: InputMaybe<ExternalDataSourceFilter>;
  dataType?: InputMaybe<DataSourceType>;
  geographyColumnType?: InputMaybe<GeographyTypes>;
};

/**
 * A third-party data source that can be read and optionally written back to.
 * E.g. Google Sheet or an Action Network table.
 * This class is to be subclassed by specific data source types.
 */
export type ExternalDataSourceInput = {
  addressField?: InputMaybe<Scalars['String']['input']>;
  autoImportEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  autoUpdateEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  canDisplayPointField?: InputMaybe<Scalars['String']['input']>;
  dataType?: InputMaybe<DataSourceType>;
  description?: InputMaybe<Scalars['String']['input']>;
  descriptionField?: InputMaybe<Scalars['String']['input']>;
  emailField?: InputMaybe<Scalars['String']['input']>;
  endTimeField?: InputMaybe<Scalars['String']['input']>;
  firstNameField?: InputMaybe<Scalars['String']['input']>;
  fullNameField?: InputMaybe<Scalars['String']['input']>;
  geographyColumn?: InputMaybe<Scalars['String']['input']>;
  geographyColumnType?: InputMaybe<GeographyTypes>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  imageField?: InputMaybe<Scalars['String']['input']>;
  lastNameField?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  organisation?: InputMaybe<OneToManyInput>;
  phoneField?: InputMaybe<Scalars['String']['input']>;
  postcodeField?: InputMaybe<Scalars['String']['input']>;
  publicUrlField?: InputMaybe<Scalars['String']['input']>;
  socialUrlField?: InputMaybe<Scalars['String']['input']>;
  startTimeField?: InputMaybe<Scalars['String']['input']>;
  titleField?: InputMaybe<Scalars['String']['input']>;
  updateMapping?: InputMaybe<Array<UpdateMappingItemInput>>;
};

export type Feature = {
  id?: Maybe<Scalars['String']['output']>;
  type: GeoJsonTypes;
};

export type FieldDefinition = {
  __typename?: 'FieldDefinition';
  description?: Maybe<Scalars['String']['output']>;
  editable: Scalars['Boolean']['output'];
  externalId?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  value: Scalars['String']['output'];
};

/** GenericData(id, data_type, data, date, float, int, json, created_at, last_update, point, polygon, postcode_data, postcode, first_name, last_name, full_name, email, phone, start_time, end_time, public_url, social_url, geocode_data, geocoder, address, title, description, image, can_display_point) */
export type GenericData = CommonData & {
  __typename?: 'GenericData';
  address?: Maybe<Scalars['String']['output']>;
  area?: Maybe<Area>;
  areas?: Maybe<Area>;
  data: Scalars['String']['output'];
  dataType: DataType;
  date?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  endTime?: Maybe<Scalars['DateTime']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  float?: Maybe<Scalars['Float']['output']>;
  fullName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  image?: Maybe<DjangoImageType>;
  int?: Maybe<Scalars['Int']['output']>;
  json?: Maybe<Scalars['JSON']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  lastUpdate: Scalars['DateTime']['output'];
  name?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  postcode?: Maybe<Scalars['String']['output']>;
  postcodeData?: Maybe<PostcodesIoResult>;
  publicUrl?: Maybe<Scalars['String']['output']>;
  remoteUrl: Scalars['String']['output'];
  shade?: Maybe<Scalars['String']['output']>;
  startTime?: Maybe<Scalars['DateTime']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};


/** GenericData(id, data_type, data, date, float, int, json, created_at, last_update, point, polygon, postcode_data, postcode, first_name, last_name, full_name, email, phone, start_time, end_time, public_url, social_url, geocode_data, geocoder, address, title, description, image, can_display_point) */
export type GenericDataAreaArgs = {
  areaType: Scalars['String']['input'];
};

export enum GeoJsonTypes {
  Feature = 'Feature',
  FeatureCollection = 'FeatureCollection',
  MultiPolygon = 'MultiPolygon',
  Point = 'Point',
  Polygon = 'Polygon'
}

/**
 * The keys and values here are identical (for GraphQL compatibility)
 * and are uppercased versions of the PostcodesIO terms
 * (for ease of mapping).
 */
export enum GeographyTypes {
  Address = 'ADDRESS',
  AdminDistrict = 'ADMIN_DISTRICT',
  ParliamentaryConstituency = 'PARLIAMENTARY_CONSTITUENCY',
  ParliamentaryConstituency_2024 = 'PARLIAMENTARY_CONSTITUENCY_2024',
  Postcode = 'POSTCODE',
  Ward = 'WARD'
}

export type GroupedDataCount = {
  __typename?: 'GroupedDataCount';
  areaData?: Maybe<Area>;
  areaType?: Maybe<Scalars['String']['output']>;
  count: Scalars['Float']['output'];
  gss?: Maybe<Scalars['String']['output']>;
  gssArea?: Maybe<Area>;
  label?: Maybe<Scalars['String']['output']>;
};

export type GroupedDataCountWithBreakdown = {
  __typename?: 'GroupedDataCountWithBreakdown';
  areaData?: Maybe<Area>;
  areaType?: Maybe<Scalars['String']['output']>;
  count: Scalars['Float']['output'];
  gss?: Maybe<Scalars['String']['output']>;
  gssArea?: Maybe<Area>;
  label?: Maybe<Scalars['String']['output']>;
  sources: Array<GroupedDataCount>;
};

/**
 * An microsite that incorporates datasets and content pages,
 * backed by a custom URL.
 */
export type HubHomepage = {
  __typename?: 'HubHomepage';
  ancestors: Array<HubPage>;
  children: Array<HubPage>;
  customCss?: Maybe<Scalars['String']['output']>;
  descendants: Array<HubPage>;
  faviconUrl?: Maybe<Scalars['String']['output']>;
  /** Return the full URL (including protocol / domain) to this page, or None if it is not routable */
  fullUrl?: Maybe<Scalars['String']['output']>;
  googleAnalyticsTagId?: Maybe<Scalars['String']['output']>;
  hostname: Scalars['String']['output'];
  hub: HubHomepage;
  id: Scalars['ID']['output'];
  layers: Array<MapLayer>;
  liveUrl?: Maybe<Scalars['String']['output']>;
  liveUrlWithoutProtocol: Scalars['String']['output'];
  modelName: Scalars['String']['output'];
  navLinks: Array<HubNavLink>;
  organisation: Organisation;
  parent?: Maybe<HubPage>;
  path: Scalars['String']['output'];
  primaryColour?: Maybe<Scalars['String']['output']>;
  puckJsonContent: Scalars['JSON']['output'];
  /** The descriptive text displayed underneath a headline in search engine results. */
  searchDescription?: Maybe<Scalars['String']['output']>;
  secondaryColour?: Maybe<Scalars['String']['output']>;
  seoImageUrl?: Maybe<Scalars['String']['output']>;
  /** The name of the page displayed on search engine results as the clickable headline. */
  seoTitle: Scalars['String']['output'];
  /** The name of the page as it will appear in URLs e.g http://domain.com/blog/[my-slug]/ */
  slug: Scalars['String']['output'];
  /** The page title as you'd like it to be seen by the public */
  title: Scalars['String']['output'];
};


/**
 * An microsite that incorporates datasets and content pages,
 * backed by a custom URL.
 */
export type HubHomepageAncestorsArgs = {
  inclusive?: Scalars['Boolean']['input'];
};


/**
 * An microsite that incorporates datasets and content pages,
 * backed by a custom URL.
 */
export type HubHomepageDescendantsArgs = {
  inclusive?: Scalars['Boolean']['input'];
};

export type HubNavLink = {
  __typename?: 'HubNavLink';
  label: Scalars['String']['output'];
  link: Scalars['String']['output'];
};

/** Page(id, path, depth, numchild, translation_key, locale, latest_revision, live, has_unpublished_changes, first_published_at, last_published_at, live_revision, go_live_at, expire_at, expired, locked, locked_at, locked_by, title, draft_title, slug, content_type, url_path, owner, seo_title, show_in_menus, search_description, latest_revision_created_at, alias_of) */
export type HubPage = {
  __typename?: 'HubPage';
  ancestors: Array<HubPage>;
  children: Array<HubPage>;
  descendants: Array<HubPage>;
  /** Return the full URL (including protocol / domain) to this page, or None if it is not routable */
  fullUrl?: Maybe<Scalars['String']['output']>;
  hostname: Scalars['String']['output'];
  hub: HubHomepage;
  id: Scalars['ID']['output'];
  liveUrl?: Maybe<Scalars['String']['output']>;
  liveUrlWithoutProtocol: Scalars['String']['output'];
  modelName: Scalars['String']['output'];
  parent?: Maybe<HubPage>;
  path: Scalars['String']['output'];
  puckJsonContent: Scalars['JSON']['output'];
  /** The descriptive text displayed underneath a headline in search engine results. */
  searchDescription?: Maybe<Scalars['String']['output']>;
  /** The name of the page displayed on search engine results as the clickable headline. */
  seoTitle: Scalars['String']['output'];
  /** The name of the page as it will appear in URLs e.g http://domain.com/blog/[my-slug]/ */
  slug: Scalars['String']['output'];
  /** The page title as you'd like it to be seen by the public */
  title: Scalars['String']['output'];
};


/** Page(id, path, depth, numchild, translation_key, locale, latest_revision, live, has_unpublished_changes, first_published_at, last_published_at, live_revision, go_live_at, expire_at, expired, locked, locked_at, locked_by, title, draft_title, slug, content_type, url_path, owner, seo_title, show_in_menus, search_description, latest_revision_created_at, alias_of) */
export type HubPageAncestorsArgs = {
  inclusive?: Scalars['Boolean']['input'];
};


/** Page(id, path, depth, numchild, translation_key, locale, latest_revision, live, has_unpublished_changes, first_published_at, last_published_at, live_revision, go_live_at, expire_at, expired, locked, locked_at, locked_by, title, draft_title, slug, content_type, url_path, owner, seo_title, show_in_menus, search_description, latest_revision_created_at, alias_of) */
export type HubPageDescendantsArgs = {
  inclusive?: Scalars['Boolean']['input'];
};

/** Page(id, path, depth, numchild, translation_key, locale, latest_revision, live, has_unpublished_changes, first_published_at, last_published_at, live_revision, go_live_at, expire_at, expired, locked, locked_at, locked_by, title, draft_title, slug, content_type, url_path, owner, seo_title, show_in_menus, search_description, latest_revision_created_at, alias_of) */
export type HubPageInput = {
  puckJsonContent?: InputMaybe<Scalars['JSON']['input']>;
  /** The name of the page as it will appear in URLs e.g http://domain.com/blog/[my-slug]/ */
  slug?: InputMaybe<Scalars['String']['input']>;
  /** The page title as you'd like it to be seen by the public */
  title?: InputMaybe<Scalars['String']['input']>;
};

export type IdFilterLookup = {
  contains?: InputMaybe<Scalars['ID']['input']>;
  endsWith?: InputMaybe<Scalars['ID']['input']>;
  exact?: InputMaybe<Scalars['ID']['input']>;
  gt?: InputMaybe<Scalars['ID']['input']>;
  gte?: InputMaybe<Scalars['ID']['input']>;
  iContains?: InputMaybe<Scalars['ID']['input']>;
  iEndsWith?: InputMaybe<Scalars['ID']['input']>;
  iExact?: InputMaybe<Scalars['ID']['input']>;
  iRegex?: InputMaybe<Scalars['String']['input']>;
  iStartsWith?: InputMaybe<Scalars['ID']['input']>;
  inList?: InputMaybe<Array<Scalars['ID']['input']>>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  lt?: InputMaybe<Scalars['ID']['input']>;
  lte?: InputMaybe<Scalars['ID']['input']>;
  range?: InputMaybe<Array<Scalars['ID']['input']>>;
  regex?: InputMaybe<Scalars['String']['input']>;
  startsWith?: InputMaybe<Scalars['ID']['input']>;
};

export type IdObject = {
  id: Scalars['String']['input'];
};

export type IntFilterLookup = {
  contains?: InputMaybe<Scalars['Int']['input']>;
  endsWith?: InputMaybe<Scalars['Int']['input']>;
  exact?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  iContains?: InputMaybe<Scalars['Int']['input']>;
  iEndsWith?: InputMaybe<Scalars['Int']['input']>;
  iExact?: InputMaybe<Scalars['Int']['input']>;
  iRegex?: InputMaybe<Scalars['String']['input']>;
  iStartsWith?: InputMaybe<Scalars['Int']['input']>;
  inList?: InputMaybe<Array<Scalars['Int']['input']>>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  range?: InputMaybe<Array<Scalars['Int']['input']>>;
  regex?: InputMaybe<Scalars['String']['input']>;
  startsWith?: InputMaybe<Scalars['Int']['input']>;
};

/** A Mailchimp list. */
export type MailChimpSourceInput = {
  addressField?: InputMaybe<Scalars['String']['input']>;
  /** Mailchimp API key. */
  apiKey: Scalars['String']['input'];
  autoImportEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  autoUpdateEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  canDisplayPointField?: InputMaybe<Scalars['String']['input']>;
  dataType?: InputMaybe<DataSourceType>;
  description?: InputMaybe<Scalars['String']['input']>;
  descriptionField?: InputMaybe<Scalars['String']['input']>;
  emailField?: InputMaybe<Scalars['String']['input']>;
  endTimeField?: InputMaybe<Scalars['String']['input']>;
  firstNameField?: InputMaybe<Scalars['String']['input']>;
  fullNameField?: InputMaybe<Scalars['String']['input']>;
  geographyColumn?: InputMaybe<Scalars['String']['input']>;
  geographyColumnType?: InputMaybe<GeographyTypes>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  imageField?: InputMaybe<Scalars['String']['input']>;
  lastNameField?: InputMaybe<Scalars['String']['input']>;
  /** The unique identifier for the Mailchimp list. */
  listId: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  organisation?: InputMaybe<OneToManyInput>;
  phoneField?: InputMaybe<Scalars['String']['input']>;
  postcodeField?: InputMaybe<Scalars['String']['input']>;
  publicUrlField?: InputMaybe<Scalars['String']['input']>;
  socialUrlField?: InputMaybe<Scalars['String']['input']>;
  startTimeField?: InputMaybe<Scalars['String']['input']>;
  titleField?: InputMaybe<Scalars['String']['input']>;
  updateMapping?: InputMaybe<Array<UpdateMappingItemInput>>;
};

/** A Mailchimp list. */
export type MailchimpSource = Analytics & {
  __typename?: 'MailchimpSource';
  addressField?: Maybe<Scalars['String']['output']>;
  allowUpdates: Scalars['Boolean']['output'];
  /** Mailchimp API key. */
  apiKey: Scalars['String']['output'];
  autoImportEnabled: Scalars['Boolean']['output'];
  autoUpdateEnabled: Scalars['Boolean']['output'];
  automatedWebhooks: Scalars['Boolean']['output'];
  canDisplayPointField?: Maybe<Scalars['String']['output']>;
  connectionDetails: AirtableSourceMailchimpSourceActionNetworkSourceEditableGoogleSheetsSourceTicketTailorSource;
  createdAt: Scalars['DateTime']['output'];
  crmType: CrmType;
  dataType: DataSourceType;
  defaultDataType?: Maybe<Scalars['String']['output']>;
  defaults: Scalars['JSON']['output'];
  description?: Maybe<Scalars['String']['output']>;
  descriptionField?: Maybe<Scalars['String']['output']>;
  emailField?: Maybe<Scalars['String']['output']>;
  endTimeField?: Maybe<Scalars['String']['output']>;
  fieldDefinitions?: Maybe<Array<FieldDefinition>>;
  firstNameField?: Maybe<Scalars['String']['output']>;
  fullNameField?: Maybe<Scalars['String']['output']>;
  geographyColumn?: Maybe<Scalars['String']['output']>;
  geographyColumnType: GeographyTypes;
  hasWebhooks: Scalars['Boolean']['output'];
  healthcheck: Scalars['Boolean']['output'];
  id: Scalars['UUID']['output'];
  imageField?: Maybe<Scalars['String']['output']>;
  importProgress?: Maybe<BatchJobProgress>;
  importedDataCount: Scalars['Int']['output'];
  importedDataCountByArea: Array<GroupedDataCount>;
  importedDataCountByConstituency: Array<GroupedDataCount>;
  importedDataCountByConstituency2024: Array<GroupedDataCount>;
  importedDataCountByConstituencyBySource: Array<GroupedDataCountWithBreakdown>;
  importedDataCountByCouncil: Array<GroupedDataCount>;
  importedDataCountByRegion: Array<GroupedDataCount>;
  importedDataCountByWard: Array<GroupedDataCount>;
  importedDataCountForArea?: Maybe<GroupedDataCount>;
  importedDataCountForConstituency?: Maybe<GroupedDataCount>;
  importedDataCountForConstituency2024?: Maybe<GroupedDataCount>;
  introspectFields: Scalars['Boolean']['output'];
  isImportScheduled: Scalars['Boolean']['output'];
  isUpdateScheduled: Scalars['Boolean']['output'];
  jobs: Array<QueueJob>;
  lastImportJob?: Maybe<QueueJob>;
  lastNameField?: Maybe<Scalars['String']['output']>;
  lastUpdate: Scalars['DateTime']['output'];
  lastUpdateJob?: Maybe<QueueJob>;
  /** The unique identifier for the Mailchimp list. */
  listId: Scalars['String']['output'];
  name: Scalars['String']['output'];
  oauthCredentials?: Maybe<Scalars['String']['output']>;
  organisation: Organisation;
  organisationId: Scalars['String']['output'];
  orgsWithAccess: Array<Organisation>;
  phoneField?: Maybe<Scalars['String']['output']>;
  postcodeField?: Maybe<Scalars['String']['output']>;
  predefinedColumnNames: Scalars['Boolean']['output'];
  publicUrlField?: Maybe<Scalars['String']['output']>;
  recordUrlTemplate?: Maybe<Scalars['String']['output']>;
  remoteName?: Maybe<Scalars['String']['output']>;
  remoteUrl?: Maybe<Scalars['String']['output']>;
  sharingPermissions: Array<SharingPermission>;
  socialUrlField?: Maybe<Scalars['String']['output']>;
  startTimeField?: Maybe<Scalars['String']['output']>;
  titleField?: Maybe<Scalars['String']['output']>;
  updateMapping?: Maybe<Array<AutoUpdateConfig>>;
  updateProgress?: Maybe<BatchJobProgress>;
  webhookHealthcheck: Scalars['Boolean']['output'];
  webhookUrl: Scalars['String']['output'];
};


/** A Mailchimp list. */
export type MailchimpSourceImportedDataCountByAreaArgs = {
  analyticalAreaType: AnalyticalAreaType;
  column?: InputMaybe<Scalars['String']['input']>;
  operation?: InputMaybe<Scalars['String']['input']>;
};


/** A Mailchimp list. */
export type MailchimpSourceImportedDataCountByConstituencyBySourceArgs = {
  gss: Scalars['String']['input'];
};


/** A Mailchimp list. */
export type MailchimpSourceImportedDataCountForAreaArgs = {
  analyticalAreaType: AnalyticalAreaType;
  gss: Scalars['String']['input'];
};


/** A Mailchimp list. */
export type MailchimpSourceImportedDataCountForConstituencyArgs = {
  gss: Scalars['String']['input'];
};


/** A Mailchimp list. */
export type MailchimpSourceImportedDataCountForConstituency2024Args = {
  gss: Scalars['String']['input'];
};


/** A Mailchimp list. */
export type MailchimpSourceJobsArgs = {
  filters?: InputMaybe<QueueFilter>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


/** A Mailchimp list. */
export type MailchimpSourceOrgsWithAccessArgs = {
  filters?: InputMaybe<OrganisationFilters>;
};

export type MapLayer = {
  __typename?: 'MapLayer';
  customMarkerText?: Maybe<Scalars['String']['output']>;
  iconImage?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  isSharedSource: Scalars['Boolean']['output'];
  mapboxLayout?: Maybe<Scalars['JSON']['output']>;
  mapboxPaint?: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
  sharingPermission?: Maybe<SharingPermission>;
  source: SharedDataSource;
  type: Scalars['String']['output'];
  visible?: Maybe<Scalars['Boolean']['output']>;
};

export type MapLayerInput = {
  customMarkerText?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  source: Scalars['String']['input'];
  visible?: InputMaybe<Scalars['Boolean']['input']>;
};

/** MapReport(polymorphic_ctype, id, organisation, name, slug, description, created_at, last_update, public, report_ptr, layers, display_options) */
export type MapReport = Analytics & {
  __typename?: 'MapReport';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  displayOptions: Scalars['JSON']['output'];
  id: Scalars['UUID']['output'];
  importedDataCount: Scalars['Int']['output'];
  importedDataCountByArea: Array<GroupedDataCount>;
  importedDataCountByConstituency: Array<GroupedDataCount>;
  importedDataCountByConstituency2024: Array<GroupedDataCount>;
  importedDataCountByConstituencyBySource: Array<GroupedDataCountWithBreakdown>;
  importedDataCountByCouncil: Array<GroupedDataCount>;
  importedDataCountByRegion: Array<GroupedDataCount>;
  importedDataCountByWard: Array<GroupedDataCount>;
  importedDataCountForArea?: Maybe<GroupedDataCount>;
  importedDataCountForConstituency?: Maybe<GroupedDataCount>;
  importedDataCountForConstituency2024?: Maybe<GroupedDataCount>;
  lastUpdate: Scalars['DateTime']['output'];
  layers: Array<MapLayer>;
  name: Scalars['String']['output'];
  organisation: Organisation;
  organisationId: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};


/** MapReport(polymorphic_ctype, id, organisation, name, slug, description, created_at, last_update, public, report_ptr, layers, display_options) */
export type MapReportImportedDataCountByAreaArgs = {
  analyticalAreaType: AnalyticalAreaType;
  column?: InputMaybe<Scalars['String']['input']>;
  operation?: InputMaybe<Scalars['String']['input']>;
};


/** MapReport(polymorphic_ctype, id, organisation, name, slug, description, created_at, last_update, public, report_ptr, layers, display_options) */
export type MapReportImportedDataCountByConstituencyBySourceArgs = {
  gss: Scalars['String']['input'];
};


/** MapReport(polymorphic_ctype, id, organisation, name, slug, description, created_at, last_update, public, report_ptr, layers, display_options) */
export type MapReportImportedDataCountForAreaArgs = {
  analyticalAreaType: AnalyticalAreaType;
  gss: Scalars['String']['input'];
};


/** MapReport(polymorphic_ctype, id, organisation, name, slug, description, created_at, last_update, public, report_ptr, layers, display_options) */
export type MapReportImportedDataCountForConstituencyArgs = {
  gss: Scalars['String']['input'];
};


/** MapReport(polymorphic_ctype, id, organisation, name, slug, description, created_at, last_update, public, report_ptr, layers, display_options) */
export type MapReportImportedDataCountForConstituency2024Args = {
  gss: Scalars['String']['input'];
};

/** MapReport(polymorphic_ctype, id, organisation, name, slug, description, created_at, last_update, public, report_ptr, layers, display_options) */
export type MapReportInput = {
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  displayOptions?: InputMaybe<Scalars['JSON']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  lastUpdate?: InputMaybe<Scalars['DateTime']['input']>;
  layers?: InputMaybe<Array<MapLayerInput>>;
  name?: InputMaybe<Scalars['String']['input']>;
  organisation?: InputMaybe<OneToManyInput>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type MapReportMemberFeature = Feature & {
  __typename?: 'MapReportMemberFeature';
  electoralCommission?: Maybe<ElectoralCommissionPostcodeLookup>;
  geometry: PointGeometry;
  id?: Maybe<Scalars['String']['output']>;
  properties?: Maybe<GenericData>;
  type: GeoJsonTypes;
};


export type MapReportMemberFeatureElectoralCommissionArgs = {
  addressSlug?: InputMaybe<Scalars['String']['input']>;
};

export type MappingSource = {
  __typename?: 'MappingSource';
  author?: Maybe<Scalars['String']['output']>;
  builtin: Scalars['Boolean']['output'];
  description?: Maybe<Scalars['String']['output']>;
  descriptionUrl?: Maybe<Scalars['String']['output']>;
  externalDataSource?: Maybe<SharedDataSource>;
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  sourcePaths: Array<MappingSourcePath>;
};

export type MappingSourcePath = {
  __typename?: 'MappingSourcePath';
  description?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  value: Scalars['String']['output'];
};

/** Membership(id, user, organisation, role) */
export type Membership = {
  __typename?: 'Membership';
  id: Scalars['ID']['output'];
  organisation: Organisation;
  organisationId: Scalars['String']['output'];
  role: Scalars['String']['output'];
  user: User;
  userId: Scalars['String']['output'];
};

export type MultiPolygonFeature = Feature & {
  __typename?: 'MultiPolygonFeature';
  geometry: MultiPolygonGeometry;
  id?: Maybe<Scalars['String']['output']>;
  properties: Scalars['JSON']['output'];
  type: GeoJsonTypes;
};

export type MultiPolygonGeometry = {
  __typename?: 'MultiPolygonGeometry';
  coordinates: Scalars['JSON']['output'];
  type: GeoJsonTypes;
};

export type Mutation = {
  __typename?: 'Mutation';
  addMember: Scalars['Boolean']['output'];
  createApiToken: ApiToken;
  createChildPage: HubPage;
  createExternalDataSource: CreateExternalDataSourceOutput;
  createMapReport: CreateMapReportPayload;
  createOrganisation: Membership;
  createSharingPermission: SharingPermission;
  deleteExternalDataSource: ExternalDataSource;
  deleteMapReport: MapReport;
  deletePage: Scalars['Boolean']['output'];
  deleteSharingPermission: SharingPermission;
  disableWebhook: ExternalDataSource;
  enableWebhook: ExternalDataSource;
  importAll: ExternalDataSourceAction;
  /**
   * Change user password without old password.
   *
   *     Receive the token that was sent by email.
   *
   *     If token and new passwords are valid, update user password and in
   *     case of using refresh tokens, revoke all of them.
   *
   *     Also, if user has not been verified yet, verify it.
   *
   */
  performPasswordReset: MutationNormalOutput;
  refreshWebhooks: ExternalDataSource;
  /**
   * Send password reset email.
   *
   *     For non verified users, send an activation email instead.
   *
   *     If there is no user with the requested email, a successful response
   *     is returned.
   *
   */
  requestPasswordReset: MutationNormalOutput;
  /**
   * Sends activation email.
   *
   *     It is called resend because theoretically the first activation email
   *     was sent when the user registered.
   *
   *     If there is no user with the requested email, a successful response
   *     is returned.
   *
   */
  resendActivationEmail: MutationNormalOutput;
  revokeApiToken: ApiToken;
  /**
   * Obtain JSON web token for given user.
   *
   *     Allow to perform login with different fields, The fields are defined
   *     on settings.
   *
   *     Not verified users can log in by default. This can be changes on
   *     settings.
   *
   *     If user is archived, make it unarchived and return
   *     `unarchiving=True` on OutputBase.
   *
   */
  tokenAuth: ObtainJsonWebTokenType;
  triggerUpdate: ExternalDataSourceAction;
  updateExternalDataSource: ExternalDataSource;
  updateMapReport: MapReport;
  updateOrganisation: Organisation;
  updatePage: HubPage;
  updateSharingPermission: SharingPermission;
  updateSharingPermissions: Array<ExternalDataSource>;
  /**
   * Verify user account.
   *
   *     Receive the token that was sent by email. If the token is valid,
   *     make the user verified by making the `user.status.verified` field
   *     true.
   *
   */
  verifyAccount: MutationNormalOutput;
};


export type MutationAddMemberArgs = {
  customFields: Scalars['JSON']['input'];
  email: Scalars['String']['input'];
  externalDataSourceId: Scalars['String']['input'];
  postcode: Scalars['String']['input'];
  tags: Array<Scalars['String']['input']>;
};


export type MutationCreateApiTokenArgs = {
  expiryDays?: Scalars['Int']['input'];
};


export type MutationCreateChildPageArgs = {
  parentId: Scalars['String']['input'];
  title: Scalars['String']['input'];
};


export type MutationCreateExternalDataSourceArgs = {
  input: CreateExternalDataSourceInput;
};


export type MutationCreateMapReportArgs = {
  data: MapReportInput;
};


export type MutationCreateOrganisationArgs = {
  input: CreateOrganisationInput;
};


export type MutationCreateSharingPermissionArgs = {
  data: SharingPermissionCudInput;
};


export type MutationDeleteExternalDataSourceArgs = {
  data: IdObject;
};


export type MutationDeleteMapReportArgs = {
  data: IdObject;
};


export type MutationDeletePageArgs = {
  pageId: Scalars['String']['input'];
};


export type MutationDeleteSharingPermissionArgs = {
  data: IdObject;
};


export type MutationDisableWebhookArgs = {
  externalDataSourceId: Scalars['String']['input'];
  webhookType: WebhookType;
};


export type MutationEnableWebhookArgs = {
  externalDataSourceId: Scalars['String']['input'];
  webhookType: WebhookType;
};


export type MutationImportAllArgs = {
  externalDataSourceId: Scalars['String']['input'];
};


export type MutationPerformPasswordResetArgs = {
  newPassword1: Scalars['String']['input'];
  newPassword2: Scalars['String']['input'];
  token: Scalars['String']['input'];
};


export type MutationRefreshWebhooksArgs = {
  externalDataSourceId: Scalars['String']['input'];
};


export type MutationRequestPasswordResetArgs = {
  email: Scalars['String']['input'];
};


export type MutationResendActivationEmailArgs = {
  email: Scalars['String']['input'];
};


export type MutationRevokeApiTokenArgs = {
  signature: Scalars['ID']['input'];
};


export type MutationTokenAuthArgs = {
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};


export type MutationTriggerUpdateArgs = {
  externalDataSourceId: Scalars['String']['input'];
};


export type MutationUpdateExternalDataSourceArgs = {
  input: ExternalDataSourceInput;
};


export type MutationUpdateMapReportArgs = {
  data: MapReportInput;
};


export type MutationUpdateOrganisationArgs = {
  data: OrganisationInputPartial;
};


export type MutationUpdatePageArgs = {
  input: HubPageInput;
  pageId: Scalars['String']['input'];
};


export type MutationUpdateSharingPermissionArgs = {
  data: SharingPermissionCudInput;
};


export type MutationUpdateSharingPermissionsArgs = {
  fromOrgId: Scalars['String']['input'];
  permissions: Array<SharingPermissionInput>;
};


export type MutationVerifyAccountArgs = {
  token: Scalars['String']['input'];
};

export type MutationError = {
  __typename?: 'MutationError';
  code: Scalars['Int']['output'];
  message: Scalars['String']['output'];
};

export type MutationNormalOutput = {
  __typename?: 'MutationNormalOutput';
  errors?: Maybe<Scalars['ExpectedError']['output']>;
  success: Scalars['Boolean']['output'];
};

/**
 *
 *     encapsulates token data, and refresh token data if `JWT_LONG_RUNNING_REFRESH_TOKEN` is on.
 *     with an output interface.
 *
 */
export type ObtainJsonWebTokenType = OutputInterface & {
  __typename?: 'ObtainJSONWebTokenType';
  errors?: Maybe<Scalars['ExpectedError']['output']>;
  refreshToken?: Maybe<RefreshTokenType>;
  success: Scalars['Boolean']['output'];
  token?: Maybe<TokenType>;
  user?: Maybe<UserType>;
};

export type OffsetPaginationInput = {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
};

export type OneToManyInput = {
  set?: InputMaybe<Scalars['ID']['input']>;
};

export type OperationInfo = {
  __typename?: 'OperationInfo';
  /** List of messages returned by the operation. */
  messages: Array<OperationMessage>;
};

export type OperationMessage = {
  __typename?: 'OperationMessage';
  /** The error code, or `null` if no error code was set. */
  code?: Maybe<Scalars['String']['output']>;
  /** The field that caused the error, or `null` if it isn't associated with any particular field. */
  field?: Maybe<Scalars['String']['output']>;
  /** The kind of this message. */
  kind: OperationMessageKind;
  /** The error message. */
  message: Scalars['String']['output'];
};

export enum OperationMessageKind {
  Error = 'ERROR',
  Info = 'INFO',
  Permission = 'PERMISSION',
  Validation = 'VALIDATION',
  Warning = 'WARNING'
}

/** Organisation(id, created_at, last_update, slug, name, description, website, logo) */
export type Organisation = {
  __typename?: 'Organisation';
  externalDataSources: Array<ExternalDataSource>;
  id: Scalars['ID']['output'];
  members: Array<Membership>;
  name: Scalars['String']['output'];
  sharingPermissionsFromOtherOrgs: Array<SharingPermission>;
  slug: Scalars['String']['output'];
};


/** Organisation(id, created_at, last_update, slug, name, description, website, logo) */
export type OrganisationExternalDataSourcesArgs = {
  filters?: InputMaybe<ExternalDataSourceFilter>;
};

/** Organisation(id, created_at, last_update, slug, name, description, website, logo) */
export type OrganisationFilters = {
  AND?: InputMaybe<OrganisationFilters>;
  NOT?: InputMaybe<OrganisationFilters>;
  OR?: InputMaybe<OrganisationFilters>;
  id?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

/** Organisation(id, created_at, last_update, slug, name, description, website, logo) */
export type OrganisationInputPartial = {
  description?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type OutputInterface = {
  errors?: Maybe<Scalars['ExpectedError']['output']>;
  success: Scalars['Boolean']['output'];
};

export type PartyResult = {
  __typename?: 'PartyResult';
  party: Scalars['String']['output'];
  shade: Scalars['String']['output'];
  votes: Scalars['Int']['output'];
};

/** Person(id, person_type, external_id, id_type, name, area, photo, start_date, end_date) */
export type Person = {
  __typename?: 'Person';
  area: Area;
  endDate?: Maybe<Scalars['Date']['output']>;
  externalId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  idType: Scalars['String']['output'];
  name: Scalars['String']['output'];
  personData: Array<PersonData>;
  personDatum?: Maybe<PersonData>;
  personType: Scalars['String']['output'];
  photo?: Maybe<DjangoImageType>;
  startDate?: Maybe<Scalars['Date']['output']>;
};


/** Person(id, person_type, external_id, id_type, name, area, photo, start_date, end_date) */
export type PersonPersonDataArgs = {
  filters?: InputMaybe<CommonDataLoaderFilter>;
};


/** Person(id, person_type, external_id, id_type, name, area, photo, start_date, end_date) */
export type PersonPersonDatumArgs = {
  filters?: InputMaybe<CommonDataLoaderFilter>;
};

/** PersonData(id, data_type, data, date, float, int, json, person) */
export type PersonData = CommonData & {
  __typename?: 'PersonData';
  data: Scalars['String']['output'];
  dataType: DataType;
  date?: Maybe<Scalars['DateTime']['output']>;
  float?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  int?: Maybe<Scalars['Int']['output']>;
  json?: Maybe<Scalars['JSON']['output']>;
  person: Person;
  shade?: Maybe<Scalars['String']['output']>;
};

/** Person(id, person_type, external_id, id_type, name, area, photo, start_date, end_date) */
export type PersonFilter = {
  personType: Scalars['String']['input'];
};

export type PointFeature = Feature & {
  __typename?: 'PointFeature';
  geometry: PointGeometry;
  id?: Maybe<Scalars['String']['output']>;
  properties: Scalars['JSON']['output'];
  type: GeoJsonTypes;
};

export type PointGeometry = {
  __typename?: 'PointGeometry';
  coordinates: Array<Scalars['Float']['output']>;
  type: GeoJsonTypes;
};

export type PollingStation = {
  __typename?: 'PollingStation';
  customFinder?: Maybe<Scalars['Void']['output']>;
  pollingStationKnown: Scalars['Boolean']['output'];
  reportProblemUrl: Scalars['String']['output'];
  station?: Maybe<ElectoralCommissionStation>;
};

export type PostcodesIoCodes = {
  __typename?: 'PostcodesIOCodes';
  adminCounty: Scalars['String']['output'];
  adminDistrict: Scalars['String']['output'];
  adminWard: Scalars['String']['output'];
  ccg: Scalars['String']['output'];
  ccgId: Scalars['String']['output'];
  ced: Scalars['String']['output'];
  lau2: Scalars['String']['output'];
  lsoa: Scalars['String']['output'];
  msoa: Scalars['String']['output'];
  nuts: Scalars['String']['output'];
  parish?: Maybe<Scalars['String']['output']>;
  parliamentaryConstituency: Scalars['String']['output'];
  parliamentaryConstituency2024: Scalars['String']['output'];
  pfa: Scalars['String']['output'];
};

export type PostcodesIoResult = {
  __typename?: 'PostcodesIOResult';
  adminCounty?: Maybe<Scalars['String']['output']>;
  adminDistrict: Scalars['String']['output'];
  adminWard: Scalars['String']['output'];
  ccg: Scalars['String']['output'];
  ced?: Maybe<Scalars['String']['output']>;
  codes: PostcodesIoCodes;
  country: Scalars['String']['output'];
  dateOfIntroduction: Scalars['Int']['output'];
  eastings: Scalars['Int']['output'];
  europeanElectoralRegion: Scalars['String']['output'];
  feature: PointFeature;
  incode: Scalars['String']['output'];
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  lsoa: Scalars['String']['output'];
  msoa: Scalars['String']['output'];
  nhsHa: Scalars['String']['output'];
  northings: Scalars['Int']['output'];
  nuts: Scalars['String']['output'];
  outcode: Scalars['String']['output'];
  parish: Scalars['String']['output'];
  parliamentaryConstituency: Scalars['String']['output'];
  parliamentaryConstituency2024: Scalars['String']['output'];
  pfa: Scalars['String']['output'];
  postcode: Scalars['String']['output'];
  primaryCareTrust: Scalars['String']['output'];
  quality: Scalars['Int']['output'];
  region: Scalars['String']['output'];
};

export enum ProcrastinateJobStatus {
  Doing = 'doing',
  Failed = 'failed',
  Succeeded = 'succeeded',
  Todo = 'todo'
}

/** Organisation(id, created_at, last_update, slug, name, description, website, logo) */
export type PublicOrganisation = {
  __typename?: 'PublicOrganisation';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  airtableSource: AirtableSource;
  airtableSources: Array<AirtableSource>;
  allOrganisations: Array<PublicOrganisation>;
  area?: Maybe<Area>;
  dataSet?: Maybe<DataSet>;
  enrichPostcode: AuthenticatedPostcodeQueryResponse;
  enrichPostcodes: Array<AuthenticatedPostcodeQueryResponse>;
  externalDataSource: ExternalDataSource;
  externalDataSources: Array<ExternalDataSource>;
  genericDataByExternalDataSource: Array<GenericData>;
  googleSheetsOauthCredentials: Scalars['String']['output'];
  googleSheetsOauthUrl: Scalars['String']['output'];
  hubByHostname?: Maybe<HubHomepage>;
  hubHomepage: HubHomepage;
  hubHomepages: Array<HubHomepage>;
  hubPage: HubPage;
  hubPageByPath?: Maybe<HubPage>;
  importedDataGeojsonPoint?: Maybe<MapReportMemberFeature>;
  job: QueueJob;
  jobs: Array<QueueJob>;
  listApiTokens: Array<ApiToken>;
  mailchimpSource: MailchimpSource;
  mailchimpSources: Array<MailchimpSource>;
  mapReport: MapReport;
  mapReports: Array<MapReport>;
  mappingSources: Array<MappingSource>;
  me: UserType;
  memberships: Array<Membership>;
  myOrganisations: Array<Organisation>;
  postcodeSearch: UnauthenticatedPostcodeQueryResponse;
  publicMapReport: MapReport;
  /** Returns the current user if he is not anonymous. */
  publicUser?: Maybe<UserType>;
  reports: Array<Report>;
  sharedDataSource: SharedDataSource;
  sharedDataSources: Array<SharedDataSource>;
  testDataSource: ExternalDataSource;
};


export type QueryAirtableSourceArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryAllOrganisationsArgs = {
  filters?: InputMaybe<OrganisationFilters>;
};


export type QueryAreaArgs = {
  analyticalAreaType: AnalyticalAreaType;
  gss: Scalars['String']['input'];
};


export type QueryDataSetArgs = {
  name: Scalars['String']['input'];
};


export type QueryEnrichPostcodeArgs = {
  postcode: Scalars['String']['input'];
};


export type QueryEnrichPostcodesArgs = {
  postcodes: Array<Scalars['String']['input']>;
};


export type QueryExternalDataSourceArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryExternalDataSourcesArgs = {
  filters?: InputMaybe<ExternalDataSourceFilter>;
};


export type QueryGenericDataByExternalDataSourceArgs = {
  externalDataSourceId: Scalars['String']['input'];
};


export type QueryGoogleSheetsOauthCredentialsArgs = {
  redirectSuccessUrl: Scalars['String']['input'];
};


export type QueryGoogleSheetsOauthUrlArgs = {
  redirectUrl: Scalars['String']['input'];
};


export type QueryHubByHostnameArgs = {
  hostname: Scalars['String']['input'];
};


export type QueryHubHomepageArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryHubPageArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryHubPageByPathArgs = {
  hostname: Scalars['String']['input'];
  path?: InputMaybe<Scalars['String']['input']>;
};


export type QueryImportedDataGeojsonPointArgs = {
  genericDataId: Scalars['String']['input'];
};


export type QueryJobArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryJobsArgs = {
  filters?: InputMaybe<QueueFilter>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryMailchimpSourceArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryMapReportArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryMappingSourcesArgs = {
  organisationPk: Scalars['String']['input'];
};


export type QueryMyOrganisationsArgs = {
  filters?: InputMaybe<OrganisationFilters>;
};


export type QueryPostcodeSearchArgs = {
  postcode: Scalars['String']['input'];
};


export type QueryPublicMapReportArgs = {
  orgSlug: Scalars['String']['input'];
  reportSlug: Scalars['String']['input'];
};


export type QueryReportsArgs = {
  filters?: InputMaybe<ReportFilter>;
};


export type QuerySharedDataSourceArgs = {
  pk: Scalars['ID']['input'];
};


export type QuerySharedDataSourcesArgs = {
  filters?: InputMaybe<ExternalDataSourceFilter>;
};


export type QueryTestDataSourceArgs = {
  input: CreateExternalDataSourceInput;
};

/** ProcrastinateEvent(id, job, type, at) */
export type QueueEvent = {
  __typename?: 'QueueEvent';
  at?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  job: QueueJob;
  type: Scalars['String']['output'];
};

/** ProcrastinateJob(id, queue_name, task_name, priority, lock, args, status, scheduled_at, attempts, queueing_lock) */
export type QueueFilter = {
  AND?: InputMaybe<QueueFilter>;
  NOT?: InputMaybe<QueueFilter>;
  OR?: InputMaybe<QueueFilter>;
  attempts?: InputMaybe<IntFilterLookup>;
  externalDataSourceId?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<IdFilterLookup>;
  queueName?: InputMaybe<StrFilterLookup>;
  scheduledAt?: InputMaybe<DatetimeFilterLookup>;
  status: ProcrastinateJobStatus;
  taskName?: InputMaybe<StrFilterLookup>;
};

/** ProcrastinateJob(id, queue_name, task_name, priority, lock, args, status, scheduled_at, attempts, queueing_lock) */
export type QueueJob = {
  __typename?: 'QueueJob';
  args: Scalars['JSON']['output'];
  attempts: Scalars['Int']['output'];
  events: Array<QueueEvent>;
  id: Scalars['ID']['output'];
  lastEventAt: Scalars['DateTime']['output'];
  lock?: Maybe<Scalars['String']['output']>;
  queueName: Scalars['String']['output'];
  queueingLock?: Maybe<Scalars['String']['output']>;
  scheduledAt?: Maybe<Scalars['DateTime']['output']>;
  status: ProcrastinateJobStatus;
  taskName: Scalars['String']['output'];
};

/**
 *
 * Refresh token can be used to obtain a new token instead of log in again
 * when the token expires.
 *
 * *This is only used if `JWT_LONG_RUNNING_REFRESH_TOKEN` is set to True.*
 *
 */
export type RefreshTokenType = {
  __typename?: 'RefreshTokenType';
  created: Scalars['DateTime']['output'];
  expiresAt: Scalars['DateTime']['output'];
  isExpired: Scalars['Boolean']['output'];
  revoked?: Maybe<Scalars['DateTime']['output']>;
  /** randomly generated token that is attached to a FK user. */
  token: Scalars['String']['output'];
};

/** Report(polymorphic_ctype, id, organisation, name, slug, description, created_at, last_update, public) */
export type Report = {
  __typename?: 'Report';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  lastUpdate: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  organisation: Organisation;
  organisationId: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};

/** Report(polymorphic_ctype, id, organisation, name, slug, description, created_at, last_update, public) */
export type ReportFilter = {
  AND?: InputMaybe<ReportFilter>;
  NOT?: InputMaybe<ReportFilter>;
  OR?: InputMaybe<ReportFilter>;
  createdAt?: InputMaybe<DatetimeFilterLookup>;
  lastUpdate?: InputMaybe<DatetimeFilterLookup>;
  organisation?: InputMaybe<DjangoModelFilterInput>;
};

/**
 * A third-party data source that can be read and optionally written back to.
 * E.g. Google Sheet or an Action Network table.
 * This class is to be subclassed by specific data source types.
 */
export type SharedDataSource = Analytics & {
  __typename?: 'SharedDataSource';
  addressField?: Maybe<Scalars['String']['output']>;
  allowUpdates: Scalars['Boolean']['output'];
  automatedWebhooks: Scalars['Boolean']['output'];
  canDisplayPointField?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  crmType: CrmType;
  dataType: DataSourceType;
  defaultDataType?: Maybe<Scalars['String']['output']>;
  defaults: Scalars['JSON']['output'];
  description?: Maybe<Scalars['String']['output']>;
  descriptionField?: Maybe<Scalars['String']['output']>;
  emailField?: Maybe<Scalars['String']['output']>;
  endTimeField?: Maybe<Scalars['String']['output']>;
  firstNameField?: Maybe<Scalars['String']['output']>;
  fullNameField?: Maybe<Scalars['String']['output']>;
  geographyColumn?: Maybe<Scalars['String']['output']>;
  geographyColumnType: GeographyTypes;
  hasWebhooks: Scalars['Boolean']['output'];
  id: Scalars['UUID']['output'];
  imageField?: Maybe<Scalars['String']['output']>;
  importProgress?: Maybe<BatchJobProgress>;
  importedDataCount: Scalars['Int']['output'];
  importedDataCountByArea: Array<GroupedDataCount>;
  importedDataCountByConstituency: Array<GroupedDataCount>;
  importedDataCountByConstituency2024: Array<GroupedDataCount>;
  importedDataCountByConstituencyBySource: Array<GroupedDataCountWithBreakdown>;
  importedDataCountByCouncil: Array<GroupedDataCount>;
  importedDataCountByRegion: Array<GroupedDataCount>;
  importedDataCountByWard: Array<GroupedDataCount>;
  importedDataCountForArea?: Maybe<GroupedDataCount>;
  importedDataCountForConstituency?: Maybe<GroupedDataCount>;
  importedDataCountForConstituency2024?: Maybe<GroupedDataCount>;
  introspectFields: Scalars['Boolean']['output'];
  isImportScheduled: Scalars['Boolean']['output'];
  isUpdateScheduled: Scalars['Boolean']['output'];
  lastNameField?: Maybe<Scalars['String']['output']>;
  lastUpdate: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  organisation: PublicOrganisation;
  organisationId: Scalars['String']['output'];
  phoneField?: Maybe<Scalars['String']['output']>;
  postcodeField?: Maybe<Scalars['String']['output']>;
  predefinedColumnNames: Scalars['Boolean']['output'];
  publicUrlField?: Maybe<Scalars['String']['output']>;
  recordUrlTemplate?: Maybe<Scalars['String']['output']>;
  socialUrlField?: Maybe<Scalars['String']['output']>;
  startTimeField?: Maybe<Scalars['String']['output']>;
  titleField?: Maybe<Scalars['String']['output']>;
  updateProgress?: Maybe<BatchJobProgress>;
};


/**
 * A third-party data source that can be read and optionally written back to.
 * E.g. Google Sheet or an Action Network table.
 * This class is to be subclassed by specific data source types.
 */
export type SharedDataSourceImportedDataCountByAreaArgs = {
  analyticalAreaType: AnalyticalAreaType;
  column?: InputMaybe<Scalars['String']['input']>;
  operation?: InputMaybe<Scalars['String']['input']>;
};


/**
 * A third-party data source that can be read and optionally written back to.
 * E.g. Google Sheet or an Action Network table.
 * This class is to be subclassed by specific data source types.
 */
export type SharedDataSourceImportedDataCountByConstituencyBySourceArgs = {
  gss: Scalars['String']['input'];
};


/**
 * A third-party data source that can be read and optionally written back to.
 * E.g. Google Sheet or an Action Network table.
 * This class is to be subclassed by specific data source types.
 */
export type SharedDataSourceImportedDataCountForAreaArgs = {
  analyticalAreaType: AnalyticalAreaType;
  gss: Scalars['String']['input'];
};


/**
 * A third-party data source that can be read and optionally written back to.
 * E.g. Google Sheet or an Action Network table.
 * This class is to be subclassed by specific data source types.
 */
export type SharedDataSourceImportedDataCountForConstituencyArgs = {
  gss: Scalars['String']['input'];
};


/**
 * A third-party data source that can be read and optionally written back to.
 * E.g. Google Sheet or an Action Network table.
 * This class is to be subclassed by specific data source types.
 */
export type SharedDataSourceImportedDataCountForConstituency2024Args = {
  gss: Scalars['String']['input'];
};

/** SharingPermission(id, created_at, last_update, external_data_source, organisation, visibility_record_coordinates, visibility_record_details) */
export type SharingPermission = {
  __typename?: 'SharingPermission';
  createdAt: Scalars['DateTime']['output'];
  deleted: Scalars['Boolean']['output'];
  externalDataSource: SharedDataSource;
  externalDataSourceId: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  lastUpdate: Scalars['DateTime']['output'];
  organisation: PublicOrganisation;
  organisationId: Scalars['String']['output'];
  visibilityRecordCoordinates?: Maybe<Scalars['Boolean']['output']>;
  visibilityRecordDetails?: Maybe<Scalars['Boolean']['output']>;
};

/** SharingPermission(id, created_at, last_update, external_data_source, organisation, visibility_record_coordinates, visibility_record_details) */
export type SharingPermissionCudInput = {
  externalDataSourceId?: InputMaybe<OneToManyInput>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  organisationId?: InputMaybe<OneToManyInput>;
  visibilityRecordCoordinates?: InputMaybe<Scalars['Boolean']['input']>;
  visibilityRecordDetails?: InputMaybe<Scalars['Boolean']['input']>;
};

export type SharingPermissionInput = {
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  externalDataSourceId: Scalars['ID']['input'];
  id?: InputMaybe<Scalars['ID']['input']>;
  organisationId: Scalars['ID']['input'];
  visibilityRecordCoordinates?: InputMaybe<Scalars['Boolean']['input']>;
  visibilityRecordDetails?: InputMaybe<Scalars['Boolean']['input']>;
};

export type StrFilterLookup = {
  contains?: InputMaybe<Scalars['String']['input']>;
  endsWith?: InputMaybe<Scalars['String']['input']>;
  exact?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  iContains?: InputMaybe<Scalars['String']['input']>;
  iEndsWith?: InputMaybe<Scalars['String']['input']>;
  iExact?: InputMaybe<Scalars['String']['input']>;
  iRegex?: InputMaybe<Scalars['String']['input']>;
  iStartsWith?: InputMaybe<Scalars['String']['input']>;
  inList?: InputMaybe<Array<Scalars['String']['input']>>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  range?: InputMaybe<Array<Scalars['String']['input']>>;
  regex?: InputMaybe<Scalars['String']['input']>;
  startsWith?: InputMaybe<Scalars['String']['input']>;
};

/** Ticket Tailor box office */
export type TicketTailorSource = Analytics & {
  __typename?: 'TicketTailorSource';
  addressField?: Maybe<Scalars['String']['output']>;
  allowUpdates: Scalars['Boolean']['output'];
  apiKey: Scalars['String']['output'];
  autoImportEnabled: Scalars['Boolean']['output'];
  autoUpdateEnabled: Scalars['Boolean']['output'];
  automatedWebhooks: Scalars['Boolean']['output'];
  canDisplayPointField?: Maybe<Scalars['String']['output']>;
  connectionDetails: AirtableSourceMailchimpSourceActionNetworkSourceEditableGoogleSheetsSourceTicketTailorSource;
  createdAt: Scalars['DateTime']['output'];
  crmType: CrmType;
  dataType: DataSourceType;
  defaultDataType?: Maybe<Scalars['String']['output']>;
  defaults: Scalars['JSON']['output'];
  description?: Maybe<Scalars['String']['output']>;
  descriptionField?: Maybe<Scalars['String']['output']>;
  emailField?: Maybe<Scalars['String']['output']>;
  endTimeField?: Maybe<Scalars['String']['output']>;
  fieldDefinitions?: Maybe<Array<FieldDefinition>>;
  firstNameField?: Maybe<Scalars['String']['output']>;
  fullNameField?: Maybe<Scalars['String']['output']>;
  geographyColumn?: Maybe<Scalars['String']['output']>;
  geographyColumnType: GeographyTypes;
  hasWebhooks: Scalars['Boolean']['output'];
  healthcheck: Scalars['Boolean']['output'];
  id: Scalars['UUID']['output'];
  imageField?: Maybe<Scalars['String']['output']>;
  importProgress?: Maybe<BatchJobProgress>;
  importedDataCount: Scalars['Int']['output'];
  importedDataCountByArea: Array<GroupedDataCount>;
  importedDataCountByConstituency: Array<GroupedDataCount>;
  importedDataCountByConstituency2024: Array<GroupedDataCount>;
  importedDataCountByConstituencyBySource: Array<GroupedDataCountWithBreakdown>;
  importedDataCountByCouncil: Array<GroupedDataCount>;
  importedDataCountByRegion: Array<GroupedDataCount>;
  importedDataCountByWard: Array<GroupedDataCount>;
  importedDataCountForArea?: Maybe<GroupedDataCount>;
  importedDataCountForConstituency?: Maybe<GroupedDataCount>;
  importedDataCountForConstituency2024?: Maybe<GroupedDataCount>;
  introspectFields: Scalars['Boolean']['output'];
  isImportScheduled: Scalars['Boolean']['output'];
  isUpdateScheduled: Scalars['Boolean']['output'];
  jobs: Array<QueueJob>;
  lastImportJob?: Maybe<QueueJob>;
  lastNameField?: Maybe<Scalars['String']['output']>;
  lastUpdate: Scalars['DateTime']['output'];
  lastUpdateJob?: Maybe<QueueJob>;
  name: Scalars['String']['output'];
  oauthCredentials?: Maybe<Scalars['String']['output']>;
  organisation: Organisation;
  organisationId: Scalars['String']['output'];
  orgsWithAccess: Array<Organisation>;
  phoneField?: Maybe<Scalars['String']['output']>;
  postcodeField?: Maybe<Scalars['String']['output']>;
  predefinedColumnNames: Scalars['Boolean']['output'];
  publicUrlField?: Maybe<Scalars['String']['output']>;
  recordUrlTemplate?: Maybe<Scalars['String']['output']>;
  remoteName?: Maybe<Scalars['String']['output']>;
  remoteUrl?: Maybe<Scalars['String']['output']>;
  sharingPermissions: Array<SharingPermission>;
  socialUrlField?: Maybe<Scalars['String']['output']>;
  startTimeField?: Maybe<Scalars['String']['output']>;
  titleField?: Maybe<Scalars['String']['output']>;
  updateMapping?: Maybe<Array<AutoUpdateConfig>>;
  updateProgress?: Maybe<BatchJobProgress>;
  webhookHealthcheck: Scalars['Boolean']['output'];
  webhookUrl: Scalars['String']['output'];
};


/** Ticket Tailor box office */
export type TicketTailorSourceImportedDataCountByAreaArgs = {
  analyticalAreaType: AnalyticalAreaType;
  column?: InputMaybe<Scalars['String']['input']>;
  operation?: InputMaybe<Scalars['String']['input']>;
};


/** Ticket Tailor box office */
export type TicketTailorSourceImportedDataCountByConstituencyBySourceArgs = {
  gss: Scalars['String']['input'];
};


/** Ticket Tailor box office */
export type TicketTailorSourceImportedDataCountForAreaArgs = {
  analyticalAreaType: AnalyticalAreaType;
  gss: Scalars['String']['input'];
};


/** Ticket Tailor box office */
export type TicketTailorSourceImportedDataCountForConstituencyArgs = {
  gss: Scalars['String']['input'];
};


/** Ticket Tailor box office */
export type TicketTailorSourceImportedDataCountForConstituency2024Args = {
  gss: Scalars['String']['input'];
};


/** Ticket Tailor box office */
export type TicketTailorSourceJobsArgs = {
  filters?: InputMaybe<QueueFilter>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


/** Ticket Tailor box office */
export type TicketTailorSourceOrgsWithAccessArgs = {
  filters?: InputMaybe<OrganisationFilters>;
};

/** Ticket Tailor box office */
export type TicketTailorSourceInput = {
  addressField?: InputMaybe<Scalars['String']['input']>;
  apiKey: Scalars['String']['input'];
  autoImportEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  autoUpdateEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  canDisplayPointField?: InputMaybe<Scalars['String']['input']>;
  dataType?: InputMaybe<DataSourceType>;
  description?: InputMaybe<Scalars['String']['input']>;
  descriptionField?: InputMaybe<Scalars['String']['input']>;
  emailField?: InputMaybe<Scalars['String']['input']>;
  endTimeField?: InputMaybe<Scalars['String']['input']>;
  firstNameField?: InputMaybe<Scalars['String']['input']>;
  fullNameField?: InputMaybe<Scalars['String']['input']>;
  geographyColumn?: InputMaybe<Scalars['String']['input']>;
  geographyColumnType?: InputMaybe<GeographyTypes>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  imageField?: InputMaybe<Scalars['String']['input']>;
  lastNameField?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  organisation?: InputMaybe<OneToManyInput>;
  phoneField?: InputMaybe<Scalars['String']['input']>;
  postcodeField?: InputMaybe<Scalars['String']['input']>;
  publicUrlField?: InputMaybe<Scalars['String']['input']>;
  socialUrlField?: InputMaybe<Scalars['String']['input']>;
  startTimeField?: InputMaybe<Scalars['String']['input']>;
  titleField?: InputMaybe<Scalars['String']['input']>;
  updateMapping?: InputMaybe<Array<UpdateMappingItemInput>>;
};

/**
 *
 * the data that was used to create the token.
 *
 */
export type TokenPayloadType = {
  __typename?: 'TokenPayloadType';
  /** when the token will be expired */
  exp: Scalars['DateTime']['output'];
  /** when the token was created */
  origIat: Scalars['DateTime']['output'];
  username: Scalars['String']['output'];
};

/**
 *
 * encapsulates the token with the payload that was used to create the token.
 *
 */
export type TokenType = {
  __typename?: 'TokenType';
  payload: TokenPayloadType;
  /** The encoded payload, namely a token. */
  token: Scalars['String']['output'];
};

export type UnauthenticatedPostcodeQueryResponse = {
  __typename?: 'UnauthenticatedPostcodeQueryResponse';
  constituency?: Maybe<Area>;
  constituency2024?: Maybe<Area>;
  electoralCommission?: Maybe<ElectoralCommissionPostcodeLookup>;
  postcode: Scalars['String']['output'];
  postcodesIO?: Maybe<PostcodesIoResult>;
};


export type UnauthenticatedPostcodeQueryResponseElectoralCommissionArgs = {
  addressSlug?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateMappingItemInput = {
  destinationColumn: Scalars['String']['input'];
  source: Scalars['String']['input'];
  sourcePath: Scalars['String']['input'];
};

/**
 * Users within the Django authentication system are represented by this
 * model.
 *
 * Username and password are required. Other fields are optional.
 */
export type User = {
  __typename?: 'User';
  email: Scalars['String']['output'];
  userProperties: UserProperties;
};

/** UserProperties(id, user, organisation_name, full_name, email_confirmed, account_confirmed, last_seen, agreed_terms) */
export type UserProperties = {
  __typename?: 'UserProperties';
  fullName?: Maybe<Scalars['String']['output']>;
  user: User;
  userId: Scalars['String']['output'];
};

/** A helper model that handles user account stuff. */
export type UserStatusType = {
  __typename?: 'UserStatusType';
  archived: Scalars['Boolean']['output'];
  verified: Scalars['Boolean']['output'];
};

/**
 * Users within the Django authentication system are represented by this
 * model.
 *
 * Username and password are required. Other fields are optional.
 */
export type UserType = {
  __typename?: 'UserType';
  archived: Scalars['Boolean']['output'];
  dateJoined: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  firstName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** Designates whether this user should be treated as active. Unselect this instead of deleting accounts. */
  isActive: Scalars['Boolean']['output'];
  /** Designates whether the user can log into this admin site. */
  isStaff: Scalars['Boolean']['output'];
  /** Designates that this user has all permissions without explicitly assigning them. */
  isSuperuser: Scalars['Boolean']['output'];
  lastLogin?: Maybe<Scalars['DateTime']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  logentrySet: Array<DjangoModelType>;
  status: UserStatusType;
  /** Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. */
  username: Scalars['String']['output'];
  verified: Scalars['Boolean']['output'];
};

export enum WebhookType {
  Import = 'Import',
  Update = 'Update'
}

export type DeveloperApiContextQueryVariables = Exact<{ [key: string]: never; }>;


export type DeveloperApiContextQuery = { __typename?: 'Query', listApiTokens: Array<{ __typename?: 'APIToken', token: string, signature: string, revoked: boolean, createdAt: any, expiresAt: any }> };

export type CreateTokenMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateTokenMutation = { __typename?: 'Mutation', createApiToken: { __typename?: 'APIToken', token: string, signature: string, revoked: boolean, createdAt: any, expiresAt: any } };

export type RevokeTokenMutationVariables = Exact<{
  signature: Scalars['ID']['input'];
}>;


export type RevokeTokenMutation = { __typename?: 'Mutation', revokeApiToken: { __typename?: 'APIToken', signature: string, revoked: boolean } };

export type VerifyMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type VerifyMutation = { __typename?: 'Mutation', verifyAccount: { __typename?: 'MutationNormalOutput', errors?: any | null, success: boolean } };

export type ExampleQueryVariables = Exact<{ [key: string]: never; }>;


export type ExampleQuery = { __typename?: 'Query', myOrganisations: Array<{ __typename?: 'Organisation', id: string, name: string }> };

export type LoginMutationVariables = Exact<{
  username: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', tokenAuth: { __typename?: 'ObtainJSONWebTokenType', errors?: any | null, success: boolean, token?: { __typename?: 'TokenType', token: string, payload: { __typename?: 'TokenPayloadType', exp: any } } | null } };

export type PerformPasswordResetMutationVariables = Exact<{
  token: Scalars['String']['input'];
  password1: Scalars['String']['input'];
  password2: Scalars['String']['input'];
}>;


export type PerformPasswordResetMutation = { __typename?: 'Mutation', performPasswordReset: { __typename?: 'MutationNormalOutput', errors?: any | null, success: boolean } };

export type ResetPasswordMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type ResetPasswordMutation = { __typename?: 'Mutation', requestPasswordReset: { __typename?: 'MutationNormalOutput', errors?: any | null, success: boolean } };

export type ListOrganisationsQueryVariables = Exact<{
  currentOrganisationId: Scalars['ID']['input'];
}>;


export type ListOrganisationsQuery = { __typename?: 'Query', myOrganisations: Array<{ __typename?: 'Organisation', id: string, externalDataSources: Array<{ __typename?: 'ExternalDataSource', id: any, name: string, dataType: DataSourceType, crmType: CrmType, autoImportEnabled: boolean, autoUpdateEnabled: boolean, connectionDetails: { __typename?: 'ActionNetworkSource' } | { __typename?: 'AirtableSource', baseId: string, tableId: string } | { __typename?: 'EditableGoogleSheetsSource' } | { __typename?: 'MailchimpSource', apiKey: string, listId: string } | { __typename?: 'TicketTailorSource' }, jobs: Array<{ __typename?: 'QueueJob', lastEventAt: any, status: ProcrastinateJobStatus }>, updateMapping?: Array<{ __typename?: 'AutoUpdateConfig', source: string, sourcePath: string, destinationColumn: string }> | null, sharingPermissions: Array<{ __typename?: 'SharingPermission', id: any, organisation: { __typename?: 'PublicOrganisation', id: string, name: string } }> }>, sharingPermissionsFromOtherOrgs: Array<{ __typename?: 'SharingPermission', id: any, externalDataSource: { __typename?: 'SharedDataSource', id: any, name: string, dataType: DataSourceType, crmType: CrmType, organisation: { __typename?: 'PublicOrganisation', name: string } } }> }> };

export type GetSourceMappingQueryVariables = Exact<{
  ID: Scalars['ID']['input'];
}>;


export type GetSourceMappingQuery = { __typename?: 'Query', externalDataSource: { __typename?: 'ExternalDataSource', id: any, autoImportEnabled: boolean, autoUpdateEnabled: boolean, allowUpdates: boolean, hasWebhooks: boolean, crmType: CrmType, geographyColumn?: string | null, geographyColumnType: GeographyTypes, postcodeField?: string | null, firstNameField?: string | null, lastNameField?: string | null, emailField?: string | null, phoneField?: string | null, addressField?: string | null, canDisplayPointField?: string | null, updateMapping?: Array<{ __typename?: 'AutoUpdateConfig', destinationColumn: string, source: string, sourcePath: string }> | null, fieldDefinitions?: Array<{ __typename?: 'FieldDefinition', label?: string | null, value: string, description?: string | null, editable: boolean }> | null } };

export type TestDataSourceQueryVariables = Exact<{
  input: CreateExternalDataSourceInput;
}>;


export type TestDataSourceQuery = { __typename?: 'Query', testDataSource: { __typename: 'ExternalDataSource', crmType: CrmType, geographyColumn?: string | null, geographyColumnType: GeographyTypes, healthcheck: boolean, predefinedColumnNames: boolean, defaultDataType?: string | null, remoteName?: string | null, allowUpdates: boolean, defaults: any, oauthCredentials?: string | null, fieldDefinitions?: Array<{ __typename?: 'FieldDefinition', label?: string | null, value: string, description?: string | null, editable: boolean }> | null } };

export type GoogleSheetsOauthUrlQueryVariables = Exact<{
  redirectUrl: Scalars['String']['input'];
}>;


export type GoogleSheetsOauthUrlQuery = { __typename?: 'Query', googleSheetsOauthUrl: string };

export type GoogleSheetsOauthCredentialsQueryVariables = Exact<{
  redirectSuccessUrl: Scalars['String']['input'];
}>;


export type GoogleSheetsOauthCredentialsQuery = { __typename?: 'Query', googleSheetsOauthCredentials: string };

export type CreateSourceMutationVariables = Exact<{
  input: CreateExternalDataSourceInput;
}>;


export type CreateSourceMutation = { __typename?: 'Mutation', createExternalDataSource: { __typename?: 'CreateExternalDataSourceOutput', code: number, errors: Array<{ __typename?: 'MutationError', message: string }>, result?: { __typename?: 'ExternalDataSource', id: any, name: string, crmType: CrmType, dataType: DataSourceType, allowUpdates: boolean } | null } };

export type AutoUpdateCreationReviewQueryVariables = Exact<{
  ID: Scalars['ID']['input'];
}>;


export type AutoUpdateCreationReviewQuery = { __typename?: 'Query', externalDataSource: { __typename?: 'ExternalDataSource', id: any, name: string, geographyColumn?: string | null, geographyColumnType: GeographyTypes, dataType: DataSourceType, crmType: CrmType, autoImportEnabled: boolean, autoUpdateEnabled: boolean, automatedWebhooks: boolean, webhookUrl: string, updateMapping?: Array<{ __typename?: 'AutoUpdateConfig', source: string, sourcePath: string, destinationColumn: string }> | null, jobs: Array<{ __typename?: 'QueueJob', lastEventAt: any, status: ProcrastinateJobStatus }>, sharingPermissions: Array<{ __typename?: 'SharingPermission', id: any, organisation: { __typename?: 'PublicOrganisation', id: string, name: string } }> } };

export type ExternalDataSourceInspectPageQueryVariables = Exact<{
  ID: Scalars['ID']['input'];
}>;


export type ExternalDataSourceInspectPageQuery = { __typename?: 'Query', externalDataSource: { __typename?: 'ExternalDataSource', id: any, name: string, dataType: DataSourceType, remoteUrl?: string | null, crmType: CrmType, autoImportEnabled: boolean, autoUpdateEnabled: boolean, hasWebhooks: boolean, allowUpdates: boolean, automatedWebhooks: boolean, webhookUrl: string, webhookHealthcheck: boolean, geographyColumn?: string | null, geographyColumnType: GeographyTypes, postcodeField?: string | null, firstNameField?: string | null, lastNameField?: string | null, fullNameField?: string | null, emailField?: string | null, phoneField?: string | null, addressField?: string | null, titleField?: string | null, descriptionField?: string | null, imageField?: string | null, startTimeField?: string | null, endTimeField?: string | null, publicUrlField?: string | null, socialUrlField?: string | null, canDisplayPointField?: string | null, isImportScheduled: boolean, isUpdateScheduled: boolean, importedDataCount: number, connectionDetails: { __typename?: 'ActionNetworkSource', apiKey: string, groupSlug: string } | { __typename?: 'AirtableSource', apiKey: string, baseId: string, tableId: string } | { __typename?: 'EditableGoogleSheetsSource' } | { __typename?: 'MailchimpSource', apiKey: string, listId: string } | { __typename?: 'TicketTailorSource', apiKey: string }, lastImportJob?: { __typename?: 'QueueJob', id: string, lastEventAt: any, status: ProcrastinateJobStatus } | null, lastUpdateJob?: { __typename?: 'QueueJob', id: string, lastEventAt: any, status: ProcrastinateJobStatus } | null, importProgress?: { __typename?: 'BatchJobProgress', id: string, hasForecast: boolean, status: ProcrastinateJobStatus, total?: number | null, succeeded?: number | null, estimatedFinishTime?: any | null } | null, updateProgress?: { __typename?: 'BatchJobProgress', id: string, hasForecast: boolean, status: ProcrastinateJobStatus, total?: number | null, succeeded?: number | null, estimatedFinishTime?: any | null } | null, fieldDefinitions?: Array<{ __typename?: 'FieldDefinition', label?: string | null, value: string, description?: string | null, editable: boolean }> | null, updateMapping?: Array<{ __typename?: 'AutoUpdateConfig', source: string, sourcePath: string, destinationColumn: string }> | null, sharingPermissions: Array<{ __typename?: 'SharingPermission', id: any }>, organisation: { __typename?: 'Organisation', id: string, name: string } } };

export type DeleteUpdateConfigMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteUpdateConfigMutation = { __typename?: 'Mutation', deleteExternalDataSource: { __typename?: 'ExternalDataSource', id: any } };

export type ManageSourceSharingQueryVariables = Exact<{
  externalDataSourceId: Scalars['ID']['input'];
}>;


export type ManageSourceSharingQuery = { __typename?: 'Query', externalDataSource: { __typename?: 'ExternalDataSource', sharingPermissions: Array<{ __typename?: 'SharingPermission', id: any, organisationId: string, externalDataSourceId: string, visibilityRecordCoordinates?: boolean | null, visibilityRecordDetails?: boolean | null, deleted: boolean, organisation: { __typename?: 'PublicOrganisation', name: string } }> } };

export type UpdateSourceSharingObjectMutationVariables = Exact<{
  data: SharingPermissionCudInput;
}>;


export type UpdateSourceSharingObjectMutation = { __typename?: 'Mutation', updateSharingPermission: { __typename?: 'SharingPermission', id: any, organisationId: string, externalDataSourceId: string, visibilityRecordCoordinates?: boolean | null, visibilityRecordDetails?: boolean | null, deleted: boolean } };

export type DeleteSourceSharingObjectMutationVariables = Exact<{
  pk: Scalars['String']['input'];
}>;


export type DeleteSourceSharingObjectMutation = { __typename?: 'Mutation', deleteSharingPermission: { __typename?: 'SharingPermission', id: any } };

export type ImportDataMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type ImportDataMutation = { __typename?: 'Mutation', importAll: { __typename?: 'ExternalDataSourceAction', id: string, externalDataSource: { __typename?: 'ExternalDataSource', importedDataCount: number, isImportScheduled: boolean, importProgress?: { __typename?: 'BatchJobProgress', status: ProcrastinateJobStatus, hasForecast: boolean, id: string, total?: number | null, succeeded?: number | null, failed?: number | null, estimatedFinishTime?: any | null } | null } } };

export type ExternalDataSourceNameQueryVariables = Exact<{
  externalDataSourceId: Scalars['ID']['input'];
}>;


export type ExternalDataSourceNameQuery = { __typename?: 'Query', externalDataSource: { __typename?: 'ExternalDataSource', name: string, crmType: CrmType, dataType: DataSourceType, remoteUrl?: string | null } };

export type ShareDataSourcesMutationVariables = Exact<{
  fromOrgId: Scalars['String']['input'];
  permissions: Array<SharingPermissionInput> | SharingPermissionInput;
}>;


export type ShareDataSourcesMutation = { __typename?: 'Mutation', updateSharingPermissions: Array<{ __typename?: 'ExternalDataSource', id: any, sharingPermissions: Array<{ __typename?: 'SharingPermission', id: any, organisationId: string, externalDataSourceId: string, visibilityRecordCoordinates?: boolean | null, visibilityRecordDetails?: boolean | null, deleted: boolean }> }> };

export type YourSourcesForSharingQueryVariables = Exact<{ [key: string]: never; }>;


export type YourSourcesForSharingQuery = { __typename?: 'Query', myOrganisations: Array<{ __typename?: 'Organisation', id: string, name: string, externalDataSources: Array<{ __typename?: 'ExternalDataSource', id: any, name: string, crmType: CrmType, importedDataCount: number, dataType: DataSourceType, organisationId: string, fieldDefinitions?: Array<{ __typename?: 'FieldDefinition', label?: string | null, editable: boolean }> | null, sharingPermissions: Array<{ __typename?: 'SharingPermission', id: any, organisationId: string, externalDataSourceId: string, visibilityRecordCoordinates?: boolean | null, visibilityRecordDetails?: boolean | null, deleted: boolean }> }> }> };

export type ShareWithOrgPageQueryVariables = Exact<{
  orgSlug: Scalars['String']['input'];
}>;


export type ShareWithOrgPageQuery = { __typename?: 'Query', allOrganisations: Array<{ __typename?: 'PublicOrganisation', id: string, name: string }> };

export type GetEditableHubsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetEditableHubsQuery = { __typename?: 'Query', hubHomepages: Array<{ __typename?: 'HubHomepage', id: string }> };

export type VerifyPageQueryVariables = Exact<{
  pageId: Scalars['ID']['input'];
}>;


export type VerifyPageQuery = { __typename?: 'Query', hubHomepages: Array<{ __typename?: 'HubHomepage', id: string }>, hubPage: { __typename?: 'HubPage', id: string, hub: { __typename?: 'HubHomepage', id: string } } };

export type CreateMapReportMutationVariables = Exact<{
  data: MapReportInput;
}>;


export type CreateMapReportMutation = { __typename?: 'Mutation', createMapReport: { __typename?: 'MapReport', id: any } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', message: string }> } };

export type ListReportsQueryVariables = Exact<{
  currentOrganisationId: Scalars['ID']['input'];
}>;


export type ListReportsQuery = { __typename?: 'Query', reports: Array<{ __typename?: 'Report', id: any, name: string, lastUpdate: any }> };

export type ListExternalDataSourcesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListExternalDataSourcesQuery = { __typename?: 'Query', myOrganisations: Array<{ __typename?: 'Organisation', id: string, externalDataSources: Array<{ __typename?: 'ExternalDataSource', id: any }> }> };

export type GetPublicMapReportQueryVariables = Exact<{
  orgSlug: Scalars['String']['input'];
  reportSlug: Scalars['String']['input'];
}>;


export type GetPublicMapReportQuery = { __typename?: 'Query', publicMapReport: { __typename?: 'MapReport', id: any, name: string } };

export type GetPublicMapReportForLayoutQueryVariables = Exact<{
  orgSlug: Scalars['String']['input'];
  reportSlug: Scalars['String']['input'];
}>;


export type GetPublicMapReportForLayoutQuery = { __typename?: 'Query', publicMapReport: { __typename?: 'MapReport', id: any, name: string, displayOptions: any, organisation: { __typename?: 'Organisation', id: string, slug: string, name: string }, layers: Array<{ __typename?: 'MapLayer', id: string, name: string }> } };

export type HostAnalyticsQueryVariables = Exact<{
  hostname: Scalars['String']['input'];
}>;


export type HostAnalyticsQuery = { __typename?: 'Query', hubByHostname?: { __typename?: 'HubHomepage', googleAnalyticsTagId?: string | null, primaryColour?: string | null, secondaryColour?: string | null, customCss?: string | null } | null };

export type GetHubMapDataQueryVariables = Exact<{
  hostname: Scalars['String']['input'];
}>;


export type GetHubMapDataQuery = { __typename?: 'Query', hubByHostname?: { __typename?: 'HubHomepage', id: string, organisation: { __typename?: 'Organisation', id: string, slug: string, name: string }, layers: Array<{ __typename?: 'MapLayer', id: string, name: string, type: string, visible?: boolean | null, iconImage?: string | null, mapboxPaint?: any | null, mapboxLayout?: any | null, source: { __typename?: 'SharedDataSource', id: any } }>, navLinks: Array<{ __typename?: 'HubNavLink', label: string, link: string }> } | null };

export type EventFragmentFragment = { __typename?: 'GenericData', id: string, title?: string | null, address?: string | null, postcode?: string | null, startTime?: any | null, publicUrl?: string | null, description?: string | null, dataType: { __typename?: 'DataType', id: string, dataSet: { __typename?: 'DataSet', externalDataSource: { __typename?: 'ExternalDataSource', dataType: DataSourceType } } } };

export type ConstituencyViewFragmentFragment = { __typename?: 'Area', id: string, gss: string, name: string, fitBounds?: any | null, samplePostcode?: { __typename?: 'PostcodesIOResult', postcode: string } | null, mp?: { __typename?: 'Person', id: string, name: string, photo?: { __typename?: 'DjangoImageType', url: string } | null, party?: { __typename?: 'PersonData', shade?: string | null, name: string } | null, email?: { __typename?: 'PersonData', data: string } | null } | null, ppcs: Array<{ __typename?: 'Person', id: string, name: string, photo?: { __typename?: 'DjangoImageType', url: string } | null, party?: { __typename?: 'PersonData', shade?: string | null, name: string } | null, email?: { __typename?: 'PersonData', data: string } | null }> };

export type GetLocalDataQueryVariables = Exact<{
  postcode: Scalars['String']['input'];
  hostname: Scalars['String']['input'];
}>;


export type GetLocalDataQuery = { __typename?: 'Query', postcodeSearch: { __typename?: 'UnauthenticatedPostcodeQueryResponse', postcode: string, constituency?: { __typename?: 'Area', id: string, gss: string, name: string, fitBounds?: any | null, genericDataForHub: Array<{ __typename?: 'GenericData', id: string, title?: string | null, address?: string | null, postcode?: string | null, startTime?: any | null, publicUrl?: string | null, description?: string | null, dataType: { __typename?: 'DataType', id: string, dataSet: { __typename?: 'DataSet', externalDataSource: { __typename?: 'ExternalDataSource', dataType: DataSourceType } } } }>, samplePostcode?: { __typename?: 'PostcodesIOResult', postcode: string } | null, mp?: { __typename?: 'Person', id: string, name: string, photo?: { __typename?: 'DjangoImageType', url: string } | null, party?: { __typename?: 'PersonData', shade?: string | null, name: string } | null, email?: { __typename?: 'PersonData', data: string } | null } | null, ppcs: Array<{ __typename?: 'Person', id: string, name: string, photo?: { __typename?: 'DjangoImageType', url: string } | null, party?: { __typename?: 'PersonData', shade?: string | null, name: string } | null, email?: { __typename?: 'PersonData', data: string } | null }> } | null } };

export type GetEventDataQueryVariables = Exact<{
  eventId: Scalars['String']['input'];
  hostname: Scalars['String']['input'];
}>;


export type GetEventDataQuery = { __typename?: 'Query', importedDataGeojsonPoint?: { __typename?: 'MapReportMemberFeature', properties?: { __typename?: 'GenericData', id: string, title?: string | null, address?: string | null, postcode?: string | null, startTime?: any | null, publicUrl?: string | null, description?: string | null, constituency?: { __typename?: 'Area', id: string, gss: string, name: string, fitBounds?: any | null, genericDataForHub: Array<{ __typename?: 'GenericData', id: string, title?: string | null, address?: string | null, postcode?: string | null, startTime?: any | null, publicUrl?: string | null, description?: string | null, dataType: { __typename?: 'DataType', id: string, dataSet: { __typename?: 'DataSet', externalDataSource: { __typename?: 'ExternalDataSource', dataType: DataSourceType } } } }>, samplePostcode?: { __typename?: 'PostcodesIOResult', postcode: string } | null, mp?: { __typename?: 'Person', id: string, name: string, photo?: { __typename?: 'DjangoImageType', url: string } | null, party?: { __typename?: 'PersonData', shade?: string | null, name: string } | null, email?: { __typename?: 'PersonData', data: string } | null } | null, ppcs: Array<{ __typename?: 'Person', id: string, name: string, photo?: { __typename?: 'DjangoImageType', url: string } | null, party?: { __typename?: 'PersonData', shade?: string | null, name: string } | null, email?: { __typename?: 'PersonData', data: string } | null }> } | null, dataType: { __typename?: 'DataType', id: string, dataSet: { __typename?: 'DataSet', externalDataSource: { __typename?: 'ExternalDataSource', dataType: DataSourceType } } } } | null } | null };

export type GetPageQueryVariables = Exact<{
  hostname: Scalars['String']['input'];
  path?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetPageQuery = { __typename?: 'Query', hubPageByPath?: { __typename?: 'HubPage', id: string, title: string, path: string, puckJsonContent: any, seoTitle: string, searchDescription?: string | null, hub: { __typename?: 'HubHomepage', faviconUrl?: string | null, seoTitle: string, seoImageUrl?: string | null, searchDescription?: string | null, primaryColour?: string | null, secondaryColour?: string | null, customCss?: string | null, navLinks: Array<{ __typename?: 'HubNavLink', link: string, label: string }> } } | null };

export type ConstituencyStatsOverviewQueryVariables = Exact<{
  reportID: Scalars['ID']['input'];
  analyticalAreaType: AnalyticalAreaType;
}>;


export type ConstituencyStatsOverviewQuery = { __typename?: 'Query', mapReport: { __typename?: 'MapReport', id: any, importedDataCountByConstituency: Array<{ __typename?: 'GroupedDataCount', label?: string | null, gss?: string | null, count: number, gssArea?: { __typename?: 'Area', id: string, name: string, fitBounds?: any | null, mp?: { __typename?: 'Person', id: string, name: string, photo?: { __typename?: 'DjangoImageType', url: string } | null, party?: { __typename?: 'PersonData', name: string } | null } | null, lastElection?: { __typename?: 'ConstituencyElectionResult', stats: { __typename?: 'ConstituencyElectionStats', date: string, majority: number, electorate: number, firstPartyResult: { __typename?: 'PartyResult', party: string, shade: string, votes: number }, secondPartyResult: { __typename?: 'PartyResult', party: string, shade: string, votes: number } } } | null } | null }> } };

export type GetConstituencyDataQueryVariables = Exact<{
  analyticalAreaType: AnalyticalAreaType;
  gss: Scalars['String']['input'];
  reportID: Scalars['ID']['input'];
}>;


export type GetConstituencyDataQuery = { __typename?: 'Query', constituency?: { __typename?: 'Area', id: string, name: string, mp?: { __typename?: 'Person', id: string, name: string, photo?: { __typename?: 'DjangoImageType', url: string } | null, party?: { __typename?: 'PersonData', shade?: string | null, name: string } | null } | null, lastElection?: { __typename?: 'ConstituencyElectionResult', stats: { __typename?: 'ConstituencyElectionStats', date: string, electorate: number, validVotes: number, majority: number, firstPartyResult: { __typename?: 'PartyResult', party: string, shade: string, votes: number }, secondPartyResult: { __typename?: 'PartyResult', party: string, shade: string, votes: number } } } | null } | null, mapReport: { __typename?: 'MapReport', id: any, importedDataCountForConstituency?: { __typename?: 'GroupedDataCount', gss?: string | null, count: number } | null, layers: Array<{ __typename?: 'MapLayer', id: string, name: string, source: { __typename?: 'SharedDataSource', id: any, importedDataCountForConstituency?: { __typename?: 'GroupedDataCount', gss?: string | null, count: number } | null } }> } };

export type MapReportWardStatsQueryVariables = Exact<{
  reportID: Scalars['ID']['input'];
}>;


export type MapReportWardStatsQuery = { __typename?: 'Query', mapReport: { __typename?: 'MapReport', id: any, importedDataCountByArea: Array<{ __typename?: 'GroupedDataCount', label?: string | null, gss?: string | null, count: number, gssArea?: { __typename?: 'Area', point?: { __typename?: 'PointFeature', id?: string | null, type: GeoJsonTypes, geometry: { __typename?: 'PointGeometry', type: GeoJsonTypes, coordinates: Array<number> } } | null } | null }> } };

export type MapReportLayerGeoJsonPointQueryVariables = Exact<{
  genericDataId: Scalars['String']['input'];
}>;


export type MapReportLayerGeoJsonPointQuery = { __typename?: 'Query', importedDataGeojsonPoint?: { __typename?: 'MapReportMemberFeature', id?: string | null, type: GeoJsonTypes, geometry: { __typename?: 'PointGeometry', type: GeoJsonTypes, coordinates: Array<number> }, properties?: { __typename?: 'GenericData', id: string, lastUpdate: any, name?: string | null, phone?: string | null, email?: string | null, address?: string | null, json?: any | null, remoteUrl: string, postcodeData?: { __typename?: 'PostcodesIOResult', postcode: string } | null, dataType: { __typename?: 'DataType', dataSet: { __typename?: 'DataSet', externalDataSource: { __typename?: 'ExternalDataSource', name: string } } } } | null } | null };

export type MapReportLayerAnalyticsQueryVariables = Exact<{
  reportID: Scalars['ID']['input'];
}>;


export type MapReportLayerAnalyticsQuery = { __typename?: 'Query', mapReport: { __typename?: 'MapReport', id: any, layers: Array<{ __typename?: 'MapLayer', id: string, name: string, source: { __typename?: 'SharedDataSource', id: any, dataType: DataSourceType, organisation: { __typename?: 'PublicOrganisation', name: string } } }> } };

export type MapReportRegionStatsQueryVariables = Exact<{
  reportID: Scalars['ID']['input'];
}>;


export type MapReportRegionStatsQuery = { __typename?: 'Query', mapReport: { __typename?: 'MapReport', id: any, importedDataCountByRegion: Array<{ __typename?: 'GroupedDataCount', label?: string | null, gss?: string | null, count: number, gssArea?: { __typename?: 'Area', point?: { __typename?: 'PointFeature', id?: string | null, type: GeoJsonTypes, geometry: { __typename?: 'PointGeometry', type: GeoJsonTypes, coordinates: Array<number> } } | null } | null }> } };

export type MapReportConstituencyStatsQueryVariables = Exact<{
  reportID: Scalars['ID']['input'];
  analyticalAreaType: AnalyticalAreaType;
}>;


export type MapReportConstituencyStatsQuery = { __typename?: 'Query', mapReport: { __typename?: 'MapReport', id: any, importedDataCountByConstituency: Array<{ __typename?: 'GroupedDataCount', label?: string | null, gss?: string | null, count: number, gssArea?: { __typename?: 'Area', point?: { __typename?: 'PointFeature', id?: string | null, type: GeoJsonTypes, geometry: { __typename?: 'PointGeometry', type: GeoJsonTypes, coordinates: Array<number> } } | null } | null }> } };

export type GetMapReportQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetMapReportQuery = { __typename?: 'Query', mapReport: { __typename?: 'MapReport', id: any, name: string, slug: string, displayOptions: any, organisation: { __typename?: 'Organisation', id: string, slug: string, name: string }, layers: Array<{ __typename?: 'MapLayer', id: string, name: string, sharingPermission?: { __typename?: 'SharingPermission', visibilityRecordDetails?: boolean | null, visibilityRecordCoordinates?: boolean | null, organisation: { __typename?: 'PublicOrganisation', name: string } } | null, source: { __typename?: 'SharedDataSource', id: any, name: string, isImportScheduled: boolean, importedDataCount: number, crmType: CrmType, dataType: DataSourceType, organisation: { __typename?: 'PublicOrganisation', name: string } } }> } };

export type UpdateMapReportMutationVariables = Exact<{
  input: MapReportInput;
}>;


export type UpdateMapReportMutation = { __typename?: 'Mutation', updateMapReport: { __typename?: 'MapReport', id: any, name: string, displayOptions: any, layers: Array<{ __typename?: 'MapLayer', id: string, name: string, source: { __typename?: 'SharedDataSource', id: any, name: string } }> } };

export type DeleteMapReportMutationVariables = Exact<{
  id: IdObject;
}>;


export type DeleteMapReportMutation = { __typename?: 'Mutation', deleteMapReport: { __typename?: 'MapReport', id: any } };

export type GetMapReportNameQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetMapReportNameQuery = { __typename?: 'Query', mapReport: { __typename?: 'MapReport', id: any, name: string } };

export type WebhookRefreshMutationVariables = Exact<{
  ID: Scalars['String']['input'];
}>;


export type WebhookRefreshMutation = { __typename?: 'Mutation', refreshWebhooks: { __typename?: 'ExternalDataSource', id: any, hasWebhooks: boolean, automatedWebhooks: boolean, webhookHealthcheck: boolean } };

export type DataSourceCardFragment = { __typename?: 'ExternalDataSource', id: any, name: string, dataType: DataSourceType, crmType: CrmType, automatedWebhooks: boolean, autoImportEnabled: boolean, autoUpdateEnabled: boolean, updateMapping?: Array<{ __typename?: 'AutoUpdateConfig', source: string, sourcePath: string, destinationColumn: string }> | null, jobs: Array<{ __typename?: 'QueueJob', lastEventAt: any, status: ProcrastinateJobStatus }>, sharingPermissions: Array<{ __typename?: 'SharingPermission', id: any, organisation: { __typename?: 'PublicOrganisation', id: string, name: string } }> };

export type ExternalDataSourceExternalDataSourceCardQueryVariables = Exact<{
  ID: Scalars['ID']['input'];
}>;


export type ExternalDataSourceExternalDataSourceCardQuery = { __typename?: 'Query', externalDataSource: { __typename?: 'ExternalDataSource', id: any, name: string, dataType: DataSourceType, crmType: CrmType, automatedWebhooks: boolean, autoImportEnabled: boolean, autoUpdateEnabled: boolean, updateMapping?: Array<{ __typename?: 'AutoUpdateConfig', source: string, sourcePath: string, destinationColumn: string }> | null, jobs: Array<{ __typename?: 'QueueJob', lastEventAt: any, status: ProcrastinateJobStatus }>, sharingPermissions: Array<{ __typename?: 'SharingPermission', id: any, organisation: { __typename?: 'PublicOrganisation', id: string, name: string } }> } };

export type EnableWebhookMutationVariables = Exact<{
  ID: Scalars['String']['input'];
  webhookType: WebhookType;
}>;


export type EnableWebhookMutation = { __typename?: 'Mutation', enableWebhook: { __typename?: 'ExternalDataSource', id: any, autoImportEnabled: boolean, autoUpdateEnabled: boolean, hasWebhooks: boolean, automatedWebhooks: boolean, webhookHealthcheck: boolean, name: string } };

export type DisableWebhookMutationVariables = Exact<{
  ID: Scalars['String']['input'];
  webhookType: WebhookType;
}>;


export type DisableWebhookMutation = { __typename?: 'Mutation', disableWebhook: { __typename?: 'ExternalDataSource', id: any, autoImportEnabled: boolean, autoUpdateEnabled: boolean, hasWebhooks: boolean, automatedWebhooks: boolean, webhookHealthcheck: boolean, name: string } };

export type TriggerFullUpdateMutationVariables = Exact<{
  externalDataSourceId: Scalars['String']['input'];
}>;


export type TriggerFullUpdateMutation = { __typename?: 'Mutation', triggerUpdate: { __typename?: 'ExternalDataSourceAction', id: string, externalDataSource: { __typename?: 'ExternalDataSource', id: any, name: string, crmType: CrmType, jobs: Array<{ __typename?: 'QueueJob', status: ProcrastinateJobStatus, id: string, taskName: string, args: any, lastEventAt: any }> } } };

export type GetOrganisationsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetOrganisationsQuery = { __typename?: 'Query', myOrganisations: Array<{ __typename?: 'Organisation', id: string, name: string }> };

export type EnrichmentLayersQueryVariables = Exact<{
  organisationPk: Scalars['String']['input'];
}>;


export type EnrichmentLayersQuery = { __typename?: 'Query', mappingSources: Array<{ __typename?: 'MappingSource', slug: string, name: string, author?: string | null, description?: string | null, descriptionUrl?: string | null, builtin: boolean, sourcePaths: Array<{ __typename?: 'MappingSourcePath', label?: string | null, value: string, description?: string | null }>, externalDataSource?: { __typename?: 'SharedDataSource', id: any, name: string, dataType: DataSourceType, crmType: CrmType, organisation: { __typename?: 'PublicOrganisation', id: string, name: string } } | null }> };

export type MyOrgsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyOrgsQuery = { __typename?: 'Query', myOrganisations: Array<{ __typename?: 'Organisation', id: string, name: string, slug: string }> };

export type UserDataQueryVariables = Exact<{ [key: string]: never; }>;


export type UserDataQuery = { __typename?: 'Query', me: { __typename?: 'UserType', id: string, email: string, username: string }, publicUser?: { __typename?: 'UserType', firstName?: string | null, lastName?: string | null } | null };

export type PublishPageMutationVariables = Exact<{
  pageId: Scalars['String']['input'];
  input: HubPageInput;
}>;


export type PublishPageMutation = { __typename?: 'Mutation', updatePage: { __typename?: 'HubPage', id: string, title: string, slug: string, puckJsonContent: any } };

export type CreateChildPageMutationVariables = Exact<{
  parentId: Scalars['String']['input'];
  title: Scalars['String']['input'];
}>;


export type CreateChildPageMutation = { __typename?: 'Mutation', createChildPage: { __typename?: 'HubPage', id: string } };

export type DeletePageMutationVariables = Exact<{
  pageId: Scalars['String']['input'];
}>;


export type DeletePageMutation = { __typename?: 'Mutation', deletePage: boolean };

export type GetHubPagesQueryVariables = Exact<{
  hubId: Scalars['ID']['input'];
}>;


export type GetHubPagesQuery = { __typename?: 'Query', hubHomepage: { __typename?: 'HubHomepage', hostname: string, descendants: Array<{ __typename?: 'HubPage', id: string, title: string, path: string, slug: string, modelName: string, ancestors: Array<{ __typename?: 'HubPage', id: string, title: string, path: string, slug: string, modelName: string }> }> } };

export type GetPageEditorDataQueryVariables = Exact<{
  pageId: Scalars['ID']['input'];
}>;


export type GetPageEditorDataQuery = { __typename?: 'Query', hubPage: { __typename?: 'HubPage', id: string, title: string, path: string, slug: string, puckJsonContent: any, modelName: string, liveUrl?: string | null, ancestors: Array<{ __typename?: 'HubPage', id: string, title: string, path: string, slug: string, modelName: string }> } };

export type GetHubContextQueryVariables = Exact<{
  hostname: Scalars['String']['input'];
}>;


export type GetHubContextQuery = { __typename?: 'Query', hubByHostname?: { __typename?: 'HubHomepage', id: string, customCss?: string | null, primaryColour?: string | null, secondaryColour?: string | null } | null };

export type GetEventSourcesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetEventSourcesQuery = { __typename?: 'Query', externalDataSources: Array<{ __typename?: 'ExternalDataSource', name: string, id: any, eventCount: number, fieldDefinitions?: Array<{ __typename?: 'FieldDefinition', label?: string | null, value: string }> | null }> };

export type GetEventListQueryVariables = Exact<{
  sourceId: Scalars['String']['input'];
}>;


export type GetEventListQuery = { __typename?: 'Query', genericDataByExternalDataSource: Array<{ __typename?: 'GenericData', id: string, title?: string | null, description?: string | null, startTime?: any | null, endTime?: any | null, publicUrl?: string | null, json?: any | null }> };

export type GetHubHomepageJsonQueryVariables = Exact<{
  hostname: Scalars['String']['input'];
}>;


export type GetHubHomepageJsonQuery = { __typename?: 'Query', hubPageByPath?: { __typename?: 'HubPage', puckJsonContent: any } | null };

export type HubListDataSourcesQueryVariables = Exact<{
  currentOrganisationId: Scalars['ID']['input'];
}>;


export type HubListDataSourcesQuery = { __typename?: 'Query', myOrganisations: Array<{ __typename?: 'Organisation', id: string, externalDataSources: Array<{ __typename?: 'ExternalDataSource', id: any, name: string, dataType: DataSourceType }> }> };

export type AddMemberMutationVariables = Exact<{
  externalDataSourceId: Scalars['String']['input'];
  email: Scalars['String']['input'];
  postcode: Scalars['String']['input'];
  customFields: Scalars['JSON']['input'];
  tags: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type AddMemberMutation = { __typename?: 'Mutation', addMember: boolean };

export type GetMemberListQueryVariables = Exact<{
  currentOrganisationId: Scalars['ID']['input'];
}>;


export type GetMemberListQuery = { __typename?: 'Query', myOrganisations: Array<{ __typename?: 'Organisation', externalDataSources: Array<{ __typename?: 'ExternalDataSource', id: any, name: string, importedDataCount: number, crmType: CrmType, dataType: DataSourceType }>, sharingPermissionsFromOtherOrgs: Array<{ __typename?: 'SharingPermission', externalDataSource: { __typename?: 'SharedDataSource', id: any, name: string, importedDataCount: number, crmType: CrmType, dataType: DataSourceType, organisation: { __typename?: 'PublicOrganisation', name: string } } }> }> };

export type UpdateExternalDataSourceMutationVariables = Exact<{
  input: ExternalDataSourceInput;
}>;


export type UpdateExternalDataSourceMutation = { __typename?: 'Mutation', updateExternalDataSource: { __typename?: 'ExternalDataSource', id: any, name: string, geographyColumn?: string | null, geographyColumnType: GeographyTypes, postcodeField?: string | null, firstNameField?: string | null, lastNameField?: string | null, emailField?: string | null, phoneField?: string | null, addressField?: string | null, canDisplayPointField?: string | null, autoImportEnabled: boolean, autoUpdateEnabled: boolean, updateMapping?: Array<{ __typename?: 'AutoUpdateConfig', source: string, sourcePath: string, destinationColumn: string }> | null } };

export type MapReportLayersSummaryFragment = { __typename?: 'MapReport', layers: Array<{ __typename?: 'MapLayer', id: string, name: string, sharingPermission?: { __typename?: 'SharingPermission', visibilityRecordDetails?: boolean | null, visibilityRecordCoordinates?: boolean | null, organisation: { __typename?: 'PublicOrganisation', name: string } } | null, source: { __typename?: 'SharedDataSource', id: any, name: string, isImportScheduled: boolean, importedDataCount: number, crmType: CrmType, dataType: DataSourceType, organisation: { __typename?: 'PublicOrganisation', name: string } } }> };

export type MapReportPageFragment = { __typename?: 'MapReport', id: any, name: string, layers: Array<{ __typename?: 'MapLayer', id: string, name: string, sharingPermission?: { __typename?: 'SharingPermission', visibilityRecordDetails?: boolean | null, visibilityRecordCoordinates?: boolean | null, organisation: { __typename?: 'PublicOrganisation', name: string } } | null, source: { __typename?: 'SharedDataSource', id: any, name: string, isImportScheduled: boolean, importedDataCount: number, crmType: CrmType, dataType: DataSourceType, organisation: { __typename?: 'PublicOrganisation', name: string } } }> };

export type PublicUserQueryVariables = Exact<{ [key: string]: never; }>;


export type PublicUserQuery = { __typename?: 'Query', publicUser?: { __typename?: 'UserType', id: string, username: string, email: string } | null };

export const EventFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GenericData"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"postcode"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"publicUrl"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dataSet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"externalDataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataType"}}]}}]}}]}}]}}]} as unknown as DocumentNode<EventFragmentFragment, unknown>;
export const ConstituencyViewFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ConstituencyViewFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Area"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"gss"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fitBounds"}},{"kind":"Field","name":{"kind":"Name","value":"samplePostcode"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"postcode"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"mp"},"name":{"kind":"Name","value":"person"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"personType"},"value":{"kind":"StringValue","value":"MP","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"photo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"party"},"name":{"kind":"Name","value":"personDatum"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"dataType_Name"},"value":{"kind":"StringValue","value":"party","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"name"},"name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"shade"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"email"},"name":{"kind":"Name","value":"personDatum"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"dataType_Name"},"value":{"kind":"StringValue","value":"email","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"}}]}}]}},{"kind":"Field","alias":{"kind":"Name","value":"ppcs"},"name":{"kind":"Name","value":"people"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"personType"},"value":{"kind":"StringValue","value":"PPC","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"photo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"party"},"name":{"kind":"Name","value":"personDatum"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"dataType_Name"},"value":{"kind":"StringValue","value":"party","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"name"},"name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"shade"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"email"},"name":{"kind":"Name","value":"personDatum"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"dataType_Name"},"value":{"kind":"StringValue","value":"email","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"}}]}}]}}]}}]} as unknown as DocumentNode<ConstituencyViewFragmentFragment, unknown>;
export const DataSourceCardFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DataSourceCard"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ExternalDataSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"crmType"}},{"kind":"Field","name":{"kind":"Name","value":"automatedWebhooks"}},{"kind":"Field","name":{"kind":"Name","value":"autoImportEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"autoUpdateEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"updateMapping"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePath"}},{"kind":"Field","name":{"kind":"Name","value":"destinationColumn"}}]}},{"kind":"Field","name":{"kind":"Name","value":"jobs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lastEventAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sharingPermissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organisation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<DataSourceCardFragment, unknown>;
export const MapReportLayersSummaryFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MapReportLayersSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MapReport"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"layers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sharingPermission"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"visibilityRecordDetails"}},{"kind":"Field","name":{"kind":"Name","value":"visibilityRecordCoordinates"}},{"kind":"Field","name":{"kind":"Name","value":"organisation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isImportScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"importedDataCount"}},{"kind":"Field","name":{"kind":"Name","value":"crmType"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"organisation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<MapReportLayersSummaryFragment, unknown>;
export const MapReportPageFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MapReportPage"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MapReport"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"MapReportLayersSummary"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MapReportLayersSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MapReport"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"layers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sharingPermission"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"visibilityRecordDetails"}},{"kind":"Field","name":{"kind":"Name","value":"visibilityRecordCoordinates"}},{"kind":"Field","name":{"kind":"Name","value":"organisation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isImportScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"importedDataCount"}},{"kind":"Field","name":{"kind":"Name","value":"crmType"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"organisation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<MapReportPageFragment, unknown>;
export const DeveloperApiContextDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DeveloperAPIContext"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listApiTokens"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"signature"}},{"kind":"Field","name":{"kind":"Name","value":"revoked"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}}]} as unknown as DocumentNode<DeveloperApiContextQuery, DeveloperApiContextQueryVariables>;
export const CreateTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createApiToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"signature"}},{"kind":"Field","name":{"kind":"Name","value":"revoked"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}}]} as unknown as DocumentNode<CreateTokenMutation, CreateTokenMutationVariables>;
export const RevokeTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RevokeToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"signature"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revokeApiToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"signature"},"value":{"kind":"Variable","name":{"kind":"Name","value":"signature"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"signature"}},{"kind":"Field","name":{"kind":"Name","value":"revoked"}}]}}]}}]} as unknown as DocumentNode<RevokeTokenMutation, RevokeTokenMutationVariables>;
export const VerifyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Verify"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifyAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"}},{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<VerifyMutation, VerifyMutationVariables>;
export const ExampleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Example"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myOrganisations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ExampleQuery, ExampleQueryVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"username"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tokenAuth"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"username"},"value":{"kind":"Variable","name":{"kind":"Name","value":"username"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"}},{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"token"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"payload"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exp"}}]}}]}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const PerformPasswordResetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PerformPasswordReset"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password1"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password2"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"performPasswordReset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}},{"kind":"Argument","name":{"kind":"Name","value":"newPassword1"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password1"}}},{"kind":"Argument","name":{"kind":"Name","value":"newPassword2"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password2"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"}},{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<PerformPasswordResetMutation, PerformPasswordResetMutationVariables>;
export const ResetPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResetPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestPasswordReset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"}},{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<ResetPasswordMutation, ResetPasswordMutationVariables>;
export const ListOrganisationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListOrganisations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currentOrganisationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myOrganisations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currentOrganisationId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"externalDataSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"connectionDetails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AirtableSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"baseId"}},{"kind":"Field","name":{"kind":"Name","value":"tableId"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MailchimpSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiKey"}},{"kind":"Field","name":{"kind":"Name","value":"listId"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"crmType"}},{"kind":"Field","name":{"kind":"Name","value":"autoImportEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"autoUpdateEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"jobs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lastEventAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updateMapping"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePath"}},{"kind":"Field","name":{"kind":"Name","value":"destinationColumn"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sharingPermissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organisation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"sharingPermissionsFromOtherOrgs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"externalDataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"crmType"}},{"kind":"Field","name":{"kind":"Name","value":"organisation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<ListOrganisationsQuery, ListOrganisationsQueryVariables>;
export const GetSourceMappingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSourceMapping"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"externalDataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pk"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"autoImportEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"autoUpdateEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"allowUpdates"}},{"kind":"Field","name":{"kind":"Name","value":"hasWebhooks"}},{"kind":"Field","name":{"kind":"Name","value":"updateMapping"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"destinationColumn"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePath"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fieldDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"editable"}}]}},{"kind":"Field","name":{"kind":"Name","value":"crmType"}},{"kind":"Field","name":{"kind":"Name","value":"geographyColumn"}},{"kind":"Field","name":{"kind":"Name","value":"geographyColumnType"}},{"kind":"Field","name":{"kind":"Name","value":"postcodeField"}},{"kind":"Field","name":{"kind":"Name","value":"firstNameField"}},{"kind":"Field","name":{"kind":"Name","value":"lastNameField"}},{"kind":"Field","name":{"kind":"Name","value":"emailField"}},{"kind":"Field","name":{"kind":"Name","value":"phoneField"}},{"kind":"Field","name":{"kind":"Name","value":"addressField"}},{"kind":"Field","name":{"kind":"Name","value":"canDisplayPointField"}}]}}]}}]} as unknown as DocumentNode<GetSourceMappingQuery, GetSourceMappingQueryVariables>;
export const TestDataSourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TestDataSource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateExternalDataSourceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testDataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"crmType"}},{"kind":"Field","name":{"kind":"Name","value":"fieldDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"editable"}}]}},{"kind":"Field","name":{"kind":"Name","value":"geographyColumn"}},{"kind":"Field","name":{"kind":"Name","value":"geographyColumnType"}},{"kind":"Field","name":{"kind":"Name","value":"healthcheck"}},{"kind":"Field","name":{"kind":"Name","value":"predefinedColumnNames"}},{"kind":"Field","name":{"kind":"Name","value":"defaultDataType"}},{"kind":"Field","name":{"kind":"Name","value":"remoteName"}},{"kind":"Field","name":{"kind":"Name","value":"allowUpdates"}},{"kind":"Field","name":{"kind":"Name","value":"defaults"}},{"kind":"Field","name":{"kind":"Name","value":"oauthCredentials"}}]}}]}}]} as unknown as DocumentNode<TestDataSourceQuery, TestDataSourceQueryVariables>;
export const GoogleSheetsOauthUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GoogleSheetsOauthUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"redirectUrl"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"googleSheetsOauthUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"redirectUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"redirectUrl"}}}]}]}}]} as unknown as DocumentNode<GoogleSheetsOauthUrlQuery, GoogleSheetsOauthUrlQueryVariables>;
export const GoogleSheetsOauthCredentialsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GoogleSheetsOauthCredentials"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"redirectSuccessUrl"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"googleSheetsOauthCredentials"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"redirectSuccessUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"redirectSuccessUrl"}}}]}]}}]} as unknown as DocumentNode<GoogleSheetsOauthCredentialsQuery, GoogleSheetsOauthCredentialsQueryVariables>;
export const CreateSourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateExternalDataSourceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createExternalDataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"Field","name":{"kind":"Name","value":"result"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"crmType"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"allowUpdates"}}]}}]}}]}}]} as unknown as DocumentNode<CreateSourceMutation, CreateSourceMutationVariables>;
export const AutoUpdateCreationReviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AutoUpdateCreationReview"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"externalDataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pk"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"geographyColumn"}},{"kind":"Field","name":{"kind":"Name","value":"geographyColumnType"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"crmType"}},{"kind":"Field","name":{"kind":"Name","value":"autoImportEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"autoUpdateEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"updateMapping"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePath"}},{"kind":"Field","name":{"kind":"Name","value":"destinationColumn"}}]}},{"kind":"Field","name":{"kind":"Name","value":"jobs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lastEventAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"automatedWebhooks"}},{"kind":"Field","name":{"kind":"Name","value":"webhookUrl"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"DataSourceCard"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DataSourceCard"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ExternalDataSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"crmType"}},{"kind":"Field","name":{"kind":"Name","value":"automatedWebhooks"}},{"kind":"Field","name":{"kind":"Name","value":"autoImportEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"autoUpdateEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"updateMapping"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePath"}},{"kind":"Field","name":{"kind":"Name","value":"destinationColumn"}}]}},{"kind":"Field","name":{"kind":"Name","value":"jobs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lastEventAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sharingPermissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organisation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<AutoUpdateCreationReviewQuery, AutoUpdateCreationReviewQueryVariables>;
export const ExternalDataSourceInspectPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExternalDataSourceInspectPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"externalDataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pk"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"remoteUrl"}},{"kind":"Field","name":{"kind":"Name","value":"crmType"}},{"kind":"Field","name":{"kind":"Name","value":"connectionDetails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AirtableSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiKey"}},{"kind":"Field","name":{"kind":"Name","value":"baseId"}},{"kind":"Field","name":{"kind":"Name","value":"tableId"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MailchimpSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiKey"}},{"kind":"Field","name":{"kind":"Name","value":"listId"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActionNetworkSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiKey"}},{"kind":"Field","name":{"kind":"Name","value":"groupSlug"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TicketTailorSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apiKey"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"lastImportJob"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastEventAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lastUpdateJob"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastEventAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"autoImportEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"autoUpdateEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"hasWebhooks"}},{"kind":"Field","name":{"kind":"Name","value":"allowUpdates"}},{"kind":"Field","name":{"kind":"Name","value":"automatedWebhooks"}},{"kind":"Field","name":{"kind":"Name","value":"webhookUrl"}},{"kind":"Field","name":{"kind":"Name","value":"webhookHealthcheck"}},{"kind":"Field","name":{"kind":"Name","value":"geographyColumn"}},{"kind":"Field","name":{"kind":"Name","value":"geographyColumnType"}},{"kind":"Field","name":{"kind":"Name","value":"postcodeField"}},{"kind":"Field","name":{"kind":"Name","value":"firstNameField"}},{"kind":"Field","name":{"kind":"Name","value":"lastNameField"}},{"kind":"Field","name":{"kind":"Name","value":"fullNameField"}},{"kind":"Field","name":{"kind":"Name","value":"emailField"}},{"kind":"Field","name":{"kind":"Name","value":"phoneField"}},{"kind":"Field","name":{"kind":"Name","value":"addressField"}},{"kind":"Field","name":{"kind":"Name","value":"titleField"}},{"kind":"Field","name":{"kind":"Name","value":"descriptionField"}},{"kind":"Field","name":{"kind":"Name","value":"imageField"}},{"kind":"Field","name":{"kind":"Name","value":"startTimeField"}},{"kind":"Field","name":{"kind":"Name","value":"endTimeField"}},{"kind":"Field","name":{"kind":"Name","value":"publicUrlField"}},{"kind":"Field","name":{"kind":"Name","value":"socialUrlField"}},{"kind":"Field","name":{"kind":"Name","value":"canDisplayPointField"}},{"kind":"Field","name":{"kind":"Name","value":"isImportScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"importProgress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hasForecast"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"succeeded"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedFinishTime"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isUpdateScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"updateProgress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hasForecast"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"succeeded"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedFinishTime"}}]}},{"kind":"Field","name":{"kind":"Name","value":"importedDataCount"}},{"kind":"Field","name":{"kind":"Name","value":"fieldDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"editable"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updateMapping"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePath"}},{"kind":"Field","name":{"kind":"Name","value":"destinationColumn"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sharingPermissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organisation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<ExternalDataSourceInspectPageQuery, ExternalDataSourceInspectPageQueryVariables>;
export const DeleteUpdateConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteUpdateConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteExternalDataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteUpdateConfigMutation, DeleteUpdateConfigMutationVariables>;
export const ManageSourceSharingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ManageSourceSharing"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"externalDataSourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"externalDataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pk"},"value":{"kind":"Variable","name":{"kind":"Name","value":"externalDataSourceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sharingPermissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organisationId"}},{"kind":"Field","name":{"kind":"Name","value":"organisation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"externalDataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"visibilityRecordCoordinates"}},{"kind":"Field","name":{"kind":"Name","value":"visibilityRecordDetails"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}}]}}]}}]}}]} as unknown as DocumentNode<ManageSourceSharingQuery, ManageSourceSharingQueryVariables>;
export const UpdateSourceSharingObjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSourceSharingObject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SharingPermissionCUDInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSharingPermission"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organisationId"}},{"kind":"Field","name":{"kind":"Name","value":"externalDataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"visibilityRecordCoordinates"}},{"kind":"Field","name":{"kind":"Name","value":"visibilityRecordDetails"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}}]}}]}}]} as unknown as DocumentNode<UpdateSourceSharingObjectMutation, UpdateSourceSharingObjectMutationVariables>;
export const DeleteSourceSharingObjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteSourceSharingObject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pk"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSharingPermission"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pk"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteSourceSharingObjectMutation, DeleteSourceSharingObjectMutationVariables>;
export const ImportDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ImportData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"importAll"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"externalDataSourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"externalDataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"importedDataCount"}},{"kind":"Field","name":{"kind":"Name","value":"isImportScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"importProgress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"hasForecast"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"succeeded"}},{"kind":"Field","name":{"kind":"Name","value":"failed"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedFinishTime"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ImportDataMutation, ImportDataMutationVariables>;
export const ExternalDataSourceNameDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExternalDataSourceName"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"externalDataSourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"externalDataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pk"},"value":{"kind":"Variable","name":{"kind":"Name","value":"externalDataSourceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"crmType"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"remoteUrl"}}]}}]}}]} as unknown as DocumentNode<ExternalDataSourceNameQuery, ExternalDataSourceNameQueryVariables>;
export const ShareDataSourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ShareDataSources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromOrgId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"permissions"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SharingPermissionInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSharingPermissions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fromOrgId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromOrgId"}}},{"kind":"Argument","name":{"kind":"Name","value":"permissions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"permissions"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sharingPermissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organisationId"}},{"kind":"Field","name":{"kind":"Name","value":"externalDataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"visibilityRecordCoordinates"}},{"kind":"Field","name":{"kind":"Name","value":"visibilityRecordDetails"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}}]}}]}}]}}]} as unknown as DocumentNode<ShareDataSourcesMutation, ShareDataSourcesMutationVariables>;
export const YourSourcesForSharingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"YourSourcesForSharing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myOrganisations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"externalDataSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"crmType"}},{"kind":"Field","name":{"kind":"Name","value":"importedDataCount"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"fieldDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"editable"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organisationId"}},{"kind":"Field","name":{"kind":"Name","value":"sharingPermissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organisationId"}},{"kind":"Field","name":{"kind":"Name","value":"externalDataSourceId"}},{"kind":"Field","name":{"kind":"Name","value":"visibilityRecordCoordinates"}},{"kind":"Field","name":{"kind":"Name","value":"visibilityRecordDetails"}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}}]}}]}}]}}]}}]} as unknown as DocumentNode<YourSourcesForSharingQuery, YourSourcesForSharingQueryVariables>;
export const ShareWithOrgPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ShareWithOrgPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orgSlug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allOrganisations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orgSlug"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ShareWithOrgPageQuery, ShareWithOrgPageQueryVariables>;
export const GetEditableHubsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEditableHubs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hubHomepages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<GetEditableHubsQuery, GetEditableHubsQueryVariables>;
export const VerifyPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"VerifyPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pageId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hubHomepages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hubPage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pk"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pageId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hub"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<VerifyPageQuery, VerifyPageQueryVariables>;
export const CreateMapReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateMapReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MapReportInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createMapReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MapReport"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OperationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateMapReportMutation, CreateMapReportMutationVariables>;
export const ListReportsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListReports"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currentOrganisationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reports"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"organisation"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"pk"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currentOrganisationId"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"lastUpdate"}}]}}]}}]} as unknown as DocumentNode<ListReportsQuery, ListReportsQueryVariables>;
export const ListExternalDataSourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListExternalDataSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myOrganisations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"externalDataSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<ListExternalDataSourcesQuery, ListExternalDataSourcesQueryVariables>;
export const GetPublicMapReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPublicMapReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orgSlug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reportSlug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publicMapReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orgSlug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orgSlug"}}},{"kind":"Argument","name":{"kind":"Name","value":"reportSlug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reportSlug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GetPublicMapReportQuery, GetPublicMapReportQueryVariables>;
export const GetPublicMapReportForLayoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPublicMapReportForLayout"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orgSlug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reportSlug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publicMapReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orgSlug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orgSlug"}}},{"kind":"Argument","name":{"kind":"Name","value":"reportSlug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reportSlug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayOptions"}},{"kind":"Field","name":{"kind":"Name","value":"organisation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"layers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetPublicMapReportForLayoutQuery, GetPublicMapReportForLayoutQueryVariables>;
export const HostAnalyticsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"HostAnalytics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hostname"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hubByHostname"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"hostname"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hostname"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"googleAnalyticsTagId"}},{"kind":"Field","name":{"kind":"Name","value":"primaryColour"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryColour"}},{"kind":"Field","name":{"kind":"Name","value":"customCss"}}]}}]}}]} as unknown as DocumentNode<HostAnalyticsQuery, HostAnalyticsQueryVariables>;
export const GetHubMapDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetHubMapData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hostname"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hubByHostname"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"hostname"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hostname"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organisation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"layers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"visible"}},{"kind":"Field","name":{"kind":"Name","value":"iconImage"}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"mapboxPaint"}},{"kind":"Field","name":{"kind":"Name","value":"mapboxLayout"}}]}},{"kind":"Field","name":{"kind":"Name","value":"navLinks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"link"}}]}}]}}]}}]} as unknown as DocumentNode<GetHubMapDataQuery, GetHubMapDataQueryVariables>;
export const GetLocalDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLocalData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"postcode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hostname"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"postcodeSearch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"postcode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"postcode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"postcode"}},{"kind":"Field","alias":{"kind":"Name","value":"constituency"},"name":{"kind":"Name","value":"constituency2024"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ConstituencyViewFragment"}},{"kind":"Field","name":{"kind":"Name","value":"genericDataForHub"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"hostname"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hostname"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventFragment"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ConstituencyViewFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Area"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"gss"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fitBounds"}},{"kind":"Field","name":{"kind":"Name","value":"samplePostcode"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"postcode"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"mp"},"name":{"kind":"Name","value":"person"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"personType"},"value":{"kind":"StringValue","value":"MP","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"photo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"party"},"name":{"kind":"Name","value":"personDatum"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"dataType_Name"},"value":{"kind":"StringValue","value":"party","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"name"},"name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"shade"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"email"},"name":{"kind":"Name","value":"personDatum"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"dataType_Name"},"value":{"kind":"StringValue","value":"email","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"}}]}}]}},{"kind":"Field","alias":{"kind":"Name","value":"ppcs"},"name":{"kind":"Name","value":"people"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"personType"},"value":{"kind":"StringValue","value":"PPC","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"photo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"party"},"name":{"kind":"Name","value":"personDatum"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"dataType_Name"},"value":{"kind":"StringValue","value":"party","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"name"},"name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"shade"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"email"},"name":{"kind":"Name","value":"personDatum"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"dataType_Name"},"value":{"kind":"StringValue","value":"email","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GenericData"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"postcode"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"publicUrl"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dataSet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"externalDataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataType"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetLocalDataQuery, GetLocalDataQueryVariables>;
export const GetEventDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEventData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"eventId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hostname"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"importedDataGeojsonPoint"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"genericDataId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"eventId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventFragment"}},{"kind":"Field","alias":{"kind":"Name","value":"constituency"},"name":{"kind":"Name","value":"area"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"areaType"},"value":{"kind":"StringValue","value":"WMC23","block":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ConstituencyViewFragment"}},{"kind":"Field","name":{"kind":"Name","value":"genericDataForHub"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"hostname"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hostname"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EventFragment"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EventFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GenericData"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"postcode"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"publicUrl"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dataSet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"externalDataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataType"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ConstituencyViewFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Area"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"gss"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fitBounds"}},{"kind":"Field","name":{"kind":"Name","value":"samplePostcode"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"postcode"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"mp"},"name":{"kind":"Name","value":"person"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"personType"},"value":{"kind":"StringValue","value":"MP","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"photo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"party"},"name":{"kind":"Name","value":"personDatum"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"dataType_Name"},"value":{"kind":"StringValue","value":"party","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"name"},"name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"shade"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"email"},"name":{"kind":"Name","value":"personDatum"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"dataType_Name"},"value":{"kind":"StringValue","value":"email","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"}}]}}]}},{"kind":"Field","alias":{"kind":"Name","value":"ppcs"},"name":{"kind":"Name","value":"people"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"personType"},"value":{"kind":"StringValue","value":"PPC","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"photo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"party"},"name":{"kind":"Name","value":"personDatum"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"dataType_Name"},"value":{"kind":"StringValue","value":"party","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"name"},"name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"shade"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"email"},"name":{"kind":"Name","value":"personDatum"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"dataType_Name"},"value":{"kind":"StringValue","value":"email","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"}}]}}]}}]}}]} as unknown as DocumentNode<GetEventDataQuery, GetEventDataQueryVariables>;
export const GetPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hostname"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hubPageByPath"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"hostname"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hostname"}}},{"kind":"Argument","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"puckJsonContent"}},{"kind":"Field","name":{"kind":"Name","value":"seoTitle"}},{"kind":"Field","name":{"kind":"Name","value":"searchDescription"}},{"kind":"Field","name":{"kind":"Name","value":"hub"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"faviconUrl"}},{"kind":"Field","name":{"kind":"Name","value":"seoTitle"}},{"kind":"Field","name":{"kind":"Name","value":"seoImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"searchDescription"}},{"kind":"Field","name":{"kind":"Name","value":"primaryColour"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryColour"}},{"kind":"Field","name":{"kind":"Name","value":"customCss"}},{"kind":"Field","name":{"kind":"Name","value":"navLinks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetPageQuery, GetPageQueryVariables>;
export const ConstituencyStatsOverviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ConstituencyStatsOverview"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reportID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"analyticalAreaType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AnalyticalAreaType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mapReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pk"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reportID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"importedDataCountByConstituency"},"name":{"kind":"Name","value":"importedDataCountByArea"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"analyticalAreaType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"analyticalAreaType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"gss"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"gssArea"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fitBounds"}},{"kind":"Field","alias":{"kind":"Name","value":"mp"},"name":{"kind":"Name","value":"person"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"personType"},"value":{"kind":"StringValue","value":"MP","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"photo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"party"},"name":{"kind":"Name","value":"personDatum"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"dataType_Name"},"value":{"kind":"StringValue","value":"party","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"name"},"name":{"kind":"Name","value":"data"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"lastElection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"majority"}},{"kind":"Field","name":{"kind":"Name","value":"electorate"}},{"kind":"Field","name":{"kind":"Name","value":"firstPartyResult"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"party"}},{"kind":"Field","name":{"kind":"Name","value":"shade"}},{"kind":"Field","name":{"kind":"Name","value":"votes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"secondPartyResult"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"party"}},{"kind":"Field","name":{"kind":"Name","value":"shade"}},{"kind":"Field","name":{"kind":"Name","value":"votes"}}]}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<ConstituencyStatsOverviewQuery, ConstituencyStatsOverviewQueryVariables>;
export const GetConstituencyDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetConstituencyData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"analyticalAreaType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AnalyticalAreaType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"gss"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reportID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"constituency"},"name":{"kind":"Name","value":"area"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"gss"},"value":{"kind":"Variable","name":{"kind":"Name","value":"gss"}}},{"kind":"Argument","name":{"kind":"Name","value":"analyticalAreaType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"analyticalAreaType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","alias":{"kind":"Name","value":"mp"},"name":{"kind":"Name","value":"person"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"personType"},"value":{"kind":"StringValue","value":"MP","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"photo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"party"},"name":{"kind":"Name","value":"personDatum"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"dataType_Name"},"value":{"kind":"StringValue","value":"party","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"name"},"name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"shade"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"lastElection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"electorate"}},{"kind":"Field","name":{"kind":"Name","value":"validVotes"}},{"kind":"Field","name":{"kind":"Name","value":"majority"}},{"kind":"Field","name":{"kind":"Name","value":"firstPartyResult"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"party"}},{"kind":"Field","name":{"kind":"Name","value":"shade"}},{"kind":"Field","name":{"kind":"Name","value":"votes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"secondPartyResult"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"party"}},{"kind":"Field","name":{"kind":"Name","value":"shade"}},{"kind":"Field","name":{"kind":"Name","value":"votes"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"mapReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pk"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reportID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"importedDataCountForConstituency"},"name":{"kind":"Name","value":"importedDataCountForArea"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"analyticalAreaType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"analyticalAreaType"}}},{"kind":"Argument","name":{"kind":"Name","value":"gss"},"value":{"kind":"Variable","name":{"kind":"Name","value":"gss"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gss"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"layers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"importedDataCountForConstituency"},"name":{"kind":"Name","value":"importedDataCountForArea"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"analyticalAreaType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"analyticalAreaType"}}},{"kind":"Argument","name":{"kind":"Name","value":"gss"},"value":{"kind":"Variable","name":{"kind":"Name","value":"gss"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gss"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetConstituencyDataQuery, GetConstituencyDataQueryVariables>;
export const MapReportWardStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MapReportWardStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reportID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mapReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pk"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reportID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"importedDataCountByArea"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"analyticalAreaType"},"value":{"kind":"EnumValue","value":"admin_ward"}},{"kind":"Argument","name":{"kind":"Name","value":"operation"},"value":{"kind":"StringValue","value":"sum","block":false}},{"kind":"Argument","name":{"kind":"Name","value":"column"},"value":{"kind":"StringValue","value":"Observation","block":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"gss"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"gssArea"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"point"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"geometry"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"coordinates"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<MapReportWardStatsQuery, MapReportWardStatsQueryVariables>;
export const MapReportLayerGeoJsonPointDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MapReportLayerGeoJSONPoint"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"genericDataId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"importedDataGeojsonPoint"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"genericDataId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"genericDataId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"geometry"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"coordinates"}}]}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastUpdate"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"postcodeData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"postcode"}}]}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"json"}},{"kind":"Field","name":{"kind":"Name","value":"remoteUrl"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"externalDataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<MapReportLayerGeoJsonPointQuery, MapReportLayerGeoJsonPointQueryVariables>;
export const MapReportLayerAnalyticsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MapReportLayerAnalytics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reportID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mapReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pk"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reportID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"layers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"organisation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<MapReportLayerAnalyticsQuery, MapReportLayerAnalyticsQueryVariables>;
export const MapReportRegionStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MapReportRegionStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reportID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mapReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pk"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reportID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"importedDataCountByRegion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"gss"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"gssArea"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"point"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"geometry"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"coordinates"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<MapReportRegionStatsQuery, MapReportRegionStatsQueryVariables>;
export const MapReportConstituencyStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MapReportConstituencyStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reportID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"analyticalAreaType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AnalyticalAreaType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mapReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pk"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reportID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"importedDataCountByConstituency"},"name":{"kind":"Name","value":"importedDataCountByArea"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"analyticalAreaType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"analyticalAreaType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"gss"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"gssArea"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"point"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"geometry"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"coordinates"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<MapReportConstituencyStatsQuery, MapReportConstituencyStatsQueryVariables>;
export const GetMapReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMapReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mapReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pk"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"displayOptions"}},{"kind":"Field","name":{"kind":"Name","value":"organisation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"MapReportPage"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MapReportLayersSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MapReport"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"layers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sharingPermission"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"visibilityRecordDetails"}},{"kind":"Field","name":{"kind":"Name","value":"visibilityRecordCoordinates"}},{"kind":"Field","name":{"kind":"Name","value":"organisation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isImportScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"importedDataCount"}},{"kind":"Field","name":{"kind":"Name","value":"crmType"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"organisation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MapReportPage"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MapReport"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"MapReportLayersSummary"}}]}}]} as unknown as DocumentNode<GetMapReportQuery, GetMapReportQueryVariables>;
export const UpdateMapReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateMapReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MapReportInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMapReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayOptions"}},{"kind":"Field","name":{"kind":"Name","value":"layers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"source"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateMapReportMutation, UpdateMapReportMutationVariables>;
export const DeleteMapReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteMapReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"IDObject"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteMapReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteMapReportMutation, DeleteMapReportMutationVariables>;
export const GetMapReportNameDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMapReportName"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mapReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pk"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GetMapReportNameQuery, GetMapReportNameQueryVariables>;
export const WebhookRefreshDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebhookRefresh"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"refreshWebhooks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"externalDataSourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hasWebhooks"}},{"kind":"Field","name":{"kind":"Name","value":"automatedWebhooks"}},{"kind":"Field","name":{"kind":"Name","value":"webhookHealthcheck"}}]}}]}}]} as unknown as DocumentNode<WebhookRefreshMutation, WebhookRefreshMutationVariables>;
export const ExternalDataSourceExternalDataSourceCardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExternalDataSourceExternalDataSourceCard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"externalDataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pk"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DataSourceCard"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DataSourceCard"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ExternalDataSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"crmType"}},{"kind":"Field","name":{"kind":"Name","value":"automatedWebhooks"}},{"kind":"Field","name":{"kind":"Name","value":"autoImportEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"autoUpdateEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"updateMapping"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePath"}},{"kind":"Field","name":{"kind":"Name","value":"destinationColumn"}}]}},{"kind":"Field","name":{"kind":"Name","value":"jobs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lastEventAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sharingPermissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organisation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<ExternalDataSourceExternalDataSourceCardQuery, ExternalDataSourceExternalDataSourceCardQueryVariables>;
export const EnableWebhookDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EnableWebhook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"webhookType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WebhookType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enableWebhook"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"externalDataSourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ID"}}},{"kind":"Argument","name":{"kind":"Name","value":"webhookType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"webhookType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"autoImportEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"autoUpdateEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"hasWebhooks"}},{"kind":"Field","name":{"kind":"Name","value":"automatedWebhooks"}},{"kind":"Field","name":{"kind":"Name","value":"webhookHealthcheck"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<EnableWebhookMutation, EnableWebhookMutationVariables>;
export const DisableWebhookDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DisableWebhook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"webhookType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WebhookType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"disableWebhook"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"externalDataSourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ID"}}},{"kind":"Argument","name":{"kind":"Name","value":"webhookType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"webhookType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"autoImportEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"autoUpdateEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"hasWebhooks"}},{"kind":"Field","name":{"kind":"Name","value":"automatedWebhooks"}},{"kind":"Field","name":{"kind":"Name","value":"webhookHealthcheck"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<DisableWebhookMutation, DisableWebhookMutationVariables>;
export const TriggerFullUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TriggerFullUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"externalDataSourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triggerUpdate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"externalDataSourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"externalDataSourceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"externalDataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"taskName"}},{"kind":"Field","name":{"kind":"Name","value":"args"}},{"kind":"Field","name":{"kind":"Name","value":"lastEventAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"crmType"}}]}}]}}]}}]} as unknown as DocumentNode<TriggerFullUpdateMutation, TriggerFullUpdateMutationVariables>;
export const GetOrganisationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrganisations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myOrganisations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GetOrganisationsQuery, GetOrganisationsQueryVariables>;
export const EnrichmentLayersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EnrichmentLayers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organisationPk"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mappingSources"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organisationPk"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organisationPk"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"descriptionUrl"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePaths"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"externalDataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"crmType"}},{"kind":"Field","name":{"kind":"Name","value":"organisation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"builtin"}}]}}]}}]} as unknown as DocumentNode<EnrichmentLayersQuery, EnrichmentLayersQueryVariables>;
export const MyOrgsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyOrgs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myOrganisations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]} as unknown as DocumentNode<MyOrgsQuery, MyOrgsQueryVariables>;
export const UserDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"publicUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]} as unknown as DocumentNode<UserDataQuery, UserDataQueryVariables>;
export const PublishPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PublishPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pageId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"HubPageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pageId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pageId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"puckJsonContent"}}]}}]}}]} as unknown as DocumentNode<PublishPageMutation, PublishPageMutationVariables>;
export const CreateChildPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateChildPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createChildPage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateChildPageMutation, CreateChildPageMutationVariables>;
export const DeletePageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeletePage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pageId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pageId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pageId"}}}]}]}}]} as unknown as DocumentNode<DeletePageMutation, DeletePageMutationVariables>;
export const GetHubPagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetHubPages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hubId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hubHomepage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pk"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hubId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hostname"}},{"kind":"Field","name":{"kind":"Name","value":"descendants"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inclusive"},"value":{"kind":"BooleanValue","value":true}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"ancestors"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inclusive"},"value":{"kind":"BooleanValue","value":true}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetHubPagesQuery, GetHubPagesQueryVariables>;
export const GetPageEditorDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPageEditorData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pageId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hubPage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pk"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pageId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"puckJsonContent"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"liveUrl"}},{"kind":"Field","name":{"kind":"Name","value":"ancestors"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inclusive"},"value":{"kind":"BooleanValue","value":true}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}}]}}]}}]}}]} as unknown as DocumentNode<GetPageEditorDataQuery, GetPageEditorDataQueryVariables>;
export const GetHubContextDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetHubContext"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hostname"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hubByHostname"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"hostname"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hostname"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"customCss"}},{"kind":"Field","name":{"kind":"Name","value":"primaryColour"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryColour"}}]}}]}}]} as unknown as DocumentNode<GetHubContextQuery, GetHubContextQueryVariables>;
export const GetEventSourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEventSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"externalDataSources"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"dataType"},"value":{"kind":"EnumValue","value":"EVENT"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","alias":{"kind":"Name","value":"eventCount"},"name":{"kind":"Name","value":"importedDataCount"}},{"kind":"Field","name":{"kind":"Name","value":"fieldDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]}}]} as unknown as DocumentNode<GetEventSourcesQuery, GetEventSourcesQueryVariables>;
export const GetEventListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEventList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"genericDataByExternalDataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"externalDataSourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sourceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"publicUrl"}},{"kind":"Field","name":{"kind":"Name","value":"json"}}]}}]}}]} as unknown as DocumentNode<GetEventListQuery, GetEventListQueryVariables>;
export const GetHubHomepageJsonDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetHubHomepageJson"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hostname"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hubPageByPath"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"hostname"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hostname"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"puckJsonContent"}}]}}]}}]} as unknown as DocumentNode<GetHubHomepageJsonQuery, GetHubHomepageJsonQueryVariables>;
export const HubListDataSourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"HubListDataSources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currentOrganisationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myOrganisations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currentOrganisationId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"externalDataSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}}]}}]}}]}}]} as unknown as DocumentNode<HubListDataSourcesQuery, HubListDataSourcesQueryVariables>;
export const AddMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"externalDataSourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"postcode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"customFields"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JSON"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tags"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"externalDataSourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"externalDataSourceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"postcode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"postcode"}}},{"kind":"Argument","name":{"kind":"Name","value":"customFields"},"value":{"kind":"Variable","name":{"kind":"Name","value":"customFields"}}},{"kind":"Argument","name":{"kind":"Name","value":"tags"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tags"}}}]}]}}]} as unknown as DocumentNode<AddMemberMutation, AddMemberMutationVariables>;
export const GetMemberListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMemberList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currentOrganisationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myOrganisations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currentOrganisationId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"externalDataSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"importedDataCount"}},{"kind":"Field","name":{"kind":"Name","value":"crmType"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sharingPermissionsFromOtherOrgs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"externalDataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"importedDataCount"}},{"kind":"Field","name":{"kind":"Name","value":"crmType"}},{"kind":"Field","name":{"kind":"Name","value":"dataType"}},{"kind":"Field","name":{"kind":"Name","value":"organisation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetMemberListQuery, GetMemberListQueryVariables>;
export const UpdateExternalDataSourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateExternalDataSource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ExternalDataSourceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateExternalDataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"geographyColumn"}},{"kind":"Field","name":{"kind":"Name","value":"geographyColumnType"}},{"kind":"Field","name":{"kind":"Name","value":"postcodeField"}},{"kind":"Field","name":{"kind":"Name","value":"firstNameField"}},{"kind":"Field","name":{"kind":"Name","value":"lastNameField"}},{"kind":"Field","name":{"kind":"Name","value":"emailField"}},{"kind":"Field","name":{"kind":"Name","value":"phoneField"}},{"kind":"Field","name":{"kind":"Name","value":"addressField"}},{"kind":"Field","name":{"kind":"Name","value":"canDisplayPointField"}},{"kind":"Field","name":{"kind":"Name","value":"autoImportEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"autoUpdateEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"updateMapping"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePath"}},{"kind":"Field","name":{"kind":"Name","value":"destinationColumn"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateExternalDataSourceMutation, UpdateExternalDataSourceMutationVariables>;
export const PublicUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublicUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publicUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<PublicUserQuery, PublicUserQueryVariables>;

      export interface PossibleTypesResultData {
        possibleTypes: {
          [key: string]: string[]
        }
      }
      const result: PossibleTypesResultData = {
  "possibleTypes": {
    "AirtableSourceMailchimpSourceActionNetworkSourceEditableGoogleSheetsSourceTicketTailorSource": [
      "ActionNetworkSource",
      "AirtableSource",
      "EditableGoogleSheetsSource",
      "MailchimpSource",
      "TicketTailorSource"
    ],
    "Analytics": [
      "ActionNetworkSource",
      "AirtableSource",
      "EditableGoogleSheetsSource",
      "ExternalDataSource",
      "MailchimpSource",
      "MapReport",
      "SharedDataSource",
      "TicketTailorSource"
    ],
    "CommonData": [
      "AreaData",
      "GenericData",
      "PersonData"
    ],
    "CreateMapReportPayload": [
      "MapReport",
      "OperationInfo"
    ],
    "Feature": [
      "MapReportMemberFeature",
      "MultiPolygonFeature",
      "PointFeature"
    ],
    "OutputInterface": [
      "ObtainJSONWebTokenType"
    ]
  }
};
      export default result;
    