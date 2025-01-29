import { requireAuth } from '@/lib/server-auth'
import { Metadata } from 'next'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()
  return children
}

export const metadata: Metadata = {
  title: 'Connect New Data Source',
}
