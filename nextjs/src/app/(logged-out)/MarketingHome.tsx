import Image from 'next/image'
import Link from 'next/link'

import AboutCTA from '@/components/marketing/AboutCTA'
import GetStarted from '@/components/marketing/GetStarted'
import IntegtationsCTA from '@/components/marketing/IntegrationCTA'
import ProductFeaturesList from '@/components/marketing/ProductFeaturesList'
import { buttonVariants } from '@/components/ui/button'

export default function MarketingHome() {
  return (
    <div className="flex flex-col gap-4">
      <div className="display md:grid md:grid-cols-3 gap-5">
        <div className="col-span-2 pb-10">
          <h1 className="md:text-hXlg text-hLg font-light font-IBMPlexSansLight w-full max-w-[915px] mb-6 ">
            Empowering{' '}
            <span className="font-PPRightGrotesk md:text-hXlgPP text-hLgPP">
              organisers
            </span>{' '}
            and{' '}
            <span className="md:text-hXlgPP text-hLgPP font-PPRightGrotesk">
              activists
            </span>{' '}
            with mapping tools and data enrichment ✊
          </h1>
          <p className="text-base max-w-prose mb-9">
            Take your organising to the next level with our free to use tools
            that enhance your existing membership lists with geographic and
            political data.{' '}
          </p>
          <Link href="/signup" className={buttonVariants({ variant: 'brand' })}>
            Get started
          </Link>
        </div>
        <Image
          className="hidden md:block absolute -top-20 right-0 -z-10 w-auto"
          src={'/hero-bg.svg'}
          alt="constiteuncy map"
          width={800}
          height={700}
          priority={true}
        />
      </div>
      <ProductFeaturesList />
      <GetStarted />
      <IntegtationsCTA />
      <AboutCTA />
    </div>
  )
}
