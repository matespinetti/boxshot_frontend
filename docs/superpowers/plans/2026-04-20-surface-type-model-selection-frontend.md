# Frontend Surface Types + Model Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Next.js frontend with the backend’s new job-level `installation_type_id`, new `surface_type_id`, explicit `model` selection, and new admin `surface_types` entity.

**Architecture:** Keep the existing frontend structure intact and update it in place. First fix shared schemas and typed API readers so the app validates the real backend contract, then extend the generation flow with explicit selectors, then add a new admin `surface-types` module by following the established `installation-types` pattern, and finally remove product-level installation type assumptions from product admin surfaces and docs.

**Tech Stack:** Next.js App Router, TypeScript, TanStack Query v5, React Hook Form, Zod, shadcn/ui, Vitest

---

## File Map

### New files

- `src/features/generation/api/getInstallationTypes.ts`
- `src/features/generation/api/getSurfaceTypes.ts`
- `src/features/generation/api/getModels.ts`
- `src/features/generation/components/InstallationTypeSelector.tsx`
- `src/features/generation/components/SurfaceTypeSelector.tsx`
- `src/features/generation/components/ModelSelector.tsx`
- `src/features/generation/schemas/__tests__/generation.schema.test.ts`
- `src/features/admin/surface-types/api/surfaceTypes.ts`
- `src/features/admin/surface-types/components/SurfaceTypeForm.tsx`
- `src/features/admin/surface-types/components/SurfaceTypesAdminTable.tsx`
- `src/features/admin/surface-types/components/__tests__/SurfaceTypeForm.test.tsx`
- `src/features/admin/surface-types/components/__tests__/SurfaceTypesAdminTable.test.tsx`
- `src/features/admin/surface-types/schemas/surface-type.schema.ts`
- `src/app/(dashboard)/admin/surface-types/page.tsx`

### Modified files

- `src/schemas/entities.ts`
- `src/schemas/__tests__/entities.test.ts`
- `src/features/generation/types.ts`
- `src/features/generation/schemas/generation.schema.ts`
- `src/features/generation/queryKeys.ts`
- `src/features/generation/components/GenerationPanel.tsx`
- `src/features/generation/hooks/useGenerationForm.ts`
- `src/features/generation/api/createJob.ts`
- `src/features/generation/api/previewPrompts.ts`
- `src/features/admin/products/schemas/product.schema.ts`
- `src/features/admin/products/components/ProductForm.tsx`
- `src/features/admin/products/components/ProductsAdminTable.tsx`
- `src/features/admin/products/components/__tests__/ProductForm.test.tsx`
- `src/features/admin/products/components/__tests__/ProductsAdminTable.test.tsx`
- `src/components/layout/AppSidebar.tsx`
- `src/constants/routes.ts`
- `docs/BACKEND_API.md`
- `docs/REQUIREMENTS.md`

---

## Task 1: Fix shared schemas and generation request contracts

**Files:**
- Modify: `src/schemas/entities.ts`
- Modify: `src/schemas/__tests__/entities.test.ts`
- Modify: `src/features/generation/schemas/generation.schema.ts`
- Modify: `src/features/generation/types.ts`
- Create: `src/features/generation/schemas/__tests__/generation.schema.test.ts`

- [ ] **Step 1: Update `src/schemas/__tests__/entities.test.ts` with failing coverage for the new contract**

Add/replace the product and new entity assertions so the test reflects the backend shape:

```ts
describe("ProductSchema", () => {
  const valid = {
    id: UUID,
    name: "Chelsea",
    slug: "chelsea",
    active: true,
  }

  it("parses a valid product without installation_type_id", () => {
    expect(() => ProductSchema.parse(valid)).not.toThrow()
  })

  it("rejects a missing slug", () => {
    const { slug: _slug, ...withoutSlug } = valid
    expect(() => ProductSchema.parse(withoutSlug)).toThrow()
  })
})

describe("SurfaceTypeSchema", () => {
  it("parses a valid surface type", () => {
    expect(() =>
      SurfaceTypeSchema.parse({
        id: UUID,
        name: "brick_wall",
        label: "Brick Wall",
        active: true,
      }),
    ).not.toThrow()
  })
})

describe("ModelSchema", () => {
  it("parses a valid model option", () => {
    expect(() =>
      ModelSchema.parse({
        id: "fal-ai/gpt-image-1.5/edit",
        label: "GPT Image 1.5 Edit (Main)",
      }),
    ).not.toThrow()
  })
})
```

