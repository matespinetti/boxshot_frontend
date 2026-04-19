# Jobs Feature — API + Polling Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the data layer for the jobs feature — types, query keys, API functions, polling hook, and URL-based image filters.

**Architecture:** Images are embedded in the `GET /jobs/{id}` response, so a single query key `["jobs", id]` covers both job status and image list. `useJobPolling` wraps TanStack Query with a `refetchInterval` callback that auto-stops on terminal status. Image filter state lives entirely in the URL via nuqs.

**Tech Stack:** TanStack Query v5, nuqs v2, Zod v4, custom `apiClient`

---

## File Map

| Action | Path |
|--------|------|
| Create | `src/features/jobs/types.ts` |
| Create | `src/features/jobs/queryKeys.ts` |
| Create | `src/features/jobs/api/getJob.ts` |
| Create | `src/features/jobs/api/getJobImages.ts` |
| Create | `src/features/jobs/api/downloadApproved.ts` |
| Create | `src/features/jobs/hooks/useJobPolling.ts` |
| Create | `src/features/jobs/hooks/useImageFilters.ts` |
| Create | `src/features/jobs/api/__tests__/getJob.test.ts` |
| Create | `src/features/jobs/hooks/__tests__/useJobPolling.test.ts` |
| Create | `src/features/jobs/hooks/__tests__/useImageFilters.test.ts` |

---

## Section 1 — Types & Query Keys

### `src/features/jobs/types.ts`

Re-exports from `@/schemas/jobs`. No new types at this layer.

```ts
export type { Job, JobImage } from "@/schemas/jobs"
```

### `src/features/jobs/queryKeys.ts`

```ts
export const jobsQueryKeys = {
  detail: (id: string) => ["jobs", id] as const,
}
```

Images are embedded in the job response — no separate images key. Invalidating `["jobs", id]` refreshes both job status and images.

---

## Section 2 — API Functions

### `src/features/jobs/api/getJob.ts`

```ts
import { apiClient } from "@/lib/api/client"
import { JobSchema } from "@/schemas/jobs"
import type { Job } from "@/features/jobs/types"

export async function getJob(jobId: string): Promise<Job> {
  const data = await apiClient.get<unknown>(`/jobs/${jobId}`)
  return JobSchema.parse(data)
}
```

### `src/features/jobs/api/getJobImages.ts`

Thin wrapper — extracts embedded images, no second network call.

```ts
import type { JobImage } from "@/features/jobs/types"
import { getJob } from "./getJob"

export async function getJobImages(jobId: string): Promise<JobImage[]> {
  const job = await getJob(jobId)
  return job.images
}
```

### `src/features/jobs/api/downloadApproved.ts`

The `GET /jobs/{id}/download` endpoint streams a ZIP — the JSON apiClient is not suitable. We construct the download URL and trigger a native browser download via a temporary `<a>` element. No blob memory, no progress handling needed in V1.

```ts
import { env } from "@/lib/env"

export function downloadApproved(jobId: string): void {
  const url = `${env.NEXT_PUBLIC_API_URL}/jobs/${jobId}/download`
  const a = document.createElement("a")
  a.href = url
  a.download = `${jobId}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
```

---

## Section 3 — `useJobPolling`

### `src/features/jobs/hooks/useJobPolling.ts`

```ts
import { useQuery } from "@tanstack/react-query"
import { getJob } from "@/features/jobs/api/getJob"
import { jobsQueryKeys } from "@/features/jobs/queryKeys"
import type { Job } from "@/features/jobs/types"
import type { UseQueryResult } from "@tanstack/react-query"

const TERMINAL_STATUSES = ["complete", "failed"] as const
type TerminalStatus = (typeof TERMINAL_STATUSES)[number]

function isTerminal(status: string | undefined): boolean {
  return !status || (TERMINAL_STATUSES as readonly string[]).includes(status)
}

export function useJobPolling(jobId: string): UseQueryResult<Job> {
  return useQuery({
    queryKey: jobsQueryKeys.detail(jobId),
    queryFn: () => getJob(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return isTerminal(status) ? false : 2000
    },
  })
}
```

Returns the full `useQuery` result — callers access `data`, `isLoading`, `isError` directly.

**Polling behavior:**
- Polls every 2 seconds while `status` is `"idle"` or `"generating"`
- Stops immediately when `status` is `"complete"` or `"failed"`
- Also stops when `data` is undefined (before first fetch completes)

---

## Section 4 — `useImageFilters`

### `src/features/jobs/hooks/useImageFilters.ts`

```ts
import { parseAsString, useQueryStates } from "nuqs"
import type { JobImage } from "@/features/jobs/types"

export function useImageFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      status: parseAsString.withDefault("all"),
      country_id: parseAsString.withDefault(""),
      shot_type_id: parseAsString.withDefault(""),
    },
    { history: "replace" },
  )

  const filterImages = (images: JobImage[]) =>
    images.filter((img) => {
      if (filters.status !== "all" && img.status !== filters.status) return false
      // country_id and shot_type_id predicates added in next section
      // when full image type with those fields is available
      return true
    })

  return { filters, setFilters, filterImages }
}
```

All three filter dimensions are in the URL — `status`, `country_id`, `shot_type_id`. Only `status` is applied now. The country/shot_type predicates slot in without touching nuqs setup again.

---

## Testing Strategy

### `getJob` tests
- Mock `apiClient.get`, assert it calls `/jobs/{id}`
- Assert returned value passes `JobSchema` validation
- Assert `ApiError` propagates when apiClient throws

### `useJobPolling` tests
- Use `renderHook` with `QueryClientProvider` wrapper
- Mock `getJob` to return a sequence of responses
- Use `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync(2000)` to tick polling
- Assert: called repeatedly while `status === "generating"`
- Assert: stops after status transitions to `"complete"`
- Assert: stops after status transitions to `"failed"`

### `useImageFilters` tests
- Use `NuqsTestingAdapter` from `nuqs/adapters/testing`
- Assert: `setFilters({ status: "approved" })` updates URL param
- Assert: `filterImages` with `status = "approved"` returns only approved images
- Assert: `filterImages` with `status = "all"` returns all images
- Assert: `country_id` and `shot_type_id` params are set in URL but do not filter yet

---

## Checkpoint

Polling starts and stops correctly (verified by tests). Filters update URL params. All new files pass `pnpm type-check` and `pnpm test`.
