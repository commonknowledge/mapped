import { gql } from '@apollo/client'
import Link from 'next/link'
import qs from 'query-string'

import {
  DataSourceType,
  ExternalDataSource,
  Organisation,
} from '@/__generated__/graphql'
import GetStarted from '@/components/marketing/GetStarted'
import { buttonVariants } from '@/components/ui/button'
import { getClient } from '@/lib/services/apollo-client'

const LIST_DATA_SOURCES = gql`
  query ListExternalDataSources {
    myOrganisations {
      id
      externalDataSources {
        id
      }
    }
  }
`

export default async function Dashboard({
  user,
}: {
  user: { username: string }
}) {
  const client = getClient()
  const { data } = await client.query({ query: LIST_DATA_SOURCES })
  const allDataSources = data.myOrganisations.reduce(
    (sources: ExternalDataSource[], org: Organisation) => {
      return sources.concat(org.externalDataSources)
    },
    []
  )

  const btnLink = qs.stringifyUrl({
    url: '/data-sources/create',
    query: { dataType: DataSourceType.Member },
  })

  const isNew = allDataSources.length === 0

  return (
    <div>
      {allDataSources.length === 0 ? (
        <div className="mb-12">
          <h1 className="md:text-hXlg text-hLg tracking-[-1.47px] font-light font-IBMPlexSans w-[915px] mb-12">
            Welcome to Mapped,{' '}
            <span className="font-PPRightGrotesk font-bold text-[84.468px] tracking-normal">
              {user?.username}
            </span>
            ! 👋
          </h1>
          <GetStarted btnLink={btnLink} />
        </div>
      ) : (
        <>
          <h1 className="md:text-hXlg text-hLg tracking-[-1.47px] font-light font-IBMPlexSans w-[915px] mb-12">
            Welcome back,{' '}
            <span className="font-PPRightGrotesk font-bold text-[84.468px] tracking-normal">
              {user?.username}
            </span>
            ! ✊
          </h1>
          <div className="grid grid-cols-2 gap-16">
            <Link
              href="/reports"
              className={buttonVariants({ variant: 'brand' })}
            >
              Your maps
            </Link>
            <Link
              href="/data-sources"
              className={buttonVariants({ variant: 'brand' })}
            >
              Your data sources
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
