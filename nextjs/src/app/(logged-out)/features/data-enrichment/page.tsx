import { Metadata } from 'next'

import FeaturesOption from '@/components/marketing/FeaturesOption'

export default function DataEnrichment() {
  let btnLink = '/signup'

  return (
    <FeaturesOption
      labelHeading="Data Enrichment"
      heading={
        <>
          Unlock new{' '}
          <span className="md:text-hXlgPP text-hLgPP font-PPRightGrotesk">
            insights
          </span>{' '}
          for your campaign through exploring data
        </>
      }
      description="Take your organising to the next level with our free to use tools that enhance your existing membership lists with geographic and political data."
      btnText="Get Started"
      btnLink={btnLink}
      screenshot="/features-screenshots/mapping-main.png"
      benefitsHeading="Use Data to inform your campaigns"
      b1Screenshot="/features-screenshots/data-enrichment.png"
      b1Heading="Toggle different data layers"
      b1Description="Choose from an evolving series of data sources that interact with the UI to give you more context to inform your campaigns."
      b2Screenshot="/features-screenshots/colloborative.png"
      b2Heading="Share Memeber Lists"
      b2Description="Share your membership lists between organisations and pool together your members and collaborate on strategy"
    />
  )
}
export const metadata: Metadata = {
  title: 'Data Enrichment',
}