- [ ] **Step 2: Create `src/features/generation/schemas/__tests__/generation.schema.test.ts` with failing request-shape coverage**

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
    installation_type_id: UUID,
    surface_type_id: UUID,
    country_ids: [UUID],
    shot_type_ids: [UUID],
  }

  it("requires installation_type_id", () => {
    const { installation_type_id: _installationTypeId, ...withoutInstallation } = valid
    expect(() => PreviewPromptsRequestSchema.parse(withoutInstallation)).toThrow()
  })

  it("requires surface_type_id", () => {
    const { surface_type_id: _surfaceTypeId, ...withoutSurface } = valid
    expect(() => PreviewPromptsRequestSchema.parse(withoutSurface)).toThrow()
  })
})

describe("CreateJobRequestSchema", () => {
  const valid = {
    product_id: UUID,
    colour_id: UUID,
    installation_type_id: UUID,
    surface_type_id: UUID,
    country_ids: [UUID],
    shot_type_ids: [UUID],
    variations: 1,
    model: "fal-ai/gpt-image-1.5/edit",
  }

  it("requires model", () => {
    const { model: _model, ...withoutModel } = valid
    expect(() => CreateJobRequestSchema.parse(withoutModel)).toThrow()
  })
})
```

- [ ] **Step 3: Run the schema tests and confirm they fail for the expected reasons**

Run:

```bash
pnpm vitest run src/schemas/__tests__/entities.test.ts src/features/generation/schemas/__tests__/generation.schema.test.ts
```

Expected:

- `entities.test.ts` fails because `ProductSchema` still expects `installation_type_id`
- `generation.schema.test.ts` fails because the request schemas do not yet require `installation_type_id`, `surface_type_id`, and `model`

- [ ] **Step 4: Update `src/schemas/entities.ts` to match the backend entity shapes**

Add/remove schemas like this:

```ts
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  active: z.boolean(),
})

export const SurfaceTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  label: z.string(),
  active: z.boolean(),
})

export const SurfaceTypeAdminSchema = SurfaceTypeSchema.extend({
  surface_prompt_block: z.string(),
  deleted_at: z.string().nullable(),
})

export const ModelSchema = z.object({
  id: z.string(),
  label: z.string(),
})
```

- [ ] **Step 5: Update `src/features/generation/schemas/generation.schema.ts` and `src/features/generation/types.ts`**

Use these request shapes:

```ts
export const PreviewPromptsRequestSchema = z.object({
  product_id: z.string().uuid(),
  colour_id: z.string().uuid(),
  installation_type_id: z.string().uuid(),
  surface_type_id: z.string().uuid(),
  country_ids: z.array(z.string().uuid()).min(1),
  shot_type_ids: z.array(z.string().uuid()).min(1),
  prompt_template_id: z.string().uuid().optional(),
})

export const CreateJobRequestSchema = z.object({
  product_id: z.string().uuid(),
  colour_id: z.string().uuid(),
  installation_type_id: z.string().uuid(),
  surface_type_id: z.string().uuid(),
  country_ids: z.array(z.string().uuid()).min(1),
  shot_type_ids: z.array(z.string().uuid()).min(1),
  variations: z.number().int().min(1).max(10).default(1),
  prompt_template_id: z.string().uuid().nullable().optional(),
  product_image_ids: z.array(z.string().uuid()).max(9).optional(),
  model: z.string().min(1),
})
```

Also export the new entity/model types from `src/features/generation/types.ts`.

- [ ] **Step 6: Re-run the schema tests**

Run:

```bash
pnpm vitest run src/schemas/__tests__/entities.test.ts src/features/generation/schemas/__tests__/generation.schema.test.ts
```

Expected: PASS

- [ ] **Step 7: Commit the shared contract update**

```bash
git add \
  src/schemas/entities.ts \
  src/schemas/__tests__/entities.test.ts \
  src/features/generation/schemas/generation.schema.ts \
  src/features/generation/types.ts \
  src/features/generation/schemas/__tests__/generation.schema.test.ts
