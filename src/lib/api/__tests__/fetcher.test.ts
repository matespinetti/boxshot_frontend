import { afterEach, describe, expect, it, vi } from "vitest"

describe("fetcher", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("includes cookies on backend requests", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000/api/v1")
    vi.resetModules()
    const { fetcher } = await import("../fetcher")
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    await fetcher("/auth/me")

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/auth/me",
      expect.objectContaining({ credentials: "include" }),
    )
  })
})
