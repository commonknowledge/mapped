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
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export function Combobox({
  options,
  label = 'constituency',
  value,
  setValue,
}: {
  options: Array<{ value: string; label: string }>
  label?: string
  value: string
  setValue: (value: string) => void
}) {
  const [open, setOpen] = React.useState(false)

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
      <PopoverTrigger asChild>
        <Button
          variant="default"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-meepGray-700"
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : `Select ${label}...`}
          {/* {value.label} */}

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={`Search ${label}...`}
            onValueChange={(search) => {
              console.log('Search term:', search)
              console.log(
                'Available options:',
                options.map((o) => ({
                  value: o.value.toLowerCase(),
                  label: o.label.toLowerCase(),
                  matches:
                    o.value.toLowerCase().includes(search.toLowerCase()) ||
                    o.label.toLowerCase().includes(search.toLowerCase()),
                }))
              )
            }}
          />
          <CommandEmpty>No {label} found.</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={`${option.label.toLowerCase()} ${option.value.toLowerCase()}`}
                onSelect={(currentValue) => {
                  setValue(value === option.value ? '' : option.value)
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
        </Command>
      </PopoverContent>
    </Popover>
  )
}
