'use client'

import { User } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { gql } from '@apollo/client'
import { useRouter, useSearchParams } from 'next/navigation'
import useRecordsMemberList from '../useRecordsMemberList'
import { useReport } from './ReportProvider'

export default function ReportRecordsComboBox() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = React.useState('')

  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState('')

  const { report } = useReport()

  const memberList = useRecordsMemberList()

  console.log('memberList', memberList)

  // const boundaryType = report.displayOptions?.dataVisualisation?.boundaryType
  // const tileset = report.politicalBoundaries.find(
  //   (boundary) => boundary.boundaryType === boundaryType
  // )?.tileset

  // const selectedBoundaryLabel = report.politicalBoundaries.find(
  //   (boundary) => boundary.boundaryType === boundaryType
  // )?.label

  // const areas = useAreasList(tileset ?? null)

  // // Get the area ID from URL params
  // useEffect(() => {
  //   const entity = searchParams.get('entity')
  //   const id = searchParams.get('id')

  //   if (entity === 'area' && id) {
  //     const area = areas.find((area) => area.gss === id)
  //     if (area) {
  //       setValue(area.name)
  //     }
  //   }
  // }, [searchParams, areas])

  // const handleSelect = (value: string) => {
  //   const valueUpper = value.toUpperCase()
  //   const area = areas.find((area) => area.gss === valueUpper)
  //   setValue(area?.name ?? '')
  //   setOpen(false)

  //   // Create new URLSearchParams object with current params
  //   const params = new URLSearchParams(searchParams)
  //   params.set('entity', 'area')
  //   params.set('id', valueUpper)
  //   params.set('showExplorer', 'true')

  //   // Update the URL
  //   router.push(`?${params.toString()}`)
  // }

  // function handleFiltering(searchQuery: string) {
  //   const search = searchQuery.toLowerCase().trim()
  //   return areas
  //     .filter((area) => area.name.toLowerCase().includes(search))
  //     .sort((a, b) => a.name.localeCompare(b.name)) // Optional: sort alphabetically
  // }

  // function handleClear() {
  //   setValue('')
  //   setSearchQuery('')
  // }

  // // Keyboard shortcuts
  // useEffect(() => {
  //   const down = (e: KeyboardEvent) => {
  //     if (e.key === 'Backspace' && (e.metaKey || e.ctrlKey)) {
  //       e.preventDefault()

  //       handleClear()
  //     }
  //     if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
  //       e.preventDefault()
  //       setOpen((open) => !open)
  //     }
  //   }
  //   document.addEventListener('keydown', down)
  //   return () => document.removeEventListener('keydown', down)
  // }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex gap-1 items-center">
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className=" justify-between text-sm font-normal w-full hover:bg-meepGray-800 text-opacity-80 gap-1 "
          >
            <User
              className={`h-4 w-4 shrink-0 opacity-50 ${value ? 'fill-meepGray-400' : 'fill-transparent'}`}
            />
            {/* <div className="text-xs text-meepGray-400 truncate w-12">
              {value ? value : 'CMD+K'}
              CMD+K
            </div> */}
          </Button>
        </PopoverTrigger>

        {/* {selectedBoundary && (
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedBoundary(null)
              setValue('')
            }}
            className="text-xs font-normal flex items-center gap-1 bg-meepGray-600 px-2 py-1 text-red-200 hover:bg-white hover:text-red-400"
          >
            <X className="w-3 h-3" />
            CLEAR
            <div className="text-meepGray-400">| CMD+BACKSPACE</div>
          </Button>
        )} */}
      </div>

      <PopoverContent className="w-[310px]  p-0" align="end">
        <Command>
          <CommandInput
            // placeholder={`Search ${selectedBoundaryLabel}`}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {/* <p>No {selectedBoundaryLabel} found.</p> */}
              <p className="text-xs text-meepGray-400 px-4 mt-1">
                Adjust the <span className="underline">border type</span> option
                in the left sidebar to see other areas.
              </p>
            </CommandEmpty>
            <CommandGroup>
              {/* {handleFiltering(searchQuery).map((area) => (
                <CommandItem
                  key={area.gss}
                  value={area.name}
                  onSelect={(currentValue) => {
                    setValue(area.name)
                    setOpen(false)
                    handleSelect(area.gss)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === area.name ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {area.name}
                </CommandItem>
              ))} */}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Same query from TopConstituencies
const CONSTITUENCY_STATS_OVERVIEW = gql`
  query ConstituencyStatsOverview(
    $reportID: ID!
    $analyticalAreaType: AnalyticalAreaType!
    $layerIds: [String!]!
  ) {
    mapReport(pk: $reportID) {
      id
      importedDataCountByConstituency: importedDataCountByArea(
        analyticalAreaType: $analyticalAreaType
        layerIds: $layerIds
      ) {
        label
        gss
        count
        gssArea {
          id
          name
          fitBounds
          mp: person(filters: { personType: "MP" }) {
            id
            name
            photo {
              url
            }
            party: personDatum(filters: { dataType_Name: "party" }) {
              name: data
            }
          }
          lastElection {
            stats {
              date
              majority
              electorate
              firstPartyResult {
                party
                shade
                votes
              }
              secondPartyResult {
                party
                shade
                votes
              }
            }
          }
        }
      }
    }
  }
`

const RECORD_EXPLORER_SUMMARY = gql`
  query RecordExplorerSummary($id: String!) {
    import: importedDataGeojsonPoint(genericDataId: $id) {
      id
      geometry {
        type
        coordinates
      }
      record: properties {
        id
        dataType {
          id
          name
          dataSet {
            id
            externalDataSource {
              id
              name
              organisation {
                id
                name
              }
              crmType
              dataType
            }
          }
        }
        postcode
        postcodeData {
          adminWard
          adminDistrict
          europeanElectoralRegion
          codes {
            adminWard
            adminDistrict
          }
        }
        title
        firstName
        lastName
        fullName
        email
        phone
        startTime
        endTime
        publicUrl
        address
        description
        json
        remoteUrl
      }
    }
  }
`
