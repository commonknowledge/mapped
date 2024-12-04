import Image from 'next/image'

import GetStarted from '@/components/marketing/GetStarted'
import MarketingPageHeader from '@/components/marketing/MarkertingPageHeader'
import TemplateTextBlock from '@/components/marketing/TemplateTextBlock'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { externalDataSourceOptions } from '@/lib/data'

import { MappedLogo } from '../logos/MappedLogo'

interface IntegrationsCRMOptionProps {
  crmPlatform: string
  comingsoon: boolean
  benefitsHeading: string
  b1Heading: string
  b1Description: string
  b2Heading: string
  b2Description: string
  b3Heading: string
  b3Description: string
}

const IntegrationsCRMOption: React.FC<IntegrationsCRMOptionProps> = ({
  crmPlatform,
  comingsoon,
  benefitsHeading,
  b1Heading,
  b1Description,
  b2Heading,
  b2Description,
  b3Heading,
  b3Description,
}) => {
  // Access the CRM platform details based on the provided crmPlatform string
  const thisCRMPlatform =
    externalDataSourceOptions[
      crmPlatform as keyof typeof externalDataSourceOptions
    ]

  if (!thisCRMPlatform) {
    // Handle case where the CRM platform is not found
    return <div>CRM platform not found</div>
  }

  const { name, logo, screenshot } = thisCRMPlatform
  let CRMLogo = logo

  return (
    <>
      <MarketingPageHeader
        labelHeading={name}
        heading={
          <>
            Sync with{' '}
            <span className="md:text-hXlgPP  text-hLgPP font-PPRightGrotesk">
              {name}
            </span>{' '}
            for a seamless workflow
          </>
        }
        description="Take your organising to the next level with our free to use tools that enhance your existing membership lists with geographic and political data."
        btnText={comingsoon ? 'Coming Soon' : 'Get Started'} // Corrected syntax
        btnLink="/signup"
      />
      <div className="py-10 grid grid-cols-1 md:grid-cols-3 items-center">
        <Image
          src={screenshot}
          alt="test"
          width="0"
          height="0"
          sizes="100vw"
          className="w-full h-auto"
        />
        <div className="grid grid-rows-3 ">
          <div className="flex items-end justify-center">
            <div className="w-[65%] md:h-[30%] h-[80%] border-x-2 border-t-2 border-brandBlue rounded-t-lg relative">
              <div className="absolute left-0 bottom-0 rounded-full w-4 h-4 bg-brandBlue -ml-2 -mb-2 z-20"></div>
              <svg
                className="absolute right-0 bottom-0 -mr-[0.55rem] -mb-0.5 z-20"
                transform="rotate(-180)"
                width="16"
                height="9"
                viewBox="0 0 16 9"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.70711 0.292893C8.31658 -0.0976311 7.68342 -0.0976311 7.29289 0.292893L0.928932 6.65685C0.538408 7.04738 0.538408 7.68054 0.928932 8.07107C1.31946 8.46159 1.95262 8.46159 2.34315 8.07107L8 2.41421L13.6569 8.07107C14.0474 8.46159 14.6805 8.46159 15.0711 8.07107C15.4616 7.68054 15.4616 7.04738 15.0711 6.65685L8.70711 0.292893ZM9 2L9 1L7 1L7 2L9 2Z"
                  fill="#678DE3"
                />
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 z-10 ">
            <Card className="p-10 place-content-center bg-meepGray-700 md:-ml-[30%]">
              <CRMLogo />
            </Card>
            <Card className="p-10 place-content-center bg-meepGray-700 md:-mr-[30%] ">
              <MappedLogo />
            </Card>
          </div>
          <div className="flex items-start justify-center">
            <div className="w-[65%] md:h-[30%] h-[80%] border-x-2 border-b-2 border-brandBlue rounded-b-lg relative">
              <div className="absolute right-0 top-0 rounded-full w-4 h-4 bg-brandBlue -mr-2 -mt-2 z-20"></div>
              <svg
                className="absolute left-0 top-0 -ml-[0.55rem] -mt-0.5 z-20"
                width="16"
                height="9"
                viewBox="0 0 16 9"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.70711 0.292893C8.31658 -0.0976311 7.68342 -0.0976311 7.29289 0.292893L0.928932 6.65685C0.538408 7.04738 0.538408 7.68054 0.928932 8.07107C1.31946 8.46159 1.95262 8.46159 2.34315 8.07107L8 2.41421L13.6569 8.07107C14.0474 8.46159 14.6805 8.46159 15.0711 8.07107C15.4616 7.68054 15.4616 7.04738 15.0711 6.65685L8.70711 0.292893ZM9 2L9 1L7 1L7 2L9 2Z"
                  fill="#678DE3"
                />
              </svg>
            </div>
          </div>
        </div>
        <Image
          src="/mapping-screenshot.png"
          alt="test"
          width="0"
          height="0"
          sizes="100vw"
          className="w-full h-auto"
        />
      </div>
      <div className="max-w-6xl mb-20">
        <div className="grid md:grid-cols-2 grid-cols-1">
          <div className="flex items-center">
            <TemplateTextBlock
              labelHeading="Benefits"
              heading={benefitsHeading}
              description=""
              btnText="Get Started"
              btnLink="/signup"
            />
          </div>
          <div className="flex flex-col gap-4 place-content-center items-center">
            <Card className="max-w-lg">
              <CardHeader>
                <CardTitle className="mb-3 px-6 pt-6">{b1Heading}</CardTitle>
                <CardDescription className="text-sm text-meepGray-400 px-6 pb-6">
                  {b1Description}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="max-w-lg">
              <CardHeader>
                <CardTitle className="mb-3 px-6 pt-6">{b2Heading}</CardTitle>
                <CardDescription className="text-sm text-meepGray-400 px-6 pb-6">
                  {b2Description}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="max-w-lg">
              <CardHeader>
                <CardTitle className="mb-3 px-6 pt-6">{b3Heading}</CardTitle>
                <CardDescription className="text-sm text-meepGray-400 px-6 pb-6">
                  {b3Description}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
      <GetStarted />
    </>
  )
}

export default IntegrationsCRMOption