git commit -m "feat: align frontend schemas with surface type and model contract"
```

---

## Task 2: Add generation config readers and explicit selectors

**Files:**
- Create: `src/features/generation/api/getInstallationTypes.ts`
- Create: `src/features/generation/api/getSurfaceTypes.ts`
- Create: `src/features/generation/api/getModels.ts`
- Create: `src/features/generation/components/InstallationTypeSelector.tsx`
- Create: `src/features/generation/components/SurfaceTypeSelector.tsx`
- Create: `src/features/generation/components/ModelSelector.tsx`
- Modify: `src/features/generation/queryKeys.ts`
- Modify: `src/features/generation/components/GenerationPanel.tsx`

- [ ] **Step 1: Write a failing component/API test for the new generation selectors or extend existing generation tests**

If no generation panel test exists, create one focused test file:

`src/features/generation/components/__tests__/GenerationPanel.test.tsx`

Add a minimal assertion:

```tsx
it("renders installation type, surface type, and model selectors", async () => {
  render(<GenerationPanel />)

  expect(await screen.findByText("Installation Type")).toBeInTheDocument()
  expect(await screen.findByText("Surface Type")).toBeInTheDocument()
  expect(await screen.findByText("Model")).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the generation panel test and confirm it fails**

Run:

```bash
pnpm vitest run src/features/generation/components/__tests__/GenerationPanel.test.tsx
```

Expected: FAIL because those selectors do not exist yet

- [ ] **Step 3: Add typed query keys and config API readers**

In `src/features/generation/queryKeys.ts`, add keys like:

```ts
export const generationQueryKeys = {
  products: () => ["generation", "products"] as const,
  colours: () => ["generation", "colours"] as const,
  countries: () => ["generation", "countries"] as const,
  shotTypes: () => ["generation", "shotTypes"] as const,
  installationTypes: () => ["generation", "installationTypes"] as const,
  surfaceTypes: () => ["generation", "surfaceTypes"] as const,
  models: () => ["generation", "models"] as const,
}
```

Create readers using `apiClient` plus shared schemas:

```ts
export async function getSurfaceTypes(): Promise<PaginatedResponse<SurfaceType>> {
  const data = await apiClient.get<unknown>("/surface-types?per_page=100")
  return paginatedSchema(SurfaceTypeSchema).parse(data)
}

export async function getModels(): Promise<Model[]> {
  const data = await apiClient.get<unknown>("/models")
  return z.array(ModelSchema).parse(data)
}
```

- [ ] **Step 4: Add selector components matching the current generation UI**

Use the same pattern as the existing selectors:

```tsx
export function SurfaceTypeSelector({
  control,
  surfaceTypes,
  isLoading,
}: SurfaceTypeSelectorProps) {
  return (
    <FormField
      control={control}
      name="surface_type_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Surface Type</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading surface types..." : "Select a surface type"} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {surfaceTypes.map((surfaceType) => (
                <SelectItem key={surfaceType.id} value={surfaceType.id}>
                  {surfaceType.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
```

Create equivalent components for installation types and models.

- [ ] **Step 5: Wire the new readers and selectors into `GenerationPanel.tsx`**

Add the new queries:

```tsx
const { data: installationTypes, isLoading: installationTypesLoading } = useQuery({
  queryKey: generationQueryKeys.installationTypes(),
  queryFn: getInstallationTypes,
})

const { data: surfaceTypes, isLoading: surfaceTypesLoading } = useQuery({
  queryKey: generationQueryKeys.surfaceTypes(),
  queryFn: getSurfaceTypes,
})

const { data: models, isLoading: modelsLoading } = useQuery({
  queryKey: generationQueryKeys.models(),
  queryFn: getModels,
})
```

Render the three selectors in the form body and disable the submit button when no model options are available:

```tsx
const hasModels = (models?.length ?? 0) > 0

<InstallationTypeSelector
  control={control}
  installationTypes={installationTypes?.items ?? []}
  isLoading={installationTypesLoading}
/>
<SurfaceTypeSelector
  control={control}
  surfaceTypes={surfaceTypes?.items ?? []}
  isLoading={surfaceTypesLoading}
/>
<ModelSelector
  control={control}
  models={models ?? []}
  isLoading={modelsLoading}
/>

<Button
  type="submit"
  className="w-full"
  disabled={isPreviewing || totalImages === 0 || !hasModels}
>
```

- [ ] **Step 6: Re-run the generation panel test**

Run:

```bash
pnpm vitest run src/features/generation/components/__tests__/GenerationPanel.test.tsx
```

Expected: PASS

- [ ] **Step 7: Commit the new generation selectors**

```bash
git add \
  src/features/generation/api/getInstallationTypes.ts \
  src/features/generation/api/getSurfaceTypes.ts \
  src/features/generation/api/getModels.ts \
  src/features/generation/components/InstallationTypeSelector.tsx \
  src/features/generation/components/SurfaceTypeSelector.tsx \
  src/features/generation/components/ModelSelector.tsx \
  src/features/generation/components/GenerationPanel.tsx \
  src/features/generation/queryKeys.ts \
  src/features/generation/components/__tests__/GenerationPanel.test.tsx
git commit -m "feat: add installation, surface, and model selectors to generation"
```

---

## Task 3: Update generation form state and request payloads

**Files:**
- Modify: `src/features/generation/hooks/useGenerationForm.ts`
- Modify: `src/features/generation/api/createJob.ts`
- Modify: `src/features/generation/api/previewPrompts.ts`
- Modify: `src/features/generation/schemas/__tests__/generation.schema.test.ts`
- Test: `src/features/generation/components/__tests__/GenerationPanel.test.tsx`

- [ ] **Step 1: Add a failing test for the new preview/create payload behavior**

Extend the generation panel or hook test with explicit payload assertions:

```tsx
it("submits installation type, surface type, and model", async () => {
  const previewPrompts = vi.fn().mockResolvedValue({ prompts: [] })
  const createJob = vi.fn().mockResolvedValue({ id: "550e8400-e29b-41d4-a716-446655440000" })

  // mock modules, render, fill required fields, submit preview, confirm

  expect(previewPrompts).toHaveBeenCalledWith(
    expect.objectContaining({
      installation_type_id: expect.any(String),
      surface_type_id: expect.any(String),
    }),
  )

  expect(createJob).toHaveBeenCalledWith(
    expect.objectContaining({
      installation_type_id: expect.any(String),
      surface_type_id: expect.any(String),
      model: "fal-ai/gpt-image-1.5/edit",
    }),
  )
})
```

- [ ] **Step 2: Run the targeted test and confirm it fails**

Run:

```bash
pnpm vitest run src/features/generation/components/__tests__/GenerationPanel.test.tsx
```

Expected: FAIL because `useGenerationForm` still omits the new fields

- [ ] **Step 3: Expand `useGenerationForm.ts` defaults, URL state, and payload assembly**

Add defaults:

```ts
defaultValues: {
  product_id: searchParams.get("product_id") ?? "",
  colour_id: searchParams.get("colour_id") ?? "",
  installation_type_id: searchParams.get("installation_type_id") ?? "",
  surface_type_id: searchParams.get("surface_type_id") ?? "",
  model: searchParams.get("model") ?? "",
  country_ids: searchParams.get("country_ids")?.split(",").filter(Boolean) ?? [],
  shot_type_ids: searchParams.get("shot_type_ids")?.split(",").filter(Boolean) ?? [],
  variations: Number(searchParams.get("variations")) || 1,
  product_image_ids: searchParams.get("product_image_ids")?.split(",").filter(Boolean) ?? [],
}
```

Add `nuqs` state:

```ts
installation_type_id: parseAsString.withDefault(""),
surface_type_id: parseAsString.withDefault(""),
model: parseAsString.withDefault(""),
```

Update payload assembly:

```ts
const preview = await previewPrompts({
  product_id: data.product_id,
  colour_id: data.colour_id,
  installation_type_id: data.installation_type_id,
  surface_type_id: data.surface_type_id,
  country_ids: data.country_ids,
  shot_type_ids: data.shot_type_ids,
  ...(data.prompt_template_id != null ? { prompt_template_id: data.prompt_template_id } : {}),
})
```

```ts
const job = await createJob({
  product_id: data.product_id,
  colour_id: data.colour_id,
  installation_type_id: data.installation_type_id,
  surface_type_id: data.surface_type_id,
  country_ids: data.country_ids,
  shot_type_ids: data.shot_type_ids,
  variations: data.variations ?? 1,
  model: data.model,
  ...(data.prompt_template_id != null ? { prompt_template_id: data.prompt_template_id } : {}),
  ...(data.product_image_ids?.length ? { product_image_ids: data.product_image_ids } : {}),
})
```

Retain the product-change reset behavior for `colour_id` and `product_image_ids` only.

- [ ] **Step 4: Default the model from `/models` without introducing a client fallback**

In `GenerationPanel.tsx`, set the form value when model data arrives:

```tsx
useEffect(() => {
  if (!form.getValues("model") && models?.[0]?.id) {
    form.setValue("model", models[0].id, { shouldValidate: true })
  }
}, [form, models])
```

Render an inline empty/error message when `models` resolves to `[]`:

```tsx
{!modelsLoading && (models?.length ?? 0) === 0 ? (
  <p className="text-sm text-destructive">
    No generation models are available. Preview and generate are disabled.
  </p>
) : null}
```

- [ ] **Step 5: Re-run the targeted generation tests**

Run:

```bash
pnpm vitest run \
  src/features/generation/schemas/__tests__/generation.schema.test.ts \
  src/features/generation/components/__tests__/GenerationPanel.test.tsx
```

Expected: PASS

- [ ] **Step 6: Commit the generation form-state update**

```bash
git add \
  src/features/generation/hooks/useGenerationForm.ts \
  src/features/generation/api/createJob.ts \
  src/features/generation/api/previewPrompts.ts \
  src/features/generation/components/GenerationPanel.tsx \
  src/features/generation/components/__tests__/GenerationPanel.test.tsx \
  src/features/generation/schemas/__tests__/generation.schema.test.ts
git commit -m "feat: submit installation type, surface type, and model in generation flow"
```

---

## Task 4: Add the admin surface-types module

**Files:**
- Create: `src/features/admin/surface-types/api/surfaceTypes.ts`
- Create: `src/features/admin/surface-types/components/SurfaceTypeForm.tsx`
- Create: `src/features/admin/surface-types/components/SurfaceTypesAdminTable.tsx`
- Create: `src/features/admin/surface-types/components/__tests__/SurfaceTypeForm.test.tsx`
- Create: `src/features/admin/surface-types/components/__tests__/SurfaceTypesAdminTable.test.tsx`
- Create: `src/features/admin/surface-types/schemas/surface-type.schema.ts`
- Create: `src/app/(dashboard)/admin/surface-types/page.tsx`
- Modify: `src/components/layout/AppSidebar.tsx`
- Modify: `src/constants/routes.ts`

- [ ] **Step 1: Create failing tests for the new form and table components**

`src/features/admin/surface-types/components/__tests__/SurfaceTypeForm.test.tsx`

```tsx
it("renders name, label, and surface prompt block fields", () => {
  render(<SurfaceTypeForm onSubmit={vi.fn()} />)

  expect(screen.getByLabelText("Surface Type Name")).toBeInTheDocument()
  expect(screen.getByLabelText("Display Label")).toBeInTheDocument()
  expect(screen.getByText("Surface Prompt Block")).toBeInTheDocument()
})
```

`src/features/admin/surface-types/components/__tests__/SurfaceTypesAdminTable.test.tsx`

```tsx
it("renders surface type name and label columns", () => {
  render(
    <SurfaceTypesAdminTable
      data={[{
        id: UUID,
        name: "brick_wall",
        label: "Brick Wall",
        surface_prompt_block: "Traditional brick wall.",
        active: true,
        deleted_at: null,
      }]}
      onEdit={vi.fn()}
      onToggleDisabled={vi.fn()}
    />,
  )

  expect(screen.getByText("Brick Wall")).toBeInTheDocument()
  expect(screen.getByText("brick_wall")).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the new tests and confirm they fail**

Run:

```bash
pnpm vitest run \
  src/features/admin/surface-types/components/__tests__/SurfaceTypeForm.test.tsx \
  src/features/admin/surface-types/components/__tests__/SurfaceTypesAdminTable.test.tsx
```

Expected: FAIL because the files do not exist yet

- [ ] **Step 3: Create the surface-type schema and CRUD hooks**

`src/features/admin/surface-types/schemas/surface-type.schema.ts`

```ts
export const surfaceTypeFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
  label: z.string().min(1, "Label is required").max(100, "Label must be 100 characters or less"),
  surface_prompt_block: z.string().min(1, "Surface prompt block is required").max(2000, "Must be 2000 characters or less"),
})

