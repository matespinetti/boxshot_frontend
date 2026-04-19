"use client"

import { type Control } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { Colour, CreateJobRequest } from "@/features/generation/types"

interface ColourSelectorProps {
  control: Control<CreateJobRequest>
  colours: Colour[]
  isLoading: boolean
  disabled?: boolean
}

export function ColourSelector({
  control,
  colours,
  isLoading,
  disabled,
}: ColourSelectorProps) {
  if (isLoading) return <Skeleton className="h-10 w-full" />

  return (
    <FormField
      control={control}
      name="colour_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Colour</FormLabel>
          <Select
            value={field.value || ""}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select colour...">
                {field.value
                  ? (() => {
                      const colour = colours.find((c) => c.id === field.value)
                      if (!colour) return undefined
                      return (
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-4 w-4 shrink-0 rounded-full border"
                            style={{
                              backgroundColor: colour.hex_preview ?? "#d1d5db",
                            }}
                          />
                          {colour.ral_code} — {colour.name}
                        </div>
                      )
                    })()
                  : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {colours.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-4 w-4 shrink-0 rounded-full border"
                      style={{ backgroundColor: c.hex_preview ?? "#d1d5db" }}
                    />
                    {c.ral_code} — {c.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
