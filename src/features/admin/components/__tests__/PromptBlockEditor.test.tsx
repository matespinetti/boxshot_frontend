import { fireEvent, render, screen } from "@testing-library/react"
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

  it("calls onChange when user types", () => {
    const onChange = vi.fn()
    render(<PromptBlockEditor value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "foo" },
    })
    expect(onChange).toHaveBeenCalledWith("foo")
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
