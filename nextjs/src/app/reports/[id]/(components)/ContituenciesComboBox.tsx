'use client'

import { Check, ChevronsUpDown } from 'lucide-react'
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
import {
  constituencyPanelTabAtom,
  isConstituencyPanelOpenAtom,
} from '@/lib/map/state'
import { cn } from '@/lib/utils'
import { useAtom, useSetAtom } from 'jotai'
import { selectedBoundaryAtom } from '../useSelectBoundary'

export function Combobox({
  options,
  setValue,
  value,
  label = 'Constituency',
}: {
  options: Array<{ value: string; label: string }>
  value: string
  label?: string
  setValue: (value: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const setTab = useSetAtom(constituencyPanelTabAtom)
  const setIsConstituencyPanelOpen = useSetAtom(isConstituencyPanelOpenAtom)
  const [selectedBoundary, setSelectedBoundary] = useAtom(selectedBoundaryAtom)

  const filteredOptions = React.useMemo(() => {
    const search = searchQuery.toLowerCase().trim()
    // console.log('Searching for:', search)

    return options.filter((option) => {
      const optionLabel = option.label.toLowerCase().trim()
      return optionLabel.includes(search)
    })
  }, [options, searchQuery])

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
      <PopoverTrigger asChild className="bg-slate-400">
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-meepGray-700"
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : `Select ${label}...`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={`Search ${label}...`}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No {label} found.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    // If already selected, deselect it
                    if (selectedBoundary === option.value) {
                      setSelectedBoundary(null)
                      setIsConstituencyPanelOpen(false)
                    } else {
                      // Select new constituency
                      setSelectedBoundary(option.value)
                      setIsConstituencyPanelOpen(true)
                    }
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
