import {
  CrmType,
  DataSourceType,
  GetMemberListQuery,
} from '@/__generated__/graphql'
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
import {
  CalendarDays,
  FlagTriangleRight,
  LineChart,
  LucideFileJson,
  LucideFileSpreadsheet,
  MapPinIcon,
  Newspaper,
  UserIcon,
  UsersIcon,
} from 'lucide-react'
import { twMerge } from 'tailwind-merge'

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
  [CrmType.Uploadedcsv]: {
    key: CrmType.Uploadedcsv,
    modelName: 'uploadedCSVSource',
    name: 'Uploaded CSV',
    icon: (props: any) => (
      <LucideFileSpreadsheet
        {...props}
        className={twMerge('text-brandBlue', props.className)}
      />
    ),
    logo: (props: any) => (
      <div className="flex flex-col gap-2">
        <LucideFileSpreadsheet
          {...props}
          className={twMerge('text-brandBlue', props.className)}
        />
        Upload CSV
      </div>
    ),
    screenshot: '/googleSheets-screenshot.png',
    supported: false,
  },
  [CrmType.Databasejson]: {
    key: CrmType.Databasejson,
    modelName: 'DatabaseJSONSource',
    name: 'Database JSON Data',
    icon: (props: any) => (
      <LucideFileJson
        {...props}
        className={twMerge('text-brandBlue', props.className)}
      />
    ),
    logo: (props: any) => (
      <div className="flex flex-col gap-2">
        <LucideFileJson
          {...props}
          className={twMerge('text-brandBlue', props.className)}
        />
        Upload JSON
      </div>
    ),
    screenshot: '/googleSheets-screenshot.png',
    supported: false,
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
export type SourceOption =
  | GetMemberListQuery['myOrganisations'][0]['sharingPermissionsFromOtherOrgs'][0]['externalDataSource']
  | GetMemberListQuery['myOrganisations'][0]['externalDataSources'][0]

export const dataTypeIcons: Record<
  DataSourceType,
  {
    icon: typeof UserIcon
    label: string
  }
> = {
  [DataSourceType.Member]: {
    icon: UserIcon,
    label: 'Member',
  },
  [DataSourceType.Location]: {
    icon: MapPinIcon,
    label: 'Location',
  },
  [DataSourceType.AreaStats]: {
    icon: LineChart,
    label: 'Area Stats',
  },
  [DataSourceType.Event]: {
    icon: CalendarDays,
    label: 'Event',
  },
  [DataSourceType.Group]: {
    icon: UsersIcon,
    label: 'Group',
  },
  [DataSourceType.Story]: {
    icon: Newspaper,
    label: 'Story',
  },
  [DataSourceType.Other]: {
    icon: FlagTriangleRight,
    label: 'Other',
  },
}
