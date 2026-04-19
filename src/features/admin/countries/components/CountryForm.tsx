import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useEffect } from "react"

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
import { CountryFormSchema, type CountryFormValues } from "../schemas/country.schema"

interface CountryFormProps {
  defaultValues?: Partial<CountryFormValues>
  onSubmit: (data: CountryFormValues) => void
  isSubmitting?: boolean
}

export function CountryForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: CountryFormProps) {
  const form = useForm<CountryFormValues>({
    resolver: zodResolver(CountryFormSchema),
    defaultValues: {
      code: defaultValues?.code ?? "",
      name: defaultValues?.name ?? "",
      environment_prompt_block: defaultValues?.environment_prompt_block ?? "",
    },
  })

  // reset if defaultValues change (e.g. switching between different countries in edit mode)
  useEffect(() => {
    form.reset({
      code: defaultValues?.code ?? "",
      name: defaultValues?.name ?? "",
      environment_prompt_block: defaultValues?.environment_prompt_block ?? "",
    })
  }, [form, defaultValues])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country Code</FormLabel>
              <FormControl>
                <Input placeholder="e.g. US" {...field} maxLength={5} />
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
                <Input placeholder="e.g. United States" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="environment_prompt_block"
          render={({ field }) => (
            <FormItem>
              <PromptBlockEditor
                label="Environment Prompt Block"
                placeholder="e.g. situated in a bright, modern US office..."
                maxLength={2000}
                {...field}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 bg-primary text-primary-foreground [a]:hover:bg-primary/80 h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 w-full"
        >
          {isSubmitting ? "Saving..." : "Save Country"}
        </button>
      </form>
    </Form>
  )
}
