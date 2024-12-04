import IntegrationsCRMOption from '@/components/marketing/IntegrationsCRMOption'

export default function CRMSyncMailchimp() {
  return (
    <>
      <IntegrationsCRMOption
        crmPlatform="mailchimp"
        comingsoon={true}
        benefitsHeading="Connect your mailing list to Mapped and see where they are"
        b1Heading="Sync memberships"
        b1Description="Upload a spreadsheet with a column of postcodes to get extra geographic data added on that can help you with your organising efforts."
        b2Heading="Sync memberships"
        b2Description="Upload a spreadsheet with a column of postcodes to get extra geographic data added on that can help you with your organising efforts."
        b3Heading="Sync memberships"
        b3Description="Upload a spreadsheet with a column of postcodes to get extra geographic data added on that can help you with your organising efforts."
      />
    </>
  )
}
