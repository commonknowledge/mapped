'use client'

import Link, { LinkProps } from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import * as React from 'react'
import { forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { buttonVariants } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { externalDataSourceOptions } from '@/lib/data'
import { cn } from '@/lib/utils'

import { OrganisationSelector } from './OrganisationSelector'

const crmSync: {
  title: string
  href: string | undefined
  description: string
}[] = [
  ...Object.values(externalDataSourceOptions)
    .filter((d) => !!d.marketingPageHref)
    .map((d) => ({
      title: d.name,
      href: d.marketingPageHref,
      description: d.name,
    })),
  {
    title: "Don't see your CRM?",
    href: 'mailto:hello@commonknowledge.coop',
    description: 'Make a request',
  },
]

interface NavbarProps {
  isLoggedIn: boolean
}

export default function Navbar({ isLoggedIn }: NavbarProps) {
  const pathname = usePathname()

  const [open, setOpen] = React.useState(false)

  return (
    <>
      {isLoggedIn ? (
        <nav className="sticky top-0 shrink-0 flex flex-row justify-start items-stretch gap-md font-IBMPlexSansCondensed text-lg border-b border-meepGray-700 px-sm">
          <Link href="/" className="py-sm">
            <MappedIcon />
          </Link>
          <Link
            className={`link ${pathname === '/reports' ? 'active' : 'flex items-center'}`}
            href="/reports"
          >
            Maps
          </Link>
          <Link
            className={`link ${pathname === '/data-layers' ? 'active' : 'flex items-center'}`}
            href="/data-sources"
          >
            Data Sources
          </Link>
          <Link
            className={`link ${pathname.includes('/hub/editor') ? 'active' : 'flex items-center'}`}
            href="/hub/editor"
          >
            Hub
          </Link>
          <div className="ml-auto flex items-stretch gap-md ">
            <OrganisationSelector />
            <Link
              className={`link ${pathname === '/account' ? 'active' : 'flex items-center'}`}
              href="/account"
            >
              Account
            </Link>
            <div className="flex items-center">
              <Link
                href="/logout"
                className={twMerge('', buttonVariants({ variant: 'brand' }))}
              >
                Logout
              </Link>
            </div>
          </div>
        </nav>
      ) : (
        <nav className="p-sm">
          <ul className="flex flex-row">
            <div className="shrink-0 flex flex-row justify-between items-center bg-meepGray-700 border border-meepGray-600 rounded-lg p-2">
              <div className="flex flex-row items-center gap-xs px-2">
                <Link className="" href="/">
                  <MappedIcon />
                </Link>
                <div className="flex flex-col">
                  <Link href="/">
                    <div className="text-hLg font-PPRightGrotesk">Mapped</div>
                    <p className="text-[9px] tracking-[-0.185px]">
                      <em>by</em> Common Knowledge
                    </p>
                  </Link>
                </div>
              </div>

              <div className="basis-1/2 flex-row items-center justify-center gap-md grow px-3 ml-4 hidden sm:flex">
                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger>Features</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                          <li className="row-span-3">
                            <NavigationMenuLink asChild>
                              <a
                                className="flex h-full w-full select-none flex-col justify-end rounded-md bg-meepGray-700 from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                                href="/"
                              >
                                <div className="mb-2 mt-4 text-hMd font-medium">
                                  ✊ Empowering the movement
                                </div>
                                <p className="text-sm leading-tight text-meepGray-400">
                                  Stay up to date with new ways to empower your
                                  organising.
                                </p>
                              </a>
                            </NavigationMenuLink>
                          </li>
                          <ListItem
                            href="/features/member-maps"
                            title="Member Maps"
                          >
                            Simple but effective geographic mapping of your
                            people
                          </ListItem>
                          <ListItem
                            href="/features/data-enrichment"
                            title="Data Enrichment"
                          >
                            Unlock new insights for your campaign
                          </ListItem>
                          <ListItem
                            href="/features/crm-sync"
                            title="Sync with your CRM"
                          >
                            Sync your membership list seamlessly
                          </ListItem>
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger>Integrate</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                          {crmSync.map((component) => (
                            <ListItem
                              key={component.title}
                              title={component.title}
                              href={component.href}
                            ></ListItem>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <Link href="/about" legacyBehavior passHref>
                        <NavigationMenuLink
                          className={navigationMenuTriggerStyle()}
                        >
                          About
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            </div>
            <div className="flex grow justify-end items-center">
              <li className="hidden sm:block">
                <Link
                  href="/login"
                  className={buttonVariants({ variant: 'brand' })}
                >
                  Login
                </Link>
              </li>
              <div className="sm:hidden">
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger
                    className={buttonVariants({ variant: 'secondary' })}
                  >
                    Menu
                  </SheetTrigger>
                  <SheetContent className="bg-meepGray-800">
                    <SheetHeader>
                      <SheetTitle></SheetTitle>
                      <SheetDescription></SheetDescription>
                    </SheetHeader>
                    <Accordion type="single" collapsible>
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="text-lg p-4 bg-meepGray-700 rounded-md my-2">
                          Features
                        </AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-2">
                          <MobileLink
                            href="/features/member-maps"
                            onOpenChange={setOpen}
                            className="p-4 border border-meepGray-600 rounded-md"
                          >
                            Member Maps
                          </MobileLink>
                          <MobileLink
                            href="/features/data-enrichment"
                            onOpenChange={setOpen}
                            className="p-4 border border-meepGray-600 rounded-md"
                          >
                            Data Enrichment
                          </MobileLink>
                          <MobileLink
                            href="/features/crm-sync"
                            onOpenChange={setOpen}
                            className="p-4 border border-meepGray-600 rounded-md"
                          >
                            CRM Sync
                          </MobileLink>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    <Accordion type="single" collapsible>
                      <AccordionItem value="item-2">
                        <AccordionTrigger className="text-lg p-4 bg-meepGray-700 mb-2 rounded-md">
                          Integrations
                        </AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-2">
                          <ul className="flex flex-col gap-2 ">
                            {crmSync.map((component) => (
                              <MobileLink
                                key={component.title}
                                href={component.href || '#'}
                                onOpenChange={setOpen}
                                className="p-4 border border-meepGray-600 rounded-md"
                              >
                                {component.title}
                              </MobileLink>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    <div className="flex flex-col gap-2">
                      <MobileLink
                        href="/about"
                        onOpenChange={setOpen}
                        className="text-xl flex w-full p-4 bg-meepGray-700 rounded-md"
                      >
                        About
                      </MobileLink>
                      <MobileLink
                        href="/login"
                        onOpenChange={setOpen}
                        className="text-xl flex w-full p-4 bg-brandBlue rounded-md"
                      >
                        Login
                      </MobileLink>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </ul>
        </nav>
      )}
    </>
  )
}

function MappedIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="29"
      height="43"
      viewBox="0 0 29 43"
      fill="none"
    >
      <circle cx="14.7351" cy="14.2833" r="13.9737" fill="#678DE3" />
      <path
        d="M16.3481 39.9C15.6435 41.1625 13.8271 41.1625 13.1226 39.9L2.23064 20.3842C1.54355 19.153 2.43356 17.6371 3.84342 17.6371L25.6273 17.6371C27.0371 17.6371 27.9271 19.1531 27.24 20.3842L16.3481 39.9Z"
        fill="#678DE3"
      />
    </svg>
  )
}

const ListItem = forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'>
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-meepGray-400">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = 'ListItem'

interface MobileLinkProps extends LinkProps {
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

function MobileLink({
  href,
  onOpenChange,
  className,
  children,
  ...props
}: MobileLinkProps) {
  const router = useRouter()
  return (
    <Link
      href={href}
      onClick={() => {
        router.push(href.toString())
        onOpenChange?.(false)
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </Link>
  )
}
