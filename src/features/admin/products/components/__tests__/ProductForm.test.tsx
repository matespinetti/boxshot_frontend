import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ProductForm } from "../ProductForm"

// Mock the ReferenceImageUpload component since it has its own tests
vi.mock("../ReferenceImageUpload", () => ({
  ReferenceImageUpload: ({ productId }: { productId: string }) => (
    <div data-testid="reference-image-upload">Mocked Upload {productId}</div>
  ),
}))

describe("ProductForm", () => {
  const queryClient = new QueryClient()

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
  }

  it("renders all form fields", () => {
    renderWithProviders(<ProductForm onSubmit={vi.fn()} />)

    expect(screen.getByText("Product Name")).toBeInTheDocument()
    expect(screen.getByText("Slug")).toBeInTheDocument()
    expect(screen.queryByText("Installation Type")).not.toBeInTheDocument()
    expect(screen.getByText("Product Prompt Block")).toBeInTheDocument()
    
    // Upload should NOT be visible when creating a new product
    expect(screen.queryByTestId("reference-image-upload")).not.toBeInTheDocument()
  })

  it("auto-generates slug from name when creating", async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProductForm onSubmit={vi.fn()} />)

    const nameInput = screen.getByPlaceholderText("e.g. Classic Mug")
    await user.type(nameInput, "My Awesome Product")
    
    // Checking the slug input value
    const slugInput = screen.getByPlaceholderText("e.g. classic-mug")
    expect(slugInput).toHaveValue("my-awesome-product")
  })

  it("renders image upload component when editing existing product", () => {
    renderWithProviders(
      <ProductForm 
        onSubmit={vi.fn()} 
        defaultValues={{ 
          id: "prod-123", 
          name: "Existing Product", 
          slug: "existing-product",
          product_prompt_block: "Test",
        }} 
      />
    )

    expect(screen.getByTestId("reference-image-upload")).toBeInTheDocument()
    expect(screen.getByText("Mocked Upload prod-123")).toBeInTheDocument()
  })

  it("shows validation errors for empty required fields", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    
    renderWithProviders(<ProductForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole("button", { name: "Create Product" }))

    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Product prompt block is required/i)).toBeInTheDocument()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
