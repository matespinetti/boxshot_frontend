import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useSearchParams } from "next/navigation"

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

vi.mock("nuqs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("nuqs")>()
  return { ...actual, useQueryStates: () => [{}, vi.fn()] }
})

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }))

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1" },
}))

vi.mock("@/features/generation/api/previewPrompts", () => ({
  previewPrompts: vi.fn(),
}))

vi.mock("@/features/generation/api/createJob", () => ({
  createJob: vi.fn(),
}))

import { useGenerationForm } from "../useGenerationForm"

describe("useGenerationForm", () => {
  beforeEach(() => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams() as ReturnType<typeof useSearchParams>,
    )
  })

  it("initialises totalImages as 0 when no selections", () => {
    const { result } = renderHook(() => useGenerationForm())
    expect(result.current.totalImages).toBe(0)
  })

  it("computes totalImages as country_ids.length × shot_type_ids.length × variations", () => {
    const { result } = renderHook(() => useGenerationForm())
    act(() => {
      result.current.form.setValue("country_ids", ["c1", "c2"])
      result.current.form.setValue("shot_type_ids", ["s1", "s2", "s3"])
      result.current.form.setValue("variations", 2)
    })
    expect(result.current.totalImages).toBe(12)
  })

  it("rehydrates product_id and variations from search params on mount", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams(
        "product_id=some-product&variations=3",
      ) as ReturnType<typeof useSearchParams>,
    )
    const { result } = renderHook(() => useGenerationForm())
    expect(result.current.form.getValues("product_id")).toBe("some-product")
    expect(result.current.form.getValues("variations")).toBe(3)
  })

  it("rehydrates comma-separated country_ids from search params", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams(
        "country_ids=id1,id2,id3",
      ) as ReturnType<typeof useSearchParams>,
    )
    const { result } = renderHook(() => useGenerationForm())
    expect(result.current.form.getValues("country_ids")).toEqual([
      "id1",
      "id2",
      "id3",
    ])
  })

  it("exposes previewData as null initially", () => {
    const { result } = renderHook(() => useGenerationForm())
    expect(result.current.previewData).toBeNull()
  })

  it("exposes isPreviewing as false initially", () => {
    const { result } = renderHook(() => useGenerationForm())
    expect(result.current.isPreviewing).toBe(false)
  })
})
