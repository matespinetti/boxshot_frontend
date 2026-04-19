vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1" },
}))

import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { ReactNode } from "react"
import type { Job } from "@/schemas/jobs"
import { useImageActions } from "@/features/images/hooks/useImageActions"
import * as updateImageStatusModule from "@/features/images/api/updateImageStatus"

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

    result.current.approve(IMAGE_ID).catch(() => {})

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
