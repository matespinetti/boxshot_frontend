"use client"

import { type Control } from "react-hook-form"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { CreateJobRequest } from "@/features/generation/types"

interface VariationSelectorProps {
  control: Control<CreateJobRequest>
}

export function VariationSelector({ control }: VariationSelectorProps) {
  return (
    <FormField
      control={control}
      name="variations"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Variations per combination</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={1}
              max={10}
              value={field.value ?? 1}
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
