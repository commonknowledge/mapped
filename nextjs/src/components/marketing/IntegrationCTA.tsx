import Link from 'next/link'
import React from 'react'

import TemplateTextBlock from '@/components/marketing/TemplateTextBlock'
import { Card, CardContent } from '@/components/ui/card'
import { externalDataSourceOptions } from '@/lib/data'
import TemplateCard from './TemplateCard'
import { PlusIcon } from 'lucide-react'

interface IntegrateProps { }

const crmSync: { title: string; href: string; description: string, icon: React.ReactNode, supported: boolean }[] = [
  ...Object.values(externalDataSourceOptions).map((d) => ({
    title: d.name,
    href: `/integrations/${d.key}`,
    description: d.name,
    icon: d.icon ? <d.icon /> : null,
    supported: d.supported,
  })),
  {
    title: "Don't see your CRM?",
    href: 'mailto:hello@commonknowledge.coop',
    description: 'Make a request',
    icon: <PlusIcon />,
    supported: false,
  },
]

const Integrate: React.FC<IntegrateProps> = () => {
  return (
    <>
      <section className="flex flex-col gap-4">
        <TemplateTextBlock
          labelHeading="Integrate your data"
          center={true}
          heading="Augment your CRM"
          description="Mapped liberates your membership data from static, siloed and opaque CRMs by augmenting them with contextual information, geographic data and historical electoral data. Now you can look for insights and develop your strategy with confidence."
        />
        <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
          {crmSync.map((component) => (
            <TemplateCard
              highlighted={true}
              heading={component.title}
              description={component.supported ? 'Supported' : 'Make a request'}
              link={component.href}
              icon={component.icon}
            />
          ))}
        </div>
      </section>
    </>
  )
}

export default Integrate
