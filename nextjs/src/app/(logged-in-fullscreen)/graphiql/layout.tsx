import 'graphiql/graphiql.css'
import { Metadata } from 'next'

import { requireAuth } from '@/lib/server-auth'

export default function GraphiQL({ children }: { children: React.ReactNode }) {
  requireAuth()
  return <div className="h-[100dvh]">{children}</div>
}

export const metadata: Metadata = {
  title: 'GraphiQL',
}
