import { useRequireAuth } from "@/hooks/auth";
import { Metadata } from "next";
import { getClient } from "@/services/apollo-client";
import { gql } from "@apollo/client";
import { redirect } from "next/navigation";
import HubPageEditor from "@/components/hub/HubPageEditor";
import { GetEditableHubsQuery, GetEditableHubsQueryVariables, VerifyPageQuery, VerifyPageQueryVariables } from "@/__generated__/graphql";

export default async function Page({ params: { pageId } }: { params: { pageId?: string[] } }) {
  await useRequireAuth();
  const client = getClient();
  const pId = pageId && pageId.length > 0 ? pageId[pageId.length - 1] : null
  if (!pId) {
    return redirect(`/hub/select`);
  } else {
    // Check it exists
    try {
      const pageHub = await client.query<VerifyPageQuery, VerifyPageQueryVariables>({
        query: gql`
          query VerifyPage($pageId: ID!) {
            hubHomepages {
              id
            }
            hubPage(pk: $pageId) {
              id
              hub {
                id
              }
            }
          }
        `,
        variables: {
          pageId: pId
        }
      })

      return (
        <HubPageEditor hubId={pageHub.data.hubPage.hub.id} pageId={pId} />
      )
    } catch (e) {
      return redirect(`/hub/select`);
    }
  }
}

export const metadata: Metadata = {
  title: "Hub manager",
};