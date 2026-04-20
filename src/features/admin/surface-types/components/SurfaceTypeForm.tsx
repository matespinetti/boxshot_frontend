"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PromptBlockEditor } from "@/features/admin/components"
import {
  surfaceTypeFormSchema,
  type SurfaceTypeFormValues,
} from "@/features/admin/surface-types/schemas/surface-type.schema"

interface SurfaceTypeFormProps {
  defaultValues?: Partial<SurfaceTypeFormValues>
  onSubmit: (values: SurfaceTypeFormValues) => void
  isSubmitting?: boolean
}

const DEFAULT_FORM_VALUES: SurfaceTypeFormValues = {
  name: "",
  label: "",
  surface_prompt_block: "",
}

export function SurfaceTypeForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: SurfaceTypeFormProps) {
  const form = useForm<SurfaceTypeFormValues>({
    resolver: zodResolver(surfaceTypeFormSchema),
    defaultValues: defaultValues ?? DEFAULT_FORM_VALUES,
  })

  useEffect(() => {
    form.reset(defaultValues ?? DEFAULT_FORM_VALUES)
  }, [defaultValues, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Surface Type Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. brick_wall" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Label</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Brick Wall" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="surface_prompt_block"
          render={({ field }) => (
            <FormItem>
              <PromptBlockEditor
                label="Surface Prompt Block"
                placeholder="e.g. Traditional brick wall with natural colour variation..."
                value={field.value}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Surface Type"}
        </Button>
      </form>
    </Form>
  )
}
