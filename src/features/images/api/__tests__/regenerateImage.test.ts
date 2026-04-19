vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1" },
}))

import { describe, expect, it, vi } from "vitest"

import { regenerateImage } from "@/features/images/api/regenerateImage"
import { apiClient } from "@/lib/api/client"

vi.mock("@/lib/api/client", () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

describe("regenerateImage", () => {
  it("accepts the backend regenerate response shape without requiring full job image fields", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      id: "ad6996be-104d-494d-af78-b27a8efdb2d1",
      job_id: "7e96929c-88e3-4d5a-974f-f2e567d12345",
      product_id: "39d0a0c4-1d5d-45ea-b9bd-0003f60b9a24",
      colour_id: "411b3197-57fc-48eb-a7db-0fd40bb7a764",
      country_id: "0d4c773b-726c-48e8-84d5-4a15e18e54a0",
      shot_type_id: "d6d77d99-d969-4d8f-94ae-f9554a419f0b",
      variation_number: 1,
      prompt_used: "PROMPT",
      file_path: null,
      status: "generating",
      model_used: "fal-ai/flux-2-pro",
      regeneration_source_id: "97d05307-70f5-4f37-b4ae-11ffd80a2650",
      created_at: "2026-04-19T12:00:00Z",
    })

    await expect(regenerateImage("ad6996be-104d-494d-af78-b27a8efdb2d1")).resolves
      .toEqual(undefined)
  })
})
