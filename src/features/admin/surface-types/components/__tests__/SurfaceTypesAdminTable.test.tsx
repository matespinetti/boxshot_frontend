import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { type SurfaceTypeAdmin } from "@/schemas/entities"
import { SurfaceTypesAdminTable } from "../SurfaceTypesAdminTable"

const mockData: SurfaceTypeAdmin[] = [
  {
    id: "1",
    name: "brick_wall",
    label: "Brick Wall",
    surface_prompt_block: "Traditional brick wall.",
    active: true,
    deleted_at: null,
  },
]

describe("SurfaceTypesAdminTable", () => {
  it("renders surface type name and label columns", () => {
    render(
      <SurfaceTypesAdminTable
        data={mockData}
        onEdit={vi.fn()}
        onToggleDisabled={vi.fn()}
      />,
    )

    expect(screen.getByText("brick_wall")).toBeInTheDocument()
    expect(screen.getByText("Brick Wall")).toBeInTheDocument()
  })

  it("calls onEdit when edit is clicked", async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()

    render(
      <SurfaceTypesAdminTable
        data={mockData}
        onEdit={onEdit}
        onToggleDisabled={vi.fn()}
      />,
    )

    const row = screen.getByText("Brick Wall").closest("tr")
    const editBtn = within(row!).getByRole("button", { name: /edit/i })
    await user.click(editBtn)

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "1" }))
  })
})
