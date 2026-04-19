import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { NuqsTestingAdapter } from "nuqs/adapters/testing"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1" },
}))

vi.mock("@/features/jobs/hooks/useJobPolling")
vi.mock("@/features/images/api/updateImageStatus")
vi.mock("@/features/images/api/regenerateImage")
vi.mock("@/features/jobs/api/downloadApproved")

import { downloadApproved } from "@/features/jobs/api/downloadApproved"
import { updateImageStatus } from "@/features/images/api/updateImageStatus"
import { useJobPolling } from "@/features/jobs/hooks/useJobPolling"
import { resetImageSelectionStore } from "@/features/jobs/stores/useImageSelectionStore"
import { JobResultsView } from "../JobResultsView"

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NuqsTestingAdapter>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </NuqsTestingAdapter>
    )
  }
}

const baseJob = {
  id: "11111111-1111-4111-8111-111111111111",
  status: "generating" as const,
  total_images: 2,
  completed_images: 1,
  created_at: "2026-04-19T12:00:00Z",
  images: [
    {
      id: "11111111-1111-4111-8111-111111111112",
      status: "complete" as const,
      file_path: "/img-1.png",
      image_url: "/static/jobs/img-1.png",
      regeneration_source_id: null,
      product_id: "aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      colour_id: "bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
      country_id: "ccccccc1-cccc-4ccc-8ccc-ccccccccccc1",
      shot_type_id: "ddddddd1-dddd-4ddd-8ddd-ddddddddddd1",
      variation_number: 1,
      created_at: "2026-04-19T12:00:10Z",
      product_name: "Chelsea",
      ral_code: "RAL7032",
      country_code: "UK",
      country_name: "United Kingdom",
      shot_type_name: "PDP",
    },
    {
      id: "11111111-1111-4111-8111-111111111113",
      status: "pending" as const,
      file_path: null,
      image_url: null,
      regeneration_source_id: null,
      product_id: "aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      colour_id: "bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
      country_id: "ccccccc2-cccc-4ccc-8ccc-ccccccccccc2",
      shot_type_id: "ddddddd2-dddd-4ddd-8ddd-ddddddddddd2",
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

describe("JobResultsView", () => {
  beforeEach(() => {
    resetImageSelectionStore()
    vi.clearAllMocks()
  })

  it("shows a waiting state when the job has no images yet", () => {
    vi.mocked(useJobPolling).mockReturnValue({
      data: { ...baseJob, images: [], completed_images: 0 },
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useJobPolling>)

    render(<JobResultsView jobId={baseJob.id} />, { wrapper: makeWrapper() })

    expect(screen.getByText("Images are on the way")).toBeInTheDocument()
  })

  it("downloads approved images", async () => {
    const user = userEvent.setup()

    vi.mocked(useJobPolling).mockReturnValue({
      data: {
        ...baseJob,
        images: [{ ...baseJob.images[0], status: "approved" }, baseJob.images[1]],
      },
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useJobPolling>)

    render(<JobResultsView jobId={baseJob.id} />, { wrapper: makeWrapper() })

    await user.click(screen.getByRole("button", { name: "Download ZIP" }))

    expect(downloadApproved).toHaveBeenCalledWith(baseJob.id)
  })

  it("bulk approves selected complete images", async () => {
    const user = userEvent.setup()
    vi.mocked(updateImageStatus).mockResolvedValue(undefined)
    vi.mocked(useJobPolling).mockReturnValue({
      data: baseJob,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useJobPolling>)

    render(<JobResultsView jobId={baseJob.id} />, { wrapper: makeWrapper() })

    await user.click(screen.getByRole("button", { name: "Select image 1" }))
    await user.click(screen.getByRole("button", { name: "Approve selected" }))

    await waitFor(() => {
      expect(updateImageStatus).toHaveBeenCalledWith(
        "11111111-1111-4111-8111-111111111112",
        "approved",
      )
    })
  })
})
