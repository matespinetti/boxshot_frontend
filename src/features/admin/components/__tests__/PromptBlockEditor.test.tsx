import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PromptBlockEditor } from "../PromptBlockEditor"

describe("PromptBlockEditor", () => {
  it("renders the textarea", () => {
    render(<PromptBlockEditor value="" onChange={vi.fn()} />)
    expect(screen.getByRole("textbox")).toBeInTheDocument()
  })

  it("shows current character count", () => {
    render(<PromptBlockEditor value="hello" onChange={vi.fn()} />)
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("shows count and max when maxLength provided", () => {
    render(
      <PromptBlockEditor value="hello" onChange={vi.fn()} maxLength={100} />,
    )
    expect(screen.getByText("5 / 100")).toBeInTheDocument()
  })

  it("calls onChange when user types", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PromptBlockEditor value="" onChange={onChange} />)
    await user.type(screen.getByRole("textbox"), "a")
    
    // the onChange prop is passed directly to the <textarea> so it gets a React ChangeEvent
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it("renders the label when provided", () => {
    render(
      <PromptBlockEditor value="" onChange={vi.fn()} label="System prompt" />,
    )
    expect(screen.getByText("System prompt")).toBeInTheDocument()
  })

  it("renders placeholder text", () => {
    render(
      <PromptBlockEditor
        value=""
        onChange={vi.fn()}
        placeholder="Write something…"
      />,
    )
    expect(
      screen.getByPlaceholderText("Write something…"),
    ).toBeInTheDocument()
  })
})
