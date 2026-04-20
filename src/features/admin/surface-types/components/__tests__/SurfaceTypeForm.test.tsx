import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SurfaceTypeForm } from "../SurfaceTypeForm"

describe("SurfaceTypeForm", () => {
  it("renders all form fields", () => {
    render(<SurfaceTypeForm onSubmit={vi.fn()} />)

    expect(screen.getByPlaceholderText(/e.g. brick_wall/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e.g. Brick Wall/i)).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/Traditional brick wall with natural colour variation/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Save Surface Type" }),
    ).toBeInTheDocument()
  })

  it("submits valid data", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<SurfaceTypeForm onSubmit={onSubmit} />)

    await user.type(
      screen.getByPlaceholderText(/e.g. brick_wall/i),
      "metal_gate",
    )
    await user.type(
      screen.getByPlaceholderText(/e.g. Brick Wall/i),
      "Metal Gate",
    )
    await user.type(
      screen.getByPlaceholderText(
        /Traditional brick wall with natural colour variation/i,
      ),
      "Powder-coated metal gate.",
    )

    await user.click(screen.getByRole("button", { name: "Save Surface Type" }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "metal_gate",
          label: "Metal Gate",
          surface_prompt_block: "Powder-coated metal gate.",
        }),
        expect.anything(),
      )
    })
  })
})
