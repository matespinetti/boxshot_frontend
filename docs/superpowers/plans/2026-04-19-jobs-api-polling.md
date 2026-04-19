# Jobs Feature — API + Polling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete data layer for the jobs feature: types, query keys, three API functions, a self-stopping polling hook, and URL-based image filters.

**Architecture:** Images are embedded in `GET /jobs/{id}`, so a single TanStack Query key `["jobs", id]` covers both job status and images. `useJobPolling` uses `refetchInterval` callback that returns `false` on terminal status. `useImageFilters` stores all three filter dimensions in the URL via nuqs `useQueryStates`.

**Tech Stack:** TanStack Query v5, nuqs v2, Zod v4, Vitest + Testing Library, jsdom

---

## File Map

| Action | Path |
|--------|------|
| Create | `src/features/jobs/types.ts` |
| Create | `src/features/jobs/queryKeys.ts` |
| Create | `src/features/jobs/api/getJob.ts` |
| Create | `src/features/jobs/api/__tests__/getJob.test.ts` |
| Create | `src/features/jobs/api/getJobImages.ts` |
| Create | `src/features/jobs/api/__tests__/getJobImages.test.ts` |
| Create | `src/features/jobs/api/downloadApproved.ts` |
| Create | `src/features/jobs/api/__tests__/downloadApproved.test.ts` |
| Create | `src/features/jobs/hooks/useJobPolling.ts` |
| Create | `src/features/jobs/hooks/__tests__/useJobPolling.test.tsx` |
| Create | `src/features/jobs/hooks/useImageFilters.ts` |
| Create | `src/features/jobs/hooks/__tests__/useImageFilters.test.tsx` |

---

### Task 1: Types and Query Keys

**Files:**
- Create: `src/features/jobs/types.ts`
- Create: `src/features/jobs/queryKeys.ts`

No tests needed — these are pure type re-exports and a constant object.

- [ ] **Step 1: Create `src/features/jobs/types.ts`**

```ts
export type { Job, JobImage } from "@/schemas/jobs"
```

- [ ] **Step 2: Create `src/features/jobs/queryKeys.ts`**

```ts
export const jobsQueryKeys = {
  detail: (id: string) => ["jobs", id] as const,
}
```

- [ ] **Step 3: Verify types compile**

Run:
```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/jobs/types.ts src/features/jobs/queryKeys.ts
git commit -m "feat: add jobs types and query keys"
```

---

### Task 2: `getJob` API Function (TDD)

**Files:**
- Create: `src/features/jobs/api/getJob.ts`
- Test: `src/features/jobs/api/__tests__/getJob.test.ts`

**Background:** The project's `apiClient` lives at `src/lib/api/client.ts` and exposes `{ get, post, patch, delete }`. All responses are validated with Zod at the API function level. The env mock (`@/lib/env`) is required because `apiClient` imports from it at module load time.

- [ ] **Step 1: Write the failing test**

Create `src/features/jobs/api/__tests__/getJob.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1" },
}))

vi.mock("@/lib/api/client", () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from "@/lib/api/client"
import { getJob } from "../getJob"

const mockJobData = {
  id: "job-1",
  status: "generating",
  total_images: 2,
  completed_images: 1,
  images: [
    {
      id: "img-1",
      status: "complete",
      file_path: "/chelsea/RAL7032/UK/PDP/img.png",
      regeneration_source_id: null,
    },
    {
      id: "img-2",
      status: "pending",
      file_path: null,
      regeneration_source_id: null,
    },
  ],
}

describe("getJob", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockResolvedValue(mockJobData)
  })

  it("calls /jobs/{id} via apiClient", async () => {
    await getJob("job-1")
    expect(apiClient.get).toHaveBeenCalledWith("/jobs/job-1")
  })

  it("returns a parsed Job with images", async () => {
    const result = await getJob("job-1")
    expect(result.id).toBe("job-1")
    expect(result.status).toBe("generating")
    expect(result.images).toHaveLength(2)
    expect(result.images[0].id).toBe("img-1")
  })

  it("propagates errors thrown by apiClient", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("Network error"))
    await expect(getJob("job-1")).rejects.toThrow("Network error")
  })
})
```

