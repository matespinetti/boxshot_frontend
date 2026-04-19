import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { type InstallationTypeAdmin } from "@/schemas/entities"
import { InstallationTypesAdminTable } from "../InstallationTypesAdminTable"

const mockData: InstallationTypeAdmin[] = [
  {
    id: "1",
    name: "wall-mounted",
    label: "Wall Mounted",
    installation_prompt_block: "wall mounted prompt",
    active: true,
    deleted_at: null,
  },
  {
    id: "2",
    name: "floor-standing",
    label: "Floor Standing",
    installation_prompt_block: "floor standing prompt",
    active: false,
    deleted_at: null,
  },
]

describe("InstallationTypesAdminTable", () => {
  it("renders data correctly", () => {
    render(
      <InstallationTypesAdminTable
        data={mockData}
        onEdit={vi.fn()}
        onToggleDisabled={vi.fn()}
      />
    )

    expect(screen.getByText("wall-mounted")).toBeInTheDocument()
    expect(screen.getByText("Wall Mounted")).toBeInTheDocument()
    expect(screen.getByText("floor-standing")).toBeInTheDocument()
    expect(screen.getByText("Floor Standing")).toBeInTheDocument()
    
    // Check status badges
    expect(screen.getByText("Complete")).toBeInTheDocument()
    expect(screen.getByText("Failed")).toBeInTheDocument()
  })

  it("calls onEdit when name is clicked", async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(
      <InstallationTypesAdminTable
        data={mockData}
        onEdit={onEdit}
        onToggleDisabled={vi.fn()}
      />
    )

    const row = screen.getByText("wall-mounted").closest("tr")
    expect(row).toBeInTheDocument()
    
    // Find and click the name span in that row
    const editButton = within(row!).getByText("wall-mounted")
    await user.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "1" }))
  })

  it("calls onToggleDisabled via AdminTable row action", async () => {
    const user = userEvent.setup()
    const onToggleDisabled = vi.fn()
    render(
      <InstallationTypesAdminTable
        data={mockData}
        onEdit={vi.fn()}
        onToggleDisabled={onToggleDisabled}
      />
    )

    // Active row should have Disable button
    const activeRow = screen.getByText("wall-mounted").closest("tr")
    const disableBtn = within(activeRow!).getByRole("button", { name: /disable/i })
    await user.click(disableBtn)
    
    // Find dialog and click the confirm button
    let dialog = await screen.findByRole("dialog")
    let confirmBtn = within(dialog).getByRole("button", { name: "Disable" })
    await user.click(confirmBtn)
    
    expect(onToggleDisabled).toHaveBeenCalledWith(expect.objectContaining({ id: "1" }))

    // Inactive row should have Enable button
    const inactiveRow = screen.getByText("floor-standing").closest("tr")
    const enableBtn = within(inactiveRow!).getByRole("button", { name: /enable/i })
    await user.click(enableBtn)
    
    // Enable button in DisableToggle confirm dialog
    dialog = await screen.findByRole("dialog")
    confirmBtn = within(dialog).getByRole("button", { name: "Enable" })
    await user.click(confirmBtn)
    
    expect(onToggleDisabled).toHaveBeenCalledWith(expect.objectContaining({ id: "2" }))
  })
})
