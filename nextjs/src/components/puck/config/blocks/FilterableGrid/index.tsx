import { ComponentConfig } from '@measured/puck'
import { ErrorBoundary } from '@sentry/nextjs'
import { Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { parseAsStringEnum, useQueryState } from 'nuqs'
import pluralize from 'pluralize'
import { useEffect, useMemo, useState } from 'react'
import slugify from 'slug'
import { twMerge } from 'tailwind-merge'

import hubGridIllustration4 from '@public/hub/illystrations/Group 14.svg'
import hubGridIllustration5 from '@public/hub/illystrations/Group 15.svg'
import hubGridIllustration3 from '@public/hub/illystrations/Group 16.svg'
import hubGridIllustration1 from '@public/hub/illystrations/Layer_1.svg'
import dragonflyIlly from '@public/hub/illystrations/Layer_5.svg'
import tccHeart from '@public/hub/tcc-heart-2.svg'
import ukMap from '@public/hub/uk-map.svg'

import { Input } from '@/components/ui/input'

import { PuckText } from '../../components/PuckText'
import { RenderCard } from '../Card'
import { itemTypes } from './cardTypes'

export const eventMonths = [
  { label: 'January', value: 'Jan' },
  { label: 'February', value: 'Feb' },
  { label: 'March', value: 'Mar' },
  { label: 'April', value: 'Apr' },
  { label: 'May', value: 'May' },
  { label: 'June', value: 'Jun' },
  { label: 'July', value: 'Jul' },
  { label: 'August', value: 'Aug' },
  { label: 'September', value: 'Sep' },
  { label: 'October', value: 'Oct' },
  { label: 'November', value: 'Nov' },
  { label: 'December', value: 'Dec' },
] as const

// TODO:
export type FilterableGridProps = {
  categories: Array<{
    title: string
    urlSlug: string
    description: string
  }>
  items: Array<{
    categories: Array<{
      category: string
    }>
    type: (typeof itemTypes)[number]['value']
    behaviour: string
    title: string
    description: string
    dialogDescription: string
    link: string
    linkLabel: string
    timestamp: number
    eventMonth: string
    eventDay: string
  }>
}

export const FilterableGrid: ComponentConfig<FilterableGridProps> = {
  label: 'FilterableGrid',
  resolveFields: (data, puck) => {
    return {
      categories: {
        type: 'array',
        arrayFields: {
          title: {
            type: 'text',
          },
          urlSlug: {
            type: 'text',
          },
          description: {
            type: 'textarea',
          },
        },
        getItemSummary(item, index) {
          return item.title || `Item ${index}`
        },
      },
      items: {
        type: 'array',
        arrayFields: {
          categories: {
            type: 'array',
            arrayFields: {
              category: {
                type: 'select',
                options: data.props.categories?.map((category: any) => ({
                  label: category.title,
                  value: category.urlSlug,
                })),
              },
            },
            getItemSummary(item, index) {
              return `Filed under ${item.category}`
            },
          },
          type: {
            type: 'select',
            options: itemTypes,
          },
          behaviour: {
            type: 'select',
            options: [
              { label: 'Dialog', value: 'dialog' },
              { label: 'No action', value: 'nothing' },
            ],
          },
          title: {
            type: 'text',
          },
          description: {
            type: 'textarea',
          },
          dialogDescription: {
            // @ts-ignore
            // visible: data.props.behaviour === "dialog",
            type: 'textarea',
          },
          link: {
            // @ts-ignore
            // visible: data.props.behaviour !== "nothing",
            type: 'text',
          },
          linkLabel: {
            type: 'text',
          },
          timestamp: {
            type: 'number',
          },
          eventMonth: {
            type: 'select',
            options: eventMonths,
          },
          eventDay: {
            type: 'text',
          },
          eventTime: {
            type: 'text',
          },
          eventLocation: {
            type: 'text',
          },
          imageUrl: {
            type: 'text',
          },
        },
        defaultItemProps: {
          categories: [],
          type: 'resource',
          behaviour: 'dialog',
          title: '',
          description: '',
          dialogDescription: '',
          link: '',
          linkLabel: '',
          timestamp: Date.now(),
          eventMonth: '',
          eventDay: '',
          eventTime: '',
          eventLocation: '',
          imageUrl: '',
        },
        getItemSummary(item, index) {
          return item.title || `Item ${index}`
        },
      },
    }
  },
  resolveData: (data, puck) => {
    return {
      ...data,
      props: {
        ...data.props,
        categories: data.props.categories?.map((category: any) => ({
          ...category,
          urlSlug: !!category?.urlSlug
            ? slugify(category.urlSlug)
            : category?.urlSlug,
        })),
      },
    }
  },
  defaultProps: {
    categories: [],
    items: [],
  },
  render: (props) => {
    return <FilterableGridRenderer {...props} />
  },
}

function withIllys(_arr: any[]) {
  const arr = [..._arr]
  if (arr.length >= 4) {
    arr.splice(3, 0, {
      // @ts-ignore
      type: 'illustration',
      src: hubGridIllustration4,
    })
  }
  if (arr.length >= 13) {
    arr.splice(10, 0, {
      // @ts-ignore
      type: 'illustration',
      src: hubGridIllustration3,
    })
  }
  if (arr.length >= 15) {
    arr.splice(14, 0, {
      // @ts-ignore
      type: 'illustration',
      src: hubGridIllustration5,
    })
  }
  return arr
}

export const FilterableGridRenderer = ({
  categories,
  items,
  showAll,
}: FilterableGridProps & {
  showAll?: boolean
}) => {
  const router = useRouter()
  const [tag, setTag] = useQueryState(
    'tag',
    parseAsStringEnum(itemTypes.map((t) => t.value))
  )
  const [category, setCategory] = useQueryState(
    'category',
    parseAsStringEnum(categories?.map((c) => c.urlSlug))
  )

  // Listen for router changes, then produce new items
  const categoryItems = useMemo(() => {
    if (!items) return []
    return items?.filter(
      (item) =>
        !category || item.categories?.some((c) => c.category === category)
    )
  }, [items, category])

  const filteredItems = useMemo(() => {
    if (!items) return []
    if (!tag && !category) {
      return withIllys(items)
    }
    const filtered = items?.filter(
      (item) =>
        (!tag || tag === item.type) &&
        (!category || item.categories?.some((c) => c.category === category))
    )
    return withIllys(filtered)
  }, [items, tag, category])

  const categoryData = categories?.find((c) => c.urlSlug === category)

  // Scroll items into full
  useEffect(() => {
    if (category) {
      document.getElementById('latest')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [category])

  return (
    // <div
    //     className={`
    //         [&[data-rfd-droppable-id~="filterable-grid-cells"]]:bg-red-100
    //         [&[data-rfd-droppable-id~="FilterableGrid-321fac77-691b-49d4-8c90-2aaf16492217:filterable-grid-cells"]]:lg:grid-cols-4
    //         [&[data-rfd-droppable-id~="FilterableGrid-321fac77-691b-49d4-8c90-2aaf16492217:filterable-grid-cells"]]:sm:grid-cols-2
    //         [&[data-rfd-droppable-id~="FilterableGrid-321fac77-691b-49d4-8c90-2aaf16492217:filterable-grid-cells"]]:grid-cols-1
    //         [&[data-rfd-droppable-id~="FilterableGrid-321fac77-691b-49d4-8c90-2aaf16492217:filterable-grid-cells"]]:gap-[25px]
    //         [&[data-rfd-droppable-id~="FilterableGrid-321fac77-691b-49d4-8c90-2aaf16492217:filterable-grid-cells"]]:grid-rows-[var(--gridTemplateRows)]
    //     `}
    //     style={{
    //         // @ts-ignore
    //         "--gridTemplateRows": rows
    //     }}
    // >
    //     <DropZone zone={`filterable-grid-cells`} />
    // </div>
    <div>
      {/* Categories */}
      {!categoryData && (
        <section id="get-involved relative z-[2]">
          <header className="space-y-2 pt-16 mb-10 md:pt-32 md:mb-14 relative">
            <Image
              src={dragonflyIlly}
              alt="illustration"
              style={{
                position: 'absolute',
                right: -50,
                bottom: -60,
                zIndex: 1,
              }}
            />
            <h2 className="relative z-[2] text-hub4xl md:text-hub6xl">
              Ways to get involved
            </h2>
            <p className="relative z-[2] text-hub-primary-neutral text-hub2xl">
              Here{"'"}s how you can help centre people, climate and nature in
              your local area.
            </p>
          </header>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 lg:gap-4 xl:gap-5">
            <div className="relative">
              <PostcodeSearch className="sticky top-24" />
            </div>
            <div className="lg:col-span-2 grid lg:grid-cols-2 gap-2 md:gap-3 lg:gap-4 xl:gap-5">
              {categories?.map((category, index) => (
                <div
                  key={index}
                  className="rounded-[20px] hover:bg-hub-primary-100 transition-all cursor-pointer p-4 space-y-1"
                  onClick={() => {
                    setCategory(category.urlSlug)
                    document
                      .getElementById('latest')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  <Image
                    src={tccHeart}
                    width={20}
                    height={20}
                    alt="arrow"
                    className="mb-5"
                  />
                  <h2 className="text-hub-primary-600 text-hub2xl tracking-tight">
                    {category.title}
                  </h2>
                  <PuckText
                    className="text-hub-primary-neutral"
                    text={category.description}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* Grid */}
      {!!(categoryData || showAll !== false) ? (
        <section id="latest">
          {!categoryData ? (
            <header className="space-y-2 pt-16 mb-10 md:pt-32 md:mb-14 relative">
              <Image
                src={hubGridIllustration1}
                alt="illustration"
                style={{
                  position: 'absolute',
                  right: -50,
                  bottom: -80,
                  zIndex: 1,
                  maxHeight: 275,
                }}
              />
              <h2 className="relative z-[2] text-hub4xl md:text-hub6xl">
                Latest from across the campaign
              </h2>
              <p className="relative z-[2] text-hub-primary-neutral text-hub2xl">
                Explore our wall of activity from the hub
              </p>
            </header>
          ) : (
            <header className="space-y-2 pt-16 mb-10 md:pt-32 md:mb-14">
              <div
                onClick={() => {
                  setCategory(null)
                  setTimeout(() => {
                    document
                      .getElementById('get-involved')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }, 500)
                }}
                className="cursor-pointer hover:text-hub-primary-600"
              >
                &larr; Back to Ways To Get Involved
              </div>
              <h2 className="text-hub4xl md:text-hub6xl">
                {categoryData.title}
              </h2>
              <PuckText
                className="text-hub-primary-neutral text-hub2xl"
                text={categoryData.description}
              />
            </header>
          )}
          <div className="flex flex-row gap-4 items-center sticky top-[75px] z-20 bg-hub-background py-3 border-b border-meepGray-200 mb-4">
            <div className="text-meepGray-400 uppercase">
              Filter Hub Content:
            </div>
            <button
              onClick={() => {
                // Toggle tag based on click
                setTag((t) => null)
              }}
              className={twMerge(
                'rounded-full px-4 py-1 cursor-pointer uppercase text-sm font-light',
                !tag
                  ? 'bg-hub-primary-300 text-hub-primary-600'
                  : 'bg-hub-primary-100 text-hub-primary-600'
              )}
            >
              all
            </button>
            {itemTypes
              .filter((t) => {
                // items exist for this tag
                return categoryItems?.some((i) => i.type === t.value)
              })
              .map((itemType, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // Toggle tag based on click
                    setTag((t) =>
                      t === itemType.value ? null : itemType.value
                    )
                  }}
                  className={twMerge(
                    'rounded-full px-3 py-1 cursor-pointer uppercase text-sm font-light',
                    tag === itemType.value
                      ? 'bg-hub-primary-300 text-hub-primary-600'
                      : 'bg-hub-primary-100 text-hub-primary-600'
                  )}
                >
                  {pluralize(itemType.label)}
                </button>
              ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 lg:gap-4 xl:gap-5 mb-8 md:mb-16 lg:mb-20">
            {filteredItems
              // TODO:
              // ?.sort((a, b) => compareAsc(a.timestamp, b.timestamp))
              .map((item, index) => (
                <ErrorBoundary key={index}>
                  <RenderCard key={index} {...item} />
                </ErrorBoundary>
              ))}
          </div>
        </section>
      ) : (
        <div className="py-8" />
      )}
    </div>
  )
}

function PostcodeSearch({ className }: { className?: string }) {
  const router = useRouter()
  const [postcode, setPostcode] = useState('')
  return (
    <article
      className={twMerge(
        'overflow-clip rounded-[20px] hover:shadow-hover transition-all',
        className
      )}
    >
      <div className="p-5 bg-hub-primary-50 pt-60 relative gap-2 flex flex-col justify-end">
        <div className="z-10 flex flex-col gap-2">
          {/* <Image src={ArrowTopRight} width={30} alt="arrow" /> */}
          <h2 className="lg:text-hub4xl text-hub3xl tracking-tight">Near me</h2>
          <p className="text-hubH5 ">
            Find out what’s happening in your local constituency
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              router.push(`/map?postcode=${postcode}`)
            }}
          >
            <div className=" flex items-center relative text-hub-primary-600">
              <Search className="absolute ml-2" />
              <Input
                placeholder="postcode"
                autoComplete="postal-code"
                className=" border-hub-foreground p-8 focus-visible:ring-0 text-2xl placeholder:text-hub4xl pl-10 placeholder:text-hub-primary-600 bg-hub-primary-100 border-0"
                value={postcode}
                onChange={(e) =>
                  setPostcode(
                    e.target.value.toUpperCase().trim().replaceAll(' ', '')
                  )
                }
              />
              <button
                className="bg-hub-primary-600 text-white text-lg font-bold rounded-md p-4 ml-2"
                disabled={!postcode}
              >
                Search
              </button>
            </div>
          </form>
          <p className="text-hub-primary-600 text-sm">
            Powered using{' '}
            <Link
              href="https://prototype.mapped.commonknowledge.coop"
              className="underline"
            >
              Mapped
            </Link>{' '}
            by Common Knowledge
          </p>
        </div>
        <div className="absolute right-10 top-0 ">
          <Image
            className="h-full"
            src={ukMap}
            width={10}
            alt="map of the uk"
            layout="responsive"
          />
        </div>
      </div>
    </article>
  )
}
