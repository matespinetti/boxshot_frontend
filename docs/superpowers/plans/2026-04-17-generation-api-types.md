# Generation Feature — API + Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the full data-contract layer for the generation feature — shared Zod schemas for all API entities, generation request schemas, 6 typed API functions, and a TanStack Query v5 key factory.

**Architecture:** Zod schemas in `src/schemas/` are the single source of truth. TypeScript types are `z.infer<>` aliases — no separate interface declarations needed. API functions in `features/generation/api/` call `apiClient` directly (connects to `NEXT_PUBLIC_API_URL` — the FastAPI backend), validate the response with `.parse()`, and return the inferred type. No Zod in components or hooks.

**Tech Stack:** Zod v4.3.6, TanStack Query v5.99.0, existing `lib/api/client.ts`

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/schemas/pagination.ts` | Generic `paginatedSchema()` factory |
| Create | `src/schemas/entities.ts` | Product, Colour, Country, ShotType, InstallationType, PromptTemplate |
| Create | `src/schemas/jobs.ts` | Job, JobImage, PreviewItem, PreviewResponse |
| Create | `src/schemas/__tests__/pagination.test.ts` | Tests for pagination factory |
| Create | `src/schemas/__tests__/entities.test.ts` | Tests for all entity schemas |
| Create | `src/schemas/__tests__/jobs.test.ts` | Tests for job/image schemas |
| Create | `src/features/generation/schemas/generation.schema.ts` | CreateJobRequest, PreviewPromptsRequest |
| Create | `src/features/generation/schemas/__tests__/generation.schema.test.ts` | Request schema tests |
| Create | `src/features/generation/types.ts` | Re-exports all types for generation consumers |
| Create | `src/features/generation/queryKeys.ts` | TanStack Query v5 key factory |
| Create | `src/features/generation/api/getProducts.ts` | GET /products?per_page=100 |
| Create | `src/features/generation/api/getColours.ts` | GET /colours?per_page=100 |
| Create | `src/features/generation/api/getCountries.ts` | GET /countries?per_page=100 |
| Create | `src/features/generation/api/getShotTypes.ts` | GET /shot-types?per_page=100 |
| Create | `src/features/generation/api/previewPrompts.ts` | POST /jobs/preview |
| Create | `src/features/generation/api/createJob.ts` | POST /jobs |

---

## Task 1: Pagination schema

**Files:**
- Create: `src/schemas/pagination.ts`
- Create: `src/schemas/__tests__/pagination.test.ts`

> **Before writing any code:** Use the context7 MCP to verify Zod v4 generic type syntax.
> Query: resolve library ID for "zod", then fetch docs for "ZodTypeAny generic object schema".
> Confirm that `z.ZodTypeAny` still exists in v4 and that `z.object({ items: z.array(itemSchema) })` inside a generic function is valid.

- [ ] **Step 1: Write the failing tests**

Create `src/schemas/__tests__/pagination.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { z } from "zod"
import { paginatedSchema } from "../pagination"

const itemSchema = z.object({ id: z.string() })

