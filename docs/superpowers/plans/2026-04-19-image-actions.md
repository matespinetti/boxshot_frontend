# Image Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-image approve/reject/regenerate/download actions and a full-size lightbox to the job results page, via a new `features/images/` module wired into the existing `ImageGrid` and `JobResultsView`.

**Architecture:** A new `features/images/` module owns types, API functions, a mutation hook with optimistic updates, and three components (`ImageCard`, `RegenerateDialog`, `ImageLightbox`). The existing `ImageGrid` is updated to use `ImageCard` instead of inline articles and hosts lightbox state. `JobResultsView` switches its bulk approve/reject to the new hook.

**Tech Stack:** Next.js 15, TanStack Query v5 (optimistic mutations), Vitest + Testing Library, `@base-ui/react` Dialog, Tailwind CSS v4, lucide-react icons.

---

## File Map

| Action | Path |
|--------|------|
| Create | `src/lib/utils/resolveImageUrl.ts` |
| Create | `src/features/images/types.ts` |
| Create | `src/features/images/queryKeys.ts` |
| Create | `src/features/images/api/updateImageStatus.ts` |
| Create | `src/features/images/api/regenerateImage.ts` |
| Create | `src/features/images/hooks/useImageActions.ts` |
| Create | `src/features/images/components/RegenerateDialog.tsx` |
| Create | `src/features/images/components/ImageLightbox.tsx` |
| Create | `src/features/images/components/ImageCard.tsx` |
| Create | `src/features/images/__tests__/useImageActions.test.tsx` |
| Create | `src/features/images/__tests__/ImageCard.test.tsx` |
| Create | `src/features/images/__tests__/RegenerateDialog.test.tsx` |
| Modify | `src/features/jobs/components/ImageGrid.tsx` |
| Modify | `src/features/jobs/components/JobResultsView.tsx` |
| Delete | `src/features/jobs/api/updateImageStatus.ts` |

---

## Task 1: Extract `resolveImageUrl` utility

**Files:**
- Create: `src/lib/utils/resolveImageUrl.ts`
- Modify: `src/features/jobs/components/ImageGrid.tsx` (remove inline definition, import from new location)

- [ ] **Step 1: Create the utility**

```ts
// src/lib/utils/resolveImageUrl.ts
import { env } from "@/lib/env"

export function resolveImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl
  }
  return `${new URL(env.NEXT_PUBLIC_API_URL).origin}${imageUrl}`
}
```

- [ ] **Step 2: Update `ImageGrid.tsx` to import from the new location**

Remove the `resolveImageUrl` function definition and `env` import from `ImageGrid.tsx`, and replace with:

```ts
import { resolveImageUrl } from "@/lib/utils/resolveImageUrl"
```

The call site (`resolveImageUrl(image.image_url)`) stays unchanged.

- [ ] **Step 3: Verify type-check passes**

```bash
cd frontend && pnpm type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/utils/resolveImageUrl.ts src/features/jobs/components/ImageGrid.tsx
git commit -m "refactor: extract resolveImageUrl to lib/utils"
```

---

## Task 2: Foundation — types, queryKeys, API functions

**Files:**
- Create: `src/features/images/types.ts`
- Create: `src/features/images/queryKeys.ts`
- Create: `src/features/images/api/updateImageStatus.ts`
- Create: `src/features/images/api/regenerateImage.ts`

- [ ] **Step 1: Create `types.ts`**

```ts
// src/features/images/types.ts
export type { JobImage } from "@/schemas/jobs"
export type ImageStatus = import("@/schemas/jobs").JobImage["status"]
```

- [ ] **Step 2: Create `queryKeys.ts`**

```ts
// src/features/images/queryKeys.ts
// Images live inside the job TanStack Query cache.
// This key mirrors jobsQueryKeys.detail without cross-feature imports.
export const imageQueryKeys = {
  jobDetail: (jobId: string) => ["jobs", jobId] as const,
}
```

- [ ] **Step 3: Create `updateImageStatus.ts`**

