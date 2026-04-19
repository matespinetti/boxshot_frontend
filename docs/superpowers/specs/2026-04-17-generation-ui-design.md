---
title: Section 5 — Generation Feature UI Design
date: 2026-04-17
status: approved
---

# Generation Feature — UI Components Design

## Overview

This section builds the generation form UI: `generate/page.tsx` as a Server Component shell, and 8 components under `features/generation/components/`. All selections are stored in URL via nuqs (product requirement — selections survive refresh and are shareable). React Hook Form is the primary state manager; nuqs is the URL persistence layer.

`features/generation/components/` does not exist yet — this section creates it.

---

## Architecture

**Page shell.** `generate/page.tsx` is a Server Component that renders `<GenerationPanel />`. No async server-side data fetching — all config data loads client-side via TanStack Query.

**RHF + nuqs integration.** RHF owns form state and validation. On mount, `defaultValues` reads from `useSearchParams()` to rehydrate from URL. A single `useEffect` watches all RHF values and writes them back to URL via nuqs `useQueryStates`. URL sync is one-directional (RHF → URL), rehydration is one-time (URL → RHF at mount).

**Modal state.** `useState<PreviewResponse | null>(null)` in `GenerationPanel`. Non-null = modal open. No Zustand needed for this section.

**Component tree:**
```
generate/page.tsx  (Server Component)
  └── GenerationPanel  ("use client" — RHF + nuqs + TanStack Query)
        ├── ProductSelector         (useController, shadcn Select)
        ├── ColourSelector          (useController, shadcn Select + hex swatch)
        ├── CountryMultiSelect      (useController, Combobox: Popover + Command)
        ├── ShotTypeMultiSelect     (useController, Combobox: Popover + Command)
        ├── VariationSelector       (useController, number input 1–10)
        ├── ReferenceImageSelector  (prop: productId, onChange)
        └── PromptPreviewModal      (prop: open, prompts, onConfirm, onClose)
```

---

## Dependencies

**Install:**
- `nuqs` — URL search param state
- `react-hook-form` — form state + validation

**shadcn components to add:**
- `form` — RHF integration (FormField, FormItem, FormLabel, FormMessage)
- `select` — ProductSelector, ColourSelector
- `command` — combobox search list
- `popover` — combobox trigger wrapper
- `scroll-area` — reference image grid

---

## File Layout

```
src/
  app/
    (dashboard)/
      generate/
        page.tsx                          ← replace shell with GenerationPanel import

  features/generation/
    components/
      GenerationPanel.tsx                 ← "use client", RHF, nuqs, TanStack Query
      ProductSelector.tsx                 ← single Select
      ColourSelector.tsx                  ← single Select + hex swatch
      CountryMultiSelect.tsx              ← Popover + Command combobox
      ShotTypeMultiSelect.tsx             ← Popover + Command combobox
      VariationSelector.tsx               ← number input 1–10
      ReferenceImageSelector.tsx          ← image grid, max 9 selectable
      PromptPreviewModal.tsx              ← Dialog, read-only prompts
      __tests__/
        CountryMultiSelect.test.tsx
        ReferenceImageSelector.test.tsx
        PromptPreviewModal.test.tsx
    api/
      getProductImages.ts                 ← GET /admin/products/{id}/images (new)
    hooks/
      useGenerationForm.ts                ← RHF form, nuqs sync, submit handlers
      __tests__/
        useGenerationForm.test.ts

  schemas/
    entities.ts                           ← add ProductImageSchema + ProductImage type
```

---

## New API Function

### `src/features/generation/api/getProductImages.ts`

Calls `GET /admin/products/{id}/images`. Returns a flat array (not paginated).

```ts
import { apiClient } from "@/lib/api/client"
import { ProductImageSchema } from "@/schemas/entities"
import type { ProductImage } from "@/features/generation/types"
import { z } from "zod"

export async function getProductImages(productId: string): Promise<ProductImage[]> {
  const data = await apiClient.get<unknown>(`/admin/products/${productId}/images`)
  return z.array(ProductImageSchema).parse(data)
}
```

### `ProductImageSchema` — add to `src/schemas/entities.ts`

```ts
export const ProductImageSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  label: z.string(),
  url: z.string(),
  created_at: z.string(),
})
export type ProductImage = z.infer<typeof ProductImageSchema>
```

Add to `src/features/generation/types.ts`:
```ts
export type { ProductImage } from "@/schemas/entities"
```

---

## `useGenerationForm` Hook

Lives at `src/features/generation/hooks/useGenerationForm.ts`. Extracts all form orchestration from GenerationPanel.

**Responsibilities:**
- Creates RHF form instance with URL-rehydrated `defaultValues`
- Syncs RHF values → URL via nuqs `useQueryStates` on every change
- Computes `totalImages = countryIds.length × shotTypeIds.length × variations`
- `onSubmit`: validates, calls `previewPrompts()`, sets `previewData` (opens modal)
- `handleConfirm`: calls `createJob()`, redirects to `/jobs/{id}`
- Exposes loading states: `isPreviewing`, `isCreating`

