import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { OverrideForm } from "../OverrideForm"

// Mock apiClient to prevent actual fetch calls
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue([
      { id: "123", name: "Red Finish" },
      { id: "456", name: "Blue Finish" },
    ]),
  },
}))

describe("OverrideForm", () => {
  const queryClient = new QueryClient()

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
  }

  it("renders cascading form fields", () => {
    renderWithProviders(<OverrideForm onSubmit={vi.fn()} />)

    expect(screen.getByText("Entity Type")).toBeInTheDocument()
    expect(screen.getByText("Entity")).toBeInTheDocument()
    expect(screen.getByText("Prompt Block to Override")).toBeInTheDocument()
    expect(screen.getByText("Override Value")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create Override" })).toBeInTheDocument()
  })

  it("shows validation errors for empty required fields", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    
    renderWithProviders(<OverrideForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole("button", { name: "Create Override" }))

    await waitFor(() => {
      expect(screen.getByText(/Entity type is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Please select an entity/i)).toBeInTheDocument()
      expect(screen.getByText(/Override key is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Override value is required/i)).toBeInTheDocument()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
