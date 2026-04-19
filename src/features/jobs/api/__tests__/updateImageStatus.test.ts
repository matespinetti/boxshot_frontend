import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1" },
}))

vi.mock("@/lib/api/client", () => ({
  apiClient: { patch: vi.fn() },
}))

import { apiClient } from "@/lib/api/client"
import { updateImageStatus } from "../updateImageStatus"

it("patches /images/{id}/status with the provided status", async () => {
  vi.mocked(apiClient.patch).mockResolvedValue({})

  await updateImageStatus(
    "11111111-1111-4111-8111-111111111111",
    "approved",
  )

  expect(apiClient.patch).toHaveBeenCalledWith(
    "/images/11111111-1111-4111-8111-111111111111/status",
    { status: "approved" },
  )
})
