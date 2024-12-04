import {
  ApolloClient,
  FetchResult,
  gql,
  useApolloClient,
  useMutation,
} from '@apollo/client'
import { formatRelative } from 'date-fns'
import Link from 'next/link'
import { toast } from 'sonner'

import {
  CrmType,
  DataSourceCardFragment,
  DataSourceType,
  DisableWebhookMutation,
  DisableWebhookMutationVariables,
  EnableWebhookMutation,
  EnableWebhookMutationVariables,
  TriggerFullUpdateMutation,
  TriggerFullUpdateMutationVariables,
  WebhookRefreshMutation,
  WebhookRefreshMutationVariables,
  WebhookType,
} from '@/__generated__/graphql'
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
import { Switch } from '@/components/ui/switch'

import { DataSourceIcon } from './DataSourceIcon'
import { Button, ButtonProps, buttonVariants } from './ui/button'

export function ExternalDataSourceCard({
  externalDataSource,
  shared = false,
  withUpdateOptions = false,
  withLink = false,
}: {
  externalDataSource: {
    id: any
    name: string
    dataType: DataSourceType
    automatedWebhooks?: boolean
    autoImportEnabled?: boolean
    autoUpdateEnabled?: boolean
    crmType?: CrmType
    jobs?: DataSourceCardFragment['jobs']
    organisation?: {
      name: string
    }
    sharingPermissions?: Array<{
      organisation: {
        name: string
      }
    }>
  }
  withUpdateOptions?: boolean
  withLink?: boolean
  shared?: boolean
}) {
  return (
    <article className="rounded-xl border border-meepGray-600 px-6 py-5 space-y-3">
      <header className="flex flex-row justify-between items-start">
        <div className="space-y-3">
          <DataSourceIcon crmType={externalDataSource.crmType} />
          <h3 className="text-hSm">
            {externalDataSource.name ||
              externalDataSource.crmType ||
              'Un-named data source'}
          </h3>
        </div>
        {withLink && (
          <Link href={`/data-sources/inspect/${externalDataSource.id}`}>
            <CogIcon />
          </Link>
        )}
      </header>
      {!!shared && !!externalDataSource.organisation && (
        <div className="text-sm text-meepGray-400">
          Shared by {externalDataSource.organisation.name}
        </div>
      )}
      {!!externalDataSource.sharingPermissions?.length && (
        <div className="text-sm text-pink-400 font-bold">
          Sharing with{' '}
          {externalDataSource.sharingPermissions
            .map((p) => p.organisation.name)
            .join(', ')}
        </div>
      )}
      <EnableWebhooksSwitch
        externalDataSource={externalDataSource}
        webhookType={WebhookType.Import}
      />
      {withUpdateOptions &&
        externalDataSource.dataType === DataSourceType.Member && (
          <EnableWebhooksSwitch
            externalDataSource={externalDataSource}
            webhookType={WebhookType.Update}
          />
        )}
      {withUpdateOptions && externalDataSource?.jobs?.[0]?.lastEventAt ? (
        <div className="text-sm text-meepGray-400">
          Last background task{' '}
          <span className="text-meepGray-300">
            {externalDataSource.jobs[0].status}
          </span>{' '}
          {formatRelative(externalDataSource.jobs[0].lastEventAt, new Date())}
        </div>
      ) : null}
    </article>
  )
}

export function EnableWebhooksSwitch({
  externalDataSource,
  webhookType,
}: {
  externalDataSource: any
  webhookType: WebhookType
}) {
  const client = useApolloClient()
  const checked =
    webhookType === WebhookType.Import
      ? externalDataSource.autoImportEnabled
      : externalDataSource.autoUpdateEnabled
  return (
    <div className="flex flex-row items-center justify-start gap-2 text-label">
      <Switch
        checked={checked}
        onCheckedChange={(e) =>
          toggleWebhooksEnabled(client, e, externalDataSource.id, webhookType)
        }
      />
      <span className={checked ? 'text-brandBlue' : ''}>
        Auto-{webhookType}
      </span>
    </div>
  )
}

const WEBHOOK_REFRESH = gql`
  mutation WebhookRefresh($ID: String!) {
    refreshWebhooks(externalDataSourceId: $ID) {
      id
      hasWebhooks
      automatedWebhooks
      webhookHealthcheck
    }
  }
`

export function WebhookRefresh({
  externalDataSourceId,
}: {
  externalDataSourceId: string
}) {
  const [mutate, mutation] = useMutation<
    WebhookRefreshMutation,
    WebhookRefreshMutationVariables
  >(WEBHOOK_REFRESH, {
    variables: { ID: externalDataSourceId },
  })

  return (
    <Button onClick={() => trigger()} disabled={mutation.loading}>
      Refresh webhooks
    </Button>
  )

  function trigger() {
    toast.promise(mutate(), {
      loading: 'Refreshing...',
      success: 'Refreshed webhooks',
      error: "Couldn't refresh webhooks",
    })
  }
}

