"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

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
import { ColourFormSchema, type ColourFormValues } from "../schemas/colour.schema"
import { getHexFromRal } from "../utils/ral"
import { useEffect } from "react"

interface ColourFormProps {
  defaultValues?: Partial<ColourFormValues>
  onSubmit: (values: ColourFormValues) => void
  isSubmitting?: boolean
}

export function ColourForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: ColourFormProps) {
  const form = useForm<ColourFormValues>({
    resolver: zodResolver(ColourFormSchema),
    defaultValues: {
      ral_code: defaultValues?.ral_code ?? "",
      name: defaultValues?.name ?? "",
      hex_preview: defaultValues?.hex_preview ?? "",
      finish_prompt_block: defaultValues?.finish_prompt_block ?? "",
    },
  })
  
  // reset if defaultValues change (e.g. switching between different colors in edit mode)
  useEffect(() => {
    form.reset({
      ral_code: defaultValues?.ral_code ?? "",
      name: defaultValues?.name ?? "",
      hex_preview: defaultValues?.hex_preview ?? "",
      finish_prompt_block: defaultValues?.finish_prompt_block ?? "",
    })
  }, [form, defaultValues])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="ral_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>RAL Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. 9010"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e)
                    const hex = getHexFromRal(e.target.value)
                    if (hex) {
                      form.setValue("hex_preview", hex, { shouldValidate: true })
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Pure White" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hex_preview"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hex Preview</FormLabel>
              <FormControl>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    className="w-12 h-12 p-1 cursor-pointer"
                    {...field}
                    value={field.value ?? "#000000"}
                  />
                  <Input 
                    type="text" 
                    placeholder="#RRGGBB" 
                    className="font-mono uppercase w-32"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value
                      field.onChange(val === "" ? null : val)
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="finish_prompt_block"
          render={({ field }) => (
            <FormItem>
              <PromptBlockEditor
                label="Prompt Block"
                placeholder="e.g. painted with RAL 9010 pure white finish..."
                maxLength={2000}
                {...field}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Saving..." : "Save Colour"}
        </Button>
      </form>
    </Form>
  )
}
