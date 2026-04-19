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

export const ColourAdminSchema = ColourSchema.extend({
  finish_prompt_block: z.string(),
  deleted_at: z.string().nullable(),
})
export type ColourAdmin = z.infer<typeof ColourAdminSchema>

export const CountrySchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  active: z.boolean(),
})
export type Country = z.infer<typeof CountrySchema>

export const CountryAdminSchema = CountrySchema.extend({
  environment_prompt_block: z.string(),
  deleted_at: z.string().nullable(),
})
export type CountryAdmin = z.infer<typeof CountryAdminSchema>

export const ShotTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  intent: z.enum(["pdp", "lifestyle", "marketing"]),
  active: z.boolean(),
})
export type ShotType = z.infer<typeof ShotTypeSchema>

export const ShotTypeAdminSchema = ShotTypeSchema.extend({
  framing_prompt_block: z.string(),
  deleted_at: z.string().nullable(),
})
export type ShotTypeAdmin = z.infer<typeof ShotTypeAdminSchema>

export const InstallationTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  label: z.string(),
  active: z.boolean(),
})
export type InstallationType = z.infer<typeof InstallationTypeSchema>

export const InstallationTypeAdminSchema = InstallationTypeSchema.extend({
  installation_prompt_block: z.string(),
  deleted_at: z.string().nullable(),
})
export type InstallationTypeAdmin = z.infer<typeof InstallationTypeAdminSchema>

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

export const ProductImageSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  label: z.string(),
  url: z.string(),
  created_at: z.string(),
})
export type ProductImage = z.infer<typeof ProductImageSchema>
