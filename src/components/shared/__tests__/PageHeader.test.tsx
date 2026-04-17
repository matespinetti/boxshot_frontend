import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PageHeader } from "../PageHeader"

describe("PageHeader", () => {
  it("renders the title", () => {
    render(<PageHeader title="Products" />)
    expect(
      screen.getByRole("heading", { name: "Products" }),
    ).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(
      <PageHeader
        title="Products"
        description="Manage your product catalogue."
      />,
    )

    expect(
      screen.getByText("Manage your product catalogue."),
    ).toBeInTheDocument()
  })

  it("does not render description element when omitted", () => {
    render(<PageHeader title="Products" />)
    expect(screen.queryByText("Manage")).not.toBeInTheDocument()
  })

  it("renders action slot content when provided", () => {
    render(<PageHeader title="Products" action={<button>Add Product</button>} />)
    expect(
      screen.getByRole("button", { name: "Add Product" }),
    ).toBeInTheDocument()
  })

  it("does not render action area when action is omitted", () => {
    render(<PageHeader title="Products" />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
