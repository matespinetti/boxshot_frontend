import { describe, expect, it } from "vitest"

import { formatDate, formatFileSize, formatStatusLabel } from "../formatters"

describe("formatDate", () => {
  it("formats an ISO date string as a locale date", () => {
    const result = formatDate("2026-04-16T10:00:00Z")
    expect(result).toMatch(/2026/)
    expect(typeof result).toBe("string")
    expect(result.length).toBeGreaterThan(0)
  })
})

describe("formatFileSize", () => {
  it("formats bytes as B", () => {
    expect(formatFileSize(500)).toBe("500 B")
  })

  it("formats kilobytes with one decimal", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB")
  })

  it("formats megabytes with one decimal", () => {
    expect(formatFileSize(2621440)).toBe("2.5 MB")
  })

  it("formats gigabytes with one decimal", () => {
    expect(formatFileSize(1073741824)).toBe("1.0 GB")
  })
})

describe("formatStatusLabel", () => {
  it("returns the mapped label for a known status", () => {
    expect(formatStatusLabel("approved")).toBe("Approved")
    expect(formatStatusLabel("generating")).toBe("Generating")
  })

  it("title-cases unknown statuses as fallback", () => {
    expect(formatStatusLabel("some_status")).toBe("Some status")
  })
})
