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
import type {
  CreateJobRequest,
  InstallationType,
} from "@/features/generation/types"

interface InstallationTypeSelectorProps {
  control: Control<CreateJobRequest>
  installationTypes: InstallationType[]
  isLoading: boolean
}

export function InstallationTypeSelector({
  control,
  installationTypes,
  isLoading,
}: InstallationTypeSelectorProps) {
  if (isLoading) return <Skeleton className="h-10 w-full" />

  return (
    <FormField
      control={control}
      name="installation_type_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Installation Type</FormLabel>
          <Select value={field.value || ""} onValueChange={field.onChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select installation type...">
                {field.value
                  ? installationTypes.find((type) => type.id === field.value)
                      ?.label
                  : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {installationTypes.map((type) => (
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