- [ ] **Step 2: Run the test — expect FAIL**

```bash
pnpm test --run src/features/jobs/api/__tests__/getJob.test.ts
```

Expected: FAIL — `Cannot find module '../getJob'`

- [ ] **Step 3: Create `src/features/jobs/api/getJob.ts`**

```ts
import { apiClient } from "@/lib/api/client"
import { JobSchema } from "@/schemas/jobs"
import type { Job } from "@/features/jobs/types"

export async function getJob(jobId: string): Promise<Job> {
  const data = await apiClient.get<unknown>(`/jobs/${jobId}`)
  return JobSchema.parse(data)
}
```

- [ ] **Step 4: Run the test — expect PASS**

```bash
pnpm test --run src/features/jobs/api/__tests__/getJob.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/jobs/api/getJob.ts src/features/jobs/api/__tests__/getJob.test.ts
git commit -m "feat: add getJob API function"
```

---

### Task 3: `getJobImages` API Function (TDD)

**Files:**
- Create: `src/features/jobs/api/getJobImages.ts`
- Test: `src/features/jobs/api/__tests__/getJobImages.test.ts`

**Background:** The backend does not have a separate `/jobs/{id}/images` endpoint — images are embedded in the job response. `getJobImages` calls `getJob` and returns `job.images`. We mock `getJob` directly (not `apiClient`) to keep tests focused.

- [ ] **Step 1: Write the failing test**

Create `src/features/jobs/api/__tests__/getJobImages.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1" },
}))

vi.mock("../getJob")

import { getJob } from "../getJob"
import { getJobImages } from "../getJobImages"
import type { Job } from "@/features/jobs/types"

const mockJob: Job = {
  id: "job-1",
  status: "complete",
  total_images: 2,
  completed_images: 2,
  images: [
    { id: "img-1", status: "approved", file_path: "/img1.png", regeneration_source_id: null },
    { id: "img-2", status: "rejected", file_path: "/img2.png", regeneration_source_id: null },
  ],
}

describe("getJobImages", () => {
  beforeEach(() => {
    vi.mocked(getJob).mockResolvedValue(mockJob)
  })

  it("calls getJob with the same jobId", async () => {
    await getJobImages("job-1")
    expect(getJob).toHaveBeenCalledWith("job-1")
  })

  it("returns the images array from the job", async () => {
    const result = await getJobImages("job-1")
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe("img-1")
    expect(result[1].id).toBe("img-2")
  })

  it("propagates errors thrown by getJob", async () => {
    vi.mocked(getJob).mockRejectedValue(new Error("Not found"))
    await expect(getJobImages("job-1")).rejects.toThrow("Not found")
  })
})
```

- [ ] **Step 2: Run the test — expect FAIL**

```bash
pnpm test --run src/features/jobs/api/__tests__/getJobImages.test.ts
```

Expected: FAIL — `Cannot find module '../getJobImages'`

- [ ] **Step 3: Create `src/features/jobs/api/getJobImages.ts`**

```ts
import type { JobImage } from "@/features/jobs/types"
import { getJob } from "./getJob"

export async function getJobImages(jobId: string): Promise<JobImage[]> {
  const job = await getJob(jobId)
  return job.images
}
```

- [ ] **Step 4: Run the test — expect PASS**

```bash
pnpm test --run src/features/jobs/api/__tests__/getJobImages.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/jobs/api/getJobImages.ts src/features/jobs/api/__tests__/getJobImages.test.ts
git commit -m "feat: add getJobImages API function"
```

---

### Task 4: `downloadApproved` (TDD)

**Files:**
- Create: `src/features/jobs/api/downloadApproved.ts`
- Test: `src/features/jobs/api/__tests__/downloadApproved.test.ts`

**Background:** `GET /jobs/{id}/download` streams a ZIP file — unsuitable for the JSON-based `apiClient`. Instead we construct the URL from `env.NEXT_PUBLIC_API_URL` and trigger a native browser download by programmatically clicking a temporary `<a>` element. Testing uses `vi.spyOn` on DOM methods; the jsdom environment provides a real `document.body`.

- [ ] **Step 1: Write the failing test**

