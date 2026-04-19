import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ShotTypeForm } from "../ShotTypeForm"

describe("ShotTypeForm", () => {
  it("renders all form fields", () => {
    render(<ShotTypeForm onSubmit={vi.fn()} />)

    expect(screen.getByPlaceholderText(/e.g. Front Angle/i)).toBeInTheDocument()
    expect(screen.getByText("Intent")).toBeInTheDocument()
    expect(screen.getByRole("combobox")).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/The camera is positioned directly in front/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save Shot Type" })).toBeInTheDocument()
  })

  it("submits valid data", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ShotTypeForm onSubmit={onSubmit} />)

    await user.type(screen.getByPlaceholderText(/e.g. Front Angle/i), "Close Up")
    
    // Select is a bit tricky with radix, but we default to pdp, so we can just leave it or select another.
    // We'll just leave default 'pdp' for simplicity in this test

    const promptInput = screen.getByPlaceholderText(/The camera is positioned directly in front/i)
    await user.type(promptInput, "A close up shot of the object")

    await user.click(screen.getByRole("button", { name: "Save Shot Type" }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Close Up",
          intent: "pdp",
          framing_prompt_block: "A close up shot of the object",
        }),
        expect.anything()
      )
    })
  })

  it("shows validation errors for empty required fields", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    
    // Pass empty defaults to trigger validation
    render(<ShotTypeForm onSubmit={onSubmit} defaultValues={{ name: "", intent: "pdp", framing_prompt_block: "" }} />)

    await user.click(screen.getByRole("button", { name: "Save Shot Type" }))

    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Framing prompt block is required/i)).toBeInTheDocument()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("initializes with default values", () => {
    render(
      <ShotTypeForm
        onSubmit={vi.fn()}
        defaultValues={{
          name: "Test Type",
          intent: "marketing",
          framing_prompt_block: "Test Prompt",
        }}
      />
    )

    expect(screen.getByDisplayValue("Test Type")).toBeInTheDocument()
    expect(screen.getByText(/marketing/i)).toBeInTheDocument() // Select value renders raw value or label
    expect(screen.getByDisplayValue("Test Prompt")).toBeInTheDocument()
  })

  it("shows saving state when isSubmitting is true", () => {
    render(<ShotTypeForm onSubmit={vi.fn()} isSubmitting={true} />)
    
    const button = screen.getByRole("button", { name: "Saving..." })
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })
})
