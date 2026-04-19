import { zodResolver } from "@hookform/resolvers/zod"
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
  promptTemplateFormSchema,
  type PromptTemplateFormValues,
} from "@/features/admin/prompt-templates/schemas/prompt-template.schema"

interface PromptTemplateFormProps {
  onSubmit: (values: PromptTemplateFormValues) => void
  isSubmitting?: boolean
}

const DEFAULT_FORM_VALUES: PromptTemplateFormValues = {
  name: "",
  base_framework: "",
  quality_rules: "",
}

export function PromptTemplateForm({ onSubmit, isSubmitting }: PromptTemplateFormProps) {
  const form = useForm<PromptTemplateFormValues>({
    resolver: zodResolver(promptTemplateFormSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. v2-production" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="base_framework"
          render={({ field }) => (
            <FormItem>
              <PromptBlockEditor
                label="Base Framework Prompt"
                placeholder="You are an expert product photographer..."
                value={field.value}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quality_rules"
          render={({ field }) => (
            <FormItem>
              <PromptBlockEditor
                label="Quality Rules"
                placeholder="Ensure ultra-realistic lighting, 8k resolution..."
                value={field.value}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Create Template Version"}
        </Button>
      </form>
    </Form>
  )
}
