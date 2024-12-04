import { Metadata } from 'next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAuth } from '@/lib/server-auth'

import YourOrganisations from './your-organisations'

export default async function Account() {
  const user = await requireAuth()

  return (
    <div className="grid grid-cols-1 gap-6">
      <h1 className="text-hLg">
        Welcome to your Mapped Account, {user.username}
      </h1>
      <YourOrganisations />
      <Card className="">
        <CardHeader className="p-4">
          <CardTitle>Your email</CardTitle>
        </CardHeader>
        <CardContent className="px-4">{user.email}</CardContent>
      </Card>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Your Account',
}
