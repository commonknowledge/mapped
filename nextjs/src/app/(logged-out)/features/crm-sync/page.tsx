import { Metadata } from 'next'

import FeaturesOption from '@/components/marketing/FeaturesOption'
import IntegtationsCTA from '@/components/marketing/IntegrationCTA'

export default function DataEnrichment() {
  let btnLink = '/signup'

  return (
    <>
      <FeaturesOption
        labelHeading="CRM Sync"
        heading={
          <>
            Upgrade your{' '}
            <span className="md:text-hXlgPP text-hLgPP font-PPRightGrotesk">
              workflow
            </span>{' '}
            by seamlessly integrating mapped your chosen CRM
          </>
        }
        description="Take your organising to the next level with our free to use tools that enhance your existing membership lists with geographic and political data."
        btnText="Get Started"
        btnLink={btnLink}
        screenshot="/features-screenshots/data-sync.png"
        benefitsHeading="Connect your mailing list to Mapped and see where they are"
        b1Screenshot="/features-screenshots/data-sync-live-sync.png"
        b1Heading="Live Sync"
        b1Description="Create a live sync to the data from your CRM, making sure the data you see in Mapped is always up to date.."
        b2Screenshot="/features-screenshots/data-sync-configure-mapping.png"
        b2Heading="Configure data mapping"
        b2Description="Select the data points you want to bring in to mapped to use to enhance your organising"
      />
      <div className="py-10">
        <IntegtationsCTA />
      </div>
    </>
  )
}
export const metadata: Metadata = {
  title: 'CRM Sync',
}
