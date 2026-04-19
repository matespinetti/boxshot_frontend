import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DisableToggle } from "../DisableToggle"

describe("DisableToggle", () => {
  it("renders 'Disable' when disabled is false", () => {
    render(<DisableToggle disabled={false} onToggle={vi.fn()} />)
    expect(screen.getByRole("button", { name: "Disable" })).toBeInTheDocument()
  })

  it("renders 'Enable' when disabled is true", () => {
    render(<DisableToggle disabled={true} onToggle={vi.fn()} />)
    expect(screen.getByRole("button", { name: "Enable" })).toBeInTheDocument()
  })

  it("opens confirm dialog when button is clicked", () => {
    render(<DisableToggle disabled={false} onToggle={vi.fn()} />)
    fireEvent.click(screen.getByRole("button", { name: "Disable" }))
    expect(screen.getByText(/Disable this item/i)).toBeInTheDocument()
  })

  it("calls onToggle after confirming", () => {
    const onToggle = vi.fn()
    render(<DisableToggle disabled={false} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole("button", { name: "Disable" }))
    fireEvent.click(screen.getByRole("button", { name: "Disable" }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it("does not call onToggle when cancel is clicked", () => {
    const onToggle = vi.fn()
    render(<DisableToggle disabled={false} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole("button", { name: "Disable" }))
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onToggle).not.toHaveBeenCalled()
  })

  it("uses entityLabel in confirmation dialog title", () => {
    render(
      <DisableToggle
        disabled={false}
        onToggle={vi.fn()}
        entityLabel="product"
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Disable" }))
    expect(screen.getByText("Disable product?")).toBeInTheDocument()
  })
})
