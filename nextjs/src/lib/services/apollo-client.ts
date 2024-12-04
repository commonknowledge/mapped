import { ApolloLink, HttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { registerApolloClient } from '@apollo/experimental-nextjs-app-support/rsc'
import {
  NextSSRApolloClient,
  NextSSRInMemoryCache,
} from '@apollo/experimental-nextjs-app-support/ssr'
import { cookies } from 'next/headers'

import { GRAPHQL_URL } from '@/env'

const getJwt = (): string | undefined => {
  const cookieStore = cookies()
  return cookieStore.get('jwt')?.value
}

/**
 * Creates an apollo client that can be used in server-side components.
 * Example:
 *
 *     import { getClient } from "@/services/apollo-client.ts";
 *
 *     const MY_QUERY = gql`
 *         {
 *             ...
 *         }
 *     `
 *
 *     export default async function MyPage() {
 *         let data = null
 *         try {
 *             const response = await getClient().query({ query: MY_QUERY })
 *             data = response.data
 *         } catch (e) {
 *             console.error(e.message)
 *         }
 *         return <div>{JSON.stringify(data)}</div>
 *     }
 *
 * This will not work if "use client" is present. For client components,
 * use the useQuery() hook (see components/ApolloWrapper.tsx).
 */
const makeBackEndClient = (token: string = '') => {
  const httpLink = new HttpLink({
    uri: GRAPHQL_URL,
  })

  const authLink = setContext((_, { headers }) => {
    const config = {
      headers: {
        ...headers,
        authorization: token ? `JWT ${token}` : '',
      },
    }
    return config
  })

  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link: ApolloLink.from([authLink, httpLink]),
  })
}

export const { getClient } = registerApolloClient(() => {
  const token = getJwt()
  return makeBackEndClient(token)
})
