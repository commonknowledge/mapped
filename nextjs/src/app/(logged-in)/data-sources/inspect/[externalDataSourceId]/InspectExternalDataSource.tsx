'use client'
import {
  CrmType,
  DataSourceType,
  DeleteUpdateConfigMutation,
  DeleteUpdateConfigMutationVariables,
  ExternalDataSourceInput,
  ExternalDataSourceInspectPageQuery,
  ExternalDataSourceInspectPageQueryVariables,
  FieldDefinition,
  ProcrastinateJobStatus,
  UpdateExternalDataSourceMutation,
  UpdateExternalDataSourceMutationVariables,
  WebhookType,
} from '@/__generated__/graphql'
import { BatchJobProgressReport } from '@/components/BatchJobProgress'
import { DataSourceFieldLabel } from '@/components/DataSourceIcon'
import {
  EnableWebhooksSwitch,
  TriggerUpdateButton,
  WebhookRefresh,
} from '@/components/ExternalDataSourceCard'
import { UpdateExternalDataSourceFields } from '@/components/UpdateExternalDataSourceFields'
import { UpdateMappingForm } from '@/components/UpdateMappingForm'
import { AirtableLogo } from '@/components/logos/AirtableLogo'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertButton } from '@/components/ui/alert-button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import { Textarea } from '@/components/ui/textarea'
import { externalDataSourceOptions } from '@/lib/data'
import { UPDATE_EXTERNAL_DATA_SOURCE } from '@/lib/graphql/mutations'
import { contentEditableMutation } from '@/lib/html'
import { createReportForSource } from '@/lib/map/createReportForSource'
import { toastPromise } from '@/lib/toast'
import { formatCrmNames } from '@/lib/utils'
import { FetchResult, gql, useApolloClient, useQuery } from '@apollo/client'
import { format } from 'd3-format'
import { interpolateRdYlGn } from 'd3-scale-chromatic'
import { formatRelative } from 'date-fns'
import parse from 'html-react-parser'
import { AlertCircle, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import pluralize from 'pluralize'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import toSpaceCase from 'to-space-case'
import { CREATE_MAP_REPORT } from '../../../reports/ReportList/CreateReportCard'
import ExternalDataSourceBadCredentials from './ExternalDataSourceBadCredentials'
import { ManageSourceSharing } from './ManageSourceSharing'
import { DELETE_UPDATE_CONFIG, GET_UPDATE_CONFIG } from './graphql-queries'
import importData, { cancelImport } from './importData'

export default function InspectExternalDataSource({
  externalDataSourceId,
  name,
  dataType,
  crmType,
}: {
  externalDataSourceId: string
  name: string
  dataType?: DataSourceType
  crmType: string
}) {
  const router = useRouter()
  const client = useApolloClient()
  const [pollInterval, setPollInterval] = useState<number | undefined>(
    undefined
  )

  const { loading, data, refetch, error } = useQuery<
    ExternalDataSourceInspectPageQuery,
    ExternalDataSourceInspectPageQueryVariables
  >(GET_UPDATE_CONFIG, {
    variables: {
      ID: externalDataSourceId,
    },
    pollInterval,
    notifyOnNetworkStatusChange: true,
  })

  // Begin polling on successful datasource query
  useEffect(() => {
    const status = data?.externalDataSource?.importProgress?.status
    if (
      data?.externalDataSource &&
      status &&
      !['cancelled', 'failed', 'succeeded'].includes(status)
    ) {
      setPollInterval(5000)
    }
  }, [data])

  // Stop polling on unmount
  useEffect(() => {
    return () => {
      setPollInterval(undefined)
    }
  }, [])

  // Stop polling when job is no longer in progress
  useEffect(() => {
    const status = data?.externalDataSource?.importProgress?.status
    if (status && ['cancelled', 'failed', 'succeeded'].includes(status)) {
      setPollInterval(undefined)
    }
  }, [data?.externalDataSource?.importProgress?.status])

  const notFound = !loading && !data?.externalDataSource
  if (error || notFound) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-7">
        <header className="flex flex-row justify-between gap-8">
          <div className="w-full">
            <h1 className="text-hLg mb-4">
              {name} ({formatCrmNames(crmType)})
            </h1>
            {String(error).includes('Bad credentials') ? (
              <ExternalDataSourceBadCredentials
                id={externalDataSourceId}
                crmType={crmType}
                onUpdateCredentials={refetch}
              />
            ) : (
              <p>Couldn{"'"}t find this data source</p>
            )}
          </div>
        </header>
      </div>
    )
  }

  const source = data?.externalDataSource

  const crmInfo = source?.crmType
    ? externalDataSourceOptions[source?.crmType]
    : undefined

  const handleCreateReport = () => {
    const variables = {
      data: createReportForSource(
        source?.name || 'Untitled Data Source',
        externalDataSourceId
      ),
    }

    toast.promise(
      client.mutate({
        mutation: CREATE_MAP_REPORT,
        variables,
      }),
      {
        loading: 'Creating report...',
        success: (d) => {
          if (d.data?.createMapReport?.__typename === 'MapReport') {
            router.push(`/reports/${d.data.createMapReport.id}`)
            return 'Map created!'
          } else {
            throw new Error('Failed to create map.')
          }
        },
        error: (e) => {
          const errorMessage =
            e?.graphQLErrors?.[0]?.message || 'Failed to create map.'
          return parse(errorMessage)
        },
      }
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-7">
      <header className="flex flex-row justify-between gap-8">
        <div className="w-full">
          <div className="text-meepGray-400">{source?.organisation.name} /</div>
          <h1
            className="text-hLg"
            {...contentEditableMutation(
              (name) => updateMutation({ name }),
              'Untitled Data Source'
            )}
          >
            {name}
          </h1>
          <div className="text-meepGray-400 capitalize">
            {dataType === DataSourceType.Member
              ? 'Membership list'
              : dataType
                ? pluralize(toSpaceCase(dataType.toLowerCase()))
                : 'Data source'}
            <span>&nbsp;&#x2022;&nbsp;</span>
            {crmInfo?.name || crmType}
          </div>
          {!!source?.remoteUrl && (
            <a
              href={source.remoteUrl}
              className="text-meepGray-300 underline text-sm"
            >
              Visit URL: {source.remoteUrl} <ExternalLink />
            </a>
          )}
        </div>
        <div>
          {crmType === CrmType.Airtable && (
            <div className="inline-flex rounded-xl bg-meepGray-700 px-10 py-6 overflow-hidden flex-row items-center justify-center">
              <AirtableLogo className="w-full" />
            </div>
          )}
        </div>
      </header>

      <div className="border-b border-meepGray-700 pt-10" />
      {(!data?.externalDataSource && loading) || !source ? (
        <div className="py-8 text-center">
          <LoadingIcon />
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4 items-start">
            <section className="space-y-4 max-w-sm">
              <h2 className="text-hMd">Imported records</h2>
              <div className="text-hXlg">
                {format(',')(source.importedDataCount || 0)}
              </div>
              <div>
                Located in {pluralize('region', source.regionCount, true)},{' '}
                {pluralize('constituency', source.constituencyCount, true)},{' '}
                {pluralize('local authority', source.ladCount, true)}, and{' '}
                {pluralize('ward', source.wardCount, true)}.{' '}
                {/* Un-geolocated count: */}
                <span
                  style={{
                    // linear interpolation based on d3
                    color: interpolateRdYlGn(
                      source.importedDataGeocodingRate / 100
                    ),
                  }}
                >
                  Geocoding success rate of{' '}
                  {(source.importedDataGeocodingRate || 0).toFixed(0)}%
                </span>
              </div>
              <p className="text-meepGray-400">
                Import data from this {formatCrmNames(source.crmType)} into
                Mapped for use in reports
                {dataType !== DataSourceType.Member
                  ? ' and to enrich membership lists'
                  : ''}
                .
              </p>
              <div className="flex flex-row align-baseline gap-2">
                <Button
                  disabled={source.importProgress?.inQueue}
                  onClick={() => {
                    importData(client, externalDataSourceId)
                  }}
                >
                  {!source.importProgress?.inQueue ||
                  source.importProgress?.status ===
                    ProcrastinateJobStatus.Failed ||
                  source.importProgress?.status ===
                    ProcrastinateJobStatus.Cancelled ? (
                    'Import all data'
                  ) : (
                    <span className="flex flex-row gap-2 items-center">
                      <LoadingIcon size={'18'} />
                      <span>
                        {source.importProgress?.inQueue ||
                        source.importProgress?.status ===
                          ProcrastinateJobStatus.Doing
                          ? 'Importing...'
                          : 'Scheduled'}
                      </span>
                    </span>
                  )}
                </Button>

                {source.importProgress?.inQueue && (
                  <Button
                    onClick={() => {
                      toastPromise(
                        cancelImport(
                          client,
                          externalDataSourceId,
                          source.importProgress?.id || ''
                        ),
                        {
                          loading: 'Cancelling...',
                          success: () => {
                            refetch()
                            return 'Cancelled'
                          },
                          error: 'Failed to cancel',
                        }
                      )
                    }}
                  >
                    Cancel import
                  </Button>
                )}
              </div>
              {source.importProgress?.status !== 'todo' ? (
                <BatchJobProgressReport
                  batchJobProgress={source.importProgress}
                  pastTenseVerb="Imported"
                />
              ) : null}
              {source?.importProgress?.status === 'todo' &&
                source?.importProgress?.numberOfJobsAheadInQueue != null &&
                source.importProgress.numberOfJobsAheadInQueue > 0 && (
                  <div>
                    {source.importProgress.numberOfJobsAheadInQueue}{' '}
                    {source.importProgress.numberOfJobsAheadInQueue === 1
                      ? 'job'
                      : 'jobs'}{' '}
                    ahead of this one in the queue
                  </div>
                )}
              {source.importProgress?.sendEmail &&
                (source?.importProgress?.status === 'todo' ||
                  source?.importProgress?.status === 'doing') && (
                  <div>
                    This job is predicted to take more than 5 minutes. Feel free
                    to navigate away from this page and we will send you an
                    email when it's finished.
                  </div>
                )}
              {source.hasWebhooks && (
                <section className="space-y-4">
                  <h2 className="text-hSm mb-5">Auto-import</h2>
                  <p className="text-sm text-meepGray-400">
                    Auto-imports are{' '}
                    {source.autoImportEnabled ? 'enabled' : 'disabled'} for this{' '}
                    {formatCrmNames(source.crmType)}.
                  </p>
                  {source.connectionDetails.__typename ===
                    'ActionNetworkSource' && (
                    <p className="text-sm text-meepGray-400 text-red-400">
                      Warning: Action Network auto-updates only work for new
                      members, not changes to existing members{"'"} details. If
                      existing members change, you must trigger a full import
                      using the button above.
                    </p>
                  )}
                  {source.automatedWebhooks ? (
                    <>
                      <EnableWebhooksSwitch
                        externalDataSource={source}
                        webhookType={WebhookType.Import}
                      />
                      {source.autoImportEnabled &&
                        !source.webhookHealthcheck && (
                          <>
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Webhooks unhealthy</AlertTitle>
                              <AlertDescription>
                                The webhook is unhealthy. Please refresh the
                                webhook to fix auto-updates.
                              </AlertDescription>
                            </Alert>
                            <WebhookRefresh
                              externalDataSourceId={externalDataSourceId}
                            />
                          </>
                        )}
                    </>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <p>Webhook URL for auto-imports:</p>
                      <code className="bg-black p-2 rounded break-words">
                        {source.webhookUrl}
                      </code>
                      <p>
                        Turn this switch on once you have added the above
                        Webhook URL to your{' '}
                        {formatCrmNames(source.crmType || 'database')}
                      </p>
                      <EnableWebhooksSwitch
                        externalDataSource={source}
                        webhookType={WebhookType.Import}
                      />
                    </div>
                  )}
                  {source.lastImportJob ? (
                    <div className="text-meepGray-400">
                      Last import:{' '}
                      {formatRelative(
                        source.lastImportJob.lastEventAt,
                        new Date()
                      )}{' '}
                      ({source.lastImportJob.status})
                    </div>
                  ) : null}
                </section>
              )}
              <Button onClick={handleCreateReport}>
                Generate map for this data source
              </Button>
            </section>
            <section className="space-y-4">
              <header className="flex flex-row justify-between items-center">
                <div>
                  <h2 className="text-hSm mb-5">Import fields</h2>
                  <p className="text-sm text-meepGray-400">
                    <span className="align-middle">
                      Designate special fields for use in Mapped reports
                    </span>
                  </p>
                </div>
              </header>
              <UpdateExternalDataSourceFields
                crmType={source.crmType}
                fieldDefinitions={source.fieldDefinitions}
                allowGeocodingConfigChange={!source.usesValidGeocodingConfig}
                initialData={{
                  geographyColumn: source.geographyColumn,
                  geographyColumnType: source.geographyColumnType,
                  firstNameField: source.firstNameField,
                  lastNameField: source.lastNameField,
                  fullNameField: source.fullNameField,
                  emailField: source.emailField,
                  phoneField: source.phoneField,
                  addressField: source.addressField,
                  titleField: source.titleField,
                  descriptionField: source.descriptionField,
                  imageField: source.imageField,
                  startTimeField: source.startTimeField,
                  endTimeField: source.endTimeField,
                  publicUrlField: source.publicUrlField,
                  socialUrlField: source.socialUrlField,
                  canDisplayPointField: source.canDisplayPointField,
                }}
                dataType={source.dataType}
                onSubmit={updateMutation}
              />
              <UpdateGecodingConfig
                externalDataSourceId={externalDataSourceId}
                geocodingConfig={source.geocodingConfig}
                fieldDefinitions={source.fieldDefinitions}
                onSubmit={updateMutation}
              />
            </section>
          </div>
          {!!source.sharingPermissions?.length && (
            <>
              <div className="border-b-4 border-meepGray-700 pt-10" />
              <section className="space-y-4">
                <header className="flex flex-row justify-between items-center">
                  <div>
                    <h2 className="text-hSm mb-5">Sharing</h2>
                    <p className="text-sm text-meepGray-400">
                      <span className="align-middle">
                        Share this data source with other users in your
                        organization
                      </span>
                    </p>
                  </div>
                </header>
                <ManageSourceSharing
                  externalDataSourceId={externalDataSourceId}
                />
              </section>
            </>
          )}
          {source.allowUpdates && (
            <>
              <div className="border-b-4 border-meepGray-700 pt-10" />
              <section className="space-y-4">
                <header className="grid md:grid-cols-2 gap-4 items-start">
                  <section className="space-y-4">
                    <h2 className="text-hMd mb-5">Enrich your original data</h2>
                    <p className="text-meepGray-400">
                      <span className="align-middle">
                        Pull Mapped data into your {crmInfo?.name || 'database'}{' '}
                      </span>
                      {!source.geocodingConfig && (
                        <>
                          <span>
                            based on each record
                            {"'"}s
                          </span>
                          <DataSourceFieldLabel
                            className="align-middle"
                            label={source.geographyColumnType}
                            crmType={source.crmType}
                          />
                        </>
                      )}
                    </p>
                    <div className="space-y-4">
                      {!source.updateProgress?.inQueue ? (
                        <TriggerUpdateButton id={source.id} />
                      ) : (
                        <>
                          <Button disabled>
                            <span className="flex flex-row gap-2 items-center">
                              <LoadingIcon size={'18'} />
                              <span>
                                {source.updateProgress?.status ===
                                ProcrastinateJobStatus.Doing
                                  ? 'Enriching...'
                                  : 'Scheduled'}
                              </span>
                            </span>
                          </Button>
                        </>
                      )}
                      {source?.updateProgress?.status === 'todo' &&
                        source?.updateProgress?.numberOfJobsAheadInQueue !=
                          null &&
                        source.updateProgress.numberOfJobsAheadInQueue > 0 && (
                          <div>
                            {source.updateProgress.numberOfJobsAheadInQueue}{' '}
                            {source.updateProgress.numberOfJobsAheadInQueue ===
                            1
                              ? 'job'
                              : 'jobs'}{' '}
                            ahead of this one in the queue
                          </div>
                        )}
                      {source.updateProgress?.sendEmail &&
                        (source?.updateProgress?.status === 'todo' ||
                          source?.updateProgress?.status === 'doing') && (
                          <div>
                            This job is predicted to take more than 5 minutes.
                            Feel free to navigate away from this page and we
                            will send you an email when it's finished.
                          </div>
                        )}
                      {source.updateProgress?.status !== 'todo' ? (
                        <BatchJobProgressReport
                          batchJobProgress={source.updateProgress}
                          pastTenseVerb="Done"
                        />
                      ) : null}
                    </div>
                  </section>
                  {source.hasWebhooks && (
                    <section className="space-y-4">
                      <h2 className="text-hSm mb-5">Auto-updates</h2>
                      <p className="text-sm text-meepGray-400">
                        Auto-updates are{' '}
                        {source.autoUpdateEnabled ? 'enabled' : 'disabled'} for
                        this {formatCrmNames(source.crmType)}. Select this to
                        allow Mapped to automatically update this{' '}
                        {formatCrmNames(source.crmType)} based on the fields you
                        selected in Data Enrichment Settings.
                      </p>
                      {source.connectionDetails.__typename ===
                        'ActionNetworkSource' && (
                        <p className="text-sm text-meepGray-400 text-red-400">
                          Warning: Action Network auto-updates only work for new
                          members, not changes to existing members{"'"} details.
                          If you are changing existing members you must trigger
                          a full update using the button on the left.
                        </p>
                      )}
                      {source.automatedWebhooks ? (
                        <>
                          <EnableWebhooksSwitch
                            externalDataSource={source}
                            webhookType={WebhookType.Update}
                          />
                          {source.autoUpdateEnabled &&
                            !source.webhookHealthcheck && (
                              <>
                                <Alert variant="destructive">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertTitle>Webhooks unhealthy</AlertTitle>
                                  <AlertDescription>
                                    The webhook is unhealthy. Please refresh the
                                    webhook to fix auto-updates.
                                  </AlertDescription>
                                </Alert>
                                <WebhookRefresh
                                  externalDataSourceId={externalDataSourceId}
                                />
                              </>
                            )}
                        </>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <p>Webhook URL for auto-updates:</p>
                          <code className="bg-black p-2 rounded break-words">
                            {source.webhookUrl}
                          </code>
                          <p>
                            Turn this switch on once you have added the above
                            Webhook URL to your database:
                          </p>
                          <EnableWebhooksSwitch
                            externalDataSource={source}
                            webhookType={WebhookType.Update}
                          />
                        </div>
                      )}
                      {source.lastUpdateJob ? (
                        <div className="text-meepGray-400">
                          Last sync:{' '}
                          {formatRelative(
                            source.lastUpdateJob.lastEventAt,
                            new Date()
                          )}{' '}
                          ({source.lastUpdateJob.status})
                        </div>
                      ) : null}
                    </section>
                  )}
                </header>
                <h2 className="text-hSm !mt-8 my-5">
                  Data Enrichment Settings
                </h2>
                <p className="mt-1 text-meepGray-400 text-sm">
                  Use the 'Enrich' button above to re-run the enrichment process
                  after changing these settings.
                </p>
                <UpdateMappingForm
                  allowMapping={true}
                  crmType={source.crmType}
                  fieldDefinitions={source.fieldDefinitions}
                  refreshFieldDefinitions={() => {
                    refetch()
                  }}
                  allowGeocodingConfigChange={!source.usesValidGeocodingConfig}
                  externalDataSourceId={source.id}
                  initialData={{
                    // Trim out the __typenames
                    geographyColumn: source?.geographyColumn,
                    geographyColumnType: source?.geographyColumnType,
                    updateMapping: source?.updateMapping?.map((m) => ({
                      source: m.source,
                      sourcePath: m.sourcePath,
                      destinationColumn: m.destinationColumn,
                    })),
                  }}
                  onSubmit={updateMutation}
                />
              </section>
            </>
          )}
          <div className="border-b-4 border-meepGray-700 pt-10" />
          <section className="space-y-4">
            <h2 className="text-hSm mb-5">Connection</h2>
            {source.connectionDetails.__typename === 'AirtableSource' ? (
              <div className="mt-2">
                <code>{source.connectionDetails.apiKey}</code>
                <br />
                <code>{source.connectionDetails.baseId}</code>
                <br />
                <code>{source.connectionDetails.tableId}</code>
              </div>
            ) : null}
            {source.connectionDetails.__typename === 'MailchimpSource' ? (
              <div className="mt-2">
                <code>{source.connectionDetails.apiKey}</code>
                <br />
                <code>{source.connectionDetails.listId}</code>
              </div>
            ) : null}
            {source.connectionDetails.__typename === 'ActionNetworkSource' ? (
              <div className="mt-2">
                <code>{source.connectionDetails.apiKey}</code>
              </div>
            ) : null}
            {source.connectionDetails.__typename === 'TicketTailorSource' ? (
              <div className="mt-2">
                <code>{source.connectionDetails.apiKey}</code>
              </div>
            ) : null}

            <div className="flex flex-row align-baseline gap-2">
              <AlertButton
                buttonLabel="Permanently delete"
                title="Are you sure you want to delete this data source?"
                children={
                  'This action cannot be undone. This will permanently delete this data source connect from Mapped.'
                }
                onConfirm={del}
                confirmLabel="Confirm delete"
                buttonProps={{
                  variant: 'destructive',
                }}
              />
              {/*  */}
              <AlertButton
                buttonLabel="Remove all records from Mapped"
                title="Are you sure you want to remove this data source's records on Mapped?"
                children={
                  'This action cannot be undone. This will permanently remove this data from Mapped. The data will NOT be deleted from the third party system.'
                }
                confirmLabel="Confirm remove records from Mapped"
                buttonProps={{
                  variant: 'destructive',
                }}
                onConfirm={() => {
                  toastPromise(
                    client.mutate({
                      mutation: gql`
                        mutation DeleteRecords($externalDataSourceId: String!) {
                          deleteAllRecords(
                            externalDataSourceId: $externalDataSourceId
                          ) {
                            id
                          }
                        }
                      `,
                      variables: {
                        externalDataSourceId,
                      },
                    }),
                    {
                      loading: 'Deleting all records...',
                      success: () => {
                        refetch()
                        return 'Deleted all records'
                      },
                      error: 'Failed to delete',
                    }
                  )
                }}
              />
            </div>
          </section>
        </>
      )}
    </div>
  )

  function UpdateGecodingConfig({
    externalDataSourceId,
    geocodingConfig,
    fieldDefinitions,
    onSubmit,
  }: {
    externalDataSourceId: string
    geocodingConfig: any
    fieldDefinitions: FieldDefinition[] | null | undefined
    onSubmit: (
      data: ExternalDataSourceInput,
      e?: React.BaseSyntheticEvent<object, any, any> | undefined
    ) => void
  }) {
    const [newGeocodingConfig, setGeocodingConfig] = useState(
      geocodingConfig ? JSON.stringify(geocodingConfig, null, 2) : ''
    )
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Edit geocoding config</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogDescription>
              Only play with this if you know what you are doing.
              <Textarea
                value={newGeocodingConfig}
                onChange={(t) => {
                  const val = t.target.value
                  setGeocodingConfig(val)
                }}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                try {
                  const parsed = JSON.parse(newGeocodingConfig)
                  onSubmit({ geocodingConfig: parsed })
                } catch {
                  onSubmit({ geocodingConfig: null })
                }
              }}
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  function updateMutation(
    data: ExternalDataSourceInput,
    e?: React.BaseSyntheticEvent<object, any, any> | undefined
  ) {
    e?.preventDefault()
    const update = client.mutate<
      UpdateExternalDataSourceMutation,
      UpdateExternalDataSourceMutationVariables
    >({
      mutation: UPDATE_EXTERNAL_DATA_SOURCE,
      variables: {
        input: {
          id: externalDataSourceId,
          ...data,
        },
      },
    })
    toast.promise(update, {
      loading: 'Saving...',
      success: (d: FetchResult<UpdateExternalDataSourceMutation>) => {
        if (!d.errors && d.data) {
          return 'Saved source'
        }
      },
      error: `Couldn't save source`,
    })
  }

  function del() {
    const mutation = client.mutate<
      DeleteUpdateConfigMutation,
      DeleteUpdateConfigMutationVariables
    >({
      mutation: DELETE_UPDATE_CONFIG,
      variables: { id: externalDataSourceId },
    })
    toast.promise(mutation, {
      loading: 'Deleting...',
      success: (e: FetchResult<DeleteUpdateConfigMutation>) => {
        if (!e.errors) {
          router.push('/data-sources')
          return `Deleted ${source?.name}`
        }
      },
      error: `Couldn't delete ${source?.name}`,
    })
  }
}
