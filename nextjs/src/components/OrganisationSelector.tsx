'use client'

import { gql, useQuery } from '@apollo/client'
import { useAtom } from 'jotai'
import { ChevronDown } from 'lucide-react'
import * as React from 'react'

import { GetOrganisationsQuery } from '@/__generated__/graphql'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { currentOrganisationIdAtom } from '@/lib/organisation'

import { LoadingIcon } from './ui/loadingIcon'

export function OrganisationSelector() {
  const organisations = useQuery<GetOrganisationsQuery>(GET_ORGANISATIONS)
  const [currentOrganisation, setOrg] = useAtom(currentOrganisationIdAtom)

  React.useEffect(() => {
    if (
      (!currentOrganisation ||
        currentOrganisation === '' ||
        !organisations.data?.myOrganisations.some(
          (o) => o.id === currentOrganisation
        )) &&
      organisations.data?.myOrganisations.length
    ) {
      setOrg(organisations.data.myOrganisations[0].id)
    }
  }, [currentOrganisation, organisations])

  const selectedOrgData = organisations.data?.myOrganisations.find(
    (org) => org.id === currentOrganisation
  )

  if (organisations.loading || !currentOrganisation || !selectedOrgData)
    return (
      <div className="border-x border-meepGray-700 px-6 py-2 flex flex-col items-center justify-center cursor-pointer hover:bg-meepGray-700">
        <div className="flex flex-row gap-2 items-center">
          <LoadingIcon size={'15'} />
          <span>Loading organisations</span>
        </div>
      </div>
    )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="border-x border-meepGray-700 px-6 py-2 flex flex-col items-center justify-center cursor-pointer hover:bg-meepGray-700">
          <div className="flex flex-row gap-2 items-center">
            <span>{selectedOrgData?.name}</span>
            <ChevronDown className="w-4 text-meepGray-400" />
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Your organisations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={currentOrganisation}
          onValueChange={setOrg}
        >
          {organisations.data?.myOrganisations.map((organisation) => (
            <DropdownMenuRadioItem
              key={organisation.id}
              value={organisation.id}
              className="py-3 text-md"
            >
              {organisation.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const GET_ORGANISATIONS = gql`
  query GetOrganisations {
    myOrganisations {
      id
      name
    }
  }
`
