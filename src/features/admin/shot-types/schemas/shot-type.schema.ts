import { z } from "zod"

export const shotTypeFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
  intent: z.enum(["pdp", "lifestyle", "marketing"], {
    message: "Please select a valid intent",
  }),
  framing_prompt_block: z.string().min(1, "Framing prompt block is required").max(2000, "Must be 2000 characters or less"),
})

export type ShotTypeFormValues = z.infer<typeof shotTypeFormSchema>
