import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1" },
}))

vi.mock("@/lib/api/client", () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from "@/lib/api/client"
import { getJobs } from "../getJobs"

describe("getJobs", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      per_page: 20,
      pages: 0,
    })
  })

  it("calls /jobs with page and per_page", async () => {
    await getJobs({ page: 2, perPage: 10 })

    expect(apiClient.get).toHaveBeenCalledWith("/jobs?page=2&per_page=10")
  })

  it("appends status when provided", async () => {
    await getJobs({ page: 1, perPage: 20, status: "generating" })

    expect(apiClient.get).toHaveBeenCalledWith(
      "/jobs?page=1&per_page=20&status=generating",
    )
  })
})
