import { describe, expect, it } from "vitest"

import { ImageStatus, JobStatus, STATUS_COLORS, STATUS_LABELS } from "../status"

const ALL_IMAGE_STATUSES = Object.values(ImageStatus)
const ALL_JOB_STATUSES = Object.values(JobStatus)
const ALL_STATUSES = [...new Set([...ALL_IMAGE_STATUSES, ...ALL_JOB_STATUSES])]

describe("STATUS_LABELS", () => {
  it("has a label for every ImageStatus value", () => {
    for (const status of ALL_IMAGE_STATUSES) {
      expect(STATUS_LABELS[status], `missing label for "${status}"`).toBeDefined()
    }
  })

  it("has a label for every JobStatus value", () => {
    for (const status of ALL_JOB_STATUSES) {
      expect(STATUS_LABELS[status], `missing label for "${status}"`).toBeDefined()
    }
  })
})

describe("STATUS_COLORS", () => {
  it("has a colour for every status value", () => {
    for (const status of ALL_STATUSES) {
      expect(STATUS_COLORS[status], `missing colour for "${status}"`).toBeDefined()
    }
  })

  it("colour values are non-empty strings", () => {
    for (const status of ALL_STATUSES) {
      expect(typeof STATUS_COLORS[status]).toBe("string")
      expect(STATUS_COLORS[status].length).toBeGreaterThan(0)
    }
  })
})
