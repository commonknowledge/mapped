import Image from 'next/image'
import Link from 'next/link'
import Marquee from 'react-fast-marquee'

import { CiviPowerFundLogo } from '@/components/logos/CiviPowerFundLogo'
import { CommonKnowledgeLogo } from '@/components/logos/CommonKnowledgeLogo'
import { JRRTLogo } from '@/components/logos/JRRTLogo'
import CurrentNextGenTech from '@/components/marketing/CurrentNextGenTech'
import GetStarted from '@/components/marketing/GetStarted'
import MarketingPageHeader from '@/components/marketing/MarkertingPageHeader'
import TemplateTextAndImage from '@/components/marketing/TemplateTextAndImage'
import TemplateTextBlock from '@/components/marketing/TemplateTextBlock'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function AboutOveriew() {
  let btnLink = '/signup'

  return (
    <div className="flex flex-col items-center">
      <MarketingPageHeader
        heading={
          <>
            <span className="md:text-hXlgPP text-hLgPP font-PPRightGrotesk">
              More{' '}
            </span>
            than just maps
          </>
        }
        description="Take your organising to the next level with our free to use tools that enhance your existing membership lists with geographic and political data."
        btnText="Get Started"
        btnLink={btnLink}
      />
      <div className="-mx-4">
        <Marquee className="overflow-clip max-w-[100vw]" speed={100}>
          <div className="mx-4">
            <Image
              src="/about-marquee-1.jpg"
              alt="test"
              width="0"
              height="0"
              sizes="100vw"
              className="w-full h-auto rounded-lg mx-4"
            />
          </div>
          <div className="mx-4">
            <Image
              src="/about-marquee-2.jpg"
              alt="test"
              width="0"
              height="0"
              sizes="100vw"
              className="w-full h-auto rounded-lg mx-4"
            />
          </div>
          <div className="mx-4">
            <Image
              src="/about-marquee-3.jpg"
              alt="test"
              width="0"
              height="0"
              sizes="100vw"
              className="w-full h-auto rounded-lg mx-4"
            />
          </div>
          <div className="mx-4">
            <Image
              src="/about-marquee-4.jpg"
              alt="test"
              width="0"
              height="0"
              sizes="100vw"
              className="w-full h-auto rounded-lg mx-4"
            />
          </div>
          <div className="mx-4">
            <Image
              src="/about-marquee-5.jpg"
              alt="test"
              width="0"
              height="0"
              sizes="100vw"
              className="w-full h-auto rounded-lg mx-4"
            />
          </div>
        </Marquee>
      </div>
      <div className="max-w-6xl">
        <div className="grid md:grid-cols-2 grid-cols-1 gap-4 py-20">
          <div className="flex items-center">
            <TemplateTextBlock
              labelHeading="Values"
              heading="Empowering organisers to create lasting change"
              description="Mapped is built for organisations and organisers trying to do good in the UK. We facilitated multiple workshops that we designed for a cohort of organisations which included a comprehensive discovery process."
              btnText="Get Started"
              btnLink={btnLink}
            />
          </div>
          <div className="flex flex-col gap-4 p-10">
            <Card className="md:max-w-lg p-6">
              <CardHeader>
                <CardTitle className="mb-3">Collective power</CardTitle>
                <CardDescription className="text-sm text-meepGray-400">
                  Mapped liberates membership data from static, siloed
                  databases, enabling aligned organisations and campaigns to
                  work together to build collective power.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="md:max-w-lg p-6">
              <CardHeader>
                <CardTitle className="mb-3">
                  Transforming information into intelligence
                </CardTitle>
                <CardDescription className="text-sm text-meepGray-400">
                  Organisers can use Mapped to create high-dimensional pictures
                  out of multiple information sources, spark creative thoughts,
                  and develop their campaign strategy based on real data.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="md:max-w-lg p-6">
              <CardHeader>
                <CardTitle className="mb-3">Radical collaboration</CardTitle>
                <CardDescription className="text-sm text-meepGray-400">
                  Mapped is a real-time, multiplayer decision-making tool for
                  grounding organisational tactics in real information,
                  facilitating radically open collaboration from both
                  organisers, members and other allies.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
        <div className="flex flex-col gap-4 place-content-center items-center">
          <p className="text-meepGray-200 text-labelXlg mb-3">Who we are</p>
          <div className="grid md:grid-cols-2 grid-cols-1 gap-4 pb-20">
            <Card className="max-w-lg">
              <CardHeader>
                <CardTitle className="mb-3 px-6 pt-6 text-hMd">
                  Built by Common Knowledge
                </CardTitle>
              </CardHeader>
              <CardDescription className="text-meepGray-400 px-6">
                We are a not-for-profit worker cooperative of technologists,
                designers, researchers and facilitators. We work directly with
                grassroots organisers, using our digital expertise to multiply
                their impact and capacity.
              </CardDescription>
              <CardFooter className="mt-6 px-6 pb-6">
                <Link
                  href="https://commonknowledge.coop/"
                  className="bg-meepGray-600 p-6 flex rounded-md"
                >
                  <CommonKnowledgeLogo />
                </Link>
              </CardFooter>
            </Card>
            <Card className="max-w-lg">
              <CardHeader>
                <CardTitle className="mb-3 px-6 pt-6 text-hMd">
                  Funded by Civic Power Fund & JRRT
                </CardTitle>
              </CardHeader>
              <CardDescription className="text-meepGray-400 px-6">
                This tool was made possible through the generous support of the
                Civic Power Fund and the Joseph Rowntree Reform Trust.
              </CardDescription>
              <CardFooter className="mt-6 px-6 pb-6 gap-4">
                <Link
                  href="https://www.civicpower.org.uk/"
                  className="bg-meepGray-600 p-6 rounded-md"
                >
                  <CiviPowerFundLogo />
                </Link>
                <Link
                  href="https://www.jrrt.org.uk/"
                  className="bg-meepGray-600 p-6 rounded-md"
                >
                  <JRRTLogo />
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
        <div className="flex flex-col gap-4 place-content-center items-center">
          <div className="text-center">
            <TemplateTextBlock
              labelHeading="The cohort"
              heading="Our Colloborators"
              description="We’ve built this tool in close collaboration with a cohort of grassroots organisers, including POMOC, Green New Deal Rising and MedAct, alongside a wider ecosystem of progressive organisations in the UK."
              center={true}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pb-20 max-w-2xl">
            <Link className="h-full" href={'https://www.gndrising.org/'}>
              <Card className="h-full max-w-lg bg-meepGray-600 p-6 flex">
                <Image
                  src="/cohort/GNDRising.png"
                  alt="test"
                  width="0"
                  height="0"
                  sizes="100vw"
                  className="w-full h-auto rounded-lg"
                />
              </Card>
            </Link>
            <Link className="h-full" href={'https://www.medact.org/'}>
              <Card className="h-full max-w-lg bg-meepGray-600 p-6 flex">
                <Image
                  src="/cohort/Medact.png"
                  alt="test"
                  width="0"
                  height="0"
                  sizes="100vw"
                  className="w-full h-auto rounded-lg mix-blend-screen"
                />
              </Card>
            </Link>

            <Link className="h-full" href={'https://www.pomoc.org.uk/'}>
              <Card className="h-full max-w-lg bg-meepGray-600 p-6 flex">
                <Image
                  src="/cohort/pomoc-logo.png"
                  alt="test"
                  width="0"
                  height="0"
                  sizes="100vw"
                  className="w-full h-auto rounded-lg"
                />
              </Card>
            </Link>

            <Link className="h-full" href={'https://justtreatment.org/'}>
              <Card className="h-full max-w-lg bg-meepGray-600 p-6 flex">
                <Image
                  src="/cohort/just-treatment.png"
                  alt="test"
                  width="0"
                  height="0"
                  sizes="100vw"
                  className="w-full h-auto rounded-lg"
                />
              </Card>
            </Link>
          </div>
        </div>
      </div>
      <div className="-mx-4 bg-meepGray-700">
        <div className="grid md:grid-cols-2 grid-cols-1 place-content-center">
          <div className="flex flex-col gap-4 place-content-center items-center">
            <Image
              src="/team-1.jpg"
              alt="test"
              width="0"
              height="0"
              sizes="100vw"
              className="w-full h-auto"
            />
          </div>
          <div className="flex items-center">
            <TemplateTextBlock
              labelHeading="Why we built this"
              heading="Information into intelligence"
              description="Organisers can use Mapped to create high-dimensional pictures out of multiple information sources, spark creative thoughts, and develop their campaign strategy based on real data."
              btnText="Set up integration"
              btnLink={btnLink}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 place-content-center items-center py-20 w-full">
        <CurrentNextGenTech />
        <GetStarted />
        <TemplateTextAndImage
          labelHeading="Our process"
          heading="Discovery, Prototype, Build, Test."
          description="We work in short bursts of focused activity where we continually inspect our progress, adapt the plan and redistribute work within the team. We always follow the same iterative process, where we build something lightweight, test it with real people and then iterate based on what we’ve learned. Read more about our process by visiting the Common Knowledge blog."
          btnText="Read more"
          btnLink="https://commonknowledge.coop/writing"
          imgSrc="/about-process.png"
        />
      </div>
    </div>
  )
}
