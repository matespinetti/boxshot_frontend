import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1" },
}))

vi.mock("@/features/jobs/api/getJob")

import { getJob } from "@/features/jobs/api/getJob"
import type { Job } from "@/features/jobs/types"
import { useJobPolling } from "../useJobPolling"

function makeJob(status: Job["status"]): Job {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    status,
    total_images: 2,
    completed_images: status === "complete" ? 2 : 1,
    created_at: "2026-04-19T12:00:00Z",
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

    renderHook(() => useJobPolling("11111111-1111-4111-8111-111111111111"), {
      wrapper,
    })

    await vi.advanceTimersByTimeAsync(50)

    expect(getJob).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111")
  })

  it("polls every 2s while status is generating", async () => {
    vi.mocked(getJob).mockResolvedValue(makeJob("generating"))

    renderHook(() => useJobPolling("11111111-1111-4111-8111-111111111111"), {
      wrapper,
    })

    await vi.advanceTimersByTimeAsync(50)
    await vi.advanceTimersByTimeAsync(2050)
    await vi.advanceTimersByTimeAsync(2050)

    expect(getJob).toHaveBeenCalledTimes(3)
  })

  it("polls every 2s while status is idle", async () => {
    vi.mocked(getJob).mockResolvedValue(makeJob("idle"))

    renderHook(() => useJobPolling("11111111-1111-4111-8111-111111111111"), {
      wrapper,
    })

    await vi.advanceTimersByTimeAsync(50)
    await vi.advanceTimersByTimeAsync(2050)
    await vi.advanceTimersByTimeAsync(2050)

    expect(getJob).toHaveBeenCalledTimes(3)
  })

  it("does not poll again when initial status is complete", async () => {
    vi.mocked(getJob).mockResolvedValue(makeJob("complete"))

    renderHook(() => useJobPolling("11111111-1111-4111-8111-111111111111"), {
      wrapper,
    })

    await vi.advanceTimersByTimeAsync(50)
    await vi.advanceTimersByTimeAsync(4000)

    expect(getJob).toHaveBeenCalledTimes(1)
  })

  it("does not poll again when initial status is failed", async () => {
    vi.mocked(getJob).mockResolvedValue(makeJob("failed"))

    renderHook(() => useJobPolling("11111111-1111-4111-8111-111111111111"), {
      wrapper,
    })

    await vi.advanceTimersByTimeAsync(50)
    await vi.advanceTimersByTimeAsync(4000)

    expect(getJob).toHaveBeenCalledTimes(1)
  })

  it("stops polling when status transitions from generating to complete", async () => {
    vi.mocked(getJob)
      .mockResolvedValueOnce(makeJob("generating"))
      .mockResolvedValue(makeJob("complete"))

    renderHook(() => useJobPolling("11111111-1111-4111-8111-111111111111"), {
      wrapper,
    })

    await vi.advanceTimersByTimeAsync(50)
    await vi.advanceTimersByTimeAsync(2050)

    const callCount = vi.mocked(getJob).mock.calls.length

    await vi.advanceTimersByTimeAsync(4000)

    expect(vi.mocked(getJob).mock.calls.length).toBe(callCount)
  })

  it("returns data from the hook result", async () => {
    vi.mocked(getJob).mockResolvedValue(makeJob("complete"))

    const { result } = renderHook(
      () => useJobPolling("11111111-1111-4111-8111-111111111111"),
      { wrapper },
    )

    await vi.advanceTimersByTimeAsync(50)

    expect(result.current.data?.status).toBe("complete")
  })
})
