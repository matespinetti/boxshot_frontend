import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PromptTemplateForm } from "../PromptTemplateForm"

describe("PromptTemplateForm", () => {
  it("renders all form fields", () => {
    render(<PromptTemplateForm onSubmit={vi.fn()} />)

    expect(screen.getByText("Template Name")).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e.g. v2-production/i)).toBeInTheDocument()
    expect(screen.getByText("Base Framework Prompt")).toBeInTheDocument()
    expect(screen.getByText("Quality Rules")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create Template Version" })).toBeInTheDocument()
  })

  it("submits valid data", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<PromptTemplateForm onSubmit={onSubmit} />)

    await user.type(screen.getByPlaceholderText(/e.g. v2-production/i), "v1.5-beta")
    await user.type(screen.getByPlaceholderText(/You are an expert product photographer/i), "Base prompt test")
    await user.type(screen.getByPlaceholderText(/Ensure ultra-realistic lighting/i), "Quality rules test")

    await user.click(screen.getByRole("button", { name: "Create Template Version" }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "v1.5-beta",
          base_framework: "Base prompt test",
          quality_rules: "Quality rules test",
        }),
        expect.anything()
      )
    })
  })

  it("shows validation errors for empty required fields", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    
    render(<PromptTemplateForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole("button", { name: "Create Template Version" }))

    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Base framework is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Quality rules are required/i)).toBeInTheDocument()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
