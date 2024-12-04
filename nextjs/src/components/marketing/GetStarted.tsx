import Image from 'next/image'

import TemplateTextBlock from '@/components/marketing/TemplateTextBlock'
import { Card, CardContent } from '@/components/ui/card'
import TemplateCard from './TemplateCard'

interface GetStartedProps {
  btnLink?: string
}

const GetStarted: React.FC<GetStartedProps> = ({ btnLink }) => {
  return (
    <section className="grid grid-cols-3 gap-4">
      <TemplateCard
        heading="Start mapping your members"
        description="Visualise your membership geographically to understand the strength of your campaign at a glance and ground your organisational tactics in real information."
        link={btnLink || '/signup'}
        highlighted={true}
        className=""
      />



      <Image
        src="/get-started-screenshot.png"
        alt="test"
        width="0"
        height="0"
        sizes="100vw"
        className="w-full h-auto rounded-lg drop-shadow border-meepGray-600 border"
      />
    </section>
  )
}

export default GetStarted
