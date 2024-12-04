import Image from 'next/image'
import Link from 'next/link'

import FeatureTextSection from '@/components/marketing/TemplateTextBlock'
import { Card, CardContent } from '@/components/ui/card'

import { buttonVariants } from '../ui/button'
import { Input } from '../ui/input'

interface SignUpProps {}

const SignUp: React.FC<SignUpProps> = () => {
  return (
    <Card className="w-full bg-brandBlue flex flex-col sm:flex-row items-center relative overflow-clip">
      <div className="flex items-center grow">
        <FeatureTextSection
          heading="Sign up to the waitlist"
          description="We’re always working on new features and integrations. Subscribe to hear about updates as we launch them."
        />
      </div>
      <CardContent className="sm:w-1/2 w-full sm:max-w-md p-8 z-10">
        <p className="text-labelMain mb-2">Email</p>
        <Input
          placeholder="sleve.mcdichael@example.com"
          className="mb-5 bg-brandBlue border-meepGray-300  placeholder:text-meepGray-200 text-meepGray-100"
        />
        <Link
          href="/signup"
          className={buttonVariants({ variant: 'secondary' })}
        >
          Sign Up
        </Link>
      </CardContent>
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
  )
}

export default SignUp