export type SurfaceTypeFormValues = z.infer<typeof surfaceTypeFormSchema>
```

`src/features/admin/surface-types/api/surfaceTypes.ts`

```ts
export const surfaceTypesKeys = {
  all: ["admin", "surfaceTypes"] as const,
}

export function useAdminSurfaceTypes() {
  return useQuery({
    queryKey: surfaceTypesKeys.all,
    queryFn: async () => {
      const data = await apiClient.get<SurfaceTypeAdmin[]>("/admin/surface-types")
      return data
    },
  })
}
```

Add create/update mutations mirroring `installationTypes.ts`.

- [ ] **Step 4: Create `SurfaceTypeForm.tsx` and `SurfaceTypesAdminTable.tsx` following the installation-types pattern**

`SurfaceTypeForm.tsx`

```tsx
<FormField
  control={form.control}
  name="surface_prompt_block"
  render={({ field }) => (
    <FormItem>
      <PromptBlockEditor
        label="Surface Prompt Block"
        placeholder="e.g. Traditional brick wall with natural colour variation..."
        value={field.value}
        onChange={field.onChange}
      />
      <FormMessage />
    </FormItem>
  )}
/>
```

`SurfaceTypesAdminTable.tsx`

```tsx
columns={[
  { key: "name", header: "Name" },
  { key: "label", header: "Label" },
  {
    key: "active",
    header: "Status",
    render: (item) => <StatusBadge status={item.active ? "complete" : "failed"} />,
  },
]}
```

- [ ] **Step 5: Add the new admin route and navigation entry**

`src/constants/routes.ts`

```ts
surfaceTypes: "/admin/surface-types",
```

`src/components/layout/AppSidebar.tsx`

```tsx
{
  label: "Surface Types",
  href: ROUTES.admin.surfaceTypes,
  icon: Wrench,
},
```

`src/app/(dashboard)/admin/surface-types/page.tsx`

Use the same state/mutation pattern as `installation-types/page.tsx`, but target the surface-type hooks and strings.

- [ ] **Step 6: Re-run the surface-types tests**

Run:

```bash
pnpm vitest run \
  src/features/admin/surface-types/components/__tests__/SurfaceTypeForm.test.tsx \
  src/features/admin/surface-types/components/__tests__/SurfaceTypesAdminTable.test.tsx
