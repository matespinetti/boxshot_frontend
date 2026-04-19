import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { BulkActions } from "../BulkActions"

describe("BulkActions", () => {
  it("calls approve and reject handlers", async () => {
    const user = userEvent.setup()
    const onApprove = vi.fn()
    const onReject = vi.fn()

    render(
      <BulkActions
        selectedCount={2}
        eligibleCount={3}
        isSubmitting={false}
        onSelectAll={vi.fn()}
        onClear={vi.fn()}
        onApprove={onApprove}
        onReject={onReject}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Approve selected" }))
    await user.click(screen.getByRole("button", { name: "Reject selected" }))

    expect(onApprove).toHaveBeenCalledTimes(1)
    expect(onReject).toHaveBeenCalledTimes(1)
  })

  it("hides itself when no visible images are eligible", () => {
    const { container } = render(
      <BulkActions
        selectedCount={0}
        eligibleCount={0}
        isSubmitting={false}
        onSelectAll={vi.fn()}
        onClear={vi.fn()}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
