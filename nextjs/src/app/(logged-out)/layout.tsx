import { Toaster } from 'sonner'

import PreFooter from '@/components/PreFooter'
import { AreaPattern } from '@/components/areaPattern'
import Footer from '@/components/footer'
import FeedbackBanner from '@/components/marketing/FeedbackBanner'
import SignUp from '@/components/marketing/SignUp'
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
    <div className="flex flex-col min-h-dvh max-w-screen-2xl mx-auto">
      <AreaPattern />
      <FeedbackBanner />
      <Navbar isLoggedIn={isLoggedIn} />

      <main className="p-4 relative">{children}</main>
      <Toaster />
      <div className="flex flex-col gap-4 mt-auto mx-4">
        {!isLoggedIn && <SignUp />}
        <PreFooter />
        <Footer />
      </div>
    </div>
  )
}
