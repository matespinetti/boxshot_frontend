import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { RegenerateDialog } from "@/features/images/components/RegenerateDialog"

describe("RegenerateDialog", () => {
  it("renders nothing when closed", () => {
    render(
      <RegenerateDialog open={false} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    )
    expect(screen.queryByText("Regenerate image")).not.toBeInTheDocument()
  })

  it("renders title when open", () => {
    render(
      <RegenerateDialog open onConfirm={vi.fn()} onCancel={vi.fn()} />,
    )
    expect(screen.getByText("Regenerate image")).toBeInTheDocument()
  })

  it("calls onConfirm when Regenerate button is clicked", () => {
    const onConfirm = vi.fn()
    render(
      <RegenerateDialog open onConfirm={onConfirm} onCancel={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it("calls onCancel when Cancel button is clicked", () => {
    const onCancel = vi.fn()
    render(
      <RegenerateDialog open onConfirm={vi.fn()} onCancel={onCancel} />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
