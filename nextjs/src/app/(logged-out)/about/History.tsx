import Image from 'next/image'

import MarketingPageHeader from '@/components/marketing/MarkertingPageHeader'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function AboutHistory() {
  let btnLink = '/signup'

  return (
    <div className="flex flex-col items-center">
      <MarketingPageHeader
        heading={
          <>
            Upgrade your{' '}
            <span className="md:text-hXlgPP text-hLgPP font-PPRightGrotesk">
              workflow
            </span>{' '}
            by seamlessly integrating mapped your chosen CRM
          </>
        }
        description="Take your organising to the next level with our free to use tools that enhance your existing membership lists with geographic and political data."
        btnText="Get Started"
        btnLink={btnLink}
      />
      <div className="py-10 -mx-10">
        <div className="relative">
          <Image
            src="/mapping-screenshot.png"
            alt="test"
            width="0"
            height="0"
            sizes="100vw"
            className="w-full h-auto"
          />
          <div className="absolute ml-6 w-[38px] top-[39%] h-[calc(100%-39%)] border-l border-t border-brandBlue">
            <div className="absolute w-3 h-3 -left-1.5 -bottom-1.5 bg-brandBlue rounded-full" />
          </div>
          <div className="absolute ml-6 w-[224px] top-[39%] right-1/4 h-[calc(100%-39%)] border-r border-t border-brandBlue">
            <div className="absolute w-3 h-3 -right-1.5 -bottom-1.5 bg-brandBlue rounded-full" />
          </div>
        </div>
        <div className="flex flex-row gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="mb-3 px-6 pt-6">
                Load in your member data
              </CardTitle>
              <CardDescription className="text-sm text-meepGray-400 px-6 pb-6">
                Upload your spreadsheet/CSV file into the data configuration
                section and see your members appear on the map
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="mb-3 px-6 pt-6">
                Access contact information
              </CardTitle>
              <CardDescription className="text-sm text-meepGray-400 px-6 pb-6">
                Reach out to your members with ease by configuring your member
                list to show contact information.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
        <div className="py-10 mt-20 border-t border-meepGray-700 flex flex-col items-center gap-10">
          <h2 className="text-hLg">Why did we build this?</h2>
          <div className="text-meepGray-300 text-lg space-y-8 flex flex-col items-center">
            <p className="max-w-prose">
              Mapped is built for organisations and organisers trying to do good
              in the UK. We facilitated multiple workshops that we designed for
              a cohort of organisations which included a comprehensive discovery
              process.
            </p>
            <Image
              src="/Team-retreat.jpg"
              alt="test"
              width="0"
              height="0"
              sizes="100vw"
              className="w-full h-auto rounded-sm shadow-lg"
            />

            <p className="max-w-prose">
              During that process, it became apparent that a lot of the CRM’s
              these organisations use have limited mapping tools. Their
              membership lists are mostly seen in a generic list format as you
              would expect from a spreadsheet but the ability to see their
              members in geographic context unlocks so much potential for
              organising.
            </p>
            <p className="max-w-prose">
              Thankfully, we were able to fill in this gap by building this
              feature into Mapped, getting us one step closer to our goal with
              our tool of empowering organisers
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
