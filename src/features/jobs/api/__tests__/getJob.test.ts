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
  created_at: "2026-04-19T12:00:00Z",
  images: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      status: "complete",
      file_path: "/chelsea/RAL7032/UK/PDP/img.png",
      regeneration_source_id: null,
      product_id: "44444444-4444-4444-8444-444444444444",
      colour_id: "55555555-5555-4555-8555-555555555555",
      country_id: "66666666-6666-4666-8666-666666666666",
      shot_type_id: "77777777-7777-4777-8777-777777777777",
      variation_number: 1,
      created_at: "2026-04-19T12:00:10Z",
      product_name: "Chelsea",
      ral_code: "RAL7032",
      country_code: "UK",
      country_name: "United Kingdom",
      shot_type_name: "PDP",
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      status: "pending",
      file_path: null,
      regeneration_source_id: null,
      product_id: "44444444-4444-4444-8444-444444444444",
      colour_id: "55555555-5555-4555-8555-555555555555",
      country_id: "88888888-8888-4888-8888-888888888888",
      shot_type_id: "99999999-9999-4999-8999-999999999999",
      variation_number: 2,
      created_at: "2026-04-19T12:00:20Z",
      product_name: "Chelsea",
      ral_code: "RAL7032",
      country_code: "NL",
      country_name: "Netherlands",
      shot_type_name: "Lifestyle",
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
    expect(result.images[0].product_name).toBe("Chelsea")
    expect(result.images[0].country_code).toBe("UK")
  })

  it("propagates errors thrown by apiClient", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("Network error"))

    await expect(
      getJob("11111111-1111-4111-8111-111111111111"),
    ).rejects.toThrow("Network error")
  })
})
