import { ApolloLink, HttpLink, gql } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import {
  NextSSRInMemoryCache,
  NextSSRApolloClient,
} from "@apollo/experimental-nextjs-app-support/ssr";
import { registerApolloClient } from "@apollo/experimental-nextjs-app-support/rsc";
import { cookies } from "next/headers";
// import { createFragmentRegistry } from "@apollo/client/cache";
// import { MapReportPageFragmentStr } from "@/app/reports/[id]/page";
// import { MapReportLayersSummaryFragmentStr } from "@/components/dataConfig";

const getJwt = (): string | undefined => {
  const cookieStore = cookies();
  return cookieStore.get("jwt")?.value;
};

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
 * use the useQuery() hook (see components/apollo-wrapper.tsx).
 */
const makeBackEndClient = () => {
  const httpLink = new HttpLink({
    uri: `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/graphql`,
  });

  const authLink = setContext((_, { headers }) => {
    const token = getJwt();
    const config = {
      headers: {
        ...headers,
        authorization: token ? `JWT ${token}` : "",
      },
    };
    return config;
  });

  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache({
      // fragments: createFragmentRegistry(gql`
      //   ${MapReportPageFragmentStr}
      //   ${MapReportLayersSummaryFragmentStr}
      // `)
    }),
    link: ApolloLink.from([authLink, httpLink]),
  });
};

export const { getClient } = registerApolloClient(() => {
  return makeBackEndClient();
});
