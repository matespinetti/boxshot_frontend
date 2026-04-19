import { z } from "zod"

export const ColourFormSchema = z.object({
  ral_code: z.string().min(1, "RAL code is required"),
  name: z.string().min(1, "Name is required"),
  hex_preview: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex colour code (e.g., #FF0000)")
    .nullable()
    .optional(),
  finish_prompt_block: z.string().min(1, "Prompt block is required"),
})

export type ColourFormValues = z.infer<typeof ColourFormSchema>
