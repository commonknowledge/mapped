'use client'

import { createGraphiQLFetcher } from '@graphiql/toolkit'
import { ErrorBoundary } from '@sentry/nextjs'
import { GraphiQL, GraphiQLProps } from 'graphiql'
import 'graphiql/graphiql.css'
import { useMemo } from 'react'

import { GRAPHQL_URL } from '@/env'
import { authenticationHeaders } from '@/lib/auth'

export function GraphQLPlayground(props: Partial<GraphiQLProps>) {
  const fetcher = useMemo(function getAuthenticatedFetcher() {
    if (typeof window === 'undefined') return null
    try {
      return createGraphiQLFetcher({
        url: GRAPHQL_URL,
        headers: authenticationHeaders(),
      })
    } catch (e) {
      console.error(e)
      return createGraphiQLFetcher({
        url: GRAPHQL_URL,
      })
    }
  }, [])
  if (!fetcher) return null
  return (
    <ErrorBoundary>
      <GraphiQL {...props} fetcher={fetcher} />
    </ErrorBoundary>
  )
}