Create `src/features/jobs/api/__tests__/downloadApproved.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from "vitest"

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1" },
}))

import { downloadApproved } from "../downloadApproved"

describe("downloadApproved", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("creates an anchor with the correct download URL", () => {
    const clickFn = vi.fn()
    const mockAnchor = {
      href: "",
      download: "",
      click: clickFn,
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor)
    vi.spyOn(document.body, "appendChild").mockImplementation((node) => node)
    vi.spyOn(document.body, "removeChild").mockImplementation((node) => node)

    downloadApproved("job-abc")

    expect(mockAnchor.href).toBe("http://localhost:8000/api/v1/jobs/job-abc/download")
    expect(mockAnchor.download).toBe("job-abc.zip")
  })

  it("calls click() on the anchor element", () => {
    const clickFn = vi.fn()
    const mockAnchor = {
      href: "",
      download: "",
      click: clickFn,
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor)
    vi.spyOn(document.body, "appendChild").mockImplementation((node) => node)
    vi.spyOn(document.body, "removeChild").mockImplementation((node) => node)

    downloadApproved("job-abc")

    expect(clickFn).toHaveBeenCalledOnce()
  })

  it("appends and removes the anchor from document.body", () => {
    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor)
    const appendSpy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => node)
    const removeSpy = vi.spyOn(document.body, "removeChild").mockImplementation((node) => node)

    downloadApproved("job-abc")

    expect(appendSpy).toHaveBeenCalledWith(mockAnchor)
    expect(removeSpy).toHaveBeenCalledWith(mockAnchor)
  })
})
```

- [ ] **Step 2: Run the test — expect FAIL**

```bash
pnpm test --run src/features/jobs/api/__tests__/downloadApproved.test.ts
```

Expected: FAIL — `Cannot find module '../downloadApproved'`

- [ ] **Step 3: Create `src/features/jobs/api/downloadApproved.ts`**

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

- [ ] **Step 4: Run the test — expect PASS**

```bash
pnpm test --run src/features/jobs/api/__tests__/downloadApproved.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/jobs/api/downloadApproved.ts src/features/jobs/api/__tests__/downloadApproved.test.ts
git commit -m "feat: add downloadApproved trigger function"
```

---

### Task 5: `useJobPolling` Hook (TDD)

**Files:**
- Create: `src/features/jobs/hooks/useJobPolling.ts`
- Test: `src/features/jobs/hooks/__tests__/useJobPolling.test.tsx`

**Background:** `useJobPolling` wraps TanStack Query's `useQuery` with a `refetchInterval` callback. The callback returns `2000` when the job status is `"idle"` or `"generating"`, and `false` (stops polling) when status is `"complete"`, `"failed"`, or `undefined`. Testing uses `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync()` to control the passage of time without actually waiting. A fresh `QueryClient` per test prevents cache leakage between tests.

- [ ] **Step 1: Write the failing tests**

Create `src/features/jobs/hooks/__tests__/useJobPolling.test.tsx`:

