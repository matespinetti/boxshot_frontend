vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1" },
}))

vi.mock("@/features/images/hooks/useImageActions", () => ({
  useImageActions: () => ({
    approve: vi.fn(),
    reject: vi.fn(),
    regenerate: vi.fn(),
    isUpdating: () => false,
    isRegenerating: () => false,
  }),
}))

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }))

import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import type { JobImage } from "@/features/images/types"
import { ImageCard } from "@/features/images/components/ImageCard"

const makeImage = (overrides: Partial<JobImage> = {}): JobImage => ({
  id: "img-1",
  status: "complete",
  file_path: "/static/img.png",
  image_url: "/static/img.png",
  regeneration_source_id: null,
  product_id: "p1",
  colour_id: "c1",
  country_id: "co1",
  shot_type_id: "st1",
  variation_number: 1,
  created_at: "2026-01-01T00:00:00Z",
  product_name: "Chelsea",
  ral_code: "RAL7032",
  country_code: "UK",
  country_name: "United Kingdom",
  shot_type_name: "PDP",
  ...overrides,
})

function Wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient()
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const defaultProps = {
  jobId: "job-1",
  selected: false,
  onToggleSelect: vi.fn(),
  isSelectable: () => true,
  onOpenLightbox: vi.fn(),
}

describe("ImageCard", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders country name and metadata", () => {
    render(<ImageCard image={makeImage()} {...defaultProps} />, { wrapper: Wrapper })
    expect(screen.getByText("United Kingdom")).toBeInTheDocument()
    expect(screen.getByText("Chelsea · RAL7032")).toBeInTheDocument()
  })

  it("renders placeholder when no image_url", () => {
    render(
      <ImageCard image={makeImage({ image_url: null })} {...defaultProps} />,
      { wrapper: Wrapper },
    )
    expect(screen.getByText("Image still pending")).toBeInTheDocument()
  })

  it("does not show Approve button when already approved", () => {
    render(
      <ImageCard image={makeImage({ status: "approved" })} {...defaultProps} />,
      { wrapper: Wrapper },
    )
    expect(screen.queryByLabelText("Approve")).not.toBeInTheDocument()
  })

  it("does not show Reject button when already rejected", () => {
    render(
      <ImageCard image={makeImage({ status: "rejected" })} {...defaultProps} />,
      { wrapper: Wrapper },
    )
    expect(screen.queryByLabelText("Reject")).not.toBeInTheDocument()
  })

  it("shows Regenerate button for pending images", () => {
    render(
      <ImageCard
        image={makeImage({ status: "pending", image_url: null, file_path: null })}
        {...defaultProps}
      />,
      { wrapper: Wrapper },
    )
    expect(screen.getByLabelText("Regenerate")).toBeInTheDocument()
  })

  it("calls onOpenLightbox when image is clicked", () => {
    const onOpenLightbox = vi.fn()
    render(
      <ImageCard image={makeImage()} {...defaultProps} onOpenLightbox={onOpenLightbox} />,
      { wrapper: Wrapper },
    )
    fireEvent.click(screen.getByRole("img"))
    expect(onOpenLightbox).toHaveBeenCalledWith("img-1")
  })

  it("shows Select button when isSelectable returns true", () => {
    render(<ImageCard image={makeImage()} {...defaultProps} />, { wrapper: Wrapper })
    expect(screen.getByRole("button", { name: /select/i })).toBeInTheDocument()
  })
})
