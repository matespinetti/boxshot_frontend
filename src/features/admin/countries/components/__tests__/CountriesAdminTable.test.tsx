import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { CountriesAdminTable } from "../CountriesAdminTable"
import { type CountryAdmin } from "@/schemas/entities"

const mockData: CountryAdmin[] = [
  {
    id: "1",
    code: "US",
    name: "United States",
    environment_prompt_block: "us environment",
    active: true,
    deleted_at: null,
  },
  {
    id: "2",
    code: "UK",
    name: "United Kingdom",
    environment_prompt_block: "uk environment",
    active: false,
    deleted_at: null,
  },
]

describe("CountriesAdminTable", () => {
  it("renders data correctly", () => {
    render(
      <CountriesAdminTable
        data={mockData}
        onEdit={vi.fn()}
        onToggleDisabled={vi.fn()}
      />
    )

    expect(screen.getByText("United States")).toBeInTheDocument()
    expect(screen.getByText("US")).toBeInTheDocument()
    
    expect(screen.getByText("United Kingdom")).toBeInTheDocument()
    expect(screen.getByText("UK")).toBeInTheDocument()
    
    // Check status badges
    expect(screen.getByText("Complete")).toBeInTheDocument()
    expect(screen.getByText("Failed")).toBeInTheDocument()
  })

  it("calls onEdit when edit button is clicked", async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    
    render(
      <CountriesAdminTable
        data={mockData}
        onEdit={onEdit}
        onToggleDisabled={vi.fn()}
      />
    )

    // Find the row for United States
    const row = screen.getByText("United States").closest("tr")
    expect(row).toBeInTheDocument()
    
    // Find and click the edit button in that row
    const editBtn = within(row!).getByRole("button", { name: /edit/i })
    await user.click(editBtn)

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "1" }))
  })

  it("calls onToggleDisabled via AdminTable row action", async () => {
    const user = userEvent.setup()
    const onToggleDisabled = vi.fn()
    
    render(
      <CountriesAdminTable
        data={mockData}
        onEdit={vi.fn()}
        onToggleDisabled={onToggleDisabled}
      />
    )

    // Active row should have Disable button
    const activeRow = screen.getByText("United States").closest("tr")
    const disableBtn = within(activeRow!).getByRole("button", { name: /disable/i })
    await user.click(disableBtn)
    
    // Find dialog and click the confirm button
    let dialog = await screen.findByRole("dialog")
    let confirmBtn = within(dialog).getByRole("button", { name: "Disable" })
    await user.click(confirmBtn)
    
    expect(onToggleDisabled).toHaveBeenCalledWith(expect.objectContaining({ id: "1" }))

    // Inactive row should have Enable button
    const inactiveRow = screen.getByText("United Kingdom").closest("tr")
    const enableBtn = within(inactiveRow!).getByRole("button", { name: /enable/i })
    await user.click(enableBtn)
    
    // Enable button in DisableToggle confirm dialog
    dialog = await screen.findByRole("dialog")
    confirmBtn = within(dialog).getByRole("button", { name: "Enable" })
    await user.click(confirmBtn)
    
    expect(onToggleDisabled).toHaveBeenCalledWith(expect.objectContaining({ id: "2" }))
  })
})
