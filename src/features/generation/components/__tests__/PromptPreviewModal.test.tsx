import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scroll-area">{children}</div>
  ),
}))

import { PromptPreviewModal } from "../PromptPreviewModal"

const mockPrompts = [
  {
    country_id: "country-1",
    shot_type_id: "shot-1",
    prompt: "A beautiful product photo",
  },
  {
    country_id: "country-2",
    shot_type_id: "shot-2",
    prompt: "Another beautiful photo",
  },
]

describe("PromptPreviewModal", () => {
  it("renders one row per prompt item", () => {
    render(
      <PromptPreviewModal
        open={true}
        prompts={mockPrompts}
        isConfirming={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByText("A beautiful product photo")).toBeInTheDocument()
    expect(screen.getByText("Another beautiful photo")).toBeInTheDocument()
  })

  it("calls onClose when Back is clicked", async () => {
    const onClose = vi.fn()
    render(
      <PromptPreviewModal
        open={true}
        prompts={mockPrompts}
        isConfirming={false}
        onClose={onClose}
        onConfirm={vi.fn()}
      />,
    )
    await userEvent.click(screen.getByRole("button", { name: /back/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("calls onConfirm when Confirm & Generate is clicked", async () => {
    const onConfirm = vi.fn()
    render(
      <PromptPreviewModal
        open={true}
        prompts={mockPrompts}
        isConfirming={false}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    )
    await userEvent.click(
      screen.getByRole("button", { name: /confirm & generate/i }),
    )
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it("shows Generating... text when isConfirming is true", () => {
    render(
      <PromptPreviewModal
        open={true}
        prompts={mockPrompts}
        isConfirming={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(
      screen.getByRole("button", { name: /generating\.\.\./i }),
    ).toBeInTheDocument()
  })

  it("does not render content when open is false", () => {
    render(
      <PromptPreviewModal
        open={false}
        prompts={mockPrompts}
        isConfirming={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(
      screen.queryByText("A beautiful product photo"),
    ).not.toBeInTheDocument()
  })
})
