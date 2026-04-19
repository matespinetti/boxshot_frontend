# Generation Feature UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full generation form UI — 8 components, a form orchestration hook, and the page shell — so users can select product/colour/countries/shot types, preview assembled prompts, and trigger a generation job.

**Architecture:** React Hook Form owns all form state and validation; nuqs syncs RHF values to URL on every change (one-directional) and rehydrates `defaultValues` from URL on mount. All 4 config lists load via TanStack Query. A single `useGenerationForm` hook extracts form orchestration from `GenerationPanel`.

**Tech Stack:** Next.js 16 App Router, React Hook Form + @hookform/resolvers/zod, nuqs, TanStack Query v5, shadcn/ui (form, select, command, popover, scroll-area), Zod v4, Vitest + @testing-library/react + @testing-library/user-event

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `src/app/providers.tsx` | Add NuqsAdapter wrapper |
| Modify | `src/app/(dashboard)/generate/page.tsx` | Replace shell with GenerationPanel inside Suspense |
| Modify | `src/schemas/entities.ts` | Add ProductImageSchema + ProductImage type |
| Modify | `src/features/generation/types.ts` | Add ProductImage re-export |
| Modify | `src/schemas/__tests__/entities.test.ts` | Add ProductImageSchema tests |
| Create | `src/features/generation/api/getProductImages.ts` | GET /admin/products/{id}/images |
| Create | `src/features/generation/hooks/useGenerationForm.ts` | RHF form, nuqs sync, totalImages, submit handlers |
| Create | `src/features/generation/hooks/__tests__/useGenerationForm.test.ts` | Hook unit tests |
| Create | `src/features/generation/components/PromptPreviewModal.tsx` | Read-only prompt review dialog |
| Create | `src/features/generation/components/__tests__/PromptPreviewModal.test.tsx` | Dialog tests |
| Create | `src/features/generation/components/MultiSelectCombobox.tsx` | Reusable Popover+Command multiselect |
| Create | `src/features/generation/components/__tests__/MultiSelectCombobox.test.tsx` | Combobox tests |
| Create | `src/features/generation/components/CountryMultiSelect.tsx` | RHF-wired country multiselect |
| Create | `src/features/generation/components/ShotTypeMultiSelect.tsx` | RHF-wired shot type multiselect |
| Create | `src/features/generation/components/ReferenceImageSelector.tsx` | Product image grid, max 9 |
| Create | `src/features/generation/components/__tests__/ReferenceImageSelector.test.tsx` | Image selector tests |
| Create | `src/features/generation/components/ProductSelector.tsx` | shadcn Select, single product |
| Create | `src/features/generation/components/ColourSelector.tsx` | shadcn Select + hex swatch |
| Create | `src/features/generation/components/VariationSelector.tsx` | Number input 1–10 |
| Create | `src/features/generation/components/GenerationPanel.tsx` | Assembles all components |

---

## Task 1: Install Dependencies + shadcn Components + NuqsAdapter

**Files:**
- Modify: `package.json` (via pnpm install)
- Modify: `src/app/providers.tsx`

- [ ] **Step 1: Install npm packages**

```bash
cd /path/to/frontend
pnpm add nuqs react-hook-form @hookform/resolvers
pnpm add -D @testing-library/user-event
```

Expected: packages installed, no peer dependency errors.

- [ ] **Step 2: Add shadcn components**

```bash
pnpm shadcn add form select command popover scroll-area
```

Expected: 5 new files in `src/components/ui/` — `form.tsx`, `select.tsx`, `command.tsx`, `popover.tsx`, `scroll-area.tsx`.

- [ ] **Step 3: Wrap providers with NuqsAdapter**

`src/app/providers.tsx` — full replacement:

```tsx
"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            staleTime: 30_000,
          },
        },
      }),
  )

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </NuqsAdapter>
  )
}
```

- [ ] **Step 4: Type-check to confirm setup is clean**

```bash
pnpm type-check
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml src/app/providers.tsx src/components/ui/
git commit -m "feat: install nuqs, react-hook-form, shadcn form components"
```

---

## Task 2: ProductImageSchema + getProductImages (TDD)

**Files:**
- Modify: `src/schemas/entities.ts`
- Modify: `src/features/generation/types.ts`
- Modify: `src/schemas/__tests__/entities.test.ts`
- Create: `src/features/generation/api/getProductImages.ts`

- [ ] **Step 1: Write the failing tests**

Add to the bottom of `src/schemas/__tests__/entities.test.ts`:

