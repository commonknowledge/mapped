import Image from 'next/image'
import Link from 'next/link'

import FeatureTextSection from '@/components/marketing/TemplateTextBlock'
import { Card, CardContent } from '@/components/ui/card'

import { buttonVariants } from '../ui/button'
import { Input } from '../ui/input'

interface SignUpProps { }

const SignUp: React.FC<SignUpProps> = () => {
  return (
    <Link href="/signup">
      <Card className="w-full bg-brandBlue flex flex-col sm:flex-row items-center relative overflow-clip hover:bg-brandBlue/50 transition">
        <div className="flex items-center grow">
          <FeatureTextSection
            heading="Start mapping now"
            description="Connect your data source and start mapping your members geographically to understand the strength of your campaign at a glance and ground your organisational tactics in real information."
          />
        </div>
        {/* <CardContent className="sm:w-1/2 w-full sm:max-w-md p-8 z-10">
        <p className="text-labelMain mb-2">Email</p>
        <Input
          placeholder="sleve.mcdichael@example.com"
          className="mb-5 bg-brandBlue border-meepGray-300  placeholder:text-meepGray-200 text-meepGray-100"
        />
      </CardContent> */}
        <div className="font-PPRightGrotesk text-hXlgPP p-10">
          Get Started
        </div>
        <div className="absolute left-[30%]">
          <Image
            src="/sign-up-graphic.svg"
            alt="test"
            width="0"
            height="0"
            sizes="100vw"
            className="w-full h-auto "
          />
        </div>
      </Card>
    </Link>
  )
}

export default SignUp
