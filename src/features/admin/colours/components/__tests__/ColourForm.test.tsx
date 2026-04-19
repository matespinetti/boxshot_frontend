import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ColourForm } from "../ColourForm"

describe("ColourForm", () => {
  it("renders all form fields", () => {
    render(<ColourForm onSubmit={vi.fn()} />)
    
    expect(screen.getByText(/RAL Code/i)).toBeInTheDocument()
    expect(screen.getByText(/Name/i)).toBeInTheDocument()
    expect(screen.getByText(/Hex Preview/i)).toBeInTheDocument()
    expect(screen.getByText(/Prompt Block/i)).toBeInTheDocument()
  })

  it("submits valid data", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ColourForm onSubmit={onSubmit} />)

    await user.type(screen.getByPlaceholderText(/e.g. 9010/i), "9010")
    await user.type(screen.getByPlaceholderText(/e.g. Pure White/i), "Pure White")
    
    // For the color picker, userEvent.type might not work well on type="color", so we can clear and type into the text input
    const hexInput = screen.getByPlaceholderText("#RRGGBB")
    await user.clear(hexInput)
    await user.type(hexInput, "#ffffff")

    // For prompt block
    const promptInput = screen.getByPlaceholderText(/painted with RAL/i)
    await user.type(promptInput, "some prompt")

    await user.click(screen.getByRole("button", { name: "Save Colour" }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        {
          ral_code: "9010",
          name: "Pure White",
          hex_preview: "#ffffff",
          finish_prompt_block: "some prompt",
        },
        expect.anything()
      )
    })
  })

  it("shows validation errors for empty required fields", async () => {
    const onSubmit = vi.fn()
    render(<ColourForm onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole("button", { name: "Save Colour" }))

    await waitFor(() => {
      expect(screen.getByText("RAL code is required")).toBeInTheDocument()
      expect(screen.getByText("Name is required")).toBeInTheDocument()
      expect(screen.getByText("Prompt block is required")).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  it("initializes with default values", () => {
    render(
      <ColourForm
        defaultValues={{
          ral_code: "9011",
          name: "Graphite Black",
          hex_preview: "#1c1c1c",
          finish_prompt_block: "black finish",
        }}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByDisplayValue("9011")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Graphite Black")).toBeInTheDocument()
    expect(screen.getAllByDisplayValue("#1c1c1c").length).toBe(2)
    expect(screen.getByDisplayValue("black finish")).toBeInTheDocument()
  })

  it("shows saving state when isSubmitting is true", () => {
    render(<ColourForm onSubmit={vi.fn()} isSubmitting={true} />)
    
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled()
  })
})
