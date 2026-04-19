import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1" },
}))

vi.mock("@/features/generation/api/getProductImages")

import { getProductImages } from "@/features/generation/api/getProductImages"
import { ReferenceImageSelector } from "../ReferenceImageSelector"

const mockImages = [
  {
    id: "img-1",
    product_id: "prod-1",
    label: "Front",
    url: "/static/studio/chelsea/front.jpg",
    created_at: "",
  },
  {
    id: "img-2",
    product_id: "prod-1",
    label: "Side",
    url: "/static/studio/chelsea/side.jpg",
    created_at: "",
  },
]

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider
    client={
      new QueryClient({ defaultOptions: { queries: { retry: false } } })
    }
  >
    {children}
  </QueryClientProvider>
)

async function openPopover() {
  await userEvent.click(screen.getByRole("button", { name: /choose images/i }))
}

describe("ReferenceImageSelector", () => {
  beforeEach(() => {
    vi.mocked(getProductImages).mockResolvedValue(mockImages)
  })

  it("shows placeholder text when productId is empty", () => {
    render(
      <ReferenceImageSelector productId="" value={[]} onChange={vi.fn()} />,
      { wrapper },
    )
    expect(screen.getByText(/select a product/i)).toBeInTheDocument()
  })

  it("renders image thumbnails inside the popover after data loads", async () => {
    render(
      <ReferenceImageSelector
        productId="prod-1"
        value={[]}
        onChange={vi.fn()}
      />,
      { wrapper },
    )
    // wait for data, then open the picker
    await screen.findByRole("button", { name: /choose images/i })
    await openPopover()
    expect(screen.getByAltText("Front")).toBeInTheDocument()
    expect(screen.getByAltText("Side")).toBeInTheDocument()
  })

  it("shows warning when 0 images are selected", async () => {
    render(
      <ReferenceImageSelector
        productId="prod-1"
        value={[]}
        onChange={vi.fn()}
      />,
      { wrapper },
    )
    await screen.findByRole("button", { name: /choose images/i })
    await openPopover()
    expect(screen.getByText(/text-to-image mode/i)).toBeInTheDocument()
  })

  it("blocks selection when 9 are already selected", async () => {
    const nineIds = Array.from({ length: 9 }, (_, i) => `other-${i}`)
    render(
      <ReferenceImageSelector
        productId="prod-1"
        value={nineIds}
        onChange={vi.fn()}
      />,
      { wrapper },
    )
    await screen.findByRole("button", { name: /choose images/i })
    await openPopover()
    expect(screen.getByRole("button", { name: "Front" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Side" })).toBeDisabled()
  })

  it("calls onChange adding the image id when unselected image is clicked", async () => {
    const onChange = vi.fn()
    render(
      <ReferenceImageSelector
        productId="prod-1"
        value={[]}
        onChange={onChange}
      />,
      { wrapper },
    )
    await screen.findByRole("button", { name: /choose images/i })
    await openPopover()
    await userEvent.click(screen.getByRole("button", { name: "Front" }))
    expect(onChange).toHaveBeenCalledWith(["img-1"])
  })

  it("calls onChange removing the image id when selected image is clicked", async () => {
    const onChange = vi.fn()
    render(
      <ReferenceImageSelector
        productId="prod-1"
        value={["img-1"]}
        onChange={onChange}
      />,
      { wrapper },
    )
    await screen.findByRole("button", { name: /choose images/i })
    await openPopover()
    await userEvent.click(screen.getByRole("button", { name: "Front" }))
    expect(onChange).toHaveBeenCalledWith([])
  })
})
