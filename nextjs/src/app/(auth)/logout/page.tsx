import { Metadata } from 'next'

import { requireAuth } from '@/lib/server-auth'

import LogoutForm from './logout-form'

// This has been split into a two components to separate the client-side (LogoutForm)
// and the server side (this component), which allows using requireAuth() here
export default async function Logout() {
  await requireAuth()

  return <LogoutForm />
}

export const metadata: Metadata = {
  title: 'Logout',
}
