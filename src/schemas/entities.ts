import { z } from "zod"

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  installation_type_id: z.string().uuid(),
  active: z.boolean(),
})
export type Product = z.infer<typeof ProductSchema>

export const ColourSchema = z.object({
  id: z.string().uuid(),
  ral_code: z.string(),
  name: z.string(),
  hex_preview: z.string().nullable(),
  active: z.boolean(),
})
export type Colour = z.infer<typeof ColourSchema>

export const CountrySchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  active: z.boolean(),
})
export type Country = z.infer<typeof CountrySchema>

export const ShotTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  intent: z.enum(["pdp", "lifestyle", "marketing"]),
  active: z.boolean(),
})
export type ShotType = z.infer<typeof ShotTypeSchema>

export const InstallationTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  label: z.string(),
  active: z.boolean(),
})
export type InstallationType = z.infer<typeof InstallationTypeSchema>

export const PromptTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  base_framework: z.string(),
  quality_rules: z.string(),
  version: z.number().int(),
  is_default: z.boolean(),
  created_at: z.string(),
})
export type PromptTemplate = z.infer<typeof PromptTemplateSchema>
