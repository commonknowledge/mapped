import { Toaster } from 'sonner'

import Navbar from '@/components/navbar'
import { loadUser } from '@/lib/server-auth'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await loadUser()
  const isLoggedIn = Boolean(user)

  return (
    <div className="h-dvh flex flex-col">
      <Navbar isLoggedIn={isLoggedIn} />
      <main className="relative overflow-x-hidden overflow-y-auto flex-grow">
        {children}
      </main>
      <Toaster />
    </div>
  )
}