```

Expected: PASS

- [ ] **Step 7: Commit the new admin module**

```bash
git add \
  src/features/admin/surface-types/ \
  src/app/'(dashboard)'/admin/surface-types/page.tsx \
  src/components/layout/AppSidebar.tsx \
  src/constants/routes.ts
git commit -m "feat: add admin surface types management"
```

---

## Task 5: Remove product-level installation type from admin products

**Files:**
- Modify: `src/features/admin/products/schemas/product.schema.ts`
- Modify: `src/features/admin/products/components/ProductForm.tsx`
- Modify: `src/features/admin/products/components/ProductsAdminTable.tsx`
- Modify: `src/features/admin/products/api/products.ts`
- Modify: `src/features/admin/products/components/__tests__/ProductForm.test.tsx`
- Modify: `src/features/admin/products/components/__tests__/ProductsAdminTable.test.tsx`

- [ ] **Step 1: Update the existing product-admin tests to fail against the new contract**

In `ProductForm.test.tsx`, remove installation type from valid payload expectations and assert the field is absent:

```tsx
it("does not render an installation type field", () => {
  render(<ProductForm onSubmit={vi.fn()} />)
  expect(screen.queryByText("Installation Type")).not.toBeInTheDocument()
})
```

In `ProductsAdminTable.test.tsx`, remove installation-type column expectations:

```tsx
it("renders name and slug without installation type", () => {
  render(<ProductsAdminTable data={[product]} onEdit={vi.fn()} onToggleDisabled={vi.fn()} />)
  expect(screen.getByText("Chelsea")).toBeInTheDocument()
  expect(screen.queryByText("Installation Type ID")).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run the product-admin tests and confirm they fail**

Run:

```bash
pnpm vitest run \
  src/features/admin/products/components/__tests__/ProductForm.test.tsx \
  src/features/admin/products/components/__tests__/ProductsAdminTable.test.tsx
```

Expected: FAIL because the form/table still reference installation type

- [ ] **Step 3: Remove installation type from the product admin schema and form**

`src/features/admin/products/schemas/product.schema.ts`

```ts
export const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  product_prompt_block: z.string().min(1, "Product prompt block is required"),
})
```

`src/features/admin/products/components/ProductForm.tsx`

Remove:

```tsx
const { data: installationTypes = [], isLoading: isLoadingInstallationTypes } = useAdminInstallationTypes()
```

and delete the whole `installation_type_id` form field block.

- [ ] **Step 4: Remove the installation type column from the products table**

Delete this block from `ProductsAdminTable.tsx`:

```tsx
{
  key: "installation_type_id",
  header: "Installation Type ID",
  render: (item) => (
    <Badge variant="outline" className="font-mono text-xs">
      {item.installation_type_id.split("-")[0]}...
    </Badge>
  ),
},
```

Also remove the `Badge` import if it becomes unused.

- [ ] **Step 5: Re-run the product-admin tests**

Run:

```bash
pnpm vitest run \
  src/features/admin/products/components/__tests__/ProductForm.test.tsx \
  src/features/admin/products/components/__tests__/ProductsAdminTable.test.tsx
```

Expected: PASS

- [ ] **Step 6: Commit the product admin cleanup**

```bash
git add \
  src/features/admin/products/schemas/product.schema.ts \
  src/features/admin/products/components/ProductForm.tsx \
  src/features/admin/products/components/ProductsAdminTable.tsx \
  src/features/admin/products/api/products.ts \
  src/features/admin/products/components/__tests__/ProductForm.test.tsx \
  src/features/admin/products/components/__tests__/ProductsAdminTable.test.tsx
git commit -m "refactor: remove product installation type dependency from admin"
```

---

## Task 6: Update frontend docs and run full verification

**Files:**
- Modify: `docs/BACKEND_API.md`
- Modify: `docs/REQUIREMENTS.md`
- Verify: `src/**` tests touched above

- [ ] **Step 1: Update `docs/BACKEND_API.md` to match the new backend contract**

Replace stale examples with the new shapes:

```md
### Products

{
  "items": [
    {
      "id": "uuid",
      "name": "Chelsea",
      "slug": "chelsea",
      "active": true
    }
  ]
}
```

Add sections for:

- `GET /surface-types`
- `GET /models`

Update the `POST /jobs/preview` and `POST /jobs` request examples to include:

- `installation_type_id`
- `surface_type_id`
- `model` on create

- [ ] **Step 2: Update `docs/REQUIREMENTS.md` so the frontend product/admin docs no longer contradict the backend**

Change generation requirements to include:

- installation type dropdown
- surface type dropdown
- model dropdown

Change product admin requirements to remove installation type from:

- table columns
- form fields

Add a new admin section:

```md
### Surface Types (`/admin/surface-types`)

**Table columns:** Name, Label, Status, Actions

**Form fields:**
- Name
- Label
- Surface Prompt Block
```

- [ ] **Step 3: Run focused tests for all touched feature areas**

Run:

```bash
pnpm vitest run \
  src/schemas/__tests__/entities.test.ts \
  src/features/generation/schemas/__tests__/generation.schema.test.ts \
  src/features/generation/components/__tests__/GenerationPanel.test.tsx \
  src/features/admin/products/components/__tests__/ProductForm.test.tsx \
  src/features/admin/products/components/__tests__/ProductsAdminTable.test.tsx \
  src/features/admin/surface-types/components/__tests__/SurfaceTypeForm.test.tsx \
  src/features/admin/surface-types/components/__tests__/SurfaceTypesAdminTable.test.tsx
```

Expected: PASS

- [ ] **Step 4: Run lint, typecheck, and the full test suite**

Run:

```bash
pnpm lint
pnpm type-check
pnpm vitest run
```

Expected:

- `pnpm lint` exits `0`
- `pnpm type-check` exits `0`
- `pnpm vitest run` exits `0`

- [ ] **Step 5: Commit the docs and verification pass**

```bash
git add docs/BACKEND_API.md docs/REQUIREMENTS.md
git commit -m "docs: update frontend docs for surface types and model selection"
```

---

## Self-Review

- Spec coverage:
  - generation selectors and payload changes are covered by Tasks 1-3
  - admin surface-types page is covered by Task 4
  - product admin cleanup is covered by Task 5
  - docs and verification are covered by Task 6
- Placeholder scan:
  - no `TODO`, `TBD`, or “similar to Task N” shortcuts remain
- Type consistency:
  - `installation_type_id`, `surface_type_id`, and `model` are used consistently in generation tasks
  - `surface_prompt_block` is used consistently in admin surface-type tasks