describe("paginatedSchema", () => {
  it("parses a valid paginated response", () => {
    const result = paginatedSchema(itemSchema).parse({
      items: [{ id: "abc" }],
      total: 1,
      page: 1,
      per_page: 20,
      pages: 1,
    })
    expect(result.items).toEqual([{ id: "abc" }])
    expect(result.total).toBe(1)
    expect(result.pages).toBe(1)
  })

  it("throws when required pagination fields are missing", () => {
    expect(() =>
      paginatedSchema(itemSchema).parse({ items: [], total: 1 })
    ).toThrow()
  })

  it("throws when an item does not match the item schema", () => {
    expect(() =>
      paginatedSchema(itemSchema).parse({
        items: [{ id: 123 }],
        total: 1,
        page: 1,
        per_page: 20,
        pages: 1,
      })
    ).toThrow()
  })

  it("parses an empty items array", () => {
    const result = paginatedSchema(itemSchema).parse({
      items: [],
      total: 0,
      page: 1,
      per_page: 20,
      pages: 0,
    })
    expect(result.items).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd frontend
pnpm vitest run src/schemas/__tests__/pagination.test.ts
```

Expected: FAIL with `Cannot find module '../pagination'`

- [ ] **Step 3: Implement `src/schemas/pagination.ts`**

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

- [ ] **Step 4: Run tests — confirm they pass**

```bash
pnpm vitest run src/schemas/__tests__/pagination.test.ts
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/schemas/pagination.ts src/schemas/__tests__/pagination.test.ts
git commit -m "feat: add generic paginatedSchema factory"
```

---

## Task 2: Entity schemas

**Files:**
- Create: `src/schemas/entities.ts`
- Create: `src/schemas/__tests__/entities.test.ts`

> **Before writing any code:** Use context7 MCP to confirm Zod v4 syntax for:
> - `z.string().uuid()` — UUID validation
> - `z.string().nullable()` — nullable fields
> - `z.enum([...])` — literal union enum
>
> Query: resolve library ID for "zod", then fetch docs for "nullable enum uuid string validation".

- [ ] **Step 1: Write the failing tests**

Create `src/schemas/__tests__/entities.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import {
  ColourSchema,
  CountrySchema,
  InstallationTypeSchema,
  ProductSchema,
  PromptTemplateSchema,
  ShotTypeSchema,
} from "../entities"

const UUID = "550e8400-e29b-41d4-a716-446655440000"

describe("ProductSchema", () => {
  const valid = {
    id: UUID,
    name: "Chelsea",
    slug: "chelsea",
    installation_type_id: UUID,
    active: true,
  }

  it("parses a valid product", () => {
    expect(() => ProductSchema.parse(valid)).not.toThrow()
  })

  it("rejects a non-UUID id", () => {
    expect(() => ProductSchema.parse({ ...valid, id: "not-a-uuid" })).toThrow()
  })

  it("rejects a non-UUID installation_type_id", () => {
    expect(() =>
      ProductSchema.parse({ ...valid, installation_type_id: "not-a-uuid" })
    ).toThrow()
  })
})

describe("ColourSchema", () => {
  const valid = {
    id: UUID,
    ral_code: "RAL7032",
    name: "Pebble Grey",
    hex_preview: "#b5b0a0",
    active: true,
  }

  it("parses a valid colour", () => {
    expect(() => ColourSchema.parse(valid)).not.toThrow()
  })

  it("parses hex_preview as null", () => {
    const result = ColourSchema.parse({ ...valid, hex_preview: null })
    expect(result.hex_preview).toBeNull()
  })

  it("rejects missing hex_preview (must be explicit null, not absent)", () => {
    const { hex_preview: _, ...withoutHex } = valid
    expect(() => ColourSchema.parse(withoutHex)).toThrow()
  })
})

describe("CountrySchema", () => {
  const valid = {
    id: UUID,
    code: "UK",
    name: "United Kingdom",
    active: true,
  }

  it("parses a valid country", () => {
    expect(() => CountrySchema.parse(valid)).not.toThrow()
  })

  it("rejects a missing code field", () => {
    const { code: _, ...withoutCode } = valid
    expect(() => CountrySchema.parse(withoutCode)).toThrow()
  })
})

describe("ShotTypeSchema", () => {
  const valid = {
    id: UUID,
    name: "PDP",
    intent: "pdp" as const,
    active: true,
  }

  it("parses valid intents: pdp, lifestyle, marketing", () => {
    expect(() => ShotTypeSchema.parse({ ...valid, intent: "pdp" })).not.toThrow()
    expect(() => ShotTypeSchema.parse({ ...valid, intent: "lifestyle" })).not.toThrow()
    expect(() => ShotTypeSchema.parse({ ...valid, intent: "marketing" })).not.toThrow()
  })

  it("rejects an invalid intent", () => {
    expect(() => ShotTypeSchema.parse({ ...valid, intent: "unknown" })).toThrow()
  })
})

describe("InstallationTypeSchema", () => {
  it("parses a valid installation type", () => {
    expect(() =>
      InstallationTypeSchema.parse({
        id: UUID,
        name: "built_in",
        label: "Built-In (Wall Integrated)",
        active: true,
      })
    ).not.toThrow()
  })
})

describe("PromptTemplateSchema", () => {
  it("parses a valid prompt template", () => {
    expect(() =>
      PromptTemplateSchema.parse({
        id: UUID,
        name: "Standard v1",
        base_framework: "Ultra-realistic architectural photograph...",
        quality_rules: "Highly detailed textures, photorealistic...",
        version: 1,
        is_default: true,
        created_at: "2026-04-15T10:00:00Z",
      })
    ).not.toThrow()
  })

  it("rejects a non-integer version", () => {
    expect(() =>
      PromptTemplateSchema.parse({
        id: UUID,
        name: "Standard v1",
        base_framework: "...",
        quality_rules: "...",
        version: "1",
        is_default: true,
        created_at: "2026-04-15T10:00:00Z",
      })
    ).toThrow()
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
pnpm vitest run src/schemas/__tests__/entities.test.ts
```

Expected: FAIL with `Cannot find module '../entities'`

- [ ] **Step 3: Implement `src/schemas/entities.ts`**

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

- [ ] **Step 4: Run tests — confirm they pass**

```bash
pnpm vitest run src/schemas/__tests__/entities.test.ts
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/schemas/entities.ts src/schemas/__tests__/entities.test.ts
git commit -m "feat: add entity schemas (Product, Colour, Country, ShotType, InstallationType, PromptTemplate)"
```

---

## Task 3: Job schemas

**Files:**
- Create: `src/schemas/jobs.ts`
- Create: `src/schemas/__tests__/jobs.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/schemas/__tests__/jobs.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import {
  JobImageSchema,
  JobSchema,
  PreviewItemSchema,
  PreviewResponseSchema,
} from "../jobs"

const UUID = "550e8400-e29b-41d4-a716-446655440000"

describe("JobImageSchema", () => {
  const valid = {
    id: UUID,
    status: "pending" as const,
    file_path: null,
    regeneration_source_id: null,
  }

  it("parses a pending image with null file_path and regeneration_source_id", () => {
    const result = JobImageSchema.parse(valid)
    expect(result.file_path).toBeNull()
    expect(result.regeneration_source_id).toBeNull()
  })

  it("parses a completed image with a file_path", () => {
    expect(() =>
      JobImageSchema.parse({
        ...valid,
        status: "complete",
        file_path: "/chelsea/RAL7032/UK/PDP/Chelsea_RAL7032_UK_PDP_V1.png",
      })
    ).not.toThrow()
  })

  it("parses a regenerated image with regeneration_source_id set", () => {
    const result = JobImageSchema.parse({
      ...valid,
      regeneration_source_id: UUID,
    })
    expect(result.regeneration_source_id).toBe(UUID)
  })

  it("rejects an invalid image status", () => {
    expect(() => JobImageSchema.parse({ ...valid, status: "uploading" })).toThrow()
  })

  it("accepts all valid image statuses", () => {
    const statuses = ["pending", "generating", "complete", "failed", "approved", "rejected"] as const
    for (const status of statuses) {
      expect(() => JobImageSchema.parse({ ...valid, status })).not.toThrow()
    }
  })
})

describe("JobSchema", () => {
  const valid = {
    id: UUID,
    status: "idle" as const,
    total_images: 4,
    completed_images: 0,
    images: [],
  }

  it("parses a job with an empty images array", () => {
    const result = JobSchema.parse(valid)
    expect(result.images).toEqual([])
  })

  it("parses a generating job with partial images", () => {
    expect(() =>
      JobSchema.parse({
        ...valid,
        status: "generating",
        completed_images: 2,
        images: [
          {
            id: UUID,
            status: "complete",
            file_path: "/chelsea/RAL7032/UK/PDP/img.png",
            regeneration_source_id: null,
          },
          {
            id: UUID,
            status: "pending",
            file_path: null,
            regeneration_source_id: null,
          },
        ],
      })
    ).not.toThrow()
  })

  it("rejects an invalid job status", () => {
    expect(() => JobSchema.parse({ ...valid, status: "cancelled" })).toThrow()
  })

  it("accepts all valid job statuses", () => {
    const statuses = ["idle", "generating", "complete", "failed"] as const
    for (const status of statuses) {
      expect(() => JobSchema.parse({ ...valid, status })).not.toThrow()
    }
  })
})

describe("PreviewItemSchema", () => {
  it("parses a valid preview item", () => {
    const result = PreviewItemSchema.parse({
      country_id: UUID,
      shot_type_id: UUID,
      prompt: "Ultra-realistic architectural photograph of...",
    })
    expect(result.prompt).toContain("Ultra-realistic")
  })
})

describe("PreviewResponseSchema", () => {
  it("parses a preview response with multiple prompts", () => {
    const result = PreviewResponseSchema.parse({
      prompts: [
        { country_id: UUID, shot_type_id: UUID, prompt: "Prompt A" },
        { country_id: UUID, shot_type_id: UUID, prompt: "Prompt B" },
      ],
    })
    expect(result.prompts).toHaveLength(2)
  })

  it("parses a preview response with an empty prompts array", () => {
    expect(() => PreviewResponseSchema.parse({ prompts: [] })).not.toThrow()
  })

  it("throws when prompts field is missing", () => {
    expect(() => PreviewResponseSchema.parse({})).toThrow()
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
pnpm vitest run src/schemas/__tests__/jobs.test.ts
```

Expected: FAIL with `Cannot find module '../jobs'`

- [ ] **Step 3: Implement `src/schemas/jobs.ts`**

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

- [ ] **Step 4: Run tests — confirm they pass**

```bash
pnpm vitest run src/schemas/__tests__/jobs.test.ts
```

Expected: all tests PASS

- [ ] **Step 5: Run all schema tests together**

```bash
pnpm vitest run src/schemas
```

Expected: all tests in `src/schemas/__tests__/` PASS

- [ ] **Step 6: Commit**

```bash
git add src/schemas/jobs.ts src/schemas/__tests__/jobs.test.ts
git commit -m "feat: add Job, JobImage, PreviewItem, PreviewResponse schemas"
```

---

## Task 4: Generation request schemas

**Files:**
- Create: `features/generation/schemas/generation.schema.ts`
- Create: `features/generation/schemas/__tests__/generation.schema.test.ts`

> **Before writing any code:** Use context7 MCP to verify Zod v4 array constraint methods.
> Query: resolve library ID for "zod", then fetch docs for "array min max nonempty constraints".
> Confirm `.min(1)` and `.max(9)` are valid on `z.array()` in Zod v4, and that `.default(1)` works on `z.number()`.

- [ ] **Step 1: Write the failing tests**

Create `features/generation/schemas/__tests__/generation.schema.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import {
  CreateJobRequestSchema,
  PreviewPromptsRequestSchema,
} from "../generation.schema"

const UUID = "550e8400-e29b-41d4-a716-446655440000"

describe("PreviewPromptsRequestSchema", () => {
  const valid = {
    product_id: UUID,
    colour_id: UUID,
    country_ids: [UUID],
    shot_type_ids: [UUID],
  }

  it("parses a minimal valid request without prompt_template_id", () => {
    const result = PreviewPromptsRequestSchema.parse(valid)
    expect(result.prompt_template_id).toBeUndefined()
  })

  it("parses a request with prompt_template_id", () => {
    const result = PreviewPromptsRequestSchema.parse({
      ...valid,
      prompt_template_id: UUID,
    })
    expect(result.prompt_template_id).toBe(UUID)
  })

  it("parses with multiple country_ids and shot_type_ids", () => {
    expect(() =>
      PreviewPromptsRequestSchema.parse({
        ...valid,
        country_ids: [UUID, UUID],
        shot_type_ids: [UUID, UUID, UUID],
      })
    ).not.toThrow()
  })

  it("rejects empty country_ids", () => {
    expect(() =>
      PreviewPromptsRequestSchema.parse({ ...valid, country_ids: [] })
    ).toThrow()
  })

  it("rejects empty shot_type_ids", () => {
    expect(() =>
      PreviewPromptsRequestSchema.parse({ ...valid, shot_type_ids: [] })
    ).toThrow()
  })

  it("rejects a non-UUID product_id", () => {
    expect(() =>
      PreviewPromptsRequestSchema.parse({ ...valid, product_id: "not-a-uuid" })
    ).toThrow()
  })
})

describe("CreateJobRequestSchema", () => {
  const valid = {
    product_id: UUID,
    colour_id: UUID,
    country_ids: [UUID],
    shot_type_ids: [UUID],
  }

  it("parses a minimal request and defaults variations to 1", () => {
    const result = CreateJobRequestSchema.parse(valid)
    expect(result.variations).toBe(1)
  })

  it("parses with explicit variations", () => {
    const result = CreateJobRequestSchema.parse({ ...valid, variations: 5 })
    expect(result.variations).toBe(5)
  })

  it("parses with product_image_ids up to 9 items", () => {
    expect(() =>
      CreateJobRequestSchema.parse({
        ...valid,
        product_image_ids: Array(9).fill(UUID),
      })
    ).not.toThrow()
  })

  it("rejects product_image_ids with 10 or more items", () => {
    expect(() =>
      CreateJobRequestSchema.parse({
        ...valid,
        product_image_ids: Array(10).fill(UUID),
      })
    ).toThrow()
  })

  it("rejects variations below 1", () => {
    expect(() =>
      CreateJobRequestSchema.parse({ ...valid, variations: 0 })
    ).toThrow()
  })

  it("rejects variations above 10", () => {
    expect(() =>
      CreateJobRequestSchema.parse({ ...valid, variations: 11 })
    ).toThrow()
  })

  it("rejects empty country_ids", () => {
    expect(() =>
      CreateJobRequestSchema.parse({ ...valid, country_ids: [] })
    ).toThrow()
  })

  it("rejects empty shot_type_ids", () => {
    expect(() =>
      CreateJobRequestSchema.parse({ ...valid, shot_type_ids: [] })
    ).toThrow()
  })

  it("accepts prompt_template_id as null", () => {
    const result = CreateJobRequestSchema.parse({
      ...valid,
      prompt_template_id: null,
    })
    expect(result.prompt_template_id).toBeNull()
  })

  it("accepts prompt_template_id as a UUID", () => {
    const result = CreateJobRequestSchema.parse({
      ...valid,
      prompt_template_id: UUID,
    })
    expect(result.prompt_template_id).toBe(UUID)
  })

  it("accepts omitted prompt_template_id", () => {
    const result = CreateJobRequestSchema.parse(valid)
    expect(result.prompt_template_id).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
pnpm vitest run src/features/generation/schemas/__tests__/generation.schema.test.ts
```

Expected: FAIL with `Cannot find module '../generation.schema'`

- [ ] **Step 3: Implement `features/generation/schemas/generation.schema.ts`**

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

- [ ] **Step 4: Run tests — confirm they pass**

```bash
pnpm vitest run features/generation/schemas/__tests__/generation.schema.test.ts
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add \
  src/features/generation/schemas/generation.schema.ts \
  src/features/generation/schemas/__tests__/generation.schema.test.ts
git commit -m "feat: add generation request schemas (CreateJobRequest, PreviewPromptsRequest)"
```

---

## Task 5: Types re-export + query keys

**Files:**
- Create: `src/features/generation/types.ts`
- Create: `src/features/generation/queryKeys.ts`

No tests needed — re-exports and key arrays have no logic to test. Type-check is the verification.

- [ ] **Step 1: Create `src/features/generation/types.ts`**

```ts
export type { Product, Colour, Country, ShotType, PromptTemplate } from "@/schemas/entities"
export type { Job, JobImage, PreviewItem, PreviewResponse } from "@/schemas/jobs"
export type { PaginatedResponse } from "@/schemas/pagination"
export type {
  CreateJobRequest,
  PreviewPromptsRequest,
} from "./schemas/generation.schema"
```

- [ ] **Step 2: Create `src/features/generation/queryKeys.ts`**

These keys follow the `[entity]` pattern from CLAUDE.md. They are used by TanStack Query `useQuery` hooks (implemented in a later section).

```ts
export const generationQueryKeys = {
  products: () => ["products"] as const,
  colours: () => ["colours"] as const,
  countries: () => ["countries"] as const,
  shotTypes: () => ["shot-types"] as const,
} as const
```

- [ ] **Step 3: Run type-check**

```bash
cd frontend
pnpm type-check
```

Expected: no errors. If you see path alias errors (`@/schemas/...`), confirm `tsconfig.json` has `"@/*": ["./src/*"]` in `compilerOptions.paths`.

- [ ] **Step 4: Commit**

```bash
git add \
  src/features/generation/types.ts \
  src/features/generation/queryKeys.ts
git commit -m "feat: add generation types re-export and query keys"
```

---

## Task 6: API functions

**Files:**
- Create: `src/features/generation/api/getProducts.ts`
- Create: `src/features/generation/api/getColours.ts`
- Create: `src/features/generation/api/getCountries.ts`
- Create: `src/features/generation/api/getShotTypes.ts`
- Create: `src/features/generation/api/previewPrompts.ts`
- Create: `src/features/generation/api/createJob.ts`

No unit tests — these functions call `apiClient` which calls the FastAPI backend. They require a running server to test. Type-check is the verification.

> **Context:** `apiClient` is at `src/lib/api/client.ts`. It exports `apiClient.get<T>(path)` and `apiClient.post<T>(path, body)`. It prepends `NEXT_PUBLIC_API_URL` (FastAPI at `http://localhost:8000/api/v1`) to the path. It throws `ApiError` on non-2xx responses. Pass `<unknown>` as `T` — Zod will validate and narrow the type.

- [ ] **Step 1: Create `src/features/generation/api/getProducts.ts`**

```ts
import { apiClient } from "@/lib/api/client"
import { ProductSchema } from "@/schemas/entities"
import { paginatedSchema } from "@/schemas/pagination"
import type { PaginatedResponse, Product } from "@/features/generation/types"

export async function getProducts(): Promise<PaginatedResponse<Product>> {
  const data = await apiClient.get<unknown>("/products?per_page=100")
  return paginatedSchema(ProductSchema).parse(data)
}
```

- [ ] **Step 2: Create `src/features/generation/api/getColours.ts`**

```ts
import { apiClient } from "@/lib/api/client"
import { ColourSchema } from "@/schemas/entities"
import { paginatedSchema } from "@/schemas/pagination"
import type { Colour, PaginatedResponse } from "@/features/generation/types"

export async function getColours(): Promise<PaginatedResponse<Colour>> {
  const data = await apiClient.get<unknown>("/colours?per_page=100")
  return paginatedSchema(ColourSchema).parse(data)
}
```

- [ ] **Step 3: Create `src/features/generation/api/getCountries.ts`**

```ts
import { apiClient } from "@/lib/api/client"
import { CountrySchema } from "@/schemas/entities"
import { paginatedSchema } from "@/schemas/pagination"
import type { Country, PaginatedResponse } from "@/features/generation/types"

export async function getCountries(): Promise<PaginatedResponse<Country>> {
  const data = await apiClient.get<unknown>("/countries?per_page=100")
  return paginatedSchema(CountrySchema).parse(data)
}
```

- [ ] **Step 4: Create `src/features/generation/api/getShotTypes.ts`**

```ts
import { apiClient } from "@/lib/api/client"
import { ShotTypeSchema } from "@/schemas/entities"
import { paginatedSchema } from "@/schemas/pagination"
import type { PaginatedResponse, ShotType } from "@/features/generation/types"

export async function getShotTypes(): Promise<PaginatedResponse<ShotType>> {
  const data = await apiClient.get<unknown>("/shot-types?per_page=100")
  return paginatedSchema(ShotTypeSchema).parse(data)
}
```

- [ ] **Step 5: Create `src/features/generation/api/previewPrompts.ts`**

```ts
import { apiClient } from "@/lib/api/client"
import { PreviewResponseSchema } from "@/schemas/jobs"
import type { PreviewPromptsRequest, PreviewResponse } from "@/features/generation/types"

export async function previewPrompts(body: PreviewPromptsRequest): Promise<PreviewResponse> {
  const data = await apiClient.post<unknown>("/jobs/preview", body)
  return PreviewResponseSchema.parse(data)
}
```

- [ ] **Step 6: Create `src/features/generation/api/createJob.ts`**

```ts
import { apiClient } from "@/lib/api/client"
import { JobSchema } from "@/schemas/jobs"
import type { CreateJobRequest, Job } from "@/features/generation/types"

export async function createJob(body: CreateJobRequest): Promise<Job> {
  const data = await apiClient.post<unknown>("/jobs", body)
  return JobSchema.parse(data)
}
```

- [ ] **Step 7: Run type-check — confirm zero errors**

```bash
cd frontend
pnpm type-check
```

Expected: no errors across all 16 new files.

- [ ] **Step 8: Run all schema tests — confirm still green**

```bash
pnpm test:run
```

Expected: all existing tests + new schema tests PASS. Zero failures.

- [ ] **Step 9: Commit**

```bash
git add \
  src/features/generation/api/getProducts.ts \
  src/features/generation/api/getColours.ts \
  src/features/generation/api/getCountries.ts \
  src/features/generation/api/getShotTypes.ts \
  src/features/generation/api/previewPrompts.ts \
  src/features/generation/api/createJob.ts
git commit -m "feat: add generation API functions (getProducts, getColours, getCountries, getShotTypes, previewPrompts, createJob)"
```

---

## Checkpoint

All tasks complete when:

- [ ] `pnpm type-check` passes with zero errors
- [ ] `pnpm test:run` passes — all 3 new test files green (pagination, entities, jobs, generation.schema)
- [ ] `src/schemas/` contains: `pagination.ts`, `entities.ts`, `jobs.ts`
- [ ] `src/features/generation/` contains: `types.ts`, `queryKeys.ts`, `schemas/generation.schema.ts`, `api/` with 6 files
