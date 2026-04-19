import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1" },
}))

vi.mock("@/features/jobs/api/getJobs")
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    asChild,
    ...props
  }: {
    href: string
    children: React.ReactNode
    asChild?: boolean
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import { getJobs } from "@/features/jobs/api/getJobs"
import { JobsTable } from "../JobsTable"

const baseResponse = {
  items: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      status: "generating" as const,
      total_images: 12,
      completed_images: 4,
      created_at: "2026-04-19T12:00:00Z",
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      status: "complete" as const,
      total_images: 8,
      completed_images: 8,
      created_at: "2026-04-19T11:30:00Z",
    },
  ],
  total: 2,
  page: 1,
  per_page: 10,
  pages: 1,
}

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe("JobsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("loads the first page of jobs and renders rows", async () => {
    vi.mocked(getJobs).mockResolvedValue(baseResponse)

    render(<JobsTable />, { wrapper: makeWrapper() })

    await waitFor(() => {
      expect(getJobs).toHaveBeenCalledWith({ page: 1, perPage: 10 })
    })
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    })

    expect(screen.getAllByRole("link", { name: /view job/i })[0]).toHaveAttribute(
      "href",
      "/jobs/11111111-1111-4111-8111-111111111111",
    )
  })

  it("shows an empty state when there are no jobs yet", async () => {
    vi.mocked(getJobs).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      per_page: 10,
      pages: 0,
    })

    render(<JobsTable />, { wrapper: makeWrapper() })

    expect(await screen.findByText("No jobs yet")).toBeInTheDocument()
    expect(
      screen.getByText("Create a job from Generate and it will show up here."),
    ).toBeInTheDocument()
  })

  it("applies the generating status filter", async () => {
    const user = userEvent.setup()

    vi.mocked(getJobs)
      .mockResolvedValueOnce(baseResponse)
      .mockResolvedValueOnce({
        ...baseResponse,
        items: [baseResponse.items[0]],
        total: 1,
      })

    render(<JobsTable />, { wrapper: makeWrapper() })

    await screen.findByText("11111111-1111-4111-8111-111111111111")
    await user.click(screen.getByRole("button", { name: "Generating" }))

    await waitFor(() => {
      expect(getJobs).toHaveBeenLastCalledWith({
        page: 1,
        perPage: 10,
        status: "generating",
      })
    })
  })
})
