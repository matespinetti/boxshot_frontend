import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

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

import { ImageGrid } from "../ImageGrid"

const images = [
  {
    id: "11111111-1111-4111-8111-111111111111",
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
    id: "11111111-1111-4111-8111-111111111112",
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
]

describe("ImageGrid", () => {
  it("renders image previews from the public image_url", () => {
    render(
      <ImageGrid
        images={images}
        jobId="job-1"
        selectedIds={[]}
        onToggleSelect={vi.fn()}
        isSelectable={(image) => image.status === "complete"}
      />,
    )

    expect(
      screen.getByRole("img", { name: "Chelsea UK PDP" }),
    ).toHaveAttribute("src", "http://localhost:8000/static/jobs/img-1.png")
  })

  it("shows a placeholder tile when the image file is not ready yet", () => {
    render(
      <ImageGrid
        images={images}
        jobId="job-1"
        selectedIds={[]}
        onToggleSelect={vi.fn()}
        isSelectable={(image) => image.status === "complete"}
      />,
    )

    expect(screen.getByText("Image still pending")).toBeInTheDocument()
  })

  it("toggles selection for selectable images", async () => {
    const user = userEvent.setup()
    const onToggleSelect = vi.fn()

    render(
      <ImageGrid
        images={images}
        jobId="job-1"
        selectedIds={[]}
        onToggleSelect={onToggleSelect}
        isSelectable={(image) => image.status === "complete"}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Select image 1" }))

    expect(onToggleSelect).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
    )
  })
})
