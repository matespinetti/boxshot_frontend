import { z } from "zod"

export const CountryFormSchema = z.object({
  code: z.string().min(1, "Code is required").max(5, "Code must be 5 characters or less"),
  name: z.string().min(1, "Name is required"),
  environment_prompt_block: z.string().min(1, "Environment prompt block is required"),
})

export type CountryFormValues = z.infer<typeof CountryFormSchema>
