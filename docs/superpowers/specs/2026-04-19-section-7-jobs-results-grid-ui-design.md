# Section 7 — Jobs History + Results Grid UI Design

## Goal

Implement the jobs review surface end-to-end for the current no-user system:

- Add a backend `GET /api/v1/jobs` endpoint for paginated job history.
- Expand backend/frontend job detail payloads so the review UI has real image metadata.
- Build `/jobs` as a compact history page.
- Build `/jobs/[id]` as the dedicated review workspace with live polling, progressive image appearance, URL-backed filters, bulk approve/reject, and ZIP download.

This section fixes the current broken post-generation flow where the app redirects to `/jobs/[id]` but the route only renders a header stub.

## Scope

### In Scope

- Backend `GET /api/v1/jobs`
- Expanded backend `GET /api/v1/jobs/{job_id}` response
- Frontend jobs list query and detail query updates
- `app/(dashboard)/jobs/page.tsx`
- `app/(dashboard)/jobs/[id]/page.tsx`
- `app/(dashboard)/jobs/[id]/loading.tsx`
- `app/(dashboard)/jobs/[id]/error.tsx`
- Jobs sidebar entry pointing to `/jobs`
- Detail-page components:
  - `JobStatusBar`
  - `GridFilters`
  - `ImageGrid`
  - `BulkActions`
  - `DownloadButton`
- Zustand selection store for bulk actions
- URL filter state via nuqs
- Proper waiting, empty, loading, and failure states

### Out of Scope

