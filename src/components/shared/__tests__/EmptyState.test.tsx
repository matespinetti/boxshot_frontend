import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { EmptyState } from "../EmptyState"

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState title="No products found" />)
    expect(screen.getByText("No products found")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(
      <EmptyState
        title="No products found"
        description="Add one to get started."
      />,
    )

    expect(screen.getByText("Add one to get started.")).toBeInTheDocument()
  })

  it("does not render description when omitted", () => {
    render(<EmptyState title="No products found" />)
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument()
  })

  it("renders action button when provided", () => {
    render(
      <EmptyState
        title="No products found"
        action={{ label: "Add Product", onClick: vi.fn() }}
      />,
    )

    expect(
      screen.getByRole("button", { name: "Add Product" }),
    ).toBeInTheDocument()
  })

  it("calls action.onClick when button is clicked", () => {
    const onClick = vi.fn()

    render(
      <EmptyState
        title="No products found"
        action={{ label: "Add Product", onClick }}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Add Product" }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("does not render action button when action is omitted", () => {
    render(<EmptyState title="No products found" />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
