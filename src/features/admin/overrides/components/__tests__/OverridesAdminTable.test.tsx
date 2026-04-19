import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { type PromptBlockOverride } from "@/schemas/entities"
import { OverridesAdminTable } from "../OverridesAdminTable"

const mockData: PromptBlockOverride[] = [
  {
    id: "1",
    entity_type: "colours",
    entity_id: "e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1",
    override_key: "finish_prompt_block",
    override_value: "Make it red.",
    active: true,
  },
  {
    id: "2",
    entity_type: "products",
    entity_id: "a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2",
    override_key: "product_prompt_block",
    override_value: "Make it a mug.",
    active: false,
  },
]

describe("OverridesAdminTable", () => {
  it("renders data correctly", () => {
    render(
      <OverridesAdminTable
        data={mockData}
        onToggleDisabled={vi.fn()}
      />
    )

    expect(screen.getByText("colours")).toBeInTheDocument()
    expect(screen.getByText("finish_prompt_block")).toBeInTheDocument()
    expect(screen.getByText("e1e1e1e1...")).toBeInTheDocument() // Truncated ID
    
    expect(screen.getByText("products")).toBeInTheDocument()
    expect(screen.getByText("product_prompt_block")).toBeInTheDocument()
    
    // Check status badges
    expect(screen.getByText("Active")).toBeInTheDocument()
    expect(screen.getByText("Inactive")).toBeInTheDocument()
  })

  it("calls onToggleDisabled via AdminTable row action", async () => {
    const user = userEvent.setup()
    const onToggleDisabled = vi.fn()
    render(
      <OverridesAdminTable
        data={mockData}
        onToggleDisabled={onToggleDisabled}
      />
    )

    // Active row should have Disable button
    const activeRow = screen.getByText("colours").closest("tr")
    const disableBtn = within(activeRow!).getByRole("button", { name: /disable/i })
    await user.click(disableBtn)
    
    // Find dialog and click the confirm button
    const dialog = await screen.findByRole("dialog")
    const confirmBtn = within(dialog).getByRole("button", { name: "Disable" })
    await user.click(confirmBtn)
    
    expect(onToggleDisabled).toHaveBeenCalledWith(expect.objectContaining({ id: "1" }))
  })
})
