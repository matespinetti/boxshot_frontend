import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ConfirmDialog } from "../ConfirmDialog"

describe("ConfirmDialog", () => {
  it("renders nothing when open is false", () => {
    render(
      <ConfirmDialog
        open={false}
        title="Delete item"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.queryByText("Delete item")).not.toBeInTheDocument()
  })

  it("renders title when open is true", () => {
    render(
      <ConfirmDialog
        open
        title="Delete item"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByText("Delete item")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(
      <ConfirmDialog
        open
        title="Delete item"
        description="This cannot be undone."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument()
  })

  it("renders default confirm label", () => {
    render(
      <ConfirmDialog
        open
        title="Delete item"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument()
  })

  it("renders custom confirm label", () => {
    render(
      <ConfirmDialog
        open
        title="Delete item"
        confirmLabel="Delete"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument()
  })

  it("calls onConfirm when confirm button is clicked", () => {
    const onConfirm = vi.fn()

    render(
      <ConfirmDialog
        open
        title="Delete item"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it("calls onCancel when cancel button is clicked", () => {
    const onCancel = vi.fn()

    render(
      <ConfirmDialog
        open
        title="Delete item"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