```tsx
import { renderHook } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1" },
}))

vi.mock("@/features/jobs/api/getJob")

import { getJob } from "@/features/jobs/api/getJob"
import { useJobPolling } from "../useJobPolling"
import type { Job } from "@/features/jobs/types"

function makeJob(status: Job["status"]): Job {
  return {
    id: "job-1",
    status,
    total_images: 2,
    completed_images: status === "complete" ? 2 : 1,
    images: [],
  }
}

let queryClient: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe("useJobPolling", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it("fetches the job on mount", async () => {
    vi.mocked(getJob).mockResolvedValue(makeJob("complete"))
    renderHook(() => useJobPolling("job-1"), { wrapper })
    await vi.advanceTimersByTimeAsync(50)
    expect(getJob).toHaveBeenCalledWith("job-1")
  })

  it("polls every 2s while status is generating", async () => {
    vi.mocked(getJob).mockResolvedValue(makeJob("generating"))
    renderHook(() => useJobPolling("job-1"), { wrapper })
    await vi.advanceTimersByTimeAsync(50)    // initial fetch settles
    await vi.advanceTimersByTimeAsync(2050)  // 1st poll
    await vi.advanceTimersByTimeAsync(2050)  // 2nd poll
    expect(getJob).toHaveBeenCalledTimes(3)
  })

  it("polls every 2s while status is idle", async () => {
    vi.mocked(getJob).mockResolvedValue(makeJob("idle"))
    renderHook(() => useJobPolling("job-1"), { wrapper })
    await vi.advanceTimersByTimeAsync(50)
    await vi.advanceTimersByTimeAsync(2050)
    await vi.advanceTimersByTimeAsync(2050)
    expect(getJob).toHaveBeenCalledTimes(3)
  })

  it("does not poll again when initial status is complete", async () => {
    vi.mocked(getJob).mockResolvedValue(makeJob("complete"))
    renderHook(() => useJobPolling("job-1"), { wrapper })
    await vi.advanceTimersByTimeAsync(50)
    await vi.advanceTimersByTimeAsync(4000)
    expect(getJob).toHaveBeenCalledTimes(1)
  })

  it("does not poll again when initial status is failed", async () => {
    vi.mocked(getJob).mockResolvedValue(makeJob("failed"))
    renderHook(() => useJobPolling("job-1"), { wrapper })
    await vi.advanceTimersByTimeAsync(50)
    await vi.advanceTimersByTimeAsync(4000)
    expect(getJob).toHaveBeenCalledTimes(1)
  })

  it("stops polling when status transitions from generating to complete", async () => {
    vi.mocked(getJob)
      .mockResolvedValueOnce(makeJob("generating"))
      .mockResolvedValue(makeJob("complete"))
    renderHook(() => useJobPolling("job-1"), { wrapper })
    await vi.advanceTimersByTimeAsync(50)    // initial: generating → sets 2s timer
    await vi.advanceTimersByTimeAsync(2050)  // 1st poll: complete → no more timers
    const callCount = vi.mocked(getJob).mock.calls.length
    await vi.advanceTimersByTimeAsync(4000)  // nothing more
    expect(vi.mocked(getJob).mock.calls.length).toBe(callCount)
  })

  it("returns data from the hook result", async () => {
    vi.mocked(getJob).mockResolvedValue(makeJob("complete"))
    const { result } = renderHook(() => useJobPolling("job-1"), { wrapper })
    await vi.advanceTimersByTimeAsync(50)
    expect(result.current.data?.status).toBe("complete")
  })
})
```

- [ ] **Step 2: Run the tests — expect FAIL**

```bash
pnpm test --run src/features/jobs/hooks/__tests__/useJobPolling.test.tsx
```

Expected: FAIL — `Cannot find module '../useJobPolling'`

- [ ] **Step 3: Create `src/features/jobs/hooks/useJobPolling.ts`**

```ts
import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import { getJob } from "@/features/jobs/api/getJob"
import { jobsQueryKeys } from "@/features/jobs/queryKeys"
import type { Job } from "@/features/jobs/types"

const TERMINAL_STATUSES = ["complete", "failed"] as const

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

- [ ] **Step 4: Run the tests — expect PASS**

```bash
pnpm test --run src/features/jobs/hooks/__tests__/useJobPolling.test.tsx
```

Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/jobs/hooks/useJobPolling.ts src/features/jobs/hooks/__tests__/useJobPolling.test.tsx
git commit -m "feat: add useJobPolling hook with auto-stop on terminal status"
```

---

### Task 6: `useImageFilters` Hook (TDD)

**Files:**
- Create: `src/features/jobs/hooks/useImageFilters.ts`
- Test: `src/features/jobs/hooks/__tests__/useImageFilters.test.tsx`

**Background:** `useImageFilters` uses nuqs `useQueryStates` to store `status`, `country_id`, and `shot_type_id` in the URL. Testing uses `NuqsTestingAdapter` from `nuqs/adapters/testing` — a thin wrapper that provides the nuqs context without a real browser URL bar. `setFilters` from `useQueryStates` returns a Promise in nuqs v2, so `await act(async () => { await setFilters(...) })` is required to flush state updates.

**Note on filter scope:** Only `status` filtering is applied in `filterImages` now. The `country_id` and `shot_type_id` URL params are wired but their filter predicates will be added in the next section when `JobImage` carries those fields.

- [ ] **Step 1: Write the failing tests**

Create `src/features/jobs/hooks/__tests__/useImageFilters.test.tsx`:

