import { gql } from '@apollo/client'
import { redirect } from 'next/navigation'

import { PublicUserQuery } from '@/__generated__/graphql'
import { getClient } from '@/lib/services/apollo-client'

const USER_QUERY = gql`
  query PublicUser {
    publicUser {
      id
      username
      email
    }
  }
`

/**
 * Async functions that use the server-side GraphQL client.
 * Cannot be imported into client components.
 */

export const loadUser = async () => {
  const client = getClient()

  let data = null
  try {
    const response = await client.query<PublicUserQuery>({ query: USER_QUERY })
    data = response.data
  } catch (e: any) {
    console.error(e.message)
  }
  return data?.publicUser
}

export const requireAuth = async () => {
  const user = await loadUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

export const requireNoAuth = async () => {
  const user = await loadUser()

  if (user) {
    redirect('/')
  }

  return user
}
