# ParcelFlow Frontend — Architecture

## What This Is

A single-purpose internal tool for generating, reviewing, and downloading AI product images. Two main surfaces:

1. **Generation dashboard** — select product/colour/markets/shot types, generate, review results, download
2. **Admin panel** — manage all config data (products, colours, countries, shot types, templates, overrides)

No authentication in V1. No public-facing pages.

---

## Tech Stack

| Layer        | Choice                  | Why                                                |
| ------------ | ----------------------- | -------------------------------------------------- |
| Framework    | Next.js 15 App Router   | Server Components, streaming, file-based routing   |
| UI           | shadcn/ui + Tailwind v4 | Accessible, composable, unstyled primitives        |
| Server state | TanStack Query v5       | Polling, cache invalidation, optimistic updates    |
| Forms        | React Hook Form + Zod   | Type-safe validation, minimal re-renders           |
| URL state    | nuqs                    | Filters/pagination survive refresh, shareable URLs |
| UI state     | Zustand                 | Minimal — modals, bulk selections only             |
| HTTP client  | Custom fetch wrapper    | Typed, centralized, error-normalized               |

---

## Project Structure

```
src/
  app/
    layout.tsx                        # Providers: QueryClient, Toaster, Zustand
    page.tsx                          # Redirect → /generate
    (dashboard)/
      layout.tsx                      # Sidebar + top nav
      generate/
        page.tsx                      # Generation input panel (Server Component shell)
        loading.tsx
      jobs/
        [id]/
          page.tsx                    # Job results grid (Server Component shell)
          loading.tsx
          error.tsx
      admin/
        layout.tsx                    # Admin sidebar
        page.tsx                      # Redirect → /admin/products
        products/page.tsx
        colours/page.tsx
        countries/page.tsx
        shot-types/page.tsx
        installation-types/page.tsx
        prompt-templates/page.tsx
        overrides/page.tsx
    api/                              # Route handlers — BFF proxy to FastAPI
      jobs/route.ts
      jobs/[id]/route.ts
      jobs/[id]/images/route.ts
      jobs/[id]/download/route.ts
      images/[id]/route.ts
      images/[id]/regenerate/route.ts
      admin/[...entity]/route.ts      # Catch-all for admin CRUD

  components/
    ui/                               # shadcn auto-generated — never edit directly
    shared/
      DataTable.tsx                   # Reusable table with sort/filter/pagination
      EmptyState.tsx
      PageHeader.tsx
      ConfirmDialog.tsx
      StatusBadge.tsx                 # pending/generating/complete/failed/approved/rejected
      ImageCard.tsx                   # Reusable image card with action buttons

  features/
    generation/
      components/
        GenerationPanel.tsx           # "use client" — full input panel
        ProductSelector.tsx
        ColourSelector.tsx
        CountryMultiSelect.tsx
        ShotTypeMultiSelect.tsx
        VariationSelector.tsx
        ReferenceImageSelector.tsx    # select which product images to use
        PromptPreviewModal.tsx        # shows assembled prompts before generating
      api/
        getProducts.ts
        getColours.ts
        getCountries.ts
        getShotTypes.ts
        previewPrompts.ts
        createJob.ts
      hooks/
        useGenerationForm.ts
      schemas/
        generation.schema.ts
      queryKeys.ts
      types.ts

    jobs/
      components/
        JobStatusBar.tsx              # "use client" — polls job status
        ImageGrid.tsx                 # "use client" — image results grid
        GridFilters.tsx               # filter by status/country/shot type
        BulkActions.tsx               # approve all / reject all selected
        DownloadButton.tsx
      api/
        getJob.ts
        getJobImages.ts
        downloadApproved.ts
      hooks/
        useJobPolling.ts              # polls while generating, stops on terminal status
        useImageFilters.ts
      queryKeys.ts
      types.ts

    images/
      components/
        ImageCard.tsx                 # "use client" — approve/reject/regenerate/download
        RegenerateDialog.tsx
      api/
        updateImageStatus.ts
        regenerateImage.ts
      hooks/
        useImageActions.ts            # optimistic approve/reject
      queryKeys.ts
      types.ts

    admin/
      components/
        AdminTable.tsx                # reusable table for all admin entities
        EntitySheet.tsx               # slide-over create/edit form
        DisableToggle.tsx
        PromptBlockEditor.tsx         # textarea with character count for prompt blocks
        TemplateVersionList.tsx       # prompt template versions with set-default action
        ReferenceImageUpload.tsx      # multi-image upload for products
        OverrideForm.tsx              # create prompt block overrides
      api/
        # one file per entity per operation
        products/getProducts.ts
        products/createProduct.ts
        products/updateProduct.ts
        products/disableProduct.ts
        # ... same pattern for all entities
      hooks/
        useAdminTable.ts              # shared table state (sort, page, search)
      schemas/
        # one schema per entity
        product.schema.ts
        colour.schema.ts
        # ...
      queryKeys.ts
      types.ts

  lib/
    api/
      client.ts                       # get/post/patch/delete with auth headers
      fetcher.ts                      # only place fetch() is called
      errors.ts                       # ApiError, NotFoundError
      types.ts                        # PaginatedResponse<T>, ApiErrorResponse
    utils/
      cn.ts                           # clsx + tailwind-merge
      formatters.ts                   # date, fileSize, statusLabel
    env/
      index.ts                        # validated env vars via Zod

  hooks/
    useDebounce.ts
    usePolling.ts                     # generic polling with auto-stop condition

  types/
    api.ts                            # shared API types matching backend schemas

  constants/
    routes.ts                         # ROUTES.generate, ROUTES.jobs, ROUTES.admin
    queryKeys.ts                      # root query key factory
    status.ts                         # status enums, labels, colours
```