export function TriggerUpdateButton({
  id,
  label = 'Enrich all data now',
  ...buttonProps
}: {
  id: string
  label?: string
} & ButtonProps) {
  const client = useApolloClient()

  return (
    <AlertDialog>
      <AlertDialogTrigger {...buttonProps}>
        <Button {...buttonProps} asChild={true}>
          <span>{label}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Trigger a full update</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            This will update all records in the CRM. Depending on the size of
            your CRM, this may take a while.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={buttonVariants({ variant: 'outline' })}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              trigger()
            }}
            className={buttonVariants({ variant: 'reverse' })}
          >
            Trigger update
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  function trigger() {
    const mutation = client.mutate<
      TriggerFullUpdateMutation,
      TriggerFullUpdateMutationVariables
    >({
      mutation: TRIGGER_FULL_UPDATE,
      variables: { externalDataSourceId: id },
    })
    toast.promise(mutation, {
      loading: 'Triggering...',
      success: (d: FetchResult<TriggerFullUpdateMutation>) => {
        return `Triggered sync for ${d.data?.triggerUpdate.externalDataSource.name}`
      },
      error: `Couldn't trigger sync`,
    })
  }
}

export function toggleWebhooksEnabled(
  client: ApolloClient<any>,
  checked: boolean,
  id: any,
  webhookType: WebhookType
) {
  if (checked) {
    const mutation = client.mutate<
      EnableWebhookMutation,
      EnableWebhookMutationVariables
    >({
      mutation: ENABLE_WEBHOOKS,
      variables: { ID: id, webhookType },
    })
    toast.promise(mutation, {
      loading: 'Enabling...',
      success: (d: FetchResult<EnableWebhookMutation>) => {
        return `Enabled auto-${webhookType.toLowerCase()} for ${d.data?.enableWebhook.name}`
      },
      error: `Couldn't enable auto-${webhookType.toLowerCase()}`,
    })
  } else {
    const mutation = client.mutate<
      DisableWebhookMutation,
      DisableWebhookMutationVariables
    >({
      mutation: DISABLE_WEBHOOKS,
      variables: { ID: id, webhookType },
    })
    toast.promise(mutation, {
      loading: 'Disabling...',
      success: (d: FetchResult<DisableWebhookMutation>) => {
        return `Disabled auto-${webhookType.toLowerCase()} for ${d.data?.disableWebhook.name}`
      },
      error: `Couldn't disable auto-${webhookType.toLowerCase()}`,
    })
  }
}

export const DATA_SOURCE_FRAGMENT = gql`
  fragment DataSourceCard on ExternalDataSource {
    id
    name
    dataType
    crmType
    automatedWebhooks
    autoImportEnabled
    autoUpdateEnabled
    updateMapping {
      source
      sourcePath
      destinationColumn
    }
    jobs(pagination: { limit: 10 }) {
      lastEventAt
      status
    }
    sharingPermissions {
      id
      organisation {
        id
        name
      }
    }
  }
`

export const GET_UPDATE_CONFIG_CARD = gql`
  query ExternalDataSourceExternalDataSourceCard($ID: ID!) {
    externalDataSource(pk: $ID) {
      ...DataSourceCard
    }
  }
  ${DATA_SOURCE_FRAGMENT}
`

export const ENABLE_WEBHOOKS = gql`
  mutation EnableWebhook($ID: String!, $webhookType: WebhookType!) {
    enableWebhook(externalDataSourceId: $ID, webhookType: $webhookType) {
      id
      autoImportEnabled
      autoUpdateEnabled
      hasWebhooks
      automatedWebhooks
      webhookHealthcheck
      name
    }
  }
`

export const DISABLE_WEBHOOKS = gql`
  mutation DisableWebhook($ID: String!, $webhookType: WebhookType!) {
    disableWebhook(externalDataSourceId: $ID, webhookType: $webhookType) {
      id
      autoImportEnabled
      autoUpdateEnabled
      hasWebhooks
      automatedWebhooks
      webhookHealthcheck
      name
    }
  }
`

export function CogIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  )
}

export const TRIGGER_FULL_UPDATE = gql`
  mutation TriggerFullUpdate($externalDataSourceId: String!) {
    triggerUpdate(externalDataSourceId: $externalDataSourceId) {
      id
      externalDataSource {
        jobs(pagination: { limit: 10 }) {
          status
          id
          taskName
          args
          lastEventAt
        }
        id
        name
        crmType
      }
    }
  }
`
