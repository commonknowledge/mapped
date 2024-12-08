import { Toaster } from 'sonner'

import Navbar from '@/components/navbar'
import { requireAuth } from '@/lib/server-auth'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()

  return (
    <div className="h-dvh flex flex-col">
      <Navbar isLoggedIn={true} />
      <main
        className="h-full relative overflow-x-hidden overflow-y-hidden flex-grow text-black"
        id="puck-editor-root"
      >
        {children}
      </main>
      <Toaster />
    </div>
  )
}