---

## Server vs Client Component Strategy

### Server Components (default)

- All page files (`page.tsx`)
- Layout files
- Static content sections
- Initial data loading for admin tables

### Client Components (`"use client"`)

- `GenerationPanel` — form state, multi-select, URL params
- `JobStatusBar` — TanStack Query polling
- `ImageGrid` — interactive approve/reject/filter
- `ImageCard` — action buttons, optimistic updates
- `AdminTable` with inline actions
- `EntitySheet` — form with React Hook Form
- Any component using Zustand

---

## Data Flow

### Generation flow

```
GenerationPanel (Client)
  → nuqs: selections stored in URL
  → POST /api/jobs (Next.js route handler)
    → POST /api/v1/jobs (FastAPI)
  → redirect to /jobs/[id]

JobStatusBar (Client, TanStack Query)
  → polls GET /api/jobs/[id] every 2s
  → stops polling when status = complete | failed
  → invalidates ["jobs", id, "images"] on status change

ImageGrid (Client, TanStack Query)
  → GET /api/jobs/[id]/images
  → re-fetches when job polling invalidates
  → images appear progressively
```

### Image action flow

```
ImageCard approve/reject (Client)
  → optimistic update via TanStack Query
  → PATCH /api/images/[id]/status
  → rollback on error

ImageCard regenerate (Client)
  → POST /api/images/[id]/regenerate
  → new image appears in grid
  → original remains (with rejected status)
```

### Admin flow

```
AdminPage (Server Component)
  → initial data fetch server-side
  → passes to AdminTable

AdminTable (Client)
  → TanStack Query for subsequent fetches
  → EntitySheet opens for create/edit
  → mutations invalidate table query
```

---

## State Management Strategy

```
TanStack Query    products, colours, countries, shot types,
                  jobs, images, prompt templates — all server data

nuqs             selected product, colours, countries, shot types,
                  variations, active filters, pagination — URL state

Zustand          selectedImageIds (bulk actions),
                  previewModalOpen, confirmDialogState

React Hook Form  all form state (generation form, admin forms)
```

---

## Key Components

### `GenerationPanel`

Single-page input form. All selections stored in URL via nuqs. On submit:

1. Call `POST /jobs/preview` to show assembled prompts in modal
2. User confirms → `POST /jobs` → redirect to results

### `JobStatusBar`

Polls job status every 2 seconds. Displays progress `X / total`. Stops polling automatically when `status` is `complete` or `failed`. Triggers confetti or success toast on completion.

### `ImageGrid`

Displays all images for a job. Filters via nuqs (status, country, shot type). Each card has approve/reject/regenerate/download. Bulk select via Zustand + checkbox per card. Download ZIP triggers a file download via `GET /jobs/[id]/download`.

### `PromptPreviewModal`

Opens before generation. Shows the full assembled prompt for each combination. Read-only. Confirms the user is happy with what will be sent to the model.

### `EntitySheet`

Slide-over panel used across all admin entities. Contains React Hook Form. On submit: create or update mutation → close sheet → invalidate table query. Reused for every admin entity by passing different form schemas and fields.

### `PromptBlockEditor`

Large textarea for editing prompt blocks. Shows character count, syntax highlighting for key terms. Used in admin for all entity forms.

---

## API Communication

All backend communication goes through Next.js route handlers in `app/api/` (BFF pattern). This:

- Hides the FastAPI base URL from the browser
- Allows adding auth headers centrally in future
- Keeps CORS simple

```
Browser → Next.js route handler → FastAPI
```

Route handlers are thin proxies — they forward requests and responses, normalize errors, handle file downloads.

---

## Polling Strategy

```ts
// features/jobs/hooks/useJobPolling.ts
const TERMINAL_STATUSES = ["complete", "failed"];

useQuery({
  queryKey: jobQueryKeys.detail(jobId),
  queryFn: () => getJob(jobId),
  refetchInterval: (query) => {
    const status = query.state.data?.status;
    if (!status || TERMINAL_STATUSES.includes(status)) return false;
    return 2000; // poll every 2s while generating
  },
});
```

---

## Error Handling

- API errors → `ApiError` from `lib/api/errors.ts`
- Component level → `error.tsx` for page-level errors
- Query errors → error state in TanStack Query, displayed inline
- Mutation errors → `sonner` toast notification
- Network errors → retry 3x automatically via TanStack Query default

---

## File Upload (Reference Images)

Product reference images uploaded via admin panel:

1. `ReferenceImageUpload` component — drag & drop, multiple files
2. `POST /admin/products/[id]/images` → streams to FastAPI
3. FastAPI saves to disk/S3, returns URL
4. URL stored in `product_reference_images` table

At generation time, `ReferenceImageSelector` shows available product images — user picks up to 9.

---

## What Is NOT in V1

- Authentication / login
- Dark mode toggle (shadcn dark mode supported, just not wired)
- Real-time WebSocket (polling is sufficient at this scale)
- Mobile responsive (internal tool, desktop only)
- Drag to reorder images in grid
