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
      id: "11111111-1111-4111-8111-111111111111",
      status: "approved",
      file_path: "/img1.png",
      regeneration_source_id: null,
      product_id: "aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      colour_id: "bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
      country_id: "ccccccc1-cccc-4ccc-8ccc-ccccccccccc1",
      shot_type_id: "ddddddd1-dddd-4ddd-8ddd-ddddddddddd1",
      variation_number: 1,
      created_at: "2026-04-19T12:00:10Z",
      product_name: "Chelsea",
      ral_code: "RAL7032",
      country_code: "UK",
      country_name: "United Kingdom",
      shot_type_name: "PDP",
    },
    {
      id: "11111111-1111-4111-8111-111111111112",
      status: "rejected",
      file_path: "/img2.png",
      regeneration_source_id: null,
      product_id: "aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      colour_id: "bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
      country_id: "ccccccc2-cccc-4ccc-8ccc-ccccccccccc2",
      shot_type_id: "ddddddd2-dddd-4ddd-8ddd-ddddddddddd2",
      variation_number: 2,
      created_at: "2026-04-19T12:00:11Z",
      product_name: "Chelsea",
      ral_code: "RAL7032",
      country_code: "NL",
      country_name: "Netherlands",
      shot_type_name: "Lifestyle",
    },
    {
      id: "11111111-1111-4111-8111-111111111113",
      status: "pending",
      file_path: null,
      regeneration_source_id: null,
      product_id: "aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      colour_id: "bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
      country_id: "ccccccc1-cccc-4ccc-8ccc-ccccccccccc1",
      shot_type_id: "ddddddd2-dddd-4ddd-8ddd-ddddddddddd2",
      variation_number: 3,
      created_at: "2026-04-19T12:00:12Z",
      product_name: "Chelsea",
      ral_code: "RAL7032",
      country_code: "UK",
      country_name: "United Kingdom",
      shot_type_name: "Lifestyle",
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
    expect(filtered[0].id).toBe("11111111-1111-4111-8111-111111111111")
  })

  it("filterImages returns only rejected images when status is 'rejected'", async () => {
    const { result } = renderHook(() => useImageFilters(), { wrapper })

    await act(async () => {
      await result.current.setFilters({ status: "rejected" })
    })

    const filtered = result.current.filterImages(makeImages())

    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe("11111111-1111-4111-8111-111111111112")
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

  it("country_id filter returns only images from the selected country", async () => {
    const { result } = renderHook(() => useImageFilters(), { wrapper })

    await act(async () => {
      await result.current.setFilters({
        country_id: "ccccccc1-cccc-4ccc-8ccc-ccccccccccc1",
      })
    })

    const filtered = result.current.filterImages(makeImages())

    expect(filtered).toHaveLength(2)
    expect(filtered.every((image) => image.country_id === "ccccccc1-cccc-4ccc-8ccc-ccccccccccc1")).toBe(true)
  })

  it("shot_type_id filter returns only images from the selected shot type", async () => {
    const { result } = renderHook(() => useImageFilters(), { wrapper })

    await act(async () => {
      await result.current.setFilters({
        shot_type_id: "ddddddd2-dddd-4ddd-8ddd-ddddddddddd2",
      })
    })

    const filtered = result.current.filterImages(makeImages())

    expect(filtered).toHaveLength(2)
    expect(filtered.every((image) => image.shot_type_id === "ddddddd2-dddd-4ddd-8ddd-ddddddddddd2")).toBe(true)
  })
})
