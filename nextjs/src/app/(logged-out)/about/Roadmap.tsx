import { Pencil } from 'lucide-react'

import Pin from '@/components/Pin'
import MarketingPageHeader from '@/components/marketing/MarkertingPageHeader'
import RoadMapItems from '@/components/marketing/RoadmapItems'
import TemplateCard from '@/components/marketing/TemplateCard'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function AboutRoadmap() {
  let btnLink = '/signup'

  return (
    <div className="flex flex-col items-center">
      <MarketingPageHeader
        heading={
          <>
            Have{' '}
            <span className="md:text-hXlgPP text-hLgPP font-PPRightGrotesk">
              your say
            </span>{' '}
            on what gets built next
          </>
        }
        description="Take your organising to the next level with our free to use tools that enhance your existing membership lists with geographic and political data."
        btnText="Get Started"
        btnLink={btnLink}
      />
      <div className="py-10 max-w-6xl">
        <div className="relative">
          <div className="grid grid-cols-1 mb-20">
            <div className="flex items-center gap-3 mb-6 text-lg">
              <Pin />
              In progress
            </div>
            <RoadMapItems />
          </div>
          <div className="grid grid-cols-1 mb-20">
            <div className="flex items-center gap-3 mb-6 text-lg">
              <Pin />
              Under Consideration
            </div>
            <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
              <TemplateCard
                highlighted={false}
                heading="Segment members by drawing shape"
                description="Create a subsection on your list by drawing a shape on a map. "
                link="#"
                tag="User Experience"
                isExternalLink={false}
              />
              <TemplateCard
                highlighted={false}
                heading="Load in your member data"
                description="Upload your spreadsheet/CSV file into the data configuration section and see your members appear on the map"
                link="#"
                tag="User Experience"
                isExternalLink={false}
              />
            </div>
          </div>

          <Card className="flex p-6 max-w-2xl gap-4 bg-meepGray-700">
            <CardHeader className="w-1/2 flex flex-col gap-10">
              <CardTitle className="text-hMd flex flex-col gap-5">
                <Pencil />
                Request new feature
              </CardTitle>
              <CardDescription className="text-sm text-meepGray-400 max-w-sm">
                Have an idea about what we should do next? Submit this form and
                explain what your feature does and the benefits it provides.{' '}
              </CardDescription>
            </CardHeader>
            <CardContent className="w-1/2 max-w-md mb-3">
              <p className="text-labelMain mb-2">Name</p>
              <Input placeholder="shadcn" className="mb-5" />
              <p className="text-labelMain mb-2">Idea</p>
              <Textarea className="bg-meepGray-800" />
            </CardContent>
          </Card>

          <div className="absolute left-0 top-1 h-full w-[10.5px] border-r border-meepGray-600 -z-10"></div>
        </div>
      </div>
    </div>
  )
}
