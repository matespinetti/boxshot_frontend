import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { JobStatusBar } from "../JobStatusBar"

describe("JobStatusBar", () => {
  it("shows generating progress", () => {
    render(
      <JobStatusBar
        job={{
          id: "11111111-1111-4111-8111-111111111111",
          status: "generating",
          total_images: 12,
          completed_images: 4,
          created_at: "2026-04-19T12:00:00Z",
          images: [],
        }}
      />,
    )

    expect(screen.getByText("4 of 12 complete")).toBeInTheDocument()
    expect(screen.getByText("Generating")).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "33",
    )
  })

  it("shows a failure message for failed jobs", () => {
    render(
      <JobStatusBar
        job={{
          id: "11111111-1111-4111-8111-111111111111",
          status: "failed",
          total_images: 12,
          completed_images: 4,
          created_at: "2026-04-19T12:00:00Z",
          images: [],
        }}
      />,
    )

    expect(
      screen.getByText("Generation stopped before all images completed."),
    ).toBeInTheDocument()
  })
})
