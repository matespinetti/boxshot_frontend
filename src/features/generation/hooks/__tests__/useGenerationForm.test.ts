import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useRouter, useSearchParams } from "next/navigation"

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

import { createJob } from "@/features/generation/api/createJob"
import { previewPrompts } from "@/features/generation/api/previewPrompts"
import type { Job } from "@/features/generation/types"
import { useGenerationForm } from "../useGenerationForm"

const UUID = "550e8400-e29b-41d4-a716-446655440000"

describe("useGenerationForm", () => {
  beforeEach(() => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams() as ReturnType<typeof useSearchParams>,
    )
    vi.mocked(previewPrompts).mockReset()
    vi.mocked(createJob).mockReset()
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
        "product_id=some-product&installation_type_id=inst-id&surface_type_id=surface-id&model=fal-ai%2Fgpt-image-1.5%2Fedit&variations=3",
      ) as ReturnType<typeof useSearchParams>,
    )
    const { result } = renderHook(() => useGenerationForm())
    expect(result.current.form.getValues("product_id")).toBe("some-product")
    expect(result.current.form.getValues("installation_type_id")).toBe("inst-id")
    expect(result.current.form.getValues("surface_type_id")).toBe("surface-id")
    expect(result.current.form.getValues("model")).toBe(
      "fal-ai/gpt-image-1.5/edit",
    )
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

  it("submits installation_type_id and surface_type_id to preview", async () => {
    vi.mocked(previewPrompts).mockResolvedValue({ prompts: [] })
    const { result } = renderHook(() => useGenerationForm())

    act(() => {
      result.current.form.setValue("product_id", UUID)
      result.current.form.setValue("colour_id", UUID)
      result.current.form.setValue("installation_type_id", UUID)
      result.current.form.setValue("surface_type_id", UUID)
      result.current.form.setValue("country_ids", [UUID])
      result.current.form.setValue("shot_type_ids", [UUID])
      result.current.form.setValue("model", "fal-ai/gpt-image-1.5/edit")
      result.current.form.setValue("product_image_ids", [UUID])
    })

    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
        persist: vi.fn(),
      } as unknown as React.BaseSyntheticEvent)
    })

    expect(previewPrompts).toHaveBeenCalledWith(
      expect.objectContaining({
        installation_type_id: UUID,
        surface_type_id: UUID,
      }),
    )
  })

  it("blocks preview when no reference image is selected", async () => {
    const { result } = renderHook(() => useGenerationForm())

    act(() => {
      result.current.form.setValue("product_id", UUID)
      result.current.form.setValue("colour_id", UUID)
      result.current.form.setValue("installation_type_id", UUID)
      result.current.form.setValue("surface_type_id", UUID)
      result.current.form.setValue("country_ids", [UUID])
      result.current.form.setValue("shot_type_ids", [UUID])
      result.current.form.setValue("model", "fal-ai/gpt-image-1.5/edit")
      result.current.form.setValue("variations", 1)
      result.current.form.setValue("product_image_ids", [])
    })

    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
        persist: vi.fn(),
      } as unknown as React.BaseSyntheticEvent)
    })

    expect(previewPrompts).not.toHaveBeenCalled()
  })

  it("submits installation_type_id, surface_type_id, and model when confirming", async () => {
    const push = vi.fn()
    vi.mocked(useRouter).mockReturnValue({
      push,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>)
    vi.mocked(createJob).mockResolvedValue({
      id: UUID,
      status: "generating",
      total_images: 1,
      completed_images: 0,
      created_at: "2026-04-20T18:00:00Z",
      images: [],
    } satisfies Job)

    const { result } = renderHook(() => useGenerationForm())

    act(() => {
      result.current.form.setValue("product_id", UUID)
      result.current.form.setValue("colour_id", UUID)
      result.current.form.setValue("installation_type_id", UUID)
      result.current.form.setValue("surface_type_id", UUID)
      result.current.form.setValue("country_ids", [UUID])
      result.current.form.setValue("shot_type_ids", [UUID])
      result.current.form.setValue("variations", 1)
      result.current.form.setValue("model", "fal-ai/gpt-image-1.5/edit")
      result.current.form.setValue("product_image_ids", [UUID])
    })

    await act(async () => {
      await result.current.handleConfirm()
    })

    expect(createJob).toHaveBeenCalledWith(
      expect.objectContaining({
        installation_type_id: UUID,
        surface_type_id: UUID,
        model: "fal-ai/gpt-image-1.5/edit",
      }),
    )
    expect(push).toHaveBeenCalledWith(`/jobs/${UUID}`)
  })
})
