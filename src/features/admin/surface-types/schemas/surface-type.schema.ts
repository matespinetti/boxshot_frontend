import { z } from "zod"

export const surfaceTypeFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
  label: z.string().min(1, "Label is required").max(100, "Label must be 100 characters or less"),
  surface_prompt_block: z.string().min(1, "Surface prompt block is required").max(2000, "Must be 2000 characters or less"),
})

export type SurfaceTypeFormValues = z.infer<typeof surfaceTypeFormSchema>
