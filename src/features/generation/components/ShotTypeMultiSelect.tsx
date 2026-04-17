"use client"

import { type Control } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { CreateJobRequest, ShotType } from "@/features/generation/types"
import { MultiSelectCombobox } from "./MultiSelectCombobox"

interface ShotTypeMultiSelectProps {
  control: Control<CreateJobRequest>
  shotTypes: ShotType[]
  isLoading: boolean
}

export function ShotTypeMultiSelect({
  control,
  shotTypes,
  isLoading,
}: ShotTypeMultiSelectProps) {
  const options = shotTypes.map((s) => ({
    value: s.id,
    label: s.name,
  }))

  return (
    <FormField
      control={control}
      name="shot_type_ids"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Shot Types</FormLabel>
          <MultiSelectCombobox
            options={options}
            value={field.value ?? []}
            onChange={field.onChange}
            placeholder="Select shot types..."
            isLoading={isLoading}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
