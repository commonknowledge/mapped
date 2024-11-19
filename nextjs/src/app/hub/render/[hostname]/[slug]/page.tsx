import { getClient } from "@/services/apollo-client";
import { Metadata, ResolvingMetadata } from "next";
import { GetPageQuery, GetPageQueryVariables } from "@/__generated__/graphql";
import { GET_PAGE } from "@/app/hub/render/[hostname]/query";
import RenderPuck, { PuckData } from "../RenderPuck";
import { Params } from "@/app/hub/render/[hostname]/params";
import MapPage from "@/components/hub/map/MapPage";

export default async function Page({ params }: { params: Params }) {
  const { hostname, slug } = params
  const client = getClient();
  const page = await client.query<GetPageQuery, GetPageQueryVariables>({
    query: GET_PAGE,
    variables: {
      hostname,
      path: slug
    }
  })
  
  /**
   * For a hub to have multiple maps, and for map config to be self-contained
   */
  if (
    // Legacy — hardcoded map pages
    slug === "map" ||
    // New — map pages with isMap flag
    (page.data.hubPageByPath?.puckJsonContent as PuckData).root.props?.isMap
  ) {
    return (
      <MapPage hostname={hostname} path={slug} page={page.data?.hubPageByPath?.puckJsonContent} isPuckEditing={false} />
    )
  }

  return (
    <RenderPuck hostname={hostname} path={slug} page={page.data?.hubPageByPath?.puckJsonContent} />
  )
}

// nextjs metadata function — page title from GetPageQuery
export async function generateMetadata(
  { params }: {
    params: Params
  },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Fetch the page data
  const client = getClient();
  const page = await client.query<GetPageQuery, GetPageQueryVariables>({
    query: GET_PAGE,
    variables: {
      hostname: params.hostname,
      path: params.slug
    }
  })
 
  return {
    title: page.data.hubPageByPath?.seoTitle || page.data.hubPageByPath?.title || page.data.hubPageByPath?.hub.seoTitle
  }
}