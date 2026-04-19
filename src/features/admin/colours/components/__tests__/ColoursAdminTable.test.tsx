import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ColoursAdminTable } from "../ColoursAdminTable"

const mockColours = [
  {
    id: "1",
    ral_code: "9010",
    name: "Pure White",
    hex_preview: "#ffffff",
    finish_prompt_block: "white finish",
    active: true,
    deleted_at: null,
  },
  {
    id: "2",
    ral_code: "9011",
    name: "Graphite Black",
    hex_preview: null,
    finish_prompt_block: "black finish",
    active: false,
    deleted_at: null,
  },
]

describe("ColoursAdminTable", () => {
  it("renders data correctly", () => {
    render(
      <ColoursAdminTable
        data={mockColours}
        onToggleDisabled={vi.fn()}
        onEdit={vi.fn()}
      />,
    )

    expect(screen.getByText("9010")).toBeInTheDocument()
    expect(screen.getByText("Pure White")).toBeInTheDocument()
    expect(screen.getByText("9011")).toBeInTheDocument()
    expect(screen.getByText("Graphite Black")).toBeInTheDocument()
  })

  it("calls onEdit when name is clicked", async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(
      <ColoursAdminTable
        data={mockColours}
        onToggleDisabled={vi.fn()}
        onEdit={onEdit}
      />,
    )

    const activeRow = screen.getByText("9010").closest("tr")
    const editBtn = within(activeRow!).getByRole("button", { name: /edit/i })
    await user.click(editBtn)
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining(mockColours[0]))
  })

  it("calls onToggleDisabled via AdminTable row action", async () => {
    const onToggleDisabled = vi.fn()
    render(
      <ColoursAdminTable
        data={mockColours}
        onToggleDisabled={onToggleDisabled}
        onEdit={vi.fn()}
      />,
    )

    const disableBtn = screen.getByRole("button", { name: "Disable" })
    fireEvent.click(disableBtn)
    
    // The confirm button in the dialog also says "Disable"
    const dialog = await screen.findByRole("dialog")
    const confirmBtn = within(dialog).getByRole("button", { name: "Disable" })
    fireEvent.click(confirmBtn)
    
    expect(onToggleDisabled).toHaveBeenCalledWith(
      expect.objectContaining({ id: "1" })
    )
  })
})
