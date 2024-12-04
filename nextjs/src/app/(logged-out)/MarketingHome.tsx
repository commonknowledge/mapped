import Image from 'next/image'
import Link from 'next/link'

import AboutCTA from '@/components/marketing/AboutCTA'
import GetStarted from '@/components/marketing/GetStarted'
import IntegtationsCTA from '@/components/marketing/IntegrationCTA'
import ProductFeaturesList from '@/components/marketing/ProductFeaturesList'
import { Button } from '@/components/ui/button'
import GetStartedNew from '@/components/marketing/GetStartedNew'

export default function MarketingHome() {
  return (
    <div className="flex flex-col gap-20">
      <div className="display md:grid md:grid-cols-2 gap-5">
        <div className="col-span-1 flex items-center ">
          <Image
            className=""
            src={'/mapped-homepage-screenshot.png'}
            alt="Mapped report view screenshot"
            width={800}
            height={700}
            priority={true}
          />
        </div>
        <div className="col-span-1 p-10 ">
          <h1 className="md:text-hXlg text-hLg font-light font-IBMPlexSansLight w-full max-w-[915px] mb-6 ">
            <span className="font-PPRightGrotesk md:text-[6.8rem] text-hLgPP">
              Empowering organisers and activists ✊
            </span>
            <p className="text-meepGray-300 text-5xl tracking-tight">
              with mapping tools and data enrichment
            </p>
          </h1>
          <p className="text-lg text-meepGray-300 max-w-prose mb-9">
            Take your organising to the next level with our free to use tools
            that enhance your existing membership lists with geographic and
            political data.{' '}
          </p>
          <Link href="/signup">
            <Button variant="brand" size="lg" className="text-xl">
              Get started
            </Button>
          </Link>
        </div>

      </div>
      <ProductFeaturesList />
      <GetStartedNew />
      <IntegtationsCTA />
      <AboutCTA />
    </div>
  )
}
