import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { InstallationTypeForm } from "../InstallationTypeForm"

describe("InstallationTypeForm", () => {
  it("renders all form fields", () => {
    render(<InstallationTypeForm onSubmit={vi.fn()} />)

    expect(screen.getByPlaceholderText(/e.g. wall-mounted/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e.g. Wall Mounted/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/The product is securely mounted/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save Installation Type" })).toBeInTheDocument()
  })

  it("submits valid data", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<InstallationTypeForm onSubmit={onSubmit} />)

    await user.type(screen.getByPlaceholderText(/e.g. wall-mounted/i), "floor-standing")
    await user.type(screen.getByPlaceholderText(/e.g. Wall Mounted/i), "Floor Standing")
    await user.type(screen.getByPlaceholderText(/The product is securely mounted/i), "Mounted to floor")

    await user.click(screen.getByRole("button", { name: "Save Installation Type" }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "floor-standing",
          label: "Floor Standing",
          installation_prompt_block: "Mounted to floor",
        }),
        expect.anything()
      )
    })
  })

  it("shows validation errors for empty required fields", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    
    // Pass empty defaults to trigger validation
    render(<InstallationTypeForm onSubmit={onSubmit} defaultValues={{ name: "", label: "", installation_prompt_block: "" }} />)

    await user.click(screen.getByRole("button", { name: "Save Installation Type" }))

    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Label is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Installation prompt block is required/i)).toBeInTheDocument()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("initializes with default values", () => {
    render(
      <InstallationTypeForm
        onSubmit={vi.fn()}
        defaultValues={{
          name: "test-name",
          label: "Test Label",
          installation_prompt_block: "Test Prompt",
        }}
      />
    )

    expect(screen.getByDisplayValue("test-name")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Test Label")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Test Prompt")).toBeInTheDocument()
  })

  it("shows saving state when isSubmitting is true", () => {
    render(<InstallationTypeForm onSubmit={vi.fn()} isSubmitting={true} />)
    
    const button = screen.getByRole("button", { name: "Saving..." })
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })
})