```ts
import {
  ColourSchema,
  CountrySchema,
  InstallationTypeSchema,
  ProductImageSchema,   // add to existing import
  ProductSchema,
  PromptTemplateSchema,
  ShotTypeSchema,
} from "../entities"

// ... (existing tests remain unchanged) ...

describe("ProductImageSchema", () => {
  const valid = {
    id: UUID,
    product_id: UUID,
    label: "Front view",
    url: "/static/studio/chelsea/front.jpg",
    created_at: "2026-04-15T10:00:00Z",
  }

  it("parses a valid product image", () => {
    const result = ProductImageSchema.parse(valid)
    expect(result.label).toBe("Front view")
    expect(result.url).toBe("/static/studio/chelsea/front.jpg")
  })

  it("rejects a non-UUID id", () => {
    expect(() => ProductImageSchema.parse({ ...valid, id: "not-a-uuid" })).toThrow()
  })

  it("rejects a non-UUID product_id", () => {
    expect(() => ProductImageSchema.parse({ ...valid, product_id: "not-a-uuid" })).toThrow()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test:run src/schemas/__tests__/entities.test.ts
```

Expected: FAIL — `ProductImageSchema` is not exported from `../entities`.

- [ ] **Step 3: Add ProductImageSchema to entities.ts**

Add to the bottom of `src/schemas/entities.ts`:

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

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test:run src/schemas/__tests__/entities.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Add ProductImage re-export to types.ts**

Add one line to `src/features/generation/types.ts`:

```ts
export type {
  Colour,
  Country,
  Product,
  ProductImage,    // add this line
  PromptTemplate,
  ShotType,
} from "@/schemas/entities"
export type {
  Job,
  JobImage,
  PreviewItem,
  PreviewResponse,
} from "@/schemas/jobs"
export type { PaginatedResponse } from "@/schemas/pagination"
export type {
  CreateJobRequest,
  PreviewPromptsRequest,
} from "./schemas/generation.schema"
```

- [ ] **Step 6: Create getProductImages.ts**

Create `src/features/generation/api/getProductImages.ts`:

```ts
import { z } from "zod"
import { apiClient } from "@/lib/api/client"
import { ProductImageSchema } from "@/schemas/entities"
import type { ProductImage } from "@/features/generation/types"

export async function getProductImages(productId: string): Promise<ProductImage[]> {
  const data = await apiClient.get<unknown>(`/admin/products/${productId}/images`)
  return z.array(ProductImageSchema).parse(data)
}
```

- [ ] **Step 7: Type-check**

```bash
pnpm type-check
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/schemas/entities.ts src/schemas/__tests__/entities.test.ts \
  src/features/generation/types.ts src/features/generation/api/getProductImages.ts
git commit -m "feat: add ProductImageSchema and getProductImages API function"
```

---

## Task 3: useGenerationForm Hook (TDD)

**Files:**
- Create: `src/features/generation/hooks/__tests__/useGenerationForm.test.ts`
- Create: `src/features/generation/hooks/useGenerationForm.ts`

**Context:** This hook owns all form state. RHF is primary state; nuqs syncs values to URL on every change. Arrays are serialized by nuqs as comma-separated (`?country_ids=id1,id2`), so rehydration reads with `.split(",").filter(Boolean)`, not `.getAll()`.

- [ ] **Step 1: Write the failing tests**

Create `src/features/generation/hooks/__tests__/useGenerationForm.test.ts`:

```ts
import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useSearchParams } from "next/navigation"

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

vi.mock("nuqs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("nuqs")>()
  return { ...actual, useQueryStates: () => [{}, vi.fn()] }
})

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }))

import { useGenerationForm } from "../useGenerationForm"

describe("useGenerationForm", () => {
  beforeEach(() => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as ReturnType<typeof useSearchParams>)
  })

  it("initialises totalImages as 0 when no selections", () => {
    const { result } = renderHook(() => useGenerationForm())
    expect(result.current.totalImages).toBe(0)
  })

  it("computes totalImages as country_ids.length × shot_type_ids.length × variations", () => {
    const { result } = renderHook(() => useGenerationForm())
    act(() => {
      result.current.form.setValue("country_ids", ["c1", "c2"])
      result.current.form.setValue("shot_type_ids", ["s1", "s2", "s3"])
      result.current.form.setValue("variations", 2)
    })
    expect(result.current.totalImages).toBe(12)
  })

  it("rehydrates product_id and variations from search params on mount", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("product_id=some-product&variations=3") as ReturnType<typeof useSearchParams>
    )
    const { result } = renderHook(() => useGenerationForm())
    expect(result.current.form.getValues("product_id")).toBe("some-product")
    expect(result.current.form.getValues("variations")).toBe(3)
  })

  it("rehydrates comma-separated country_ids from search params", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("country_ids=id1,id2,id3") as ReturnType<typeof useSearchParams>
    )
    const { result } = renderHook(() => useGenerationForm())
    expect(result.current.form.getValues("country_ids")).toEqual(["id1", "id2", "id3"])
  })

  it("exposes previewData as null initially", () => {
    const { result } = renderHook(() => useGenerationForm())
    expect(result.current.previewData).toBeNull()
  })

  it("exposes isPreviewing as false initially", () => {
    const { result } = renderHook(() => useGenerationForm())
    expect(result.current.isPreviewing).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test:run src/features/generation/hooks/__tests__/useGenerationForm.test.ts
```

