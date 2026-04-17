"use client"

import { type Control } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { Country, CreateJobRequest } from "@/features/generation/types"
import { MultiSelectCombobox } from "./MultiSelectCombobox"

interface CountryMultiSelectProps {
  control: Control<CreateJobRequest>
  countries: Country[]
  isLoading: boolean
}

export function CountryMultiSelect({
  control,
  countries,
  isLoading,
}: CountryMultiSelectProps) {
  const options = countries.map((c) => ({
    value: c.id,
    label: `${c.code} — ${c.name}`,
  }))

  return (
    <FormField
      control={control}
      name="country_ids"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Countries</FormLabel>
          <MultiSelectCombobox
            options={options}
            value={field.value ?? []}
            onChange={field.onChange}
            placeholder="Select countries..."
            isLoading={isLoading}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