```ts
// src/features/images/api/updateImageStatus.ts
import { apiClient } from "@/lib/api/client"

export async function updateImageStatus(
  imageId: string,
  status: "approved" | "rejected",
): Promise<void> {
  await apiClient.patch(`/images/${imageId}/status`, { status })
}
```

- [ ] **Step 4: Create `regenerateImage.ts`**

```ts
// src/features/images/api/regenerateImage.ts
import { JobImageSchema } from "@/schemas/jobs"
import type { JobImage } from "@/schemas/jobs"
import { apiClient } from "@/lib/api/client"

export async function regenerateImage(imageId: string): Promise<JobImage> {
  const data = await apiClient.post<unknown>(`/images/${imageId}/regenerate`, {})
  return JobImageSchema.parse(data)
}
```

- [ ] **Step 5: Type-check**

```bash
cd frontend && pnpm type-check
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/images/
git commit -m "feat: add features/images foundation (types, queryKeys, API functions)"
```

---

## Task 3: `useImageActions` hook

**Files:**
- Create: `src/features/images/hooks/useImageActions.ts`
- Create: `src/features/images/__tests__/useImageActions.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// src/features/images/__tests__/useImageActions.test.tsx
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { ReactNode } from "react"
import type { Job } from "@/schemas/jobs"
import { useImageActions } from "@/features/images/hooks/useImageActions"
import * as updateImageStatusModule from "@/features/images/api/updateImageStatus"
import * as regenerateImageModule from "@/features/images/api/regenerateImage"

vi.mock("@/features/images/api/updateImageStatus")
vi.mock("@/features/images/api/regenerateImage")
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const JOB_ID = "job-1"
const IMAGE_ID = "img-1"

const makeJob = (status: Job["images"][0]["status"] = "complete"): Job => ({
  id: JOB_ID,
  status: "complete",
  total_images: 1,
  completed_images: 1,
  created_at: "2026-01-01T00:00:00Z",
  images: [
    {
      id: IMAGE_ID,
      status,
      file_path: "/static/img.png",
      image_url: "/static/img.png",
      regeneration_source_id: null,
      product_id: "p1",
      colour_id: "c1",
      country_id: "co1",
      shot_type_id: "st1",
      variation_number: 1,
      created_at: "2026-01-01T00:00:00Z",
      product_name: "Chelsea",
      ral_code: "RAL7032",
      country_code: "UK",
      country_name: "United Kingdom",
      shot_type_name: "PDP",
    },
  ],
})

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe("useImageActions", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    queryClient.setQueryData(["jobs", JOB_ID], makeJob())
    vi.clearAllMocks()
  })

  it("approve optimistically updates status in cache", async () => {
    vi.mocked(updateImageStatusModule.updateImageStatus).mockResolvedValue(undefined)

    const { result } = renderHook(() => useImageActions(JOB_ID), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.approve(IMAGE_ID)

    await waitFor(() => {
      const job = queryClient.getQueryData<Job>(["jobs", JOB_ID])
      expect(job?.images[0].status).toBe("approved")
    })
  })

  it("reject optimistically updates status in cache", async () => {
    vi.mocked(updateImageStatusModule.updateImageStatus).mockResolvedValue(undefined)

    const { result } = renderHook(() => useImageActions(JOB_ID), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.reject(IMAGE_ID)

    await waitFor(() => {
      const job = queryClient.getQueryData<Job>(["jobs", JOB_ID])
      expect(job?.images[0].status).toBe("rejected")
    })
  })

  it("rolls back optimistic update on approve error", async () => {
    vi.mocked(updateImageStatusModule.updateImageStatus).mockRejectedValue(
      new Error("network error"),
    )

    const { result } = renderHook(() => useImageActions(JOB_ID), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.approve(IMAGE_ID)

    await waitFor(() => {
      const job = queryClient.getQueryData<Job>(["jobs", JOB_ID])
      expect(job?.images[0].status).toBe("complete")
    })
  })

  it("isUpdating returns true while mutation is pending for that image", async () => {
    let resolveUpdate!: () => void
    vi.mocked(updateImageStatusModule.updateImageStatus).mockReturnValue(
      new Promise<undefined>((res) => { resolveUpdate = () => res(undefined) }),
    )

    const { result } = renderHook(() => useImageActions(JOB_ID), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.approve(IMAGE_ID)

    await waitFor(() => expect(result.current.isUpdating(IMAGE_ID)).toBe(true))
    resolveUpdate()
    await waitFor(() => expect(result.current.isUpdating(IMAGE_ID)).toBe(false))
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd frontend && pnpm test:run src/features/images/__tests__/useImageActions.test.tsx
```

