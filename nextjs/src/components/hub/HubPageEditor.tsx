"use client"

import { gql, useApolloClient, useQuery } from "@apollo/client";
import { Fragment, ReactNode, useMemo, useRef, useState } from "react";
import { Data, Puck, Button as PuckButton, ActionBar, usePuck, PuckAction } from "@measured/puck";
import "@measured/puck/puck.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link";
import { Breadcrumb, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { LoadingIcon } from "@/components/ui/loadingIcon";
import { Button } from "@/components/ui/button";
import { CreateChildPageMutation, CreateChildPageMutationVariables, GetHubPagesQuery, GetHubPagesQueryVariables, GetPageEditorDataQuery, GetPageEditorDataQueryVariables } from "@/__generated__/graphql";
import { toastPromise } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { ChevronDownIcon, Slash } from "lucide-react";
import { getMapPagePuckConfigForHostname, getPuckConfigForHostname } from "@/data/puck/ui";
import { HubRenderContextProvider } from "@/components/hub/HubRenderContext";
import { PuckData } from "@/app/hub/render/[hostname]/RenderPuck";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { atom, useAtom } from "jotai";
import { MapLayerEditor } from "./map/MapLayerEditor";
import { AnyARecord } from "dns";

const hubPageEditorTabAtom = atom<'intro' | 'map'>('map')

export default function HubPageEditor({ hubId, pageId }: { hubId: string, pageId: string }) {
  const router = useRouter()
  const client = useApolloClient()
  const hubData = useQuery<GetHubPagesQuery, GetHubPagesQueryVariables>(GET_HUB_PAGES, {
    variables: {
      hubId
    }
  })
  const pageData = useQuery<GetPageEditorDataQuery, GetPageEditorDataQueryVariables>(GET_PAGE_EDITOR_DATA, {
    variables: {
      pageId
    }
  })

  const isMap = (pageData.data?.hubPage.puckJsonContent as PuckData).root.props?.isMap

  const [tab, setTab] = useAtom(hubPageEditorTabAtom)

  const config = useMemo(() => {
    if (hubData.data?.hubHomepage.hostname) {
      if ((pageData.data?.hubPage.puckJsonContent as PuckData).root.props?.isMap) {
        return getMapPagePuckConfigForHostname(hubData.data?.hubHomepage.hostname)
      }
      return getPuckConfigForHostname(hubData.data?.hubHomepage.hostname)
    }
  }, [pageData.data, hubData.data?.hubHomepage.hostname])

  // unique b64 key that updates each time we add / remove components
  const dbDataKey = useMemo(() => {
    if (!pageData?.data?.hubPage?.puckJsonContent) return null
    return Buffer.from(
      `${JSON.stringify(pageData.data.hubPage.puckJsonContent)}`
    ).toString("base64");
  }, [pageData]);

  if (!hubData.data || !pageData?.data?.hubPage?.puckJsonContent || !config) {
    return (
      <div className="text-center py-16 w-full flex flex-row justify-center items-center">
        <LoadingIcon className='mx-auto inline-block' />
      </div>
    )
  }

  const puckJsonContent = { ...pageData.data.hubPage.puckJsonContent }
  if (!puckJsonContent.root) {
    puckJsonContent.root = {}
  }
  if (!puckJsonContent.content) {
    puckJsonContent.content = []
  }

  // const tabs = (
  //   // Tabs
  //   <div>
  //     <Tabs className="w-[400px]" value={tab} onValueChange={t => setTab(t as any)}>
  //       <TabsList>
  //         <TabsTrigger value="map">Intro</TabsTrigger>
  //         <TabsTrigger value="layers">Map layers</TabsTrigger>
  //       </TabsList>
  //       {/* <TabsContent value="account">Make changes to your account here.</TabsContent>
  //       <TabsContent value="password">Change your password here.</TabsContent> */}
  //     </Tabs>
  //   </div>
  // )

  return (
    <HubRenderContextProvider hostname={hubData.data.hubHomepage.hostname} path={pageData.data.hubPage.path} page={puckJsonContent}>
      <Puck
        // To force refresh data after deferred initialisation
        key={dbDataKey}
        config={config}
        iframe={{
          // 31 Oct 2024: This seems to fix the mapbox preview (not sure why), but spills the hub CSS out into the editor. 
          enabled: !isMap || (isMap && tab !== "map")
        }}
        data={puckJsonContent}
        onPublish={publish}
      >
        <div className='grid grid-cols-12' style={{
          gridTemplateRows: "min-content 1fr"
        }}>
          <header className="col-span-12">
            <EditorHeader onPublish={publish} />
          </header>
          <div className='col-span-3 overflow-auto pl-4 pr-4 py-4'>
            <Puck.Components />
            <Puck.Outline />
          </div>
          <div className='col-span-6 [&_#preview-frame]:flex'>
            <Puck.Preview />
          </div>
          <div className='col-span-3 overflow-auto py-2'>
            <Puck.Fields />
          </div>
        </div>
      </Puck>
    </HubRenderContextProvider>
  )

  function EditorHeader ({
    onPublish
  }: {
    onPublish: (d: Data) => void
  }) {
    const puck = usePuck()

    return (
      <header className='p-4 w-full col-span-3 text-black' style={{
        background: 'var(--puck-color-white)',
        borderBottom: '1px solid var(--puck-color-grey-09)'
      }}>
        <div className='flex flex-row gap-4 justify-between '>
          <Dialog>
            <DialogTrigger>
              <div className='border border-gray-200 font-bold hover:bg-meepGray-100 rounded-md p-2 flex flex-row gap-2 items-center'>
                <BreadcrumbList className='text-lg'>
                  {pageData.data?.hubPage?.ancestors.filter(
                    // wagtail root
                    ancestor => ancestor.path !== "0001"
                  ).map((ancestor, i, a) => (
                    <Fragment key={ancestor.id}>
                      <Breadcrumb>
                        {ancestor.modelName === "HubHomepage" ? "Home Page" : ancestor.title}
                      </Breadcrumb>
                      {i < a.length - 1 && (
                        <BreadcrumbSeparator>
                          <Slash />
                        </BreadcrumbSeparator>
                      )}
                    </Fragment>
                  ))}
                </BreadcrumbList>
                <ChevronDownIcon />
              </div>
            </DialogTrigger>
            <DialogContent className="block max-w-full w-[80vw] h-[80vh] overflow-hidden">
              <DialogHeader className='mb-5'>
                <DialogTitle>Select a page to edit</DialogTitle>
              </DialogHeader>
              <div className='overflow-y-auto divide-y'>
                {hubData.data?.hubHomepage?.descendants.map(page => {
                  const ancestors = page.ancestors.filter(
                    // wagtail root
                    ancestor => ancestor.path !== "0001"
                  )

                  const isHomePage = page.modelName === "HubHomepage"
                  const isTopLevelPage = ancestors.length === 1

                  return (
                    <div key={page.id} className="w-full items-start py-4 space-y-2">
                      <BreadcrumbList>
                        {ancestors.map((ancestor, i, a) => (
                          <Fragment key={ancestor.id}>
                            <Breadcrumb>
                              <Link href={`/hub/editor/${ancestor.id}`}>
                                {ancestor.modelName === "HubHomepage" ? "Home Page" : ancestor.title}</Link>
                            </Breadcrumb>
                            {i < a.length - 1 && (
                              <BreadcrumbSeparator>
                                <Slash />
                              </BreadcrumbSeparator>
                            )}
                          </Fragment>
                        ))}
                      </BreadcrumbList>
                      <div className='flex flex-row gap-3 justify-between'>
                        {isTopLevelPage && (
                          // Due to limitations with NextJS routing,
                          // we don't currently support multi-level nesting
                          <Button size='sm' variant='outline' onClick={() => addChildPage(page.id, `Page created at ${(new Date().toISOString())}`)}>Add child page</Button>
                        )}
                        {/* TODO: add "are you sure checker" */}
                        {!isHomePage && (
                          <Button size='sm' variant="destructive" onClick={() => deletePage(page.id)}>Delete</Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </DialogContent>
          </Dialog>

          <div className='flex flex-row gap-4 items-center justify-center'>
            {!!pageData.data?.hubPage.liveUrl && (
              <>
                <Link target="_blank" href={pageData.data?.hubPage.liveUrl}>
                  <PuckButton variant="secondary">
                    Visit page
                  </PuckButton>
                </Link>
                <Link target="_blank" href={`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/cms/pages/${pageData.data?.hubPage.id}/history`}>
                  <PuckButton variant="secondary">
                    Version history
                  </PuckButton>
                </Link></>
            )}
            <PuckButton onClick={() => void onPublish(puck.appState.data)}>
              Save
            </PuckButton>
          </div>
        </div>
        {isMap && (
          <Tabs />
        )}
      </header>
    )
  }

  function publish(data: Data) {
    const p = client.mutate({
      mutation: gql`
        mutation PublishPage($pageId: String!, $input: HubPageInput!) {
          updatePage(pageId: $pageId, input: $input) {
            id
            # Refresh cache
            title
            slug
            puckJsonContent
          }
        }
      `,
      variables: {
        pageId,
        input: {
          puckJsonContent: data
        }
      },
      refetchQueries: [
        "GetHubHomepageJson"
      ]
    })

    toastPromise(p, {
      success: "Page changes published",
      loading: "Publish page changes...",
      error: "Failed to publish page changes"
    })
  }

  async function addChildPage(parentId: string, title: string) {
    const p = client.mutate<CreateChildPageMutation, CreateChildPageMutationVariables>({
      mutation: gql`
        mutation CreateChildPage($parentId: String!, $title: String!) {
          createChildPage(parentId: $parentId, title: $title) {
            id
          }
        }
      `,
      variables: {
        parentId,
        title
      },
      refetchQueries: [
        "GetHubPages"
      ]
    })

    const t = await toastPromise(p, {
      success: "Page created",
      loading: "Creating page...",
      error: "Failed to create page"
    })
    const id = t.data?.createChildPage.id
    if (id) {
      router.push(`/hub/editor/${id}`)
    }
  }

  async function deletePage(deletePageId: string) {
    const newPageId = deletePageId === pageId ? hubId : pageId
    const p = client.mutate({
      mutation: gql`
        mutation DeletePage($pageId: String!) {
          deletePage(pageId: $pageId)
        }
      `,
      variables: {
        pageId: deletePageId
      },
      refetchQueries: [
        "GetHubPages"
      ]
    })
    await toastPromise(p, {
      success: "Page deleted",
      loading: "Deleting page...",
      error: "Failed to delete page"
    })
    if (pageId !== newPageId) {
      router.push(`/hub/editor/${newPageId}`)
    }
  }
}

const GET_HUB_PAGES = gql`
  query GetHubPages($hubId: ID!) {
    hubHomepage(pk: $hubId) {
      hostname
      descendants(inclusive: true) {
        id
        title
        path
        slug
        modelName
        ancestors(inclusive: true) {
          id
          title
          path
          slug
          modelName
        }
      }
    }
  }
`

const GET_PAGE_EDITOR_DATA = gql`
  query GetPageEditorData($pageId: ID!) {
    hubPage(pk: $pageId) {
      id
      title
      path
      slug
      puckJsonContent
      modelName
      liveUrl
      # For breadcrumbs
      ancestors(inclusive: true) {
        id
        title
        path
        slug
        modelName
      }
    }
  }
`