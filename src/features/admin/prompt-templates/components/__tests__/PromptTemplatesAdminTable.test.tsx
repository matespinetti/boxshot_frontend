import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { type PromptTemplateAdmin } from "@/schemas/entities"
import { PromptTemplatesAdminTable } from "../PromptTemplatesAdminTable"

const mockData: PromptTemplateAdmin[] = [
  {
    id: "1",
    name: "v1-default",
    base_framework: "Base 1",
    quality_rules: "Rules 1",
    version: 1,
    is_default: true,
    created_at: "2026-04-19T00:00:00Z",
  },
  {
    id: "2",
    name: "v2-beta",
    base_framework: "Base 2",
    quality_rules: "Rules 2",
    version: 2,
    is_default: false,
    created_at: "2026-04-19T00:00:00Z",
  },
]

describe("PromptTemplatesAdminTable", () => {
  it("renders data correctly", () => {
    render(
      <PromptTemplatesAdminTable
        data={mockData}
        onSetDefault={vi.fn()}
        onView={vi.fn()}
      />
    )

    expect(screen.getByText("v1-default")).toBeInTheDocument()
    expect(screen.getByText("v1")).toBeInTheDocument()
    
    expect(screen.getByText("v2-beta")).toBeInTheDocument()
    expect(screen.getByText("v2")).toBeInTheDocument()
    
    // Check status badges
    expect(screen.getByText("Default")).toBeInTheDocument()
    expect(screen.getByText("Inactive")).toBeInTheDocument()
  })

  it("calls onSetDefault when Set Default is clicked on inactive template", async () => {
    const user = userEvent.setup()
    const onSetDefault = vi.fn()
    render(
      <PromptTemplatesAdminTable
        data={mockData}
        onSetDefault={onSetDefault}
        onView={vi.fn()}
      />
    )

    // The inactive row should have an "Enable" button because disabled: !is_default
    // The generic table thinks disabled=true means it's inactive, so it renders "Enable".
    // "Enable" in this context translates to "Set Default" via our mapping.
    const inactiveRow = screen.getByText("v2-beta").closest("tr")
    const enableBtn = within(inactiveRow!).getByRole("button", { name: /enable/i })
    await user.click(enableBtn)
    
    // Find dialog and click the confirm button
    const dialog = await screen.findByRole("dialog")
    const confirmBtn = within(dialog).getByRole("button", { name: "Enable" })
    await user.click(confirmBtn)
    
    expect(onSetDefault).toHaveBeenCalledWith(expect.objectContaining({ id: "2" }))
  })
})
