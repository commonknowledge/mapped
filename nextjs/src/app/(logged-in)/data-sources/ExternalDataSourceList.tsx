'use client'

import { gql, useQuery } from '@apollo/client'
import { useAtomValue } from 'jotai'
import Link from 'next/link'
import qs from 'query-string'
import { useEffect } from 'react'

import {
  DataSourceType,
  ListOrganisationsQuery,
  ListOrganisationsQueryVariables,
} from '@/__generated__/graphql'
import { ExternalDataSourceCard } from '@/components/ExternalDataSourceCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { externalDataSourceOptions } from '@/lib/data'
import { currentOrganisationIdAtom } from '@/lib/organisation'

const LIST_UPDATE_CONFIGS = gql`
  query ListOrganisations($currentOrganisationId: ID!) {
    myOrganisations(filters: { id: $currentOrganisationId }) {
      id
      externalDataSources {
        id
        name
        dataType
        connectionDetails {
          ... on AirtableSource {
            baseId
            tableId
          }
          ... on MailchimpSource {
            apiKey
            listId
          }
        }
        crmType
        autoImportEnabled
        autoUpdateEnabled
        jobs(pagination: { limit: 10 }) {
          lastEventAt
          status
        }
        updateMapping {
          source
          sourcePath
          destinationColumn
        }
        sharingPermissions {
          id
          organisation {
            id
            name
          }
        }
      }
      sharingPermissionsFromOtherOrgs {
        id
        externalDataSource {
          id
          name
          dataType
          crmType
          organisation {
            name
          }
        }
      }
    }
  }
`

