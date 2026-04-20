import { z } from "zod"

export const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  product_prompt_block: z.string().min(1, "Product prompt block is required"),
})

export type ProductFormValues = z.infer<typeof productFormSchema>