Expected: FAIL with "Cannot find module" or similar.

- [ ] **Step 3: Implement the hook**

```ts
// src/features/images/hooks/useImageActions.ts
"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { Job } from "@/schemas/jobs"
import { updateImageStatus } from "@/features/images/api/updateImageStatus"
import { regenerateImage } from "@/features/images/api/regenerateImage"
import { imageQueryKeys } from "@/features/images/queryKeys"

export function useImageActions(jobId: string) {
  const queryClient = useQueryClient()
  const queryKey = imageQueryKeys.jobDetail(jobId)

  const statusMutation = useMutation({
    mutationFn: ({
      imageId,
      status,
    }: {
      imageId: string
      status: "approved" | "rejected"
    }) => updateImageStatus(imageId, status),

    onMutate: async ({ imageId, status }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Job>(queryKey)
      queryClient.setQueryData<Job>(queryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          images: old.images.map((img) =>
            img.id === imageId ? { ...img, status } : img,
          ),
        }
      })
      return { previous }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
      toast.error("Failed to update image status.")
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const regenMutation = useMutation({
    mutationFn: ({ imageId }: { imageId: string }) => regenerateImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
    onError: () => {
      toast.error("Failed to regenerate image.")
    },
  })

  return {
    approve: (imageId: string) =>
      statusMutation.mutateAsync({ imageId, status: "approved" }),
    reject: (imageId: string) =>
      statusMutation.mutateAsync({ imageId, status: "rejected" }),
    regenerate: (imageId: string) =>
      regenMutation.mutateAsync({ imageId }),
    isUpdating: (imageId: string) =>
      statusMutation.isPending &&
      statusMutation.variables?.imageId === imageId,
    isRegenerating: (imageId: string) =>
      regenMutation.isPending &&
      regenMutation.variables?.imageId === imageId,
  }
}
```

- [ ] **Step 4: Run tests — expect green**

```bash
cd frontend && pnpm test:run src/features/images/__tests__/useImageActions.test.tsx
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/images/hooks/useImageActions.ts src/features/images/__tests__/useImageActions.test.tsx
git commit -m "feat: add useImageActions hook with optimistic approve/reject and regenerate"
```

---

## Task 4: `RegenerateDialog` component

**Files:**
- Create: `src/features/images/components/RegenerateDialog.tsx`
- Create: `src/features/images/__tests__/RegenerateDialog.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// src/features/images/__tests__/RegenerateDialog.test.tsx
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { RegenerateDialog } from "@/features/images/components/RegenerateDialog"

describe("RegenerateDialog", () => {
  it("renders nothing when closed", () => {
    render(
      <RegenerateDialog open={false} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    )
    expect(screen.queryByText("Regenerate image")).not.toBeInTheDocument()
  })

  it("renders title when open", () => {
    render(
      <RegenerateDialog open onConfirm={vi.fn()} onCancel={vi.fn()} />,
    )
    expect(screen.getByText("Regenerate image")).toBeInTheDocument()
  })

  it("calls onConfirm when Regenerate button is clicked", () => {
    const onConfirm = vi.fn()
    render(
      <RegenerateDialog open onConfirm={onConfirm} onCancel={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it("calls onCancel when Cancel button is clicked", () => {
    const onCancel = vi.fn()
    render(
      <RegenerateDialog open onConfirm={vi.fn()} onCancel={onCancel} />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd frontend && pnpm test:run src/features/images/__tests__/RegenerateDialog.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

```tsx
// src/features/images/components/RegenerateDialog.tsx
"use client"

