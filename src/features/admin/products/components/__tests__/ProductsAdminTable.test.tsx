import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { type ProductAdmin } from "@/schemas/entities"
import { ProductsAdminTable } from "../ProductsAdminTable"

const mockData: ProductAdmin[] = [
  {
    id: "1",
    name: "Ceramic Mug",
    slug: "ceramic-mug",
    product_prompt_block: "A nice mug.",
    active: true,
    deleted_at: null,
  },
  {
    id: "2",
    name: "Steel Bottle",
    slug: "steel-bottle",
    product_prompt_block: "A metal bottle.",
    active: false,
    deleted_at: null,
  },
]

describe("ProductsAdminTable", () => {
  it("renders data correctly", () => {
    render(
      <ProductsAdminTable
        data={mockData}
        onEdit={vi.fn()}
        onToggleDisabled={vi.fn()}
      />
    )

    expect(screen.getByText("Ceramic Mug")).toBeInTheDocument()
    expect(screen.getByText("ceramic-mug")).toBeInTheDocument()
    expect(screen.queryByText("Installation Type ID")).not.toBeInTheDocument()
    
    expect(screen.getByText("Steel Bottle")).toBeInTheDocument()
    expect(screen.getByText("steel-bottle")).toBeInTheDocument()
    
    // Check status badges
    expect(screen.getByText("Complete")).toBeInTheDocument()
    expect(screen.getByText("Failed")).toBeInTheDocument()
  })

  it("calls onEdit when product name is clicked", async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(
      <ProductsAdminTable
        data={mockData}
        onEdit={onEdit}
        onToggleDisabled={vi.fn()}
      />
    )

    const activeRow = screen.getByText("Ceramic Mug").closest("tr")
    const editBtn = within(activeRow!).getByRole("button", { name: /edit/i })
    await user.click(editBtn)
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining(mockData[0]))
  })

  it("calls onToggleDisabled via AdminTable row action", async () => {
    const user = userEvent.setup()
    const onToggleDisabled = vi.fn()
    render(
      <ProductsAdminTable
        data={mockData}
        onEdit={vi.fn()}
        onToggleDisabled={onToggleDisabled}
      />
    )

    const activeRow = screen.getByText("Ceramic Mug").closest("tr")
    const disableBtn = within(activeRow!).getByRole("button", { name: /disable/i })
    await user.click(disableBtn)
    
    const dialog = await screen.findByRole("dialog")
    const confirmBtn = within(dialog).getByRole("button", { name: "Disable" })
    await user.click(confirmBtn)
    
    expect(onToggleDisabled).toHaveBeenCalledWith(expect.objectContaining({ id: "1" }))
  })
})
