'use client'

import { useQuery } from '@apollo/client'
import { DefaultRootProps } from '@measured/puck'
import { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'
import { getColors } from 'theme-colors'

import {
  GetPageQuery,
  GetPageQueryVariables,
  HubNavLink,
} from '@/__generated__/graphql'
import { GET_PAGE } from '@/app/hub/render/[hostname]/query'
import { useHubRenderContext } from '@/components/hub/HubRenderContext'

import HubFooter from './template/HubFooter'
import HubNavbar from './template/HubNavbar'

export type RootProps = {
  children?: ReactNode
  title?: string
  fullScreen?: boolean
  navLinks?: HubNavLink[]
  renderCSS?: boolean
} & DefaultRootProps

export default function Root({
  children,
  editMode,
  navLinks = [],
  fullScreen = false,
  renderCSS = true,
}: RootProps) {
  const hub = useHubRenderContext()
  const hostname = hub.hostname
  const pageQuery = useQuery<GetPageQuery, GetPageQueryVariables>(GET_PAGE, {
    variables: {
      hostname,
    },
    skip: !!navLinks?.length || typeof window === 'undefined',
  })

  let links = navLinks.length
    ? navLinks
    : pageQuery.data?.hubPageByPath?.hub.navLinks || []

  if (hub.isPeopleClimateNature) {
    return (
      <>
        {renderCSS && (
          <RootCSS
            primaryColour={
              pageQuery.data?.hubPageByPath?.hub.primaryColour ||
              hub.hubData?.primaryColour ||
              '#0f8c6c'
            }
            secondaryColour={
              pageQuery.data?.hubPageByPath?.hub.secondaryColour ||
              hub.hubData?.secondaryColour ||
              '#0f8c6c'
            }
            customCss={hub.hubData?.customCss || ''}
          />
        )}
        <main
          className={twMerge(
            'font-publicSans text-hub-primary-800 min-w-screen h-full w-full mx-auto relative overflow-clip',
            fullScreen
              ? 'h-dvh flex flex-col px-2 md:px-4'
              : 'max-w-screen-xl min-h-[dv100] px-2 md:px-4 lg:px-6 xl:px-8'
          )}
        >
          <header className="sticky top-0 z-50 ">
            <HubNavbar navLinks={links} />
          </header>
          <div
            className={twMerge(
              'rounded-t-2xl md:rounded-2xl',
              fullScreen && 'h-full flex-grow mb-2 md:mb-4 overflow-hidden'
            )}
          >
            {children}
          </div>
          {!fullScreen && <HubFooter />}
        </main>
      </>
    )
  } else {
    return (
      <>
        {renderCSS && (
          <RootCSS
            primaryColour={
              pageQuery.data?.hubPageByPath?.hub.primaryColour ||
              hub.hubData?.primaryColour ||
              '#0f8c6c'
            }
            secondaryColour={
              pageQuery.data?.hubPageByPath?.hub.secondaryColour ||
              hub.hubData?.secondaryColour ||
              '#0f8c6c'
            }
            customCss={hub.hubData?.customCss || ''}
          />
        )}
        <main
          className={twMerge(
            'min-w-screen h-full w-full mx-auto relative overflow-clip',
            fullScreen ? 'h-dvh flex flex-col' : 'min-h-[dv100]'
          )}
        >
          <div
            className={twMerge(
              fullScreen && 'h-full flex-grow overflow-hidden'
            )}
          >
            {children}
          </div>
          {!fullScreen && <HubFooter />}
        </main>
      </>
    )
  }
}

export function RootCSS({
  primaryColour,
  secondaryColour,
  customCss,
}: {
  primaryColour: string
  secondaryColour: string
  customCss: string
}) {
  const primaryColours = getColors(primaryColour || '#555555')
  const secondaryColours = getColors(secondaryColour || '#555555')

  return (
    <>
      <style key="generated-colors">
        {`
          :root {
            ${Object.entries(primaryColours)
              .map(([key, value]) => `--primary-${key}: ${value};`)
              .join('\n')}
            ${Object.entries(secondaryColours)
              .map(([key, value]) => `--secondary-${key}: ${value};`)
              .join('\n')}
          }
        `}
      </style>
      <style key="hardcodedCss">
        {`
          html, body {
            background: var(--background, #f2f2f2);
            color: hsl(var(--text));
          }
        `}
      </style>
      <style key="customCss">{customCss || ''}</style>
    </>
  )
}
