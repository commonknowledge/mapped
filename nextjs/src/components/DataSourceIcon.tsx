import { File } from 'lucide-react'
import { twMerge } from 'tailwind-merge'

import { CrmType, FieldDefinition } from '@/__generated__/graphql'
import { externalDataSourceOptions } from '@/lib/data'

export function DataSourceFieldLabel({
  label,
  fieldDefinition,
  crmType,
  className,
  source,
}: {
  label?: string
  fieldDefinition?: FieldDefinition
  crmType: CrmType
  className?: string
  source?: string
}) {
  return (
    <span
      className={twMerge(
        'rounded-sm bg-meepGray-700 inline-flex gap-1 justify-start items-center overflow-hidden text-ellipsis text-nowrap',
        className
      )}
    >
      <span className="px-2 py-1 inline-flex gap-2 items-center">
        <DataSourceIcon crmType={crmType} className={'inline-block w-5'} />
        <span className="font-IBMPlexMono !text-white">
          {label ||
            fieldDefinition?.label ||
            fieldDefinition?.value ||
            'Unknown field'}
        </span>
      </span>
      {!!source && (
        <span className="px-2 py-1 text-xs text-meepGray-400 bg-meepGray-600">
          {source}
        </span>
      )}
    </span>
  )
}

export function DataSourceIcon({
  crmType,
  className = 'w-4',
}: {
  crmType?: CrmType // keyof typeof externalDataSourceOptions,
  className?: string
}) {
  if (!crmType) return <File className={className} />
  const option = externalDataSourceOptions[crmType]
  if (crmType && !!option) {
    const Icon = option.icon || option.logo
    if (Icon) {
      return <Icon className={className} />
    }
  }
  return <File className={className} />
}
