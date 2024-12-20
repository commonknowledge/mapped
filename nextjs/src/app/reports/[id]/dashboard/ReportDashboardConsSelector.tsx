'use client'

import { Check, ChevronsUpDown, X } from 'lucide-react'
import * as React from 'react'

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
  constituencies: any[]
  selectedBoundary: any
  setSelectedBoundary: any
}) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState('')

  function getGSSfromGSSAreaID(gssAreaID: string) {
    return constituencies.find(
      (constituency) => constituency.gssArea.id === gssAreaID
    )?.gss
  }

  const [filteredConstituencies, setFilteredConstituencies] =
    React.useState(constituencies)

  function handleSearch(searchTerm: string) {
    const filteredConstituencies = constituencies.filter((constituency) =>
      constituency.gssArea.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredConstituencies(filteredConstituencies)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {selectedBoundary && (
        <Button
          variant="ghost"
          onClick={() => {
            setSelectedBoundary(null)
            setValue('')
          }}
        >
          <X className="w-3 h-3" />
        </Button>
      )}
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          {value
            ? constituencies.find(
                (constituency) => constituency.gssArea.id === value
              )?.gssArea.name
            : 'Select constituency...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder="Search framework..."
            onChange={(e) => handleSearch(e.target.value)}
          />
          <CommandList>
            <CommandEmpty>No constituency found.</CommandEmpty>
            <CommandGroup>
              {filteredConstituencies.map((constituency) => (
                <CommandItem
                  key={constituency.gssArea.id}
                  value={constituency.gssArea.id}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? '' : currentValue)
                    setOpen(false)
                    setSelectedBoundary(
                      getGSSfromGSSAreaID(currentValue as string)
                    )
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === constituency.gssArea.id
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  {constituency.gssArea.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
