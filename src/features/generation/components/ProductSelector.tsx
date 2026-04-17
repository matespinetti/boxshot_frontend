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
import type { CreateJobRequest, Product } from "@/features/generation/types"

interface ProductSelectorProps {
  control: Control<CreateJobRequest>
  products: Product[]
  isLoading: boolean
}

export function ProductSelector({
  control,
  products,
  isLoading,
}: ProductSelectorProps) {
  if (isLoading) return <Skeleton className="h-10 w-full" />

  return (
    <FormField
      control={control}
      name="product_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Product</FormLabel>
          <Select value={field.value || ""} onValueChange={field.onChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select product..." />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
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