```ts
// Rehydration
const searchParams = useSearchParams()
const form = useForm<CreateJobRequest>({
  defaultValues: {
    product_id: searchParams.get('product_id') ?? '',
    colour_id: searchParams.get('colour_id') ?? '',
    country_ids: searchParams.getAll('country_ids') ?? [],
    shot_type_ids: searchParams.getAll('shot_type_ids') ?? [],
    variations: Number(searchParams.get('variations')) || 1,
    product_image_ids: searchParams.getAll('product_image_ids') ?? [],
  }
})

// URL sync
const [, setParams] = useQueryStates({
  product_id: parseAsString.withDefault(''),
  colour_id: parseAsString.withDefault(''),
  country_ids: parseAsArrayOf(parseAsString).withDefault([]),
  shot_type_ids: parseAsArrayOf(parseAsString).withDefault([]),
  variations: parseAsInteger.withDefault(1),
  product_image_ids: parseAsArrayOf(parseAsString).withDefault([]),
})
const values = form.watch()
useEffect(() => { setParams(values) }, [JSON.stringify(values)])

// Total images counter
const totalImages = values.country_ids.length * values.shot_type_ids.length * (values.variations || 1)
```

---

## Component Designs

### `GenerationPanel`

Layout: two-column. Left column contains all form fields. Right column contains total images counter and Generate button (sticky at bottom on scroll).

Fetches config data:
```ts
const { data: products, isLoading: productsLoading } = useQuery({
  queryKey: generationQueryKeys.products(), queryFn: getProducts
})
// same pattern for colours, countries, shotTypes
```

Product images:
```ts
const productId = form.watch('product_id')
const { data: productImages } = useQuery({
  queryKey: ['product-images', productId],
  queryFn: () => getProductImages(productId!),
  enabled: !!productId,
})
```

When `product_id` changes, reset `colour_id` and `product_image_ids`:
```ts
const prevProductId = useRef(productId)
useEffect(() => {
  if (prevProductId.current && prevProductId.current !== productId) {
    form.setValue('colour_id', '')
    form.setValue('product_image_ids', [])
  }
  prevProductId.current = productId
}, [productId])
```

Error handling: preview or createJob failure shows a sonner toast. Modal stays open on createJob failure (user can retry).

### `ProductSelector`

shadcn `Select`. Shows skeleton while `productsLoading`. Options: product name. Single selection, required.

### `ColourSelector`

shadcn `Select` with custom `SelectItem` renderer. Each option shows:
- A 16×16px coloured circle (`background-color: hex_preview` or `bg-gray-300` if null)
- RAL code + name

Disabled until `product_id` is set (though colours are not filtered by product — UX convention: pick product first).

### `CountryMultiSelect` / `ShotTypeMultiSelect`

Identical pattern:
- shadcn `Popover` + `Command`
- Trigger button: "Select countries..." or count badge when items selected ("3 countries")
- Each item in Command list has a checkbox (checked = selected)
- Clicking a selected item removes it
- Selected items rendered as `Badge` pills below the trigger with an × to remove

### `VariationSelector`

shadcn `Input` type `number`. `min={1}` `max={10}`. Label: "Variations per combination". Inline note: "1 variation = fewer images, faster generation".

### `ReferenceImageSelector`

- Disabled + shows placeholder if no `product_id` selected
- Shows shadcn Skeleton grid while images loading
- ScrollArea containing a grid of image thumbnails (3 columns)
- Each thumbnail: `<img>` with `src={new URL(env.NEXT_PUBLIC_API_URL).origin + url}` (e.g. `http://localhost:8000` + `/static/studio/chelsea/front.jpg`). Selected = ring border highlight
- Selecting a 10th image is blocked (button/card disabled when 9 already selected)
- Warning badge (not hard block) shown below if 0 selected: "No reference images selected — text-to-image mode"

### `PromptPreviewModal`

shadcn `Dialog`. Props: `open: boolean`, `prompts: PreviewItem[]`, `onClose: () => void`, `onConfirm: () => void`, `isConfirming: boolean`.

Content:
- Header: "Review Prompts" + total count
- ScrollArea with one row per prompt: country code + shot type name + prompt text (monospace, truncated with expand)
- Footer: "Back" button (calls `onClose`) + "Confirm & Generate" button (calls `onConfirm`, shows spinner while `isConfirming`)

---

## State Flow Summary

```
URL params (nuqs)
    ↓ (on mount, one-time)
RHF defaultValues
    ↓ (on every change via useEffect)
URL params (nuqs) ← persists selections
    ↓ (on submit)
previewPrompts() → PreviewResponse → modal open
    ↓ (on confirm)
createJob() → Job → router.push('/jobs/' + job.id)
```

---

## Validation

RHF validation rules (from `CreateJobRequestSchema`):
- `product_id`: required (non-empty string)
- `colour_id`: required (non-empty string)
- `country_ids`: min 1 item
- `shot_type_ids`: min 1 item
- `variations`: min 1, max 10, integer

Generate button disabled when form is invalid or `isPreviewing`.

---

## Testing

### `useGenerationForm.test.ts`
- Rehydrates `defaultValues` from search params on mount
- `totalImages` = 2 × 3 × 2 = 12 (2 countries, 3 shot types, 2 variations)
- `totalImages` = 0 when country_ids or shot_type_ids are empty

### `CountryMultiSelect.test.tsx`
- Opens popover on trigger click
- Selecting an item adds it to `value` prop (via `onChange`)
- Selecting a selected item removes it from `value`
- Selected items render as Badge pills

### `ReferenceImageSelector.test.tsx`
- Shows skeleton while loading
- Renders image thumbnails when data arrives
- Blocks selection of a 10th image (9 already selected → remaining images disabled)
- Shows warning when 0 selected

### `PromptPreviewModal.test.tsx`
- Renders one row per `PreviewItem` in `prompts`
- "Back" button calls `onClose`
- "Confirm & Generate" button calls `onConfirm`
- Shows spinner on Confirm button when `isConfirming` is true

---

## Checkpoint

- `pnpm type-check` passes
- `pnpm test:run` — all 4 test files green
- Dev server running: generation form renders, selections persist on refresh, total counter updates live
