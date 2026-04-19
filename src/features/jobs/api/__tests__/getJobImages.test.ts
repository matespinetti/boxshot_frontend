import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1" },
}))

vi.mock("../getJob")

import type { Job } from "@/features/jobs/types"
import { getJob } from "../getJob"
import { getJobImages } from "../getJobImages"

const mockJob: Job = {
  id: "11111111-1111-4111-8111-111111111111",
  status: "complete",
  total_images: 2,
  completed_images: 2,
  created_at: "2026-04-19T12:00:00Z",
  images: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      status: "approved",
      file_path: "/img1.png",
      image_url: "/static/img1.png",
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
      status: "rejected",
      file_path: "/img2.png",
      image_url: "/static/img2.png",
      regeneration_source_id: null,
      product_id: "44444444-4444-4444-8444-444444444444",
      colour_id: "55555555-5555-4555-8555-555555555555",
      country_id: "88888888-8888-4888-8888-888888888888",
      shot_type_id: "99999999-9999-4999-8999-999999999999",
      variation_number: 2,
      created_at: "2026-04-19T12:00:11Z",
      product_name: "Chelsea",
      ral_code: "RAL7032",
      country_code: "NL",
      country_name: "Netherlands",
      shot_type_name: "Lifestyle",
    },
  ],
}

describe("getJobImages", () => {
  beforeEach(() => {
    vi.mocked(getJob).mockResolvedValue(mockJob)
  })

  it("calls getJob with the same jobId", async () => {
    await getJobImages("11111111-1111-4111-8111-111111111111")

    expect(getJob).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111")
  })

  it("returns the images array from the job", async () => {
    const result = await getJobImages("11111111-1111-4111-8111-111111111111")

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe("22222222-2222-4222-8222-222222222222")
    expect(result[1].id).toBe("33333333-3333-4333-8333-333333333333")
  })

  it("propagates errors thrown by getJob", async () => {
    vi.mocked(getJob).mockRejectedValue(new Error("Not found"))

    await expect(
      getJobImages("11111111-1111-4111-8111-111111111111"),
    ).rejects.toThrow("Not found")
  })
})
