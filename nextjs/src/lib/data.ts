import { CrmType } from '@/__generated__/graphql'
import { ActionNetworkIcon } from '@/components/logos/ActionNetworkIcon'
import { ActionNetworkLogo } from '@/components/logos/ActionNetworkLogo'
import { AirtableIcon } from '@/components/logos/AirtableIcon'
import { AirtableLogo } from '@/components/logos/AirtableLogo'
import { GoogleSheetsIcon } from '@/components/logos/GoogleSheetsIcon'
import { GoogleSheetsLogo } from '@/components/logos/GoogleSheetsLogo'
import { MailchimpIcon } from '@/components/logos/MailchimpIcon'
import { MailchimpLogo } from '@/components/logos/MailchimpLogo'
import { TicketTailorIcon } from '@/components/logos/TicketTailorIcon'
import { TicketTailorLogo } from '@/components/logos/TicketTailorLogo'

export const externalDataSourceOptions: Record<
  CrmType,
  {
    key: CrmType
    modelName: string
    name: string
    icon?: ({ className }: { className?: string | undefined }) => any
    logo: ({ className }: { className?: string | undefined }) => any
    screenshot: string
    supported: boolean
    marketingPageHref?: string
  }
> = {
  [CrmType.Airtable]: {
    key: CrmType.Airtable,
    modelName: 'AirtableSource',
    name: 'Airtable',
    icon: AirtableIcon,
    logo: AirtableLogo,
    screenshot: '/airtable-screenshot.png',
    supported: true,
    marketingPageHref: 'integrations/airtable',
  },
  [CrmType.Actionnetwork]: {
    key: CrmType.Actionnetwork,
    modelName: 'actionNetworkSource',
    name: 'Action Network',
    icon: ActionNetworkIcon,
    logo: ActionNetworkLogo,
    screenshot: '/actionNetwork-screenshot.png',
    supported: true,
    marketingPageHref: 'integrations/actionNetwork',
  },
  [CrmType.Mailchimp]: {
    key: CrmType.Mailchimp,
    modelName: 'mailchimpSource',
    name: 'Mailchimp',
    icon: MailchimpIcon,
    logo: MailchimpLogo,
    screenshot: '/mailchimp-screenshot.png',
    supported: true,
    marketingPageHref: 'integrations/mailchimp',
  },
  [CrmType.Editablegooglesheets]: {
    key: CrmType.Editablegooglesheets,
    modelName: 'editableGoogleSheetsSource',
    name: 'Google Sheets',
    icon: GoogleSheetsIcon,
    logo: GoogleSheetsLogo,
    screenshot: '/googleSheets-screenshot.png',
    supported: true,
    marketingPageHref: 'integrations/google-sheets',
  },
  [CrmType.Tickettailor]: {
    key: CrmType.Tickettailor,
    modelName: 'TicketTailorSource',
    name: 'Ticket Tailor',
    icon: TicketTailorIcon,
    logo: TicketTailorLogo,
    screenshot: '/tickettailor-screenshot.png',
    supported: true,
  },
  // civiCRM: {
  //   key: "civi-crm",
  //   modelName: "civiCRMSource",
  //   name: "Civi CRM",
  //   logo: CiviCRMLogo,
  //   screenshot: "/civiCRM-screenshot.png",
  //   supported: false
  // },
  // nationBuilder: {
  //   key: "nation-builder",
  //   modelName: "nationBuilderSource",
  //   name: "NationBuilder",
  //   logo: NationBuilderLogo,
  //   screenshot: "/nationBuilder-screenshot.png",
  //   supported: false
  // },
}

export const getSourceOptionForTypename = (typename: string) => {
  return Object.values(externalDataSourceOptions).find(
    (option) => option.modelName === typename
  )
}

export type SourcePath =
  | {
      value: string
      label?: string | null
      description?: string | null
    }
  | string
