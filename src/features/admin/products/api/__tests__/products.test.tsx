import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useUploadProductImage } from "../products"

describe("useUploadProductImage", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    })

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "image-1",
            product_id: "product-1",
            label: "Front",
            url: "https://example.com/front.png",
            created_at: "2026-04-29T00:00:00Z",
          }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("sends auth cookies with multipart upload requests", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useUploadProductImage(), { wrapper })

    const file = new File(["image"], "front.png", { type: "image/png" })
    await result.current.mutateAsync({
      productId: "product-1",
      file,
      label: "Front",
    })

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/admin/products/product-1/images/upload",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
        credentials: "include",
      }),
    )
  })
})