export default function ExternalDataSourceList() {
  const currentOrganisationId = useAtomValue(currentOrganisationIdAtom)
  const { loading, error, data, refetch } = useQuery<
    ListOrganisationsQuery,
    ListOrganisationsQueryVariables
  >(LIST_UPDATE_CONFIGS, {
    variables: { currentOrganisationId },
  })

  useEffect(() => {
    refetch()
  }, [refetch])

  const allOrgSources =
    data?.myOrganisations.flatMap((org) => org.externalDataSources) || []
  const allOrgShares =
    data?.myOrganisations.flatMap(
      (org) => org.sharingPermissionsFromOtherOrgs
    ) || []

  return (
    <div className="max-w-7xl space-y-7 w-full">
      <PageHeader />
      <div className="border-b border-meepGray-700 pt-10" />
      <header className="flex flex-row justify-end">
        <h2 className="text-hMd mr-auto">Membership data sources</h2>
      </header>
      <p className="text-meepGray-400">
        Add your membership lists here. You will then be able to:
      </p>
      <ul className="list-disc list-inside pl-1 text-meepGray-400">
        <li className="mb-1">
          Enrich your membership lists with geographical data;
        </li>
        <li className="mb-1">
          Visualise and explore your membership using our&nbsp;
          <Link className="underline" href="/reports">
            map report
          </Link>{' '}
          features.
        </li>
      </ul>
      {loading ? (
        <section className="w-full grid gap-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-xl border border-meepGray-700 px-6 py-5 space-y-3">
            <Skeleton className="h-4 w-full max-w-[100px]" />
            <Skeleton className="h-10 w-full" />
          </article>
          <ConnectDataSource
            label="Connect a membership list"
            params={{ dataType: DataSourceType.Member }}
          />
        </section>
      ) : error ? (
        <h2>Error: {error.message}</h2>
      ) : data ? (
        <section className="w-full grid gap-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {(allOrgSources || [])
            .filter((d) =>
              [DataSourceType.Member, DataSourceType.Group].includes(d.dataType)
            )
            .map((externalDataSource) => (
              <ExternalDataSourceCard
                key={externalDataSource.id}
                externalDataSource={externalDataSource}
                withLink
                withUpdateOptions
              />
            ))}
          <ConnectDataSource
            label="Connect a membership list"
            params={{ dataType: DataSourceType.Member }}
          />
        </section>
      ) : null}
      {!!allOrgShares.length && (
        <>
          <div className="border-b border-meepGray-700 pt-10" />
          <header className="flex flex-row justify-end">
            <h2 className="text-hSm mr-auto">Shared with you</h2>
          </header>
          {loading ? (
            <section className="w-full grid gap-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <article className="rounded-xl border border-meepGray-700 px-6 py-5 space-y-3">
                <Skeleton className="h-4 w-full max-w-[100px]" />
                <Skeleton className="h-10 w-full" />
              </article>
            </section>
          ) : error ? (
            <h2>Error: {error.message}</h2>
          ) : data ? (
            <section className="w-full grid gap-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {allOrgShares.map((share) => (
                <ExternalDataSourceCard
                  key={share.externalDataSource.id}
                  externalDataSource={share.externalDataSource}
                  shared
                />
              ))}
            </section>
          ) : null}
        </>
      )}
      <div className="border-b border-meepGray-700 pt-16" />
      <header className="flex flex-row justify-end">
        <h2 className="text-hMd mr-auto">Other data sources</h2>
      </header>
      <p className="text-meepGray-400">
        Add non-membership data sources here. These can be used to:
      </p>
      <ul className="list-disc list-inside pl-1 text-meepGray-400">
        <li className="mb-1">
          Enrich your membership lists with custom geographical data;
        </li>
        <li className="mb-1">
          Display custom points on a public Hub map, e.g. upcoming events.
        </li>
      </ul>
      {loading ? (
        <section className="grid gap-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-xl border border-meepGray-700 px-6 py-5 space-y-3">
            <Skeleton className="h-4 w-full max-w-[100px]" />
            <Skeleton className="h-10 w-full" />
          </article>
          <ConnectDataSource
            label="Connect a data source"
            params={{ dataType: DataSourceType.Other }}
          />
        </section>
      ) : error ? (
        <h2>Error: {error.message}</h2>
      ) : data ? (
        <section className="grid gap-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {(allOrgSources || [])
            .filter(
              (d) =>
                ![DataSourceType.Member, DataSourceType.Group].includes(
                  d.dataType
                )
            )
            .map((externalDataSource) => (
              <ExternalDataSourceCard
                key={externalDataSource.id}
                externalDataSource={externalDataSource}
                withLink
              />
            ))}
          <ConnectDataSource
            label="Connect a data source"
            params={{ dataType: DataSourceType.Other }}
          />
        </section>
      ) : null}
    </div>
  )
}

function PageHeader() {
  return (
    <header className="grid grid-rows-2 md:grid-rows-1 md:grid-cols-2  gap-8">
      <div>
        <h1 className="text-hLg mb-7">Data Sources</h1>
        <p className="text-meepGray-400 w-[400px]">
          Connect your campaign data systems, auto-update them with useful
          information, and use the data to design empowering dashboards.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-7">
        {Object.values(externalDataSourceOptions)
          .filter((d) => d.supported)
          .map((d) => {
            const Logo = d.logo
            return (
              <Link
                key={d.key}
                href={`/data-sources/create/connect/${d.key}`}
                className="rounded-3xl bg-meepGray-700 hover:bg-meepGray-600 px-10 py-6 overflow-hidden flex flex-row items-center justify-center"
              >
                <Logo className="w-full" />
              </Link>
            )
          })}
      </div>
    </header>
  )
}

function ConnectDataSource({
  label = 'Connect a data layer',
  params,
}: {
  label?: string
  params?: any
}) {
  const link = qs.stringifyUrl({
    url: '/data-sources/create',
    query: params,
  })
  return (
    <Link href={link}>
      <article className="relative cursor-pointer rounded-xl border border-meepGray-700 px-6 py-5">
        <div className="space-y-5">
          <Skeleton className="h-4 w-full max-w-[100px]" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="absolute inset-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <Button variant="reverse" className="shadow-md">
            + {label}
          </Button>
        </div>
      </article>
    </Link>
  )
}
