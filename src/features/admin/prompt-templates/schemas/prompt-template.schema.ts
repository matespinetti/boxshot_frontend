import { z } from "zod"

export const promptTemplateFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  base_framework: z.string().min(1, "Base framework is required"),
  quality_rules: z.string().min(1, "Quality rules are required"),
})

export type PromptTemplateFormValues = z.infer<typeof promptTemplateFormSchema>
