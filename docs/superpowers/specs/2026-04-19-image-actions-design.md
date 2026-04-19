# Image Actions — Design Spec
_Date: 2026-04-19_

## Context

The job results page (`/jobs/[id]`) already shows a grid of generated images with bulk approve/reject. What it lacks is per-image actions: approve, reject, regenerate, and download individual images. It also lacks a full-size image viewer. This spec covers adding all of that through a new `features/images/` module wired into the existing `ImageGrid` and `JobResultsView`.

---

## Scope

**In scope:**
- New `features/images/` module: types, queryKeys, API functions, mutation hook, components
- Extract `ImageCard` from the inline `<article>` in `ImageGrid`
- Per-image actions: approve, reject, regenerate (with confirm dialog), download single image
- Lightbox modal with prev/next navigation over the filtered image list
- Optimistic approve/reject with rollback on error
- Update `JobResultsView` bulk action to use the new hook

**Out of scope:**
- Changes to the bulk selection/action UI (BulkActions.tsx)
- Changes to filtering, pagination, or job polling
- Mobile layout

---

## Module Structure

```
features/images/
  types.ts
  queryKeys.ts
  api/
    updateImageStatus.ts
    regenerateImage.ts
  hooks/
    useImageActions.ts
  components/
    ImageCard.tsx
    RegenerateDialog.tsx
    ImageLightbox.tsx
```

**Modified files:**
- `features/jobs/components/ImageGrid.tsx` — swap inline `<article>` for `<ImageCard>`, add lightbox state
- `features/jobs/components/JobResultsView.tsx` — use `useImageActions` hook for bulk approve/reject

**Deleted files:**
- `features/jobs/api/updateImageStatus.ts` — superseded by `features/images/api/updateImageStatus.ts`

---

## Types — `features/images/types.ts`

Re-exports from existing schemas to avoid duplication:

```ts
export type { JobImage } from "@/schemas/jobs"
export type ImageStatus = JobImage["status"]
```

---

## Query Keys — `features/images/queryKeys.ts`

Images live inside the job TanStack Query cache. The image module defines its own key that mirrors the job detail key — no cross-feature import.

```ts
export const imageQueryKeys = {
  jobDetail: (jobId: string) => ["jobs", jobId] as const,
}
```

---

## API Functions

### `features/images/api/updateImageStatus.ts`

Plain async function. Same signature as the existing one in `features/jobs/api/` — this is the canonical location going forward.

```ts
async function updateImageStatus(imageId: string, status: "approved" | "rejected"): Promise<void>
// PATCH /images/{imageId}/status  { status }
```

### `features/images/api/regenerateImage.ts`

```ts
async function regenerateImage(imageId: string): Promise<JobImage>
// POST /images/{imageId}/regenerate  (no body)
// Returns the new JobImage record
```

---

## Hook — `features/images/hooks/useImageActions.ts`

Single hook scoped to a job. Returns action functions and per-image loading state.

```ts
function useImageActions(jobId: string): {
  approve: (imageId: string) => void
  reject: (imageId: string) => void
  regenerate: (imageId: string) => void
  isUpdating: (imageId: string) => boolean   // approve/reject in flight for this image
  isRegenerating: (imageId: string) => boolean
}
```

**Optimistic update flow for approve/reject:**
1. `onMutate`: cancel in-flight job query → snapshot cache → update `image.status` in `job.images[]`
2. `onError`: restore snapshot from context → show error toast
3. `onSettled`: invalidate job query to resync with server

The hook tracks which `imageId` is in-flight using the mutation's `variables` so the card can show a per-image spinner without blocking others.

**Regenerate flow:**
- No optimistic update (new image gets an unknown server-assigned ID)
- `onSuccess`: invalidate job query — new image appears at the end of the list
- `onError`: show error toast

**`JobResultsView` bulk update** is updated to use `useImageActions` rather than calling the plain function directly, so bulk approve/reject also gets optimistic updates.

