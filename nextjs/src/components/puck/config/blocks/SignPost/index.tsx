import { ComponentConfig } from '@measured/puck'
import Image from 'next/image'
import Link from 'next/link'

import ArrowTopRight from '../../../../../../public/hub/arrow-top-right.svg'
import CirclePattern from '../../../../../../public/hub/main-circle-pattern.svg'
import tccHeart from '../../../../../../public/hub/tcc-heart.svg'
import ukMap from '../../../../../../public/hub/uk-map.svg'
import HubResponsivity from '../../template/HubReponsivity'

export type SignPostProps = {
  resourcesSubtitle: string
  actionsSubtitle: string
  mapSubtitle: string
  resourcesSubtitleURL: string
  actionsSubtitleURL: string
}

export const SignPost: ComponentConfig<SignPostProps> = {
  label: 'SignPost',
  fields: {
    resourcesSubtitle: {
      type: 'text',
    },
    resourcesSubtitleURL: {
      type: 'text',
    },
    actionsSubtitle: {
      type: 'text',
    },
    actionsSubtitleURL: {
      type: 'text',
    },
    mapSubtitle: {
      type: 'text',
    },
  },
  defaultProps: {
    resourcesSubtitle: 'Files, links and More',
    resourcesSubtitleURL: '/resources',
    actionsSubtitle: 'Things you can do today',
    actionsSubtitleURL: '/actions',
    mapSubtitle: 'See what’s happening across the UK',
  },

  render: ({
    resourcesSubtitle,
    resourcesSubtitleURL,
    actionsSubtitle,
    actionsSubtitleURL,
    mapSubtitle,
  }) => {
    return (
      <HubResponsivity>
        <Link
          href={resourcesSubtitleURL}
          className="col-span-1 w-full h-full md:aspect-square aspect-video overflow-clip rounded-[20px] hover:shadow-hover transition-all"
        >
          <div className="p-5 bg-white h-full relative gap-2 flex flex-col justify-end z-20 ">
            <div className="z-10 flex flex-col gap-2">
              <Image src={ArrowTopRight} width={30} alt="arrow" />
              <h2 className="lg:text-hub4xl text-hub3xl">Resources</h2>
              <p className="text-hubH5 ">{actionsSubtitle}</p>
            </div>
            <div className="absolute right-0 top-2 sm:h-1/3 sm:w-1/3 md:1/2 md:1/2">
              <Image
                className="h-full"
                src={tccHeart}
                width={10}
                alt="decorative"
                layout="responsive"
              />
            </div>
          </div>
        </Link>
        <Link
          href={actionsSubtitleURL}
          className=" col-span-1  w-full h-full md:aspect-square aspect-video overflow-clip rounded-[20px] hover:shadow-hover transition-all"
        >
          <div className="p-5 bg-hub-primary-600 text-white h-full relative gap-2 flex flex-col justify-end">
            <div className="z-10 flex flex-col gap-2">
              <Image src={ArrowTopRight} width={30} alt="arrow" />
              <h2 className="lg:text-hub4xl text-hub3xl tracking-tight">
                Actions
              </h2>
              <p className="text-hubH5 text-hub-primary-100">
                {resourcesSubtitle}
              </p>
            </div>

            <Image
              className="object-cover rounded-[40px] absolute top-0 left-0 "
              src={CirclePattern}
              width={500}
              alt="hero image"
            />
          </div>
        </Link>
        <Link
          href="/map"
          className=" md:col-span-2 w-full h-full md:aspect-auto aspect-video overflow-clip rounded-[20px] hover:shadow-hover transition-all"
        >
          <div className="p-5 bg-hub-primary-50 h-full relative gap-2 flex flex-col justify-end">
            <div className="z-10 flex flex-col gap-2">
              <Image src={ArrowTopRight} width={30} alt="arrow" />
              <h2 className="lg:text-hub4xl text-hub3xl tracking-tight">
                Event Map
              </h2>
              <p className="text-hubH5 ">{mapSubtitle}</p>
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
        </Link>
      </HubResponsivity>
    )
  },
}