- Per-image actions on cards (`approve`, `reject`, `regenerate`, single-image download`)
- Search on `/jobs`
- Arbitrary sort controls on `/jobs`
- Server-side pagination for the detail image grid
- User-specific job scoping
- Reworking the generation page flow beyond its existing redirect to `/jobs/[id]`

## Architecture

### Route Model

Use a two-page jobs model:

- `/jobs`
  - Paginated history page
  - Basic status filter
  - Newest jobs first
  - Clicking a row navigates to `/jobs/[id]`
- `/jobs/[id]`
  - Dedicated review workspace for one job
  - Shows progress/status at top
  - Polls for job updates while generation is active
  - Shows images progressively as they become available

This is intentionally simpler and lower risk than a master-detail workspace. It also matches the existing generation redirect target.

### Component Boundaries

#### Jobs History Page

- `app/(dashboard)/jobs/page.tsx`
  - Route shell
  - Fetches paginated jobs list
  - Renders status filter and jobs table/list
  - Handles empty state when no jobs exist

#### Job Detail Page

- `app/(dashboard)/jobs/[id]/page.tsx`
  - Route shell for a single job
  - Receives `job_id`
  - Renders page header, status bar, filters, bulk actions, grid, and download control
- `loading.tsx`
  - Route-level loading UI
- `error.tsx`
  - Route-level failure boundary

#### Detail Components

- `JobStatusBar`
  - Consumes the polling-backed job query
  - Displays status, progress (`completed_images / total_images`), and terminal-state messaging
  - Stops polling automatically when job status becomes terminal
- `GridFilters`
  - Owns `status`, `country_id`, and `shot_type_id` via nuqs
  - Emits current filter state to the grid
- `ImageGrid`
  - Filters the in-memory image list from the job detail payload
  - Paginates client-side in V1
  - Renders image cards or structured placeholders
- `BulkActions`
  - Uses a small Zustand store keyed by image id
  - Supports select-all-visible, bulk approve, and bulk reject
  - Invalidates/refetches the job detail query after mutation success
- `DownloadButton`
  - Triggers ZIP download for the current job

### State Ownership

- Server route params:
  - `job_id`
- TanStack Query:
  - jobs history list
  - job detail / polling
- nuqs:
  - image filters on `/jobs/[id]`
- Zustand:
  - selected image ids for the current detail page only

Keep the Zustand store focused on transient selection state. Do not move job data into Zustand.

## Backend API Design

### Resource Model

#### Resource: Job

Represents a generation run and its overall progress.

Fields:

- `id: UUID`
- `status: JobStatus`
- `total_images: int`
- `completed_images: int`
- `created_at: datetime`

Relationships:

- has many `Image`

#### Resource: Job Image Detail

Represents one generated or pending image belonging to a job.

Fields required by the frontend detail grid:

- `id: UUID`
- `status: ImageStatus`
- `file_path: str | None`
- `regeneration_source_id: UUID | None`
- `product_id: UUID`
- `colour_id: UUID`
- `country_id: UUID`
- `shot_type_id: UUID`
- `variation_number: int`
- `created_at: datetime`

Display-ready fields required in the same payload:

- `product_name: str`
- `ral_code: str`
- `country_code: str`
- `country_name: str`
- `shot_type_name: str`

Returning display-ready fields here is intentionally denormalized. This is the required V1 shape because it avoids turning the detail page into a multi-query composition problem.

### Endpoint Table

| Method | Path | Status | Auth | Description |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/jobs` | `200` | No | Paginated jobs history, newest first, optional status filter |
| `GET` | `/api/v1/jobs/{job_id}` | `200` | No | Single job with expanded image detail payload |

Existing endpoints remain unchanged:

- `POST /api/v1/jobs`
- `POST /api/v1/jobs/preview`
- `GET /api/v1/jobs/{job_id}/download`
- image mutation endpoints used by bulk actions

### `GET /api/v1/jobs`

Query params:

- `page: int = 1`
- `per_page: int = 20`
- `status: JobStatus | None = None`

Behavior:

- Ordered by `created_at desc`
- Paginates through all jobs in the system
- If `status` is provided, filters to that status
- No search in V1
- No custom sorting in V1

Response shape:

```json
{
  "items": [
    {
      "id": "uuid",
      "status": "generating",
      "total_images": 12,
      "completed_images": 4,
      "created_at": "2026-04-19T12:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20,
  "pages": 1
}
```

### `GET /api/v1/jobs/{job_id}`

Expand the response schema so each image entry contains the full metadata required by the frontend review grid.

Response shape:

```json
{
  "id": "uuid",
  "status": "generating",
  "total_images": 12,
  "completed_images": 4,
  "created_at": "2026-04-19T12:00:00Z",
  "images": [
    {
      "id": "uuid",
      "status": "complete",
      "file_path": "/static/generated/...png",
      "regeneration_source_id": null,
      "product_id": "uuid",
      "colour_id": "uuid",
      "country_id": "uuid",
      "shot_type_id": "uuid",
      "variation_number": 1,
      "created_at": "2026-04-19T12:00:10Z",
      "product_name": "Chelsea",
      "ral_code": "RAL7032",
      "country_code": "UK",
      "country_name": "United Kingdom",
      "shot_type_name": "PDP"
    }
  ]
}
```

### Backend Implementation Notes

Implement `GET /jobs` using the existing backend module layering:

- repository: list query with count + pagination + optional status filter
- service: pagination math and response assembly
- router: query params and response model

Expand `GET /jobs/{job_id}` by:

- updating repository loading strategy so job detail can include image metadata and related display fields
- expanding response schemas
- expanding service mapping logic

## Frontend Data Layer

### Query Keys

Add a list query key alongside the existing detail key:

```ts
jobsQueryKeys = {
  list: (params) => ["jobs", "list", params] as const,
  detail: (id) => ["jobs", id] as const,
}
```

### API Functions

Add:

- `getJobs(page, perPage, status?)`

Expand:

- `getJob(jobId)` to parse the richer image payload

Keep:

- `downloadApproved(jobId)`
- `useJobPolling(jobId)`
- `useImageFilters()`

### Frontend Types

Expand the frontend jobs schemas/types to match the richer backend shape rather than keeping the current minimal `JobImage` summary.

Minimum frontend image fields:

- `id`
- `status`
- `file_path`
- `regeneration_source_id`
- `product_id`
- `colour_id`
- `country_id`
- `shot_type_id`
- `variation_number`
- `created_at`
- `product_name`
- `ral_code`
- `country_code`
- `country_name`
- `shot_type_name`

## UI Design

### `/jobs`

Purpose:

- Give the sidebar a stable jobs destination
- Let the user return to previously created jobs

Behavior:

- Shows a paginated jobs table or list
- Displays:
  - job id
  - status
  - progress
  - created time
- Includes a basic status filter in V1
- Clicking a row navigates to `/jobs/[id]`
- Shows an empty state when there are no jobs

### `/jobs/[id]`

Purpose:

- Serve as the post-generation landing page
- Let the user monitor progress and review images as they appear

Behavior:

- Header shows job id and review context
- `JobStatusBar` appears first
- Polling continues while job status is `idle` or `generating`
- Polling stops automatically on `complete` or `failed`
- Image cards appear progressively as image records gain renderable file paths or terminal statuses
- The page must never appear empty:
  - route loading state
  - query failure state
  - waiting-for-images state
  - no-matching-filters state

### Status Bar

Displays:

- job status badge
- progress count
- terminal state copy

Include:

- animated generating treatment
- relative created time

Do not add elapsed-time tracking in V1.

### Filters

`GridFilters` uses nuqs to store:

- `status`
- `country_id`
- `shot_type_id`

Rules:

- filters are URL-backed and shareable
- filters apply only to the detail grid
- bulk selection operations respect the currently filtered visible set

### Image Grid

Rules:

- client-side filtering
- client-side pagination over the fetched job images
- cards render actual thumbnails when `file_path` exists
- cards render structured placeholders for `pending` / `generating`
- cards show metadata:
  - product name
  - RAL code
  - country
  - shot type
  - variation number
  - status

No per-image action buttons in this section.

### Bulk Actions

Support:

- select visible images
- clear selection
- bulk approve selected
- bulk reject selected

Selection store:

- keyed by image id
- scoped to the current job page lifecycle
- should be reset when changing jobs

After mutation success:

- invalidate the job detail query
- refetch to reconcile statuses

### Download

`DownloadButton` triggers ZIP download for approved images on the current job.

Rules:

- keep it page-level, not tied to selection
- available even while the job is in progress
- empty ZIP behavior is accepted because the backend already defines it

## Error Handling

### Backend

- `GET /jobs` returns `200` with empty `items` for no jobs
- `GET /jobs/{job_id}` returns `404` if job does not exist

### Frontend

#### Route Level

- `loading.tsx` for detail-route loading
- `error.tsx` for uncaught route failures

#### Query Level

- jobs list empty state
- job detail waiting state before images appear
- failure state when the job is terminally failed
- no-results state when filters remove all visible images

Do not rely on route-level boundaries alone. The page still needs meaningful in-page states.

## Testing Strategy

### Backend

Add tests for:

- repository list query with status filter and newest-first ordering
- service pagination math for jobs list
- router `GET /jobs` response shape and query param handling
- expanded `GET /jobs/{job_id}` schema mapping with richer image fields

### Frontend

Add tests for:

- `getJobs`
- expanded `getJob`
- jobs list page renders paginated rows
- jobs detail page renders waiting state before images are available
- polling-driven progress/status updates
- URL-backed filters narrow visible images
- bulk selection respects filtered items
- bulk approve/reject invalidates the detail query
- download button triggers ZIP download helper
- sidebar includes `Jobs`

## File Targets

### Frontend

- `src/app/(dashboard)/jobs/page.tsx`
- `src/app/(dashboard)/jobs/[id]/page.tsx`
- `src/app/(dashboard)/jobs/[id]/loading.tsx`
- `src/app/(dashboard)/jobs/[id]/error.tsx`
- `src/components/layout/AppSidebar.tsx`
- `src/features/jobs/api/*`
- `src/features/jobs/components/*`
- `src/features/jobs/hooks/*`
- `src/features/jobs/stores/*`
- `src/schemas/jobs.ts`

### Backend

- `backend/app/modules/jobs/router.py`
- `backend/app/modules/jobs/service.py`
- `backend/app/modules/jobs/repository.py`
- `backend/app/modules/jobs/schemas.py`
- related backend tests for jobs router/service/repository

## Recommended Approach

Implement this section as a bounded jobs review milestone:

1. Add backend list support with `GET /jobs`
2. Expand job detail payloads to include real image metadata
3. Build `/jobs` as the sidebar destination and history page
4. Replace the `/jobs/[id]` stub with a working review workspace
5. Keep per-image actions and richer list controls out of scope for now

This gives the user a complete, non-broken generation → review loop without overloading the section.
