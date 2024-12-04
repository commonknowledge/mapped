import { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { requireNoAuth } from '@/lib/server-auth'

import LoginForm from './login-form'

// This has been split into a two components to separate the client-side (LoginForm)
// and the server side (this component), which allows using requireNoAuth() here
export default async function Login() {
  await requireNoAuth()

  return (
    <div className="m-8 md:ml-36 max-w-xs space-y-4 rounded border border-meepGray-600 bg-meepGray-800 p-8">
      <h1 className="text-hLg font-IBMPlexSans">Login</h1>
      <LoginForm />
      <div
        aria-roledescription="divider"
        className="border-t border-meepGray-600"
      ></div>
      <div className="text-labelMain text-meepGray-400">
        Don’t have an account?
      </div>
      <Link href="/signup" className="block">
        <Button className="w-full" variant="outline" size="sm">
          Sign up to the waitlist
        </Button>
      </Link>
      <div className="text-labelMain text-meepGray-400">
        Forgotten password?
      </div>
      <Link href="/reset-password" className="block">
        <Button className="w-full" variant="outline" size="sm">
          Request password reset
        </Button>
      </Link>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Login',
}
