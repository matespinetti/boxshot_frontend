import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1" },
}))

vi.mock("@/lib/api/client", () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from "@/lib/api/client"
import { getJob } from "../getJob"

const mockJobData = {
  id: "11111111-1111-4111-8111-111111111111",
  status: "generating",
  total_images: 2,
  completed_images: 1,
  images: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      status: "complete",
      file_path: "/chelsea/RAL7032/UK/PDP/img.png",
      regeneration_source_id: null,
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
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
    await getJob("11111111-1111-4111-8111-111111111111")
    expect(apiClient.get).toHaveBeenCalledWith(
      "/jobs/11111111-1111-4111-8111-111111111111",
    )
  })

  it("returns a parsed Job with images", async () => {
    const result = await getJob("11111111-1111-4111-8111-111111111111")

    expect(result.id).toBe("11111111-1111-4111-8111-111111111111")
    expect(result.status).toBe("generating")
    expect(result.images).toHaveLength(2)
    expect(result.images[0].id).toBe("22222222-2222-4222-8222-222222222222")
  })

  it("propagates errors thrown by apiClient", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("Network error"))

    await expect(
      getJob("11111111-1111-4111-8111-111111111111"),
    ).rejects.toThrow("Network error")
  })
})
