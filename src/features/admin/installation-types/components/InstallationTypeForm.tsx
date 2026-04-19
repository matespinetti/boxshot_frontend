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
  installationTypeFormSchema,
  type InstallationTypeFormValues,
} from "@/features/admin/installation-types/schemas/installation-type.schema"

interface InstallationTypeFormProps {
  defaultValues?: Partial<InstallationTypeFormValues>
  onSubmit: (values: InstallationTypeFormValues) => void
  isSubmitting?: boolean
}

const DEFAULT_FORM_VALUES: InstallationTypeFormValues = {
  name: "",
  label: "",
  installation_prompt_block: "",
}

export function InstallationTypeForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: InstallationTypeFormProps) {
  const form = useForm<InstallationTypeFormValues>({
    resolver: zodResolver(installationTypeFormSchema),
    defaultValues: defaultValues ?? DEFAULT_FORM_VALUES,
  })

  // Reset form when defaultValues changes (e.g., when switching between Edit and Create in the same sheet)
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
              <FormLabel>Installation Type Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. wall-mounted" {...field} />
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
                <Input placeholder="e.g. Wall Mounted" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="installation_prompt_block"
          render={({ field }) => (
            <FormItem>
              <PromptBlockEditor
                label="Installation Prompt Block"
                placeholder="e.g. The product is securely mounted to a solid brick wall..."
                value={field.value}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Installation Type"}
        </Button>
      </form>
    </Form>
  )
}
