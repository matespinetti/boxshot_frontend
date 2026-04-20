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
import type { CreateJobRequest, SurfaceType } from "@/features/generation/types"

interface SurfaceTypeSelectorProps {
  control: Control<CreateJobRequest>
  surfaceTypes: SurfaceType[]
  isLoading: boolean
}

export function SurfaceTypeSelector({
  control,
  surfaceTypes,
  isLoading,
}: SurfaceTypeSelectorProps) {
  if (isLoading) return <Skeleton className="h-10 w-full" />

  return (
    <FormField
      control={control}
      name="surface_type_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Surface Type</FormLabel>
          <Select value={field.value || ""} onValueChange={field.onChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select surface type...">
                {field.value
                  ? surfaceTypes.find((type) => type.id === field.value)?.label
                  : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {surfaceTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label}
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
