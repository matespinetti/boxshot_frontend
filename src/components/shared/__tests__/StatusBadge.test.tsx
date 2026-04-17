import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ImageStatus, JobStatus } from "@/constants/status"

import { StatusBadge } from "../StatusBadge"

describe("StatusBadge", () => {
  it("renders the label for ImageStatus.Complete", () => {
    render(<StatusBadge status={ImageStatus.Complete} />)
    expect(screen.getByText("Complete")).toBeInTheDocument()
  })

  it("renders the label for ImageStatus.Approved", () => {
    render(<StatusBadge status={ImageStatus.Approved} />)
    expect(screen.getByText("Approved")).toBeInTheDocument()
  })

  it("renders the label for JobStatus.Idle", () => {
    render(<StatusBadge status={JobStatus.Idle} />)
    expect(screen.getByText("Idle")).toBeInTheDocument()
  })

  it("renders the label for ImageStatus.Failed with correct colour class", () => {
    const { container } = render(<StatusBadge status={ImageStatus.Failed} />)

    expect(container.firstChild).toHaveClass("bg-red-100")
  })

  it("renders the label for ImageStatus.Generating with correct colour class", () => {
    const { container } = render(<StatusBadge status={ImageStatus.Generating} />)

    expect(container.firstChild).toHaveClass("bg-blue-100")
  })
})
