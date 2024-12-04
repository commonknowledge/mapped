import { Layers, Repeat } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card'

import Pin from '../Pin'

export default function ProductFeaturesList() {
  const productFeatures = {
    mapping: {
      key: 'mapping',
      name: 'Mapping',
      icon: Layers,
      screenshot: '/airtable-screenshot.png',
      link: '/features/member-maps',
      description: 'test',
    },
    dataEnrichment: {
      key: 'dataEnrichment',
      name: 'Data Enrichment',
      icon: Layers,
      screenshot: '/airtable-screenshot.png',
      link: '/features/data-enrichment',
      description: 'test',
    },
    dataSync: {
      key: 'dataSync',
      name: 'Data Sync',
      icon: Repeat,
      screenshot: '/airtable-screenshot.png',
      link: '/features/crm-sync',
      description: 'test',
    },
  }

  return (
    <div className="grid md:grid-cols-3 grid-cols-1 gap-4 ">
      <Link href="/features/member-maps">
        <Card className="bg-meepGray-800 border-meepGray-700 hover:bg-meepGray-700 transition h-full ">
          <div className="block p-4">
            <CardTitle className="mb-3 inline-flex gap-2 px-3 py-2 bg-meepGray-600 rounded-lg items-center">
              <Pin />

              <p className="">Mapping</p>
            </CardTitle>
            <CardDescription className="text-sm text-meepGray-400">
              Visualise your members geographically to help plan your campaigns.
            </CardDescription>
          </div>
          <CardContent>
            <Image
              src="/feature-mapping-thumbnail.png"
              alt="test"
              width="0"
              height="0"
              sizes="100vw"
              className="w-full h-auto rounded-lg"
            />
          </CardContent>
        </Card>
      </Link>
      <Link href="/features/data-enrichment">
        <Card className="bg-meepGray-800 border-meepGray-700 hover:bg-meepGray-700 transition h-full ">
          <div className="block p-4">
            <CardTitle className="mb-3 inline-flex gap-2 px-3 py-2 bg-meepGray-600 rounded-lg items-center">
              <Layers color="#678DE3" className="w-4" />
              <p>Data Enrichment</p>
            </CardTitle>
            <CardDescription className="text-sm text-meepGray-400">
              Overlay your membership list with useful contextual data.
            </CardDescription>
          </div>
          <CardContent>
            <Image
              src="/feature-data-enrichment-thumbnail.png"
              alt="test"
              width="0"
              height="0"
              sizes="100vw"
              className="w-full h-auto rounded-lg"
            />
          </CardContent>
        </Card>
      </Link>
      <Link href="/features/crm-sync">
        <Card className="bg-meepGray-800 border-meepGray-700 hover:bg-meepGray-700 transition h-full ">
          <div className="block p-4">
            <CardTitle className="mb-3 inline-flex gap-2 px-3 py-2 bg-meepGray-600 rounded-lg items-center">
              <Repeat className="w-4" color="#678DE3" />
              <p className="">CRM Sync</p>
            </CardTitle>
            <CardDescription className="text-sm text-meepGray-400">
              Instantly sync data between Mapped and your CRM.
            </CardDescription>
          </div>
          <CardContent>
            <Image
              src="/feature-crm-sync-thumbnail.png"
              alt="test"
              width="0"
              height="0"
              sizes="100vw"
              className="w-full h-auto rounded-lg"
            />
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
