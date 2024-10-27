import { useRequireAuth } from "@/hooks/auth";
import { Metadata } from "next";
import { getClient } from "@/services/apollo-client";
import { gql } from "@apollo/client";
import { GetEditableHubListQuery, GetEditableHubListQueryVariables } from "@/__generated__/graphql";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function Page() {
  await useRequireAuth();
  const client = getClient();
  const hubLandingPages = await client.query<GetEditableHubListQuery, GetEditableHubListQueryVariables>({
    query: gql`
      query GetEditableHubList {
        hubHomepages {
          id
          title
          searchDescription
          lastPublishedAt
        }
      }
    `
  })

  return (
    <div className="max-w-7xl space-y-7 w-full">
      <header className="grid grid-rows-2 md:grid-rows-1 md:grid-cols-2 gap-8">
        <div>
          <h1 className="text-hLg mb-7">Public hubs</h1>
          <p className="text-meepGray-400 w-[400px]">
            Host micro-sites on Mapped with maps and other content.
          </p>
        </div>
      </header>
      <div className="border-b border-meepGray-700 pt-10" />
      <section className="w-full grid gap-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {hubLandingPages.data.hubHomepages.slice().sort(
          // Most recently edited
          // @ts-ignore (dates are sortable, I don't care what anyone says!)
          (a, b) => new Date(b.lastPublishedAt) - new Date(a.lastPublishedAt)
        ).map((hub) => (
          <HubCard key={hub.id} hub={hub} />
        ))}
      </section>
    </div>
  )
}

export function HubCard ({ hub }: { hub: GetEditableHubListQuery['hubHomepages'][0] }) {
  return (
    <Link href={`/hub/editor/${hub.id}`}>
      <Card>
        <CardHeader>
          <CardTitle className="mb-1 px-5 pt-4">
            {hub.title}
          </CardTitle>
          <CardDescription className="text-sm text-meepGray-400 px-5 pb-5">
            {hub.searchDescription}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}

export const metadata: Metadata = {
  title: "Hub manager",
};