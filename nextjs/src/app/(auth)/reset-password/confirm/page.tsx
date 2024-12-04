import { Metadata } from 'next'
import { Suspense } from 'react'

import { requireNoAuth } from '@/lib/server-auth'

import NewPasswordForm from './new-password-form'

export default async function Reset() {
  await requireNoAuth()

  return (
    <div className="m-8 md:ml-36 max-w-xs space-y-4 rounded border border-meepGray-600 bg-meepGray-800 p-8">
      <h1 className="text-hLg font-IBMPlexSans">Create a new password</h1>
      <Suspense>
        <NewPasswordForm />
      </Suspense>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Create a new password',
}