import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

interface RegenerateDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function RegenerateDialog({ open, onConfirm, onCancel }: RegenerateDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Regenerate image"
      description="A new image will be created using the same prompt. The original stays in the grid."
      confirmLabel="Regenerate"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
```

- [ ] **Step 4: Run tests — expect green**

```bash
cd frontend && pnpm test:run src/features/images/__tests__/RegenerateDialog.test.tsx
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/images/components/RegenerateDialog.tsx src/features/images/__tests__/RegenerateDialog.test.tsx
git commit -m "feat: add RegenerateDialog component"
```

---

## Task 5: `ImageLightbox` component

**Files:**
- Create: `src/features/images/components/ImageLightbox.tsx`

- [ ] **Step 1: Implement the component**

```tsx
// src/features/images/components/ImageLightbox.tsx
"use client"

import { useEffect } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { StatusBadge } from "@/components/shared"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { JobImage } from "@/features/images/types"
import { resolveImageUrl } from "@/lib/utils/resolveImageUrl"

interface ImageLightboxProps {
  images: JobImage[]
  openIndex: number | null
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

export function ImageLightbox({
  images,
  openIndex,
  onClose,
  onNext,
  onPrev,
}: ImageLightboxProps) {
  const isOpen = openIndex !== null
  const image = isOpen ? images[openIndex] : null
  const hasPrev = isOpen && openIndex > 0
  const hasNext = isOpen && openIndex < images.length - 1

  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && hasPrev) onPrev()
      if (e.key === "ArrowRight" && hasNext) onNext()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [isOpen, hasPrev, hasNext, onPrev, onNext])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        className="flex max-h-[90vh] w-full flex-col gap-4 sm:max-w-4xl"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="sr-only">
            {image
              ? `${image.product_name} ${image.country_name} ${image.shot_type_name}`
              : "Image"}
          </DialogTitle>
        </DialogHeader>

        {image && (
          <>
            {/* Image + nav */}
            <div className="relative flex items-center justify-center">
              {hasPrev && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 z-10"
                  onClick={onPrev}
                  aria-label="Previous image"
                >
                  <ChevronLeftIcon className="size-5" />
                </Button>
              )}

              <img
                src={resolveImageUrl(image.image_url!)}
                alt={`${image.product_name} ${image.country_code} ${image.shot_type_name}`}
                className="max-h-[60vh] w-full object-contain"
              />

              {hasNext && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 z-10"
                  onClick={onNext}
                  aria-label="Next image"
                >
                  <ChevronRightIcon className="size-5" />
                </Button>
              )}
            </div>

            {/* Counter */}
            <p className="text-center text-xs text-muted-foreground">
              {openIndex! + 1} / {images.length}
            </p>

            {/* Metadata */}
            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <div>
                <p className="font-medium">{image.country_name}</p>
                <p className="text-sm text-muted-foreground">
                  {image.shot_type_name} · V{image.variation_number} ·{" "}
                  {image.product_name} · {image.ral_code}
                </p>
              </div>
              <StatusBadge status={image.status} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/images/components/ImageLightbox.tsx
git commit -m "feat: add ImageLightbox component with keyboard navigation"
```

---

## Task 6: `ImageCard` component

**Files:**
- Create: `src/features/images/components/ImageCard.tsx`
- Create: `src/features/images/__tests__/ImageCard.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// src/features/images/__tests__/ImageCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import type { JobImage } from "@/features/images/types"
import { ImageCard } from "@/features/images/components/ImageCard"

vi.mock("@/features/images/hooks/useImageActions", () => ({
  useImageActions: () => ({
    approve: vi.fn(),
    reject: vi.fn(),
    regenerate: vi.fn(),
    isUpdating: () => false,
    isRegenerating: () => false,
  }),
}))

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }))

