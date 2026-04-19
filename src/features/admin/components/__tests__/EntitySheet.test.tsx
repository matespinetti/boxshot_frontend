import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { EntitySheet } from "../EntitySheet"

describe("EntitySheet", () => {
  it("does not render content when open is false", () => {
    render(
      <EntitySheet open={false} onOpenChange={vi.fn()} title="Edit Product">
        <p>Form content</p>
      </EntitySheet>,
    )
    expect(screen.queryByText("Edit Product")).not.toBeInTheDocument()
    expect(screen.queryByText("Form content")).not.toBeInTheDocument()
  })

  it("renders title when open is true", () => {
    render(
      <EntitySheet open onOpenChange={vi.fn()} title="Edit Product">
        <p>Form content</p>
      </EntitySheet>,
    )
    expect(screen.getByText("Edit Product")).toBeInTheDocument()
  })

  it("renders children when open", () => {
    render(
      <EntitySheet open onOpenChange={vi.fn()} title="Edit Product">
        <input aria-label="Name" />
      </EntitySheet>,
    )
    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(
      <EntitySheet
        open
        onOpenChange={vi.fn()}
        title="Edit Product"
        description="Fill in the details below."
      >
        <p>Child</p>
      </EntitySheet>,
    )
    expect(screen.getByText("Fill in the details below.")).toBeInTheDocument()
  })

  it("renders footer when provided", () => {
    render(
      <EntitySheet
        open
        onOpenChange={vi.fn()}
        title="Edit Product"
        footer={<button type="submit">Save</button>}
      >
        <p>Child</p>
      </EntitySheet>,
    )
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
  })
})