Expected: FAIL — `useGenerationForm` module not found.

- [ ] **Step 3: Implement useGenerationForm**

Create `src/features/generation/hooks/useGenerationForm.ts`:

```ts
"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSearchParams, useRouter } from "next/navigation"
import {
  useQueryStates,
  parseAsString,
  parseAsArrayOf,
  parseAsInteger,
} from "nuqs"
import { toast } from "sonner"
import {
  CreateJobRequestSchema,
  type CreateJobRequest,
} from "@/features/generation/schemas/generation.schema"
import { previewPrompts } from "@/features/generation/api/previewPrompts"
import { createJob } from "@/features/generation/api/createJob"
import type { PreviewResponse } from "@/features/generation/types"

export function useGenerationForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const form = useForm<CreateJobRequest>({
    resolver: zodResolver(CreateJobRequestSchema),
    mode: "onSubmit",
    defaultValues: {
      product_id: searchParams.get("product_id") ?? "",
      colour_id: searchParams.get("colour_id") ?? "",
      country_ids:
        searchParams.get("country_ids")?.split(",").filter(Boolean) ?? [],
      shot_type_ids:
        searchParams.get("shot_type_ids")?.split(",").filter(Boolean) ?? [],
      variations: Number(searchParams.get("variations")) || 1,
      product_image_ids:
        searchParams.get("product_image_ids")?.split(",").filter(Boolean) ?? [],
    },
  })

  const [, setParams] = useQueryStates(
    {
      product_id: parseAsString.withDefault(""),
      colour_id: parseAsString.withDefault(""),
      country_ids: parseAsArrayOf(parseAsString).withDefault([]),
      shot_type_ids: parseAsArrayOf(parseAsString).withDefault([]),
      variations: parseAsInteger.withDefault(1),
      product_image_ids: parseAsArrayOf(parseAsString).withDefault([]),
    },
    { history: "replace" },
  )

  const values = form.watch()

  useEffect(() => {
    void setParams({
      product_id: values.product_id ?? "",
      colour_id: values.colour_id ?? "",
      country_ids: values.country_ids ?? [],
      shot_type_ids: values.shot_type_ids ?? [],
      variations: values.variations ?? 1,
      product_image_ids: values.product_image_ids ?? [],
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)])

  const prevProductId = useRef(values.product_id)
  useEffect(() => {
    if (prevProductId.current && prevProductId.current !== values.product_id) {
      form.setValue("colour_id", "")
      form.setValue("product_image_ids", [])
    }
    prevProductId.current = values.product_id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.product_id])

  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const totalImages =
    (values.country_ids?.length ?? 0) *
    (values.shot_type_ids?.length ?? 0) *
    (values.variations || 1)

  const handlePreview = async (data: CreateJobRequest) => {
    setIsPreviewing(true)
    try {
      const preview = await previewPrompts(data)
      setPreviewData(preview)
    } catch {
      toast.error("Failed to preview prompts")
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleConfirm = async () => {
    const data = form.getValues()
    setIsCreating(true)
    try {
      const job = await createJob(data)
      router.push(`/jobs/${job.id}`)
    } catch {
      toast.error("Failed to create job")
      setIsCreating(false)
    }
  }

  const handleCloseModal = () => setPreviewData(null)

  return {
    form,
    totalImages,
    previewData,
    isPreviewing,
    isCreating,
    onSubmit: form.handleSubmit(handlePreview),
    handleConfirm,
    handleCloseModal,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test:run src/features/generation/hooks/__tests__/useGenerationForm.test.ts
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Type-check**

```bash
pnpm type-check
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/generation/hooks/
git commit -m "feat: add useGenerationForm hook with RHF + nuqs sync"
```

---

## Task 4: PromptPreviewModal (TDD)

**Files:**
- Create: `src/features/generation/components/__tests__/PromptPreviewModal.test.tsx`
- Create: `src/features/generation/components/PromptPreviewModal.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/features/generation/components/__tests__/PromptPreviewModal.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { PromptPreviewModal } from "../PromptPreviewModal"

const mockPrompts = [
  { country_id: "country-1", shot_type_id: "shot-1", prompt: "A beautiful product photo" },
  { country_id: "country-2", shot_type_id: "shot-2", prompt: "Another beautiful photo" },
]

