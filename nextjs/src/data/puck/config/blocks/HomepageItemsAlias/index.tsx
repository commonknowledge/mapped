import React, { useEffect, useMemo, useState } from "react";

import { ComponentConfig } from "@measured/puck";
import { PuckData } from '@/app/hub/render/[hostname]/RenderPuck';
import { FilterableGridProps, FilterableGridRenderer } from "../FilterableGrid";
import { gql, useQuery } from "@apollo/client";
import { LoadingIcon } from "@/components/ui/loadingIcon";
import { GetHubHomepageJsonQuery, GetHubHomepageJsonQueryVariables } from "@/__generated__/graphql";
import { useHubRenderContext } from "@/components/hub/HubRenderContext";

// TODO:
export type HomepageItemsAliasProps = {}

export const HomepageItemsAlias: ComponentConfig<HomepageItemsAliasProps> = {
    label: "Homepage Items Alias",
    fields: {
        text: {
            type: "text",
        }
    },
    render: (props) => {
        return <HomepageItemsAliasRenderer />
    },
};

const HomepageItemsAliasRenderer = () => {
    const hubContext = useHubRenderContext()

    const data = useQuery<GetHubHomepageJsonQuery, GetHubHomepageJsonQueryVariables>(GET_HUB_HOMEPAGE_JSON, {
        variables: {
            hostname: hubContext.hostname
        },
        skip: !hubContext.hostname
    })

    const puckData = data.data?.hubPageByPath?.puckJsonContent as PuckData<FilterableGridProps>
    const gridProps = puckData?.content?.find((item: any) => (
        // @ts-ignore — Puck types aren't good here.
        item.type === "FilterableGrid"
    ))?.props

    if (!data.data) return <LoadingIcon />

    if (!gridProps) return <div>Something went wrong.</div>

    return (
        <FilterableGridRenderer {...gridProps} showAll={false} />
    )
}

const GET_HUB_HOMEPAGE_JSON = gql`
    query GetHubHomepageJson($hostname: String!) {
        hubPageByPath(hostname: $hostname) {
            puckJsonContent
        }
    }
`