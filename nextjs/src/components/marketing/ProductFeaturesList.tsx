import { MapIcon, Repeat, Database, Layers } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card'

import Pin from '../Pin'
import TemplateCard from './TemplateCard'

export default function ProductFeaturesList() {
  const productFeatures = {
    mapping: {
      key: 'mapping',
      name: 'Mapping',
      icon: MapIcon,
      screenshot: '/airtable-screenshot.png',
      link: '/features/member-maps',
      description: 'See where your members are and reach them easily using our mapping tool. Configure your map to show the constituencies, wards, or other areas that are important to your campaign.',
    },
    dataEnrichment: {
      key: 'dataEnrichment',
      name: 'Data Enrichment',
      icon: Database,
      screenshot: '/airtable-screenshot.png',
      link: '/features/data-enrichment',
      description: 'Unlock new insights for your campaign through exploring data using our data enrichment tool. We use a range of open data sources to enrich your data and provide you with a range of insights.',
    },
    dataSync: {
      key: 'dataSync',
      name: 'Data Sync',
      icon: Repeat,
      screenshot: '/airtable-screenshot.png',
      link: '/features/crm-sync',
      description: 'Upgrade your workflow by seamlessly integrating mapped your chosen CRM. No need to manually copy data between systems. Use Mapped to power your organising.',
    },
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="col-span-3 text-lg uppercase font-light font-IBMPlexMono text-meepGray-400 mx-auto mb-4">
        Features
      </h2>
      <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
        {Object.values(productFeatures).map((feature) => (
          <TemplateCard
            highlighted={true}
            heading={feature.name}
            description={feature.description}
            link={feature.link}
            icon={<feature.icon />}
          />
        ))}
      </div>
    </section>
  )
}
