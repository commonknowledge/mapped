import { Metadata } from 'next'

import FeaturesOption from '@/components/marketing/FeaturesOption'

export default function MemberMaps() {
  let btnLink = '/signup'

  return (
    <FeaturesOption
      labelHeading="Member Maps"
      heading={
        <>
          See where your{' '}
          <span className="md:text-hXlgPP text-hLgPP font-PPRightGrotesk">
            members
          </span>{' '}
          are and reach them easily
        </>
      }
      description="Take your organising to the next level with our free to use tools that enhance your existing membership lists with geographic and political data."
      btnText="Get Started"
      btnLink={btnLink}
      screenshot="/features-screenshots/mapping-main-clean.png"
      benefitsHeading="Connect your mailing list to Mapped and see where they are"
      b1Screenshot="/features-screenshots/mapping-third.png"
      b1Heading="Member Density"
      b1Description="See the quantity of your members per region represented through colour on the map."
      b2Screenshot="/features-screenshots/mid-level.png"
      b2Heading="See your members from different scales"
      b2Description="The Mapped UI adapts to your zoom level to give you the most useful information for each context."
      b3Screenshot="/features-screenshots/member-level.png"
      b3Heading="Get Granular"
      b3Description="See exactly where your members are as well as access their contact information."
    />
  )
}
export const metadata: Metadata = {
  title: 'CRM Sync',
}
