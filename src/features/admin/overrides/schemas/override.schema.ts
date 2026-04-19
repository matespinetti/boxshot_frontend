import { z } from "zod"

export const overrideFormSchema = z.object({
  entity_type: z.string().min(1, "Entity type is required"),
  entity_id: z.string().uuid("Please select an entity"),
  override_key: z.string().min(1, "Override key is required"),
  override_value: z.string().min(1, "Override value is required"),
})

export type OverrideFormValues = z.infer<typeof overrideFormSchema>