const makeImage = (overrides: Partial<JobImage> = {}): JobImage => ({
  id: "img-1",
  status: "complete",
  file_path: "/static/img.png",
  image_url: "/static/img.png",
  regeneration_source_id: null,
  product_id: "p1",
  colour_id: "c1",
  country_id: "co1",
  shot_type_id: "st1",
  variation_number: 1,
  created_at: "2026-01-01T00:00:00Z",
  product_name: "Chelsea",
  ral_code: "RAL7032",
  country_code: "UK",
  country_name: "United Kingdom",
  shot_type_name: "PDP",
  ...overrides,
})

function Wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient()
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const defaultProps = {
  jobId: "job-1",
  selected: false,
  onToggleSelect: vi.fn(),
  isSelectable: () => true,
  onOpenLightbox: vi.fn(),
}

describe("ImageCard", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders country name and metadata", () => {
    render(<ImageCard image={makeImage()} {...defaultProps} />, { wrapper: Wrapper })
    expect(screen.getByText("United Kingdom")).toBeInTheDocument()
    expect(screen.getByText("Chelsea · RAL7032")).toBeInTheDocument()
  })

  it("renders placeholder when no image_url", () => {
    render(
      <ImageCard image={makeImage({ image_url: null })} {...defaultProps} />,
      { wrapper: Wrapper },
    )
    expect(screen.getByText("Image still pending")).toBeInTheDocument()
  })

  it("does not show Approve button when already approved", () => {
    render(
      <ImageCard image={makeImage({ status: "approved" })} {...defaultProps} />,
      { wrapper: Wrapper },
    )
    expect(screen.queryByLabelText("Approve")).not.toBeInTheDocument()
  })

  it("does not show Reject button when already rejected", () => {
    render(
      <ImageCard image={makeImage({ status: "rejected" })} {...defaultProps} />,
      { wrapper: Wrapper },
    )
    expect(screen.queryByLabelText("Reject")).not.toBeInTheDocument()
  })

  it("calls onOpenLightbox when image is clicked", () => {
    const onOpenLightbox = vi.fn()
    render(
      <ImageCard image={makeImage()} {...defaultProps} onOpenLightbox={onOpenLightbox} />,
      { wrapper: Wrapper },
    )
    fireEvent.click(screen.getByRole("img"))
    expect(onOpenLightbox).toHaveBeenCalledWith("img-1")
  })

  it("shows Select button when isSelectable returns true", () => {
    render(<ImageCard image={makeImage()} {...defaultProps} />, { wrapper: Wrapper })
    expect(screen.getByRole("button", { name: /select/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd frontend && pnpm test:run src/features/images/__tests__/ImageCard.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `ImageCard`**

```tsx
// src/features/images/components/ImageCard.tsx
"use client"

import { useState } from "react"
import {
  CheckIcon,
  DownloadIcon,
  Loader2,
  RefreshCcwIcon,
  XIcon,
} from "lucide-react"

import { StatusBadge } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { useImageActions } from "@/features/images/hooks/useImageActions"
import { RegenerateDialog } from "@/features/images/components/RegenerateDialog"
import type { JobImage } from "@/features/images/types"
import { resolveImageUrl } from "@/lib/utils/resolveImageUrl"

interface ImageCardProps {
  image: JobImage
  jobId: string
  selected: boolean
  onToggleSelect: (imageId: string) => void
  isSelectable: (image: JobImage) => boolean
  onOpenLightbox: (imageId: string) => void
}

const REGENERABLE_STATUSES: Array<JobImage["status"]> = [
  "complete",
  "approved",
  "rejected",
  "failed",
]

function getPlaceholderCopy(status: JobImage["status"]): string {
  switch (status) {
    case "generating":
      return "Rendering in progress"
    case "failed":
      return "Render failed"
    default:
      return "Image still pending"
  }
}

function downloadImage(url: string, filename: string) {
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.target = "_blank"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function ImageCard({
  image,
  jobId,
  selected,
  onToggleSelect,
  isSelectable,
  onOpenLightbox,
}: ImageCardProps) {
  const [regenDialogOpen, setRegenDialogOpen] = useState(false)
  const { approve, reject, regenerate, isUpdating, isRegenerating } =
    useImageActions(jobId)

  const selectable = isSelectable(image)
  const hasImage = !!image.image_url
  const updating = isUpdating(image.id)
  const regenerating = isRegenerating(image.id)
  const busy = updating || regenerating

  function handleRegenerate() {
    setRegenDialogOpen(false)
    void regenerate(image.id)
  }

  function handleDownload() {
    if (!image.image_url) return
    const absUrl = resolveImageUrl(image.image_url)
    const filename = `${image.product_name}_${image.ral_code}_${image.country_code}_${image.shot_type_name}_V${image.variation_number}.jpg`
    downloadImage(absUrl, filename)
  }

  return (
    <>
      <RegenerateDialog
        open={regenDialogOpen}
        onConfirm={handleRegenerate}
        onCancel={() => setRegenDialogOpen(false)}
      />

      <article className="overflow-hidden rounded-2xl border bg-card">
        {/* Image area */}
        <div className="group relative aspect-square bg-muted">
          {hasImage ? (
            <img
              src={resolveImageUrl(image.image_url!)}
              alt={`${image.product_name} ${image.country_code} ${image.shot_type_name}`}
              className="h-full w-full cursor-pointer object-cover"
              onClick={() => onOpenLightbox(image.id)}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
              {getPlaceholderCopy(image.status)}
            </div>
          )}

          {/* Busy spinner */}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="size-8 animate-spin text-white" />
            </div>
          )}

          {/* Hover action buttons */}
          {!busy && hasImage && (
            <div className="absolute inset-0 flex items-end justify-center gap-2 bg-black/40 pb-3 opacity-0 transition-opacity group-hover:opacity-100">
              {image.status !== "approved" && (
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="size-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    void approve(image.id)
                  }}
                  aria-label="Approve"
                >
                  <CheckIcon className="size-4" />
                </Button>
              )}
              {image.status !== "rejected" && (
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="size-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    void reject(image.id)
                  }}
                  aria-label="Reject"
                >
                  <XIcon className="size-4" />
                </Button>
              )}
              {REGENERABLE_STATUSES.includes(image.status) && (
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="size-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    setRegenDialogOpen(true)
                  }}
                  aria-label="Regenerate"
                >
                  <RefreshCcwIcon className="size-4" />
                </Button>
              )}
              {hasImage && (
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="size-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownload()
                  }}
                  aria-label="Download"
                >
                  <DownloadIcon className="size-4" />
                </Button>
              )}
            </div>
          )}

          {/* Status badge — top left */}
          <div className="absolute top-2 left-2">
            <StatusBadge status={image.status} />
          </div>

          {/* Select button — top right */}
          {selectable && (
            <Button
              type="button"
              size="sm"
              variant={selected ? "default" : "outline"}
              className="absolute top-2 right-2"
              onClick={(e) => {
                e.stopPropagation()
                onToggleSelect(image.id)
              }}
              aria-label={`Select image ${image.variation_number}`}
            >
              {selected ? "Selected" : "Select"}
            </Button>
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-1 p-4">
          <p className="font-medium">{image.country_name}</p>
          <p className="text-sm text-muted-foreground">
            {image.shot_type_name} · V{image.variation_number}
          </p>
          <p className="text-sm text-muted-foreground">
            {image.product_name} · {image.ral_code}
          </p>
        </div>
      </article>
    </>
  )
}
```

- [ ] **Step 4: Run tests — expect green**

```bash
cd frontend && pnpm test:run src/features/images/__tests__/ImageCard.test.tsx
```

Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/images/components/ImageCard.tsx src/features/images/__tests__/ImageCard.test.tsx
git commit -m "feat: add ImageCard component with per-image actions and lightbox trigger"
```

---

## Task 7: Update `ImageGrid` — use `ImageCard`, add lightbox

**Files:**
- Modify: `src/features/jobs/components/ImageGrid.tsx`

- [ ] **Step 1: Replace the file content**

```tsx
// src/features/jobs/components/ImageGrid.tsx
"use client"

import { useEffect, useState } from "react"

import { EmptyState } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { ImageCard } from "@/features/images/components/ImageCard"
import { ImageLightbox } from "@/features/images/components/ImageLightbox"
import type { JobImage } from "@/features/jobs/types"

interface ImageGridProps {
  images: JobImage[]
  jobId: string
  selectedIds: string[]
  onToggleSelect: (imageId: string) => void
  isSelectable: (image: JobImage) => boolean
  pageSize?: number
}

export function ImageGrid({
  images,
  jobId,
  selectedIds,
  onToggleSelect,
  isSelectable,
  pageSize = 12,
}: ImageGridProps) {
  const [page, setPage] = useState(1)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const totalPages = Math.max(1, Math.ceil(images.length / pageSize))

  useEffect(() => {
    setPage(1)
  }, [images.length])

  const pageImages = images.slice((page - 1) * pageSize, page * pageSize)

  function handleOpenLightbox(imageId: string) {
    const index = images.findIndex((img) => img.id === imageId)
    if (index !== -1) setLightboxIndex(index)
  }

  if (images.length === 0) {
    return (
      <EmptyState
        title="No images match these filters"
        description="Adjust the filters to bring more results into view."
      />
    )
  }

  return (
    <>
      <ImageLightbox
        images={images}
        openIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onPrev={() => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
        onNext={() =>
          setLightboxIndex((i) =>
            i !== null && i < images.length - 1 ? i + 1 : i,
          )
        }
      />

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pageImages.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              jobId={jobId}
              selected={selectedIds.includes(image.id)}
              onToggleSelect={onToggleSelect}
              isSelectable={isSelectable}
              onOpenLightbox={handleOpenLightbox}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && pnpm type-check
```

Expected: TypeScript will now complain that `ImageGrid` is called without `jobId` in `JobResultsView.tsx`. That's expected — we'll fix it in the next task.

- [ ] **Step 3: Commit (pre-fix)**

```bash
git add src/features/jobs/components/ImageGrid.tsx
git commit -m "feat: wire ImageCard and ImageLightbox into ImageGrid"
```

---

## Task 8: Update `JobResultsView`, delete old `updateImageStatus`

**Files:**
- Modify: `src/features/jobs/components/JobResultsView.tsx`
- Delete: `src/features/jobs/api/updateImageStatus.ts`

- [ ] **Step 1: Update `JobResultsView.tsx`**

Replace the full file content:

```tsx
// src/features/jobs/components/JobResultsView.tsx
"use client"

import { useEffect, useState } from "react"

import { EmptyState, PageHeader } from "@/components/shared"
import { downloadApproved } from "@/features/jobs/api/downloadApproved"
import { useImageActions } from "@/features/images/hooks/useImageActions"
import type { ImageFilters } from "@/features/jobs/hooks/useImageFilters"
import { useImageFilters } from "@/features/jobs/hooks/useImageFilters"
import { useJobPolling } from "@/features/jobs/hooks/useJobPolling"
import {
  imageSelectionStore,
  useImageSelectionStore,
} from "@/features/jobs/stores/useImageSelectionStore"
import type { JobImage } from "@/features/jobs/types"
import { BulkActions } from "./BulkActions"
import { DownloadButton } from "./DownloadButton"
import { GridFilters } from "./GridFilters"
import { ImageGrid } from "./ImageGrid"
import { JobStatusBar } from "./JobStatusBar"

interface JobResultsViewProps {
  jobId: string
}

function isSelectableImage(image: JobImage): boolean {
  return image.status === "complete"
}

export function JobResultsView({ jobId }: JobResultsViewProps) {
  const jobQuery = useJobPolling(jobId)
  const { filters, setFilters, filterImages } = useImageFilters()
  const { selectedIds } = useImageSelectionStore()
  const { approve, reject } = useImageActions(jobId)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    imageSelectionStore.setJob(jobId)
  }, [jobId])

  if (jobQuery.isPending && !jobQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeader title={`Job ${jobId}`} description="Review generated images." />
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Loading job results...
        </div>
      </div>
    )
  }

  if (jobQuery.isError || !jobQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeader title={`Job ${jobId}`} description="Review generated images." />
        <EmptyState
          title="Could not load this job"
          description="Try again to refresh the results workspace."
          action={{ label: "Retry", onClick: () => void jobQuery.refetch() }}
        />
      </div>
    )
  }

  const job = jobQuery.data
  const filteredImages = filterImages(job.images)
  const eligibleImages = filteredImages.filter(isSelectableImage)
  const selectedEligibleIds = selectedIds.filter((id) =>
    eligibleImages.some((image) => image.id === id),
  )

  async function handleFiltersChange(next: Partial<ImageFilters>) {
    await setFilters(next)
  }

  async function handleBulkUpdate(status: "approved" | "rejected") {
    if (selectedEligibleIds.length === 0) return
    setIsSubmitting(true)
    try {
      await Promise.all(
        selectedEligibleIds.map((imageId) =>
          status === "approved" ? approve(imageId) : reject(imageId),
        ),
      )
      imageSelectionStore.clear()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Job ${job.id}`}
        description="Review generated images."
        action={
          <DownloadButton
            onClick={() => downloadApproved(job.id)}
            disabled={!job.images.some((image) => image.status === "approved")}
          />
        }
      />

      <JobStatusBar job={job} />

      {job.images.length === 0 ? (
        <EmptyState
          title="Images are on the way"
          description="This job has started, but no image records are ready to review yet."
        />
      ) : (
        <>
          <GridFilters
            images={job.images}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
          <BulkActions
            selectedCount={selectedEligibleIds.length}
            eligibleCount={eligibleImages.length}
            isSubmitting={isSubmitting}
            onSelectAll={() =>
              imageSelectionStore.replaceSelected(
                eligibleImages.map((image) => image.id),
              )
            }
            onClear={() => imageSelectionStore.clear()}
            onApprove={() => void handleBulkUpdate("approved")}
            onReject={() => void handleBulkUpdate("rejected")}
          />
          <ImageGrid
            images={filteredImages}
            jobId={jobId}
            selectedIds={selectedIds}
            onToggleSelect={(imageId) => imageSelectionStore.toggle(imageId)}
            isSelectable={isSelectableImage}
          />
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Delete the old API file**

```bash
rm src/features/jobs/api/updateImageStatus.ts
```

- [ ] **Step 3: Final type-check and test run**

```bash
cd frontend && pnpm type-check && pnpm test:run
```

Expected: no TypeScript errors, all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/features/jobs/components/JobResultsView.tsx
git rm src/features/jobs/api/updateImageStatus.ts
git commit -m "feat: wire useImageActions into JobResultsView, remove legacy updateImageStatus"
```

---

## Verification Checklist

After all tasks complete:

1. **Per-image actions visible** — navigate to `/jobs/[id]`, hover a complete image card: approve ✓, reject ✗, regenerate ↺, download ↓ buttons appear
2. **Optimistic approve** — click Approve: status badge changes to "Approved" immediately, no page reload
3. **Rollback on error** — open DevTools → Network → set "Offline", click Approve: badge briefly flips then rolls back, error toast appears
4. **Regenerate flow** — click ↺: `RegenerateDialog` opens; click Regenerate: dialog closes, new image appears at bottom of grid after polling cycle
5. **Lightbox** — click an image: full-size lightbox opens; ←/→ keys and chevron buttons navigate the full filtered list; Esc closes
6. **Download** — click ↓: image file downloads to disk
7. **Bulk approve still works** — select images, click "Approve selected": all update optimistically, selection clears
