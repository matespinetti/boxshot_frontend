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
  images: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      status: "approved",
      file_path: "/img1.png",
      regeneration_source_id: null,
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      status: "rejected",
      file_path: "/img2.png",
      regeneration_source_id: null,
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
