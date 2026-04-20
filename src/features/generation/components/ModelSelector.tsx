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
import type { CreateJobRequest, Model } from "@/features/generation/types"

interface ModelSelectorProps {
  control: Control<CreateJobRequest>
  models: Model[]
  isLoading: boolean
}

export function ModelSelector({
  control,
  models,
  isLoading,
}: ModelSelectorProps) {
  if (isLoading) return <Skeleton className="h-10 w-full" />

  return (
    <FormField
      control={control}
      name="model"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Model</FormLabel>
          <Select value={field.value || ""} onValueChange={field.onChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select model...">
                {field.value
                  ? models.find((model) => model.id === field.value)?.label
                  : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.label}
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
