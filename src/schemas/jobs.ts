import { z } from "zod"

export const JobImageSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "pending",
    "generating",
    "complete",
    "failed",
    "approved",
    "rejected",
  ]),
  file_path: z.string().nullable(),
  regeneration_source_id: z.string().uuid().nullable(),
  product_id: z.string().uuid(),
  colour_id: z.string().uuid(),
  country_id: z.string().uuid(),
  shot_type_id: z.string().uuid(),
  variation_number: z.number(),
  created_at: z.string(),
  product_name: z.string(),
  ral_code: z.string(),
  country_code: z.string(),
  country_name: z.string(),
  shot_type_name: z.string(),
})
export type JobImage = z.infer<typeof JobImageSchema>

export const JobSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["idle", "generating", "complete", "failed"]),
  total_images: z.number(),
  completed_images: z.number(),
  created_at: z.string(),
  images: z.array(JobImageSchema),
})
export type Job = z.infer<typeof JobSchema>

export const JobListItemSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["idle", "generating", "complete", "failed"]),
  total_images: z.number(),
  completed_images: z.number(),
  created_at: z.string(),
})
export type JobListItem = z.infer<typeof JobListItemSchema>

export const JobsListResponseSchema = z.object({
  items: z.array(JobListItemSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  pages: z.number(),
})
export type JobsListResponse = z.infer<typeof JobsListResponseSchema>

export const PreviewItemSchema = z.object({
  country_id: z.string().uuid(),
  shot_type_id: z.string().uuid(),
  prompt: z.string(),
})
export type PreviewItem = z.infer<typeof PreviewItemSchema>

export const PreviewResponseSchema = z.object({
  prompts: z.array(PreviewItemSchema),
})
export type PreviewResponse = z.infer<typeof PreviewResponseSchema>
