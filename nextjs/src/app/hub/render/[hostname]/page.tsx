"use server"

import { getClient } from "@/services/apollo-client";
import { GetPageQuery, GetPageQueryVariables } from "@/__generated__/graphql";
import RenderPuck from "./RenderPuck";
import { redirect } from "next/navigation";
import { GET_PAGE } from "@/app/hub/render/[hostname]/query";
import { Params } from "@/app/hub/render/[hostname]/params";

export default async function Page({ params: { hostname, slug } }: { params: Params }) {
  const client = getClient();
  const page = await client.query<GetPageQuery, GetPageQueryVariables>({
    query: GET_PAGE,
    variables: {
      hostname,
      path: slug
    }
  })

  // const puckJsonContent = page.data?.hubPageByPath?.puckJsonContent

  // // TODO: display 404 in this case
  // if (!puckJsonContent) {
  //   return redirect('/')
  // }

  return (
    <RenderPuck hostname={hostname} path={slug} page={page.data.hubPageByPath?.puckJsonContent} />
  )
}
