import { Metadata } from 'next'

import { requireAuth } from '@/lib/server-auth'

import ExternalDataSourceList from './ExternalDataSourceList'

export default async function Page() {
  await requireAuth()

  return <ExternalDataSourceList />
}

export const metadata: Metadata = {
  title: 'Your Data Sources',
}
