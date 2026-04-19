---
title: Section 4 — Generation Feature (API + Types) Design
date: 2026-04-17
status: approved
---

# Generation Feature — API + Types Design

## Overview

This section establishes the data contract layer for the generation feature: shared Zod schemas for all API entities, generation-specific request schemas, 6 API functions, and a TanStack Query v5 key factory. No UI components or hooks are in scope.

`features/` does not exist yet — this section creates it from scratch.

## Architecture

**Schema-first.** Zod schemas in `src/schemas/` are the single source of truth for all entity shapes. TypeScript types are `z.infer<>` aliases — no separate interface declarations. The existing `lib/api/types.ts` (`PaginatedResponse<T>` interface) is left untouched; the new Zod-inferred type is structurally identical.

**API functions** call `apiClient` directly (which connects to `NEXT_PUBLIC_API_URL` — the FastAPI backend). Response validation happens at the API function level via `.parse()`. No Zod in components or hooks.

**Generation request schemas** (`features/generation/schemas/`) are separate from entity schemas because they validate user-submitted data (form inputs), not API responses. They are specific to the generation flow and not shared across features.

**Stack:**
- Zod v4.3.6 — schema definition and response validation
- TanStack Query v5.99.0 — query key factory (hooks in a later section)
- `lib/api/client.ts` — existing `apiClient` for all HTTP calls

## File Layout

```
src/schemas/
  pagination.ts              ← generic paginatedSchema() factory + PaginatedResponse<T> type
  entities.ts                ← Product, Colour, Country, ShotType, InstallationType, PromptTemplate
  jobs.ts                    ← Job, JobImage, PreviewItem, PreviewResponse

features/generation/
  types.ts                   ← re-exports all types consumed by generation components
  queryKeys.ts               ← TanStack Query v5 key factory for config lookups
  schemas/
    generation.schema.ts     ← CreateJobRequest, PreviewPromptsRequest
  api/
    getProducts.ts
    getColours.ts
    getCountries.ts
    getShotTypes.ts
    previewPrompts.ts
    createJob.ts
```

## Shared Schemas

### `src/schemas/pagination.ts`

Generic factory. Returns a typed Zod object schema for any paginated list response.

```ts
import { z } from "zod"

export const paginatedSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    per_page: z.number(),
    pages: z.number(),
  })

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}
```

### `src/schemas/entities.ts`

One schema per API entity. All fields match BACKEND_API.md field names exactly (snake_case). Types are inferred.

```ts
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
  version: z.number(),
  is_default: z.boolean(),
  created_at: z.string(),
})
export type PromptTemplate = z.infer<typeof PromptTemplateSchema>
```

`hex_preview` is `nullable()` because the field is optional on create — the backend may return `null`. `created_at` is a raw ISO string; no date coercion.

### `src/schemas/jobs.ts`

```ts
import { z } from "zod"

export const JobImageSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "generating", "complete", "failed", "approved", "rejected"]),
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
```

`file_path` and `regeneration_source_id` are `nullable()` — both are null until generation completes.

## Generation Request Schemas

### `features/generation/schemas/generation.schema.ts`

Validates the generation form inputs before they are sent to the API. Field constraints mirror BACKEND_API.md exactly.

```ts
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
```

`prompt_template_id` is `nullable().optional()` in CreateJobRequest to allow explicit `null` (use default template) or omission. In PreviewPromptsRequest it is `optional()` only (BACKEND_API.md says "omit to use default" — no `null` documented for preview).

## Generation Types Re-export

### `features/generation/types.ts`

Single import point for all types used by generation components and hooks. Components import from here — not from `src/schemas/` directly.

```ts
export type { Product, Colour, Country, ShotType, PromptTemplate } from "@/schemas/entities"
export type { Job, JobImage, PreviewItem, PreviewResponse } from "@/schemas/jobs"
export type { PaginatedResponse } from "@/schemas/pagination"
export type { CreateJobRequest, PreviewPromptsRequest } from "./schemas/generation.schema"
```

## Query Keys

### `features/generation/queryKeys.ts`

TanStack Query v5 key factory. Config dropdown data has no dynamic filters at the query-key level — always fetches all active items.

```ts
export const generationQueryKeys = {
  products: () => ["products"] as const,
  colours: () => ["colours"] as const,
  countries: () => ["countries"] as const,
  shotTypes: () => ["shot-types"] as const,
} as const
```

Keys follow the `[entity]` pattern from CLAUDE.md. Future additions (e.g. with filters) would extend: `products: (filters?) => ["products", filters] as const`.

## API Functions

All 6 functions follow the same pattern: call `apiClient`, parse with Zod, return the inferred type. No Zod in the call site.

### Config fetches — `getProducts`, `getColours`, `getCountries`, `getShotTypes`

Config entities are small sets (< 100 items in V1). All 4 functions use `per_page=100` (API max) to fetch all active items in a single request for the generation form dropdowns.

```ts
// features/generation/api/getProducts.ts
import { apiClient } from "@/lib/api/client"
import { paginatedSchema } from "@/schemas/pagination"
import { ProductSchema } from "@/schemas/entities"
import type { PaginatedResponse, Product } from "@/features/generation/types"

export async function getProducts(): Promise<PaginatedResponse<Product>> {
  const data = await apiClient.get<unknown>("/products?per_page=100")
  return paginatedSchema(ProductSchema).parse(data)
}
```

`getColours`, `getCountries`, `getShotTypes` follow the identical pattern with their schema and path:

| Function | Path | Schema |
|---|---|---|
| `getColours` | `/colours?per_page=100` | `ColourSchema` |
| `getCountries` | `/countries?per_page=100` | `CountrySchema` |
| `getShotTypes` | `/shot-types?per_page=100` | `ShotTypeSchema` |

### `features/generation/api/previewPrompts.ts`

```ts
import { apiClient } from "@/lib/api/client"
import { PreviewResponseSchema } from "@/schemas/jobs"
import type { PreviewPromptsRequest, PreviewResponse } from "@/features/generation/types"

export async function previewPrompts(body: PreviewPromptsRequest): Promise<PreviewResponse> {
  const data = await apiClient.post<unknown>("/jobs/preview", body)
  return PreviewResponseSchema.parse(data)
}
```

### `features/generation/api/createJob.ts`

```ts
import { apiClient } from "@/lib/api/client"
import { JobSchema } from "@/schemas/jobs"
import type { CreateJobRequest, Job } from "@/features/generation/types"

export async function createJob(body: CreateJobRequest): Promise<Job> {
  const data = await apiClient.post<unknown>("/jobs", body)
  return JobSchema.parse(data)
}
```

## Testing

Vitest unit tests for Zod schemas only. No tests for API functions (those are integration-level — they require a running FastAPI server).

**Schema tests cover:**
- Valid API response shapes parse without error
- `Colour` with `hex_preview: null` parses correctly
- `Job` with `images: []` parses correctly
- `JobImage` with `file_path: null` and `regeneration_source_id: null` parses correctly
- `CreateJobRequestSchema` rejects `country_ids: []` (min 1 violation)
- `CreateJobRequestSchema` rejects `product_image_ids` with 10 items (max 9 violation)
- `PreviewPromptsRequestSchema` parses without `prompt_template_id`
- Invalid UUID strings cause parse failure

Test files:
- `src/schemas/__tests__/entities.test.ts`
- `src/schemas/__tests__/jobs.test.ts`
- `features/generation/schemas/__tests__/generation.schema.test.ts`

## Checkpoint

`pnpm type-check` passes with no errors. All schema tests green (`pnpm test:run`). No API calls required to verify — schemas are pure TypeScript/Zod.
