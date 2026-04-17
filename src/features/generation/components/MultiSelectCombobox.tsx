"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils/cn"

interface MultiSelectComboboxProps {
  options: { value: string; label: string }[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder: string
  isLoading?: boolean
}

export function MultiSelectCombobox({
  options,
  value,
  onChange,
  placeholder,
  isLoading,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = useState(false)

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const remove = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue))
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={(isOpen: boolean) => setOpen(isOpen)}>
        <PopoverTrigger
          render={
            <Button
              role="combobox"
              variant="outline"
              type="button"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={isLoading}
            />
          }
        >
          {value.length > 0 ? `${value.length} selected` : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => toggle(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0",
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

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((v) => {
            const option = options.find((o) => o.value === v)
            return (
              <Badge key={v} variant="secondary" className="gap-1">
                {option?.label ?? v}
                <button
                  type="button"
                  onClick={() => remove(v)}
                  aria-label={`Remove ${option?.label ?? v}`}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
