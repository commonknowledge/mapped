'use client'

import { Check, Locate, X } from 'lucide-react'
import * as React from 'react'

import {
  ConstituencyStatsOverviewQuery,
  ConstituencyStatsOverviewQueryVariables,
} from '@/__generated__/graphql'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { gql, useQuery } from '@apollo/client'
import { useAtom } from 'jotai'
import { useEffect } from 'react'
import { useReport } from '../(components)/ReportProvider'
import { selectedBoundaryAtom } from '../useSelectBoundary'

export default function ReportDashboardConsSelector() {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState('')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedBoundary, setSelectedBoundary] = useAtom(selectedBoundaryAtom)
  const { report } = useReport()

  const constituencyAnalytics = useQuery<
    ConstituencyStatsOverviewQuery,
    ConstituencyStatsOverviewQueryVariables
  >(CONSTITUENCY_STATS_OVERVIEW, {
    variables: {
      reportID: report.id,
      analyticalAreaType:
        report.displayOptions?.dataVisualisation?.boundaryType!,
      layerIds: [report.displayOptions?.dataVisualisation?.dataSource!],
    },
  })

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()

        setSelectedBoundary(null)
      }
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    if (selectedBoundary) {
      const gssAreaID = getGSSAreaIDfromGSS(selectedBoundary)
      if (gssAreaID) {
        setValue(gssAreaID)
      }
    }
    if (!selectedBoundary) {
      setValue('')
    }
  }, [selectedBoundary])

  const constituencies =
    constituencyAnalytics.data?.mapReport.importedDataCountByConstituency
      .filter((constituency) => constituency.gssArea)
      .sort((a, b) => b.count - a.count) // Sort by count in descending order

  if (constituencyAnalytics.loading) {
    return <div>Loading...</div>
  }

  function getGSSfromGSSAreaID(gssAreaID: string) {
    return constituencies?.find(
      (constituency) => constituency?.gssArea?.id === gssAreaID
    )?.gss
  }

  function getGSSAreaIDfromGSS(gss: string) {
    return constituencies?.find((constituency) => constituency?.gss === gss)
      ?.gssArea?.id
  }

  function getMatchingConstituencies(searchTerm: string) {
    const search = searchTerm.toLowerCase().trim()
    return constituencies?.filter((constituency) =>
      constituency?.gssArea?.name?.toLowerCase().includes(search)
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex  gap-1 items-center">
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className=" justify-between text-sm font-normal w-full hover:bg-meepGray-800 text-opacity-80 "
          >
            <Locate className="ml-2 h-4 w-4 shrink-0 opacity-50" />

            <div className="flex items-center gap-1">
              <span className="truncate =">
                {value
                  ? constituencies?.find(
                      (constituency) => constituency?.gssArea?.id === value
                    )?.gssArea?.name
                  : 'Select Constituency'}
              </span>
            </div>
            {!selectedBoundary && (
              <div className="text-xs text-meepGray-400">CMD+K</div>
            )}
          </Button>
        </PopoverTrigger>

        {selectedBoundary && (
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
        )}
      </div>

      <PopoverContent className="w-full  p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search constituencies..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No constituency found.</CommandEmpty>
            <CommandGroup>
              {getMatchingConstituencies(searchQuery)?.map((constituency) => (
                <CommandItem
                  key={constituency.gssArea?.id}
                  value={constituency.gssArea?.name}
                  onSelect={(currentValue) => {
                    const selectedId = constituency?.gssArea?.id
                    if (selectedId) {
                      setValue(selectedId)
                      setOpen(false)
                      setSelectedBoundary(
                        getGSSfromGSSAreaID(selectedId) || null
                      )
                    }
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === constituency.gssArea?.id
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  {constituency.gssArea?.name}
                  <span className="text-xs text-brandBlue ml-2">
                    {constituency.count > 0 && ` ${constituency.count}`}
                  </span>
                </CommandItem>
              ))}
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
