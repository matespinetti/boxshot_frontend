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
})
export type JobImage = z.infer<typeof JobImageSchema>

export const JobSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["idle", "generating", "complete", "failed"]),
  total_images: z.number(),
  completed_images: z.number(),
  images: z.array(JobImageSchema),
})
export type Job = z.infer<typeof JobSchema>

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
