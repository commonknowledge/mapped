// List

import { CrmType } from '@/__generated__/graphql'
import { externalDataSourceOptions } from '@/lib/data'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'

export default function IngestScreen() {
  const [source, setSource] = useState<CrmType | null>(null)

  return (
    <main>
      <h2 className="text-hLgPP mb-4">Where does your data come from?</h2>
      <p className="text-meepGray-400 mb-16">
        Select the source of your data. You can upload a file or connect a third
        party tool to regularly sync data between.
      </p>
      <div className="grid grid-cols-3 gap-4">
        {Object.values(externalDataSourceOptions)
          .filter((externalDataSource) => externalDataSource.supported)
          .map((externalDataSource) => (
            <div
              key={externalDataSource.key}
              className={twMerge(
                'flex flex-row items-center gap-2 p-4 rounded-md cursor-pointer border-2 border-meepGray-600',
                source === externalDataSource.key &&
                  'border-brandBlue font-medium'
              )}
              onClick={() => {
                setSource(externalDataSource.key)
              }}
            >
              <externalDataSource.icon className="w-5" />
              {externalDataSource.name}
            </div>
          ))}
      </div>
    </main>
  )
}
