import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatCrmNames(input: string): string {
  switch (input.toLowerCase()) {
    case 'actionnetwork':
      return 'Action Network'
    case 'editablegooglesheets':
      return 'Editable Google Sheets'
    case 'tickettailor':
      return 'Ticket Tailor'
    case 'airtable':
      return 'Airtable'
    case 'mailchimp':
      return 'Mailchimp'
    default:
      return 'CRM'
  }
}