describe("PromptPreviewModal", () => {
  it("renders one row per prompt item", () => {
    render(
      <PromptPreviewModal
        open={true}
        prompts={mockPrompts}
        isConfirming={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByText("A beautiful product photo")).toBeInTheDocument()
    expect(screen.getByText("Another beautiful photo")).toBeInTheDocument()
  })

  it("calls onClose when Back is clicked", async () => {
    const onClose = vi.fn()
    render(
      <PromptPreviewModal
        open={true}
        prompts={mockPrompts}
        isConfirming={false}
        onClose={onClose}
        onConfirm={vi.fn()}
      />,
    )
    await userEvent.click(screen.getByRole("button", { name: /back/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("calls onConfirm when Confirm & Generate is clicked", async () => {
    const onConfirm = vi.fn()
    render(
      <PromptPreviewModal
        open={true}
        prompts={mockPrompts}
        isConfirming={false}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    )
    await userEvent.click(screen.getByRole("button", { name: /confirm & generate/i }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it("shows Generating... text when isConfirming is true", () => {
    render(
      <PromptPreviewModal
        open={true}
        prompts={mockPrompts}
        isConfirming={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByRole("button", { name: /generating\.\.\./i })).toBeInTheDocument()
  })

  it("does not render content when open is false", () => {
    render(
      <PromptPreviewModal
        open={false}
        prompts={mockPrompts}
        isConfirming={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.queryByText("A beautiful product photo")).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test:run src/features/generation/components/__tests__/PromptPreviewModal.test.tsx
```

Expected: FAIL — `PromptPreviewModal` not found.

- [ ] **Step 3: Implement PromptPreviewModal**

Create `src/features/generation/components/PromptPreviewModal.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { PreviewItem } from "@/features/generation/types"

interface PromptPreviewModalProps {
  open: boolean
  prompts: PreviewItem[]
  isConfirming: boolean
  onClose: () => void
  onConfirm: () => void
}

export function PromptPreviewModal({
  open,
  prompts,
  isConfirming,
  onClose,
  onConfirm,
}: PromptPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Prompts ({prompts.length})</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <ul className="space-y-4 p-1">
            {prompts.map((item, i) => (
              <li key={i} className="rounded border p-3">
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  {item.country_id} / {item.shot_type_id}
                </div>
                <p className="font-mono text-sm">{item.prompt}</p>
              </li>
            ))}
          </ul>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            Back
          </Button>
          <Button onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? "Generating..." : "Confirm & Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test:run src/features/generation/components/__tests__/PromptPreviewModal.test.tsx
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/generation/components/PromptPreviewModal.tsx \
  src/features/generation/components/__tests__/PromptPreviewModal.test.tsx
git commit -m "feat: add PromptPreviewModal component"
```

---

## Task 5: MultiSelectCombobox + Country/ShotType Wrappers (TDD)

**Files:**
- Create: `src/features/generation/components/__tests__/MultiSelectCombobox.test.tsx`
- Create: `src/features/generation/components/MultiSelectCombobox.tsx`
- Create: `src/features/generation/components/CountryMultiSelect.tsx`
- Create: `src/features/generation/components/ShotTypeMultiSelect.tsx`

**Context:** `MultiSelectCombobox` is a generic reusable component. `CountryMultiSelect` and `ShotTypeMultiSelect` are thin RHF-wired wrappers around it. Tests target `MultiSelectCombobox` only.

- [ ] **Step 1: Write the failing tests**

Create `src/features/generation/components/__tests__/MultiSelectCombobox.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { MultiSelectCombobox } from "../MultiSelectCombobox"

const options = [
  { value: "uk", label: "UK — United Kingdom" },
  { value: "de", label: "DE — Germany" },
  { value: "fr", label: "FR — France" },
]

describe("MultiSelectCombobox", () => {
  it("shows placeholder when no items are selected", () => {
    render(
      <MultiSelectCombobox
        options={options}
        value={[]}
        onChange={vi.fn()}
        placeholder="Select countries..."
      />,
    )
    expect(screen.getByRole("combobox")).toHaveTextContent("Select countries...")
  })

  it("shows count badge when items are selected", () => {
    render(
      <MultiSelectCombobox
        options={options}
        value={["uk", "de"]}
        onChange={vi.fn()}
        placeholder="Select countries..."
      />,
    )
    expect(screen.getByRole("combobox")).toHaveTextContent("2 selected")
  })

  it("opens the popover when trigger is clicked", async () => {
    render(
      <MultiSelectCombobox
        options={options}
        value={[]}
        onChange={vi.fn()}
        placeholder="Select countries..."
      />,
    )
    await userEvent.click(screen.getByRole("combobox"))
    expect(screen.getByText("UK — United Kingdom")).toBeInTheDocument()
    expect(screen.getByText("DE — Germany")).toBeInTheDocument()
  })

  it("calls onChange with added item when an unselected option is clicked", async () => {
    const onChange = vi.fn()
    render(
      <MultiSelectCombobox
        options={options}
        value={["uk"]}
        onChange={onChange}
        placeholder="Select countries..."
      />,
    )
    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByText("DE — Germany"))
    expect(onChange).toHaveBeenCalledWith(["uk", "de"])
  })

  it("calls onChange with item removed when a selected option is clicked", async () => {
    const onChange = vi.fn()
    render(
      <MultiSelectCombobox
        options={options}
        value={["uk", "de"]}
        onChange={onChange}
        placeholder="Select countries..."
      />,
    )
    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByText("UK — United Kingdom"))
    expect(onChange).toHaveBeenCalledWith(["de"])
  })

  it("renders selected items as badge pills below the trigger", () => {
    render(
      <MultiSelectCombobox
        options={options}
        value={["uk", "de"]}
        onChange={vi.fn()}
        placeholder="Select countries..."
      />,
    )
    expect(screen.getByText("UK — United Kingdom")).toBeInTheDocument()
    expect(screen.getByText("DE — Germany")).toBeInTheDocument()
  })

  it("calls onChange with item removed when badge × button is clicked", async () => {
    const onChange = vi.fn()
    render(
      <MultiSelectCombobox
        options={options}
        value={["uk", "de"]}
        onChange={onChange}
        placeholder="Select countries..."
      />,
    )
    await userEvent.click(screen.getByRole("button", { name: /remove UK/i }))
    expect(onChange).toHaveBeenCalledWith(["de"])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test:run src/features/generation/components/__tests__/MultiSelectCombobox.test.tsx
```

Expected: FAIL — `MultiSelectCombobox` not found.

- [ ] **Step 3: Implement MultiSelectCombobox**

Create `src/features/generation/components/MultiSelectCombobox.tsx`:

```tsx
"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils/cn"

interface MultiSelectComboboxProps {
  options: { value: string; label: string }[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder: string
  isLoading?: boolean
}

export function MultiSelectCombobox({
  options,
  value,
  onChange,
  placeholder,
  isLoading,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = useState(false)

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const remove = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue))
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            role="combobox"
            variant="outline"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isLoading}
            type="button"
          >
            {value.length > 0 ? `${value.length} selected` : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => toggle(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((v) => {
            const option = options.find((o) => o.value === v)
            return (
              <Badge key={v} variant="secondary" className="gap-1">
                {option?.label ?? v}
                <button
                  type="button"
                  onClick={() => remove(v)}
                  aria-label={`Remove ${option?.label ?? v}`}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test:run src/features/generation/components/__tests__/MultiSelectCombobox.test.tsx
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Create CountryMultiSelect**

Create `src/features/generation/components/CountryMultiSelect.tsx`:

```tsx
"use client"

import { type Control } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import type { Country, CreateJobRequest } from "@/features/generation/types"
import { MultiSelectCombobox } from "./MultiSelectCombobox"

interface CountryMultiSelectProps {
  control: Control<CreateJobRequest>
  countries: Country[]
  isLoading: boolean
}

export function CountryMultiSelect({
  control,
  countries,
  isLoading,
}: CountryMultiSelectProps) {
  const options = countries.map((c) => ({
    value: c.id,
    label: `${c.code} — ${c.name}`,
  }))

  return (
    <FormField
      control={control}
      name="country_ids"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Countries</FormLabel>
          <MultiSelectCombobox
            options={options}
            value={field.value ?? []}
            onChange={field.onChange}
            placeholder="Select countries..."
            isLoading={isLoading}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
```

- [ ] **Step 6: Create ShotTypeMultiSelect**

Create `src/features/generation/components/ShotTypeMultiSelect.tsx`:

```tsx
"use client"

import { type Control } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import type { CreateJobRequest, ShotType } from "@/features/generation/types"
import { MultiSelectCombobox } from "./MultiSelectCombobox"

interface ShotTypeMultiSelectProps {
  control: Control<CreateJobRequest>
  shotTypes: ShotType[]
  isLoading: boolean
}

export function ShotTypeMultiSelect({
  control,
  shotTypes,
  isLoading,
}: ShotTypeMultiSelectProps) {
  const options = shotTypes.map((s) => ({
    value: s.id,
    label: s.name,
  }))

  return (
    <FormField
      control={control}
      name="shot_type_ids"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Shot Types</FormLabel>
          <MultiSelectCombobox
            options={options}
            value={field.value ?? []}
            onChange={field.onChange}
            placeholder="Select shot types..."
            isLoading={isLoading}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
```

- [ ] **Step 7: Type-check**

```bash
pnpm type-check
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/features/generation/components/MultiSelectCombobox.tsx \
  src/features/generation/components/__tests__/MultiSelectCombobox.test.tsx \
  src/features/generation/components/CountryMultiSelect.tsx \
  src/features/generation/components/ShotTypeMultiSelect.tsx
git commit -m "feat: add MultiSelectCombobox, CountryMultiSelect, ShotTypeMultiSelect"
```

---

## Task 6: ReferenceImageSelector (TDD)

**Files:**
- Create: `src/features/generation/components/__tests__/ReferenceImageSelector.test.tsx`
- Create: `src/features/generation/components/ReferenceImageSelector.tsx`

**Context:** Images have URLs like `/static/studio/chelsea/front.jpg` — a path relative to the API host. The component prepends the origin: `new URL(env.NEXT_PUBLIC_API_URL).origin + img.url` → `http://localhost:8000/static/studio/chelsea/front.jpg`.

- [ ] **Step 1: Write the failing tests**

Create `src/features/generation/components/__tests__/ReferenceImageSelector.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReferenceImageSelector } from "../ReferenceImageSelector"

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1" },
}))

vi.mock("@/features/generation/api/getProductImages")

import { getProductImages } from "@/features/generation/api/getProductImages"

const mockImages = [
  {
    id: "img-1",
    product_id: "prod-1",
    label: "Front",
    url: "/static/studio/chelsea/front.jpg",
    created_at: "",
  },
  {
    id: "img-2",
    product_id: "prod-1",
    label: "Side",
    url: "/static/studio/chelsea/side.jpg",
    created_at: "",
  },
]

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
)

describe("ReferenceImageSelector", () => {
  beforeEach(() => {
    vi.mocked(getProductImages).mockResolvedValue(mockImages)
  })

  it("shows placeholder text when productId is empty", () => {
    render(
      <ReferenceImageSelector productId="" value={[]} onChange={vi.fn()} />,
      { wrapper },
    )
    expect(screen.getByText(/select a product/i)).toBeInTheDocument()
  })

  it("renders image thumbnails after data loads", async () => {
    render(
      <ReferenceImageSelector productId="prod-1" value={[]} onChange={vi.fn()} />,
      { wrapper },
    )
    expect(await screen.findByAltText("Front")).toBeInTheDocument()
    expect(screen.getByAltText("Side")).toBeInTheDocument()
  })

  it("shows warning when 0 images are selected", async () => {
    render(
      <ReferenceImageSelector productId="prod-1" value={[]} onChange={vi.fn()} />,
      { wrapper },
    )
    await screen.findByAltText("Front")
    expect(screen.getByText(/text-to-image mode/i)).toBeInTheDocument()
  })

  it("blocks selection of a 10th image when 9 are already selected", async () => {
    const nineIds = Array.from({ length: 9 }, (_, i) => `other-${i}`)
    render(
      <ReferenceImageSelector
        productId="prod-1"
        value={nineIds}
        onChange={vi.fn()}
      />,
      { wrapper },
    )
    await screen.findByAltText("Front")
    expect(screen.getByRole("button", { name: "Front" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Side" })).toBeDisabled()
  })

  it("calls onChange adding the image id when an unselected image is clicked", async () => {
    const onChange = vi.fn()
    render(
      <ReferenceImageSelector productId="prod-1" value={[]} onChange={onChange} />,
      { wrapper },
    )
    await userEvent.click(await screen.findByRole("button", { name: "Front" }))
    expect(onChange).toHaveBeenCalledWith(["img-1"])
  })

  it("calls onChange removing the image id when a selected image is clicked", async () => {
    const onChange = vi.fn()
    render(
      <ReferenceImageSelector
        productId="prod-1"
        value={["img-1"]}
        onChange={onChange}
      />,
      { wrapper },
    )
    await userEvent.click(await screen.findByRole("button", { name: "Front" }))
    expect(onChange).toHaveBeenCalledWith([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test:run src/features/generation/components/__tests__/ReferenceImageSelector.test.tsx
```

Expected: FAIL — `ReferenceImageSelector` not found.

- [ ] **Step 3: Implement ReferenceImageSelector**

Create `src/features/generation/components/ReferenceImageSelector.tsx`:

```tsx
"use client"

import { useQuery } from "@tanstack/react-query"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils/cn"
import { env } from "@/lib/env"
import { getProductImages } from "@/features/generation/api/getProductImages"

interface ReferenceImageSelectorProps {
  productId: string
  value: string[]
  onChange: (value: string[]) => void
}

export function ReferenceImageSelector({
  productId,
  value,
  onChange,
}: ReferenceImageSelectorProps) {
  const { data: images, isLoading } = useQuery({
    queryKey: ["product-images", productId],
    queryFn: () => getProductImages(productId),
    enabled: !!productId,
  })

  if (!productId) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a product to see reference images.
      </p>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded" />
        ))}
      </div>
    )
  }

  const baseUrl = new URL(env.NEXT_PUBLIC_API_URL).origin

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id))
    } else if (value.length < 9) {
      onChange([...value, id])
    }
  }

  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <p className="text-xs text-yellow-600">
          No reference images selected — text-to-image mode
        </p>
      )}
      <ScrollArea className="h-48">
        <div className="grid grid-cols-3 gap-2 p-1">
          {images?.map((img) => {
            const isSelected = value.includes(img.id)
            const isDisabled = !isSelected && value.length >= 9
            return (
              <button
                key={img.id}
                type="button"
                disabled={isDisabled}
                onClick={() => toggle(img.id)}
                aria-label={img.label || img.id}
                className={cn(
                  "relative aspect-square overflow-hidden rounded border-2 transition-colors",
                  isSelected ? "border-primary" : "border-transparent",
                  isDisabled && "cursor-not-allowed opacity-50",
                )}
              >
                <img
                  src={`${baseUrl}${img.url}`}
                  alt={img.label}
                  className="h-full w-full object-cover"
                />
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test:run src/features/generation/components/__tests__/ReferenceImageSelector.test.tsx
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/generation/components/ReferenceImageSelector.tsx \
  src/features/generation/components/__tests__/ReferenceImageSelector.test.tsx
git commit -m "feat: add ReferenceImageSelector with 9-image limit"
```

---

## Task 7: ProductSelector, ColourSelector, VariationSelector

**Files:**
- Create: `src/features/generation/components/ProductSelector.tsx`
- Create: `src/features/generation/components/ColourSelector.tsx`
- Create: `src/features/generation/components/VariationSelector.tsx`

No unit tests for these — type-check is the verification.

- [ ] **Step 1: Create ProductSelector**

Create `src/features/generation/components/ProductSelector.tsx`:

```tsx
"use client"

import { type Control } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { CreateJobRequest, Product } from "@/features/generation/types"

interface ProductSelectorProps {
  control: Control<CreateJobRequest>
  products: Product[]
  isLoading: boolean
}

export function ProductSelector({
  control,
  products,
  isLoading,
}: ProductSelectorProps) {
  if (isLoading) return <Skeleton className="h-10 w-full" />

  return (
    <FormField
      control={control}
      name="product_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Product</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select product..." />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
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

- [ ] **Step 2: Create ColourSelector**

Create `src/features/generation/components/ColourSelector.tsx`:

```tsx
"use client"

import { type Control } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { Colour, CreateJobRequest } from "@/features/generation/types"

interface ColourSelectorProps {
  control: Control<CreateJobRequest>
  colours: Colour[]
  isLoading: boolean
  disabled?: boolean
}

export function ColourSelector({
  control,
  colours,
  isLoading,
  disabled,
}: ColourSelectorProps) {
  if (isLoading) return <Skeleton className="h-10 w-full" />

  return (
    <FormField
      control={control}
      name="colour_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Colour</FormLabel>
          <Select
            value={field.value}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select colour..." />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {colours.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-4 w-4 rounded-full border"
                      style={{ backgroundColor: c.hex_preview ?? "#d1d5db" }}
                    />
                    {c.ral_code} — {c.name}
                  </div>
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

- [ ] **Step 3: Create VariationSelector**

Create `src/features/generation/components/VariationSelector.tsx`:

```tsx
"use client"

import { type Control } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { CreateJobRequest } from "@/features/generation/types"

interface VariationSelectorProps {
  control: Control<CreateJobRequest>
}

export function VariationSelector({ control }: VariationSelectorProps) {
  return (
    <FormField
      control={control}
      name="variations"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Variations per combination</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={1}
              max={10}
              value={field.value}
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
```

- [ ] **Step 4: Type-check all three**

```bash
pnpm type-check
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/generation/components/ProductSelector.tsx \
  src/features/generation/components/ColourSelector.tsx \
  src/features/generation/components/VariationSelector.tsx
git commit -m "feat: add ProductSelector, ColourSelector, VariationSelector"
```

---

## Task 8: GenerationPanel

**Files:**
- Create: `src/features/generation/components/GenerationPanel.tsx`

No unit tests — integration-level component requiring mocked API + nuqs provider. Verify via type-check only.

- [ ] **Step 1: Create GenerationPanel**

Create `src/features/generation/components/GenerationPanel.tsx`:

```tsx
"use client"

import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { getColours } from "@/features/generation/api/getColours"
import { getCountries } from "@/features/generation/api/getCountries"
import { getProducts } from "@/features/generation/api/getProducts"
import { getShotTypes } from "@/features/generation/api/getShotTypes"
import { useGenerationForm } from "@/features/generation/hooks/useGenerationForm"
import { generationQueryKeys } from "@/features/generation/queryKeys"
import { ColourSelector } from "./ColourSelector"
import { CountryMultiSelect } from "./CountryMultiSelect"
import { ProductSelector } from "./ProductSelector"
import { PromptPreviewModal } from "./PromptPreviewModal"
import { ReferenceImageSelector } from "./ReferenceImageSelector"
import { ShotTypeMultiSelect } from "./ShotTypeMultiSelect"
import { VariationSelector } from "./VariationSelector"

export function GenerationPanel() {
  const {
    form,
    totalImages,
    previewData,
    isPreviewing,
    isCreating,
    onSubmit,
    handleConfirm,
    handleCloseModal,
  } = useGenerationForm()

  const productId = form.watch("product_id")

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: generationQueryKeys.products(),
    queryFn: getProducts,
  })
  const { data: colours, isLoading: coloursLoading } = useQuery({
    queryKey: generationQueryKeys.colours(),
    queryFn: getColours,
  })
  const { data: countries, isLoading: countriesLoading } = useQuery({
    queryKey: generationQueryKeys.countries(),
    queryFn: getCountries,
  })
  const { data: shotTypes, isLoading: shotTypesLoading } = useQuery({
    queryKey: generationQueryKeys.shotTypes(),
    queryFn: getShotTypes,
  })

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]"
        >
          <div className="space-y-6">
            <ProductSelector
              control={form.control}
              products={products?.items ?? []}
              isLoading={productsLoading}
            />
            <ColourSelector
              control={form.control}
              colours={colours?.items ?? []}
              isLoading={coloursLoading}
              disabled={!productId}
            />
            <CountryMultiSelect
              control={form.control}
              countries={countries?.items ?? []}
              isLoading={countriesLoading}
            />
            <ShotTypeMultiSelect
              control={form.control}
              shotTypes={shotTypes?.items ?? []}
              isLoading={shotTypesLoading}
            />
            <VariationSelector control={form.control} />
            <ReferenceImageSelector
              productId={productId}
              value={form.watch("product_image_ids") ?? []}
              onChange={(ids) => form.setValue("product_image_ids", ids)}
            />
          </div>

          <div className="space-y-4 lg:sticky lg:top-6">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-3xl font-bold">{totalImages}</p>
              <p className="text-sm text-muted-foreground">images to generate</p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isPreviewing || totalImages === 0}
            >
              {isPreviewing ? "Loading preview..." : "Generate"}
            </Button>
          </div>
        </form>
      </Form>

      {previewData && (
        <PromptPreviewModal
          open={true}
          prompts={previewData.prompts}
          isConfirming={isCreating}
          onClose={handleCloseModal}
          onConfirm={handleConfirm}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/generation/components/GenerationPanel.tsx
git commit -m "feat: add GenerationPanel assembling all generation form components"
```

---

## Task 9: Update Page + Final Verification

**Files:**
- Modify: `src/app/(dashboard)/generate/page.tsx`

- [ ] **Step 1: Replace generate/page.tsx**

`src/app/(dashboard)/generate/page.tsx` — full replacement:

```tsx
import { Suspense } from "react"
import { PageHeader } from "@/components/shared"
import { GenerationPanel } from "@/features/generation/components/GenerationPanel"

export default function GeneratePage() {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Generate"
        description="Select options and generate product images."
      />
      <Suspense>
        <GenerationPanel />
      </Suspense>
    </div>
  )
}
```

`Suspense` is required because `useGenerationForm` calls `useSearchParams()` inside a Client Component — Next.js requires the nearest parent to wrap with `Suspense` when that hook is used.

- [ ] **Step 2: Run all tests**

```bash
pnpm test:run
```

Expected: all tests PASS. Count should include tests from Tasks 2–6.

- [ ] **Step 3: Final type-check**

```bash
pnpm type-check
```

Expected: 0 errors.

- [ ] **Step 4: Start dev server and smoke-test manually**

```bash
pnpm dev
```

Open `http://localhost:3000/generate`. Verify:
- Form renders with skeleton states while config loads
- Product dropdown populates; selecting a product enables the Colour dropdown
- Changing product clears the colour and reference images
- Country/ShotType comboboxes open and allow multi-select with badge pills
- Total images counter updates live as selections change
- Variations input accepts 1–10
- Selecting a product shows reference images; selecting 9 disables the rest
- "Generate" button is disabled when total = 0
- URL updates as you make selections; refreshing the page restores selections

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/generate/page.tsx
git commit -m "feat: wire GenerationPanel into generate page with Suspense boundary"
```
