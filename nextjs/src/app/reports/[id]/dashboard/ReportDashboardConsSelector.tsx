'use client'

import { Check, ChevronsUpDown, X } from 'lucide-react'
import * as React from 'react'

import { ConstituencyStatsOverviewQuery } from '@/__generated__/graphql'
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
export default function ReportDashboardConsSelector({
  constituencies,
  selectedBoundary,
  setSelectedBoundary,
}: {
  constituencies: ConstituencyStatsOverviewQuery['mapReport']['importedDataCountByConstituency']
  selectedBoundary: any
  setSelectedBoundary: any
}) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState('')
  const [searchQuery, setSearchQuery] = React.useState('')

  function getGSSfromGSSAreaID(gssAreaID: string) {
    return constituencies.find(
      (constituency) => constituency?.gssArea?.id === gssAreaID
    )?.gss
  }

  function getMatchingConstituencies(searchTerm: string) {
    const search = searchTerm.toLowerCase().trim()
    return constituencies.filter((constituency) =>
      constituency?.gssArea?.name?.toLowerCase().includes(search)
    )
  }

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex gap-1 items-center">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[300px] justify-between text-sm font-normal"
          >
            {value
              ? constituencies.find(
                  (constituency) => constituency?.gssArea?.id === value
                )?.gssArea?.name
              : 'Filter by constituency...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        {selectedBoundary && (
          <Button
            variant="outline"
            onClick={() => {
              setSelectedBoundary(null)
              setValue('')
            }}
            className="text-sm font-normal flex items-center gap-2"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder="Search constituencies..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No constituency found.</CommandEmpty>
            <CommandGroup>
              {getMatchingConstituencies(searchQuery).map((constituency) => (
                <CommandItem
                  key={constituency.gssArea?.id}
                  value={constituency.gssArea?.name}
                  onSelect={(currentValue) => {
                    const selectedId = constituency?.gssArea?.id
                    if (selectedId) {
                      setValue(selectedId)
                      setOpen(false)
                      setSelectedBoundary(getGSSfromGSSAreaID(selectedId))
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
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
