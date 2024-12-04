'use client'

import { FetchResult, gql, useApolloClient, useQuery } from '@apollo/client'
import { format } from 'd3-format'
import { formatRelative } from 'date-fns'
import { useAtom } from 'jotai'
import { AlertCircle, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import pluralize from 'pluralize'
import { toast } from 'sonner'

import {
  DataSourceType,
  DeleteUpdateConfigMutation,
  DeleteUpdateConfigMutationVariables,
  ExternalDataSourceInput,
  ExternalDataSourceInspectPageQuery,
  ExternalDataSourceInspectPageQueryVariables,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import { externalDataSourceOptions } from '@/lib/data'
import { UPDATE_EXTERNAL_DATA_SOURCE } from '@/lib/graphql/mutations'
import { contentEditableMutation } from '@/lib/html'
import { currentOrganisationIdAtom } from '@/lib/organisation'

import { ManageSourceSharing } from './ManageSourceSharing'
import importData from './importData'

const GET_UPDATE_CONFIG = gql`
  query ExternalDataSourceInspectPage($ID: ID!) {
    externalDataSource(pk: $ID) {
      id
      name
      dataType
      remoteUrl
      crmType
      connectionDetails {
        ... on AirtableSource {
          apiKey
          baseId
          tableId
        }
        ... on MailchimpSource {
          apiKey
          listId
        }
        ... on ActionNetworkSource {
          apiKey
          groupSlug
        }
        ... on TicketTailorSource {
          apiKey
        }
      }
      lastImportJob {
        id
        lastEventAt
        status
      }
      lastUpdateJob {
        id
        lastEventAt
        status
      }
      autoImportEnabled
      autoUpdateEnabled
      hasWebhooks
      allowUpdates
      automatedWebhooks
      webhookUrl
      webhookHealthcheck
      geographyColumn
      geographyColumnType
      postcodeField
      firstNameField
      lastNameField
      fullNameField
      emailField
      phoneField
      addressField
      titleField
      descriptionField
      imageField
      startTimeField
      endTimeField
      publicUrlField
      socialUrlField
      canDisplayPointField
      isImportScheduled
      importProgress {
        id
        hasForecast
        status
        total
        succeeded
        estimatedFinishTime
      }
      isUpdateScheduled
      updateProgress {
        id
        hasForecast
        status
        total
        succeeded
        estimatedFinishTime
      }
      importedDataCount
      fieldDefinitions {
        label
        value
        description
        editable
      }
      updateMapping {
        source
        sourcePath
        destinationColumn
      }
      sharingPermissions {
        id
      }
      organisation {
        id
        name
      }
    }
  }
`

const DELETE_UPDATE_CONFIG = gql`
  mutation DeleteUpdateConfig($id: String!) {
    deleteExternalDataSource(data: { id: $id }) {
      id
    }
  }
`

export default function InspectExternalDataSource({
  externalDataSourceId,
  name,
  dataType,
  remoteUrl,
  crmType,
}: {
  externalDataSourceId: string
  name?: string
  dataType?: DataSourceType
  remoteUrl?: string | null
  crmType?: string
}) {
  const router = useRouter()
  const client = useApolloClient()

  const { loading, error, data, refetch } = useQuery<
    ExternalDataSourceInspectPageQuery,
    ExternalDataSourceInspectPageQueryVariables
  >(GET_UPDATE_CONFIG, {
    variables: {
      ID: externalDataSourceId,
    },
    pollInterval: 5000,
  })

  const orgId = useAtom(currentOrganisationIdAtom)

  if (!loading && !data?.externalDataSource) {
    return <h2>Couldn{"'"}t find this data source</h2>
  }

  const source = data?.externalDataSource

  const allowMapping =
    source?.dataType == DataSourceType.Member && source.allowUpdates

  const crmInfo = source?.crmType
    ? externalDataSourceOptions[source?.crmType]
    : undefined

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-7">
      <header className="flex flex-row justify-between gap-8">
        <div className="w-full">
          <div className="text-meepGray-400">{source?.organisation.name} /</div>
          <h1
            className="text-hLg"
            {...contentEditableMutation(
              updateMutation,
              'name',
              'Untitled Data Source'
            )}
          >
            {name}
          </h1>
          <div className="text-meepGray-400 capitalize">
            {dataType === DataSourceType.Member
              ? 'Membership list'
              : dataType
                ? pluralize(dataType.toLowerCase())
                : 'Data source'}
            <span>&nbsp;&#x2022;&nbsp;</span>
            {crmInfo?.name || crmType}
          </div>
          {!!remoteUrl && (
            <a href={remoteUrl} className="text-meepGray-300 underline text-sm">
              Visit URL: {remoteUrl} <ExternalLink />
            </a>
          )}
        </div>
        <div>
          {crmType === 'AirtableSource' && (
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
              <p className="text-meepGray-400">
                Import data from this source into Mapped for use in reports
                {dataType !== DataSourceType.Member
                  ? ', and to enrich membership lists'
                  : ''}
                .
              </p>
              <Button
                disabled={source.isImportScheduled}
                onClick={() => importData(client, externalDataSourceId)}
              >
                {!source.isImportScheduled ? (
                  'Import all data'
                ) : (
                  <span className="flex flex-row gap-2 items-center">
                    <LoadingIcon size={'18'} />
                    <span>
                      {source.importProgress?.status ===
                      ProcrastinateJobStatus.Doing
                        ? 'Importing...'
                        : 'Scheduled'}
                    </span>
                  </span>
                )}
              </Button>
              {source.importProgress?.status ===
                ProcrastinateJobStatus.Doing && (
                <BatchJobProgressReport
                  batchJobProgress={source.importProgress}
                  pastTenseVerb="Imported"
                />
              )}
              {source.hasWebhooks && (
                <section className="space-y-4">
                  <h2 className="text-hSm mb-5">Auto-import</h2>
                  <p className="text-sm text-meepGray-400">
                    Auto-imports are{' '}
                    {source.autoImportEnabled ? 'enabled' : 'disabled'} for this
                    data source.
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
                        Webhook URL to your CRM:
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
                        Pull Mapped data into your original{' '}
                        {crmInfo?.name || 'data source'}, based on the record
                        {"'"}s
                      </span>
                      <DataSourceFieldLabel
                        className="align-middle"
                        label={source.geographyColumnType}
                        crmType={source.crmType}
                      />
                    </p>
                    <div className="space-y-4">
                      {!source.isUpdateScheduled ? (
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
                          {source.updateProgress?.status ===
                            ProcrastinateJobStatus.Doing && (
                            <BatchJobProgressReport
                              batchJobProgress={source.updateProgress}
                              pastTenseVerb="Done"
                            />
                          )}
                        </>
                      )}
                    </div>
                  </section>
                  {source.hasWebhooks && (
                    <section className="space-y-4">
                      <h2 className="text-hSm mb-5">Auto-updates</h2>
                      <p className="text-sm text-meepGray-400">
                        Auto-updates are{' '}
                        {source.autoUpdateEnabled ? 'enabled' : 'disabled'} for
                        this data source. Mapped can automatically update this
                        data source based on the mapping you{"'"}ve defined in
                        the Data Mapping section.
                      </p>
                      {source.connectionDetails.__typename ===
                        'ActionNetworkSource' && (
                        <p className="text-sm text-meepGray-400 text-red-400">
                          Warning: Action Network auto-updates only work for new
                          members, not changes to existing members{"'"} details.
                          If existing members change, you must trigger a full
                          update using the button on the left.
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
                            Webhook URL to your CRM:
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
                  Configure data enrichment
                </h2>
                <p className="mt-1 text-meepGray-400 text-sm">
                  Use the 'Enrich' button above to re-run the enrichment process
                  after changing this configuration.
                </p>
                <UpdateMappingForm
                  allowMapping={allowMapping}
                  crmType={source.crmType}
                  fieldDefinitions={source.fieldDefinitions}
                  refreshFieldDefinitions={() => {
                    refetch()
                  }}
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
            <AlertDialog>
              <AlertDialogTrigger>
                <Button variant="destructive" asChild={true}>
                  <span>Permanently delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-base">
                    This action cannot be undone. This will permanently delete
                    this data source connect from Mapped.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    className={buttonVariants({ variant: 'outline' })}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      del()
                    }}
                    className={buttonVariants({ variant: 'destructive' })}
                  >
                    Confirm delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
        </>
      )}
    </div>
  )

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
