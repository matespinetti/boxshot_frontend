import { z } from "zod"

export const PreviewPromptsRequestSchema = z.object({
  product_id: z.string().uuid(),
  colour_id: z.string().uuid(),
  country_ids: z.array(z.string().uuid()).min(1),
  shot_type_ids: z.array(z.string().uuid()).min(1),
  prompt_template_id: z.string().uuid().optional(),
})
export type PreviewPromptsRequest = z.infer<typeof PreviewPromptsRequestSchema>

export const CreateJobRequestSchema = z.object({
  product_id: z.string().uuid(),
  colour_id: z.string().uuid(),
  country_ids: z.array(z.string().uuid()).min(1),
  shot_type_ids: z.array(z.string().uuid()).min(1),
  variations: z.number().int().min(1).max(10).default(1),
  prompt_template_id: z.string().uuid().nullable().optional(),
  product_image_ids: z.array(z.string().uuid()).max(9).optional(),
})
export type CreateJobRequest = z.infer<typeof CreateJobRequestSchema>
