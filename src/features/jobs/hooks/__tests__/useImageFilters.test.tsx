import { renderHook, act } from "@testing-library/react"
import type { ReactNode } from "react"
import { NuqsTestingAdapter } from "nuqs/adapters/testing"
import { describe, expect, it } from "vitest"

import type { JobImage } from "@/features/jobs/types"
import { useImageFilters } from "../useImageFilters"

function wrapper({ children }: { children: ReactNode }) {
  return <NuqsTestingAdapter>{children}</NuqsTestingAdapter>
}

function makeImages(): JobImage[] {
  return [
    {
      id: "img-1",
      status: "approved",
      file_path: "/img1.png",
      regeneration_source_id: null,
    },
    {
      id: "img-2",
      status: "rejected",
      file_path: "/img2.png",
      regeneration_source_id: null,
    },
    {
      id: "img-3",
      status: "pending",
      file_path: null,
      regeneration_source_id: null,
    },
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

    expect(result.current.filterImages(makeImages())).toHaveLength(3)
  })
})
