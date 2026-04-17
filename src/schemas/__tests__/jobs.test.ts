import { describe, expect, it } from "vitest"

import {
  JobImageSchema,
  JobSchema,
  PreviewItemSchema,
  PreviewResponseSchema,
} from "../jobs"

const UUID = "550e8400-e29b-41d4-a716-446655440000"

describe("JobImageSchema", () => {
  const valid = {
    id: UUID,
    status: "pending" as const,
    file_path: null,
    regeneration_source_id: null,
  }

  it("parses a pending image with null file_path and regeneration_source_id", () => {
    const result = JobImageSchema.parse(valid)

    expect(result.file_path).toBeNull()
    expect(result.regeneration_source_id).toBeNull()
  })

  it("parses a completed image with a file_path", () => {
    expect(() =>
      JobImageSchema.parse({
        ...valid,
        status: "complete",
        file_path: "/chelsea/RAL7032/UK/PDP/Chelsea_RAL7032_UK_PDP_V1.png",
      }),
    ).not.toThrow()
  })

  it("parses a regenerated image with regeneration_source_id set", () => {
    const result = JobImageSchema.parse({
      ...valid,
      regeneration_source_id: UUID,
    })

    expect(result.regeneration_source_id).toBe(UUID)
  })

  it("rejects an invalid image status", () => {
    expect(() =>
      JobImageSchema.parse({ ...valid, status: "uploading" }),
    ).toThrow()
  })

  it("accepts all valid image statuses", () => {
    const statuses = [
      "pending",
      "generating",
      "complete",
      "failed",
      "approved",
      "rejected",
    ] as const

    for (const status of statuses) {
      expect(() => JobImageSchema.parse({ ...valid, status })).not.toThrow()
    }
  })
})

describe("JobSchema", () => {
  const valid = {
    id: UUID,
    status: "idle" as const,
    total_images: 4,
    completed_images: 0,
    images: [],
  }

  it("parses a job with an empty images array", () => {
    const result = JobSchema.parse(valid)

    expect(result.images).toEqual([])
  })

  it("parses a generating job with partial images", () => {
    expect(() =>
      JobSchema.parse({
        ...valid,
        status: "generating",
        completed_images: 2,
        images: [
          {
            id: UUID,
            status: "complete",
            file_path: "/chelsea/RAL7032/UK/PDP/img.png",
            regeneration_source_id: null,
          },
          {
            id: UUID,
            status: "pending",
            file_path: null,
            regeneration_source_id: null,
          },
        ],
      }),
    ).not.toThrow()
  })

  it("rejects an invalid job status", () => {
    expect(() => JobSchema.parse({ ...valid, status: "cancelled" })).toThrow()
  })

  it("accepts all valid job statuses", () => {
    const statuses = ["idle", "generating", "complete", "failed"] as const

    for (const status of statuses) {
      expect(() => JobSchema.parse({ ...valid, status })).not.toThrow()
    }
  })
})

describe("PreviewItemSchema", () => {
  it("parses a valid preview item", () => {
    const result = PreviewItemSchema.parse({
      country_id: UUID,
      shot_type_id: UUID,
      prompt: "Ultra-realistic architectural photograph of...",
    })

    expect(result.prompt).toContain("Ultra-realistic")
  })
})

describe("PreviewResponseSchema", () => {
  it("parses a preview response with multiple prompts", () => {
    const result = PreviewResponseSchema.parse({
      prompts: [
        { country_id: UUID, shot_type_id: UUID, prompt: "Prompt A" },
        { country_id: UUID, shot_type_id: UUID, prompt: "Prompt B" },
      ],
    })

    expect(result.prompts).toHaveLength(2)
  })

  it("parses a preview response with an empty prompts array", () => {
    expect(() => PreviewResponseSchema.parse({ prompts: [] })).not.toThrow()
  })

  it("throws when prompts field is missing", () => {
    expect(() => PreviewResponseSchema.parse({})).toThrow()
  })
})