```tsx
import { renderHook, act } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { NuqsTestingAdapter } from "nuqs/adapters/testing"
import type { ReactNode } from "react"
import { useImageFilters } from "../useImageFilters"
import type { JobImage } from "@/features/jobs/types"

function wrapper({ children }: { children: ReactNode }) {
  return <NuqsTestingAdapter>{children}</NuqsTestingAdapter>
}

function makeImages(): JobImage[] {
  return [
    { id: "img-1", status: "approved", file_path: "/img1.png", regeneration_source_id: null },
    { id: "img-2", status: "rejected", file_path: "/img2.png", regeneration_source_id: null },
    { id: "img-3", status: "pending", file_path: null, regeneration_source_id: null },
  ]
}

describe("useImageFilters", () => {
  it("defaults status to 'all'", () => {
    const { result } = renderHook(() => useImageFilters(), { wrapper })
    expect(result.current.filters.status).toBe("all")
  })

  it("defaults country_id to empty string", () => {
    const { result } = renderHook(() => useImageFilters(), { wrapper })
    expect(result.current.filters.country_id).toBe("")
  })

  it("defaults shot_type_id to empty string", () => {
    const { result } = renderHook(() => useImageFilters(), { wrapper })
    expect(result.current.filters.shot_type_id).toBe("")
  })

  it("filterImages returns all images when status is 'all'", () => {
    const { result } = renderHook(() => useImageFilters(), { wrapper })
    expect(result.current.filterImages(makeImages())).toHaveLength(3)
  })

  it("filterImages returns only approved images when status is 'approved'", async () => {
    const { result } = renderHook(() => useImageFilters(), { wrapper })
    await act(async () => {
      await result.current.setFilters({ status: "approved" })
    })
    const filtered = result.current.filterImages(makeImages())
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe("img-1")
  })

  it("filterImages returns only rejected images when status is 'rejected'", async () => {
    const { result } = renderHook(() => useImageFilters(), { wrapper })
    await act(async () => {
      await result.current.setFilters({ status: "rejected" })
    })
    const filtered = result.current.filterImages(makeImages())
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe("img-2")
  })

  it("setFilters updates country_id in state", async () => {
    const { result } = renderHook(() => useImageFilters(), { wrapper })
    await act(async () => {
      await result.current.setFilters({ country_id: "uuid-country-1" })
    })
    expect(result.current.filters.country_id).toBe("uuid-country-1")
  })

  it("setFilters updates shot_type_id in state", async () => {
    const { result } = renderHook(() => useImageFilters(), { wrapper })
    await act(async () => {
      await result.current.setFilters({ shot_type_id: "uuid-shot-1" })
    })
    expect(result.current.filters.shot_type_id).toBe("uuid-shot-1")
  })

  it("country_id filter does not reduce results yet (predicate not implemented)", async () => {
    const { result } = renderHook(() => useImageFilters(), { wrapper })
    await act(async () => {
      await result.current.setFilters({ country_id: "uuid-country-1" })
    })
    // Full country filtering added when JobImage carries country_id
    expect(result.current.filterImages(makeImages())).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Run the tests — expect FAIL**

```bash
pnpm test --run src/features/jobs/hooks/__tests__/useImageFilters.test.tsx
```

Expected: FAIL — `Cannot find module '../useImageFilters'`

- [ ] **Step 3: Create `src/features/jobs/hooks/useImageFilters.ts`**

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
      return true
    })

  return { filters, setFilters, filterImages }
}
```

- [ ] **Step 4: Run the tests — expect PASS**

```bash
pnpm test --run src/features/jobs/hooks/__tests__/useImageFilters.test.tsx
```

Expected: 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/jobs/hooks/useImageFilters.ts src/features/jobs/hooks/__tests__/useImageFilters.test.tsx
git commit -m "feat: add useImageFilters hook with nuqs URL state"
```

---

### Task 7: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run the full test suite**

```bash
pnpm test --run
```

Expected: all tests pass (previous 128 + new tests from this feature).

- [ ] **Step 2: Run type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit if any fixes were needed**

Only commit if step 1 or 2 required fixes. Otherwise skip.

```bash
git add -p
git commit -m "fix: resolve type or test issues from jobs data layer"
```
