import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { type ShotTypeAdmin } from "@/schemas/entities"
import { ShotTypesAdminTable } from "../ShotTypesAdminTable"

const mockData: ShotTypeAdmin[] = [
  {
    id: "1",
    name: "Front Angle",
    intent: "pdp",
    framing_prompt_block: "front angle prompt",
    active: true,
    deleted_at: null,
  },
  {
    id: "2",
    name: "Lifestyle Kitchen",
    intent: "lifestyle",
    framing_prompt_block: "kitchen prompt",
    active: false,
    deleted_at: null,
  },
]

describe("ShotTypesAdminTable", () => {
  it("renders data correctly", () => {
    render(
      <ShotTypesAdminTable
        data={mockData}
        onEdit={vi.fn()}
        onToggleDisabled={vi.fn()}
      />
    )

    expect(screen.getByText("Front Angle")).toBeInTheDocument()
    expect(screen.getByText("pdp")).toBeInTheDocument()
    expect(screen.getByText("Lifestyle Kitchen")).toBeInTheDocument()
    expect(screen.getByText("lifestyle")).toBeInTheDocument()
    
    // Check status badges
    expect(screen.getByText("Complete")).toBeInTheDocument()
    expect(screen.getByText("Failed")).toBeInTheDocument()
  })

  it("calls onEdit when name is clicked", async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(
      <ShotTypesAdminTable
        data={mockData}
        onEdit={onEdit}
        onToggleDisabled={vi.fn()}
      />
    )

    const row = screen.getByText("Front Angle").closest("tr")
    expect(row).toBeInTheDocument()
    
    // Find and click the name span in that row
    const editButton = within(row!).getByText("Front Angle")
    await user.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "1" }))
  })

  it("calls onToggleDisabled via AdminTable row action", async () => {
    const user = userEvent.setup()
    const onToggleDisabled = vi.fn()
    render(
      <ShotTypesAdminTable
        data={mockData}
        onEdit={vi.fn()}
        onToggleDisabled={onToggleDisabled}
      />
    )

    // Active row should have Disable button
    const activeRow = screen.getByText("Front Angle").closest("tr")
    const disableBtn = within(activeRow!).getByRole("button", { name: /disable/i })
    await user.click(disableBtn)
    
    // Find dialog and click the confirm button
    let dialog = await screen.findByRole("dialog")
    let confirmBtn = within(dialog).getByRole("button", { name: "Disable" })
    await user.click(confirmBtn)
    
    expect(onToggleDisabled).toHaveBeenCalledWith(expect.objectContaining({ id: "1" }))

    // Inactive row should have Enable button
    const inactiveRow = screen.getByText("Lifestyle Kitchen").closest("tr")
    const enableBtn = within(inactiveRow!).getByRole("button", { name: /enable/i })
    await user.click(enableBtn)
    
    // Enable button in DisableToggle confirm dialog
    dialog = await screen.findByRole("dialog")
    confirmBtn = within(dialog).getByRole("button", { name: "Enable" })
    await user.click(confirmBtn)
    
    expect(onToggleDisabled).toHaveBeenCalledWith(expect.objectContaining({ id: "2" }))
  })
})
