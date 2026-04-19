import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { CountryForm } from "../CountryForm"

describe("CountryForm", () => {
  it("renders all form fields", () => {
    render(<CountryForm onSubmit={vi.fn()} />)

    expect(screen.getByPlaceholderText(/e.g. US/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e.g. United States/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/situated in a bright/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save Country" })).toBeInTheDocument()
  })

  it("submits valid data", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<CountryForm onSubmit={onSubmit} />)

    await user.type(screen.getByPlaceholderText(/e.g. US/i), "US")
    await user.type(screen.getByPlaceholderText(/e.g. United States/i), "United States")
    
    // For prompt block
    const promptInput = screen.getByPlaceholderText(/situated in a bright/i)
    await user.type(promptInput, "some environment prompt")

    await user.click(screen.getByRole("button", { name: "Save Country" }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        {
          code: "US",
          name: "United States",
          environment_prompt_block: "some environment prompt",
        },
        expect.anything()
      )
    })
  })

  it("shows validation errors for empty required fields", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<CountryForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole("button", { name: "Save Country" }))

    await waitFor(() => {
      expect(screen.getByText(/Code is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Environment prompt block is required/i)).toBeInTheDocument()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })



  it("initializes with default values", () => {
    render(
      <CountryForm
        onSubmit={vi.fn()}
        defaultValues={{
          code: "UK",
          name: "United Kingdom",
          environment_prompt_block: "uk environment",
        }}
      />
    )

    expect(screen.getByDisplayValue("UK")).toBeInTheDocument()
    expect(screen.getByDisplayValue("United Kingdom")).toBeInTheDocument()
    expect(screen.getByDisplayValue("uk environment")).toBeInTheDocument()
  })

  it("shows saving state when isSubmitting is true", () => {
    render(<CountryForm onSubmit={vi.fn()} isSubmitting={true} />)
    
    const button = screen.getByRole("button", { name: "Saving..." })
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })
})
