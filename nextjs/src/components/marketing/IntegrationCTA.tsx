import Link from 'next/link'
import React from 'react'

import TemplateTextBlock from '@/components/marketing/TemplateTextBlock'
import { Card, CardContent } from '@/components/ui/card'
import { externalDataSourceOptions } from '@/lib/data'

interface IntegrateProps {}

const crmSync: { title: string; href: string; description: string }[] = [
  ...Object.values(externalDataSourceOptions).map((d) => ({
    title: d.name,
    href: `/integrations/${d.key}`,
    description: d.name,
  })),
  {
    title: "Don't see your CRM?",
    href: 'mailto:hello@commonknowledge.coop',
    description: 'Make a request',
  },
]

const Integrate: React.FC<IntegrateProps> = () => {
  return (
    <Card className="w-full grid lg:grid-cols-2 grid-cols-1 drop-shadow">
      <div className="flex items-center lg:order-1">
        <TemplateTextBlock
          labelHeading="Integrate"
          heading="Augment your CRM"
          description="Mapped liberates your membership data from static, siloed and opaque CRMs by augmenting them with contextual information, geographic data and historical electoral data. Now you can look for insights and develop your strategy with confidence."
        />
      </div>
      <CardContent className="p-8 flex place-content-center">
        <div className="grid md:grid-cols-3 grid-cols-2 gap-3 md:p-6">
          {crmSync.map((component) => (
            <Link href={component.href} key={component.href}>
              <Card className="p-6 h-full place-content-center text-center bg-meepGray-700 hover:bg-meepGray-600">
                {component.title}
              </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default Integrate