---

## Components

### `features/images/components/RegenerateDialog.tsx`

Thin wrapper around the existing `ConfirmDialog` with fixed copy. No logic — just props passthrough.

```
title:       "Regenerate image"
description: "A new image will be created using the same prompt. The original stays in the grid."
confirmLabel: "Regenerate"
```

Props: `open`, `onConfirm`, `onCancel`.

---

### `features/images/components/ImageCard.tsx`

Props:
```ts
{
  image: JobImage
  jobId: string
  selected: boolean
  onToggleSelect: (imageId: string) => void
  isSelectable: (image: JobImage) => boolean
  onOpenLightbox: (imageId: string) => void
}
```

**Layout:**
- Top: image area (`aspect-square`) — click opens lightbox
  - Hover overlay with action icon buttons (approve ✓, reject ✗, regenerate ↺, download ↓)
  - Select button in top-right (visible when `isSelectable`)
  - Status badge in top-left (always visible)
  - Spinner overlay when `isUpdating` or `isRegenerating`
- Bottom: metadata — country name, shot type · variation, product · RAL code, status badge

**Action button visibility:**

| Button | Visible when |
|--------|-------------|
| Approve | `image_url` exists and `status !== "approved"` |
| Reject | `image_url` exists and `status !== "rejected"` |
| Regenerate | `status` is `"complete"` \| `"approved"` \| `"rejected"` \| `"failed"` |
| Download | `image_url` exists |

Regenerate button opens `RegenerateDialog` (state local to the card). On confirm, calls `regenerate(image.id)` from the hook and closes the dialog.

Download triggers a programmatic `<a href download>` using the resolved absolute URL (via the `resolveImageUrl` helper, extracted to `lib/utils/resolveImageUrl.ts`).

---

### `features/images/components/ImageLightbox.tsx`

Props:
```ts
{
  images: JobImage[]     // full filtered list, not just current page
  openIndex: number | null
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}
```

Built on the existing shadcn `Dialog`. Full-screen overlay:
- Large image centered, `object-contain`
- Left/right chevron buttons for navigation (hidden when at list boundaries)
- Metadata row below: country, shot type, product, RAL, status badge
- Keyboard: `←`/`→` navigate, `Esc` closes (Dialog handles Esc natively)
- Image counter: "3 / 12"

Lightbox shows images from the entire filtered list, not just the current page, so navigation flows naturally across page boundaries.

---

### `ImageGrid.tsx` changes

- Replace inline `<article>` with `<ImageCard>`, passing action handlers down
- Add `openLightboxIndex: number | null` state (local to the grid)
- Render `<ImageLightbox>` alongside the grid
- Extract `resolveImageUrl` usage — that helper moves to `lib/utils/resolveImageUrl.ts`

---

## `resolveImageUrl` utility

Extracted from `ImageGrid.tsx` to `lib/utils/resolveImageUrl.ts` so it can be shared by `ImageCard` (download) and `ImageLightbox`.

```ts
function resolveImageUrl(imageUrl: string): string
// Prepends API origin to relative paths; returns absolute URLs unchanged
```

---

## Error Handling

- Approve/reject failure: rollback optimistic update + `toast.error("Failed to update image status.")`
- Regenerate failure: `toast.error("Failed to regenerate image.")`
- Download failure: silently fails (browser handles it); no toast needed

---

## Verification

1. `/jobs/[id]` — hover an image card: confirm approve/reject/regenerate/download buttons appear
2. Approve an image: status badge updates immediately (optimistic), card border changes, no page reload
3. Simulate network failure (DevTools offline): approve optimistic update rolls back, toast appears
4. Click Regenerate: `RegenerateDialog` opens; confirm → new image appears in grid after a moment
5. Click image area: lightbox opens; ←/→ keys and buttons navigate the full filtered list
6. Download button: image file downloads to disk
7. Bulk approve via BulkActions still works, now with optimistic updates
