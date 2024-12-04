import { loadUser } from '@/lib/server-auth'

import Dashboard from './Dashboard'
import MarketingHome from './MarketingHome'

export default async function Home() {
  const user = await loadUser()

  return (
    <div className="">
      {user ? <Dashboard user={user} /> : <MarketingHome />}
    </div>
  )
}
