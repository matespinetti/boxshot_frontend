import { z } from "zod"

export const installationTypeFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
  label: z.string().min(1, "Label is required").max(50, "Label must be 50 characters or less"),
  installation_prompt_block: z.string().min(1, "Installation prompt block is required").max(2000, "Must be 2000 characters or less"),
})

export type InstallationTypeFormValues = z.infer<typeof installationTypeFormSchema>
