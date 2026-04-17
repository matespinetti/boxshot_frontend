import { describe, expect, it } from "vitest"

import {
  CreateJobRequestSchema,
  PreviewPromptsRequestSchema,
} from "../generation.schema"

const UUID = "550e8400-e29b-41d4-a716-446655440000"

describe("PreviewPromptsRequestSchema", () => {
  const valid = {
    product_id: UUID,
    colour_id: UUID,
    country_ids: [UUID],
    shot_type_ids: [UUID],
  }

  it("parses a minimal valid request without prompt_template_id", () => {
    const result = PreviewPromptsRequestSchema.parse(valid)

    expect(result.prompt_template_id).toBeUndefined()
  })

  it("parses a request with prompt_template_id", () => {
    const result = PreviewPromptsRequestSchema.parse({
      ...valid,
      prompt_template_id: UUID,
    })

    expect(result.prompt_template_id).toBe(UUID)
  })

  it("parses with multiple country_ids and shot_type_ids", () => {
    expect(() =>
      PreviewPromptsRequestSchema.parse({
        ...valid,
        country_ids: [UUID, UUID],
        shot_type_ids: [UUID, UUID, UUID],
      }),
    ).not.toThrow()
  })

  it("rejects empty country_ids", () => {
    expect(() =>
      PreviewPromptsRequestSchema.parse({ ...valid, country_ids: [] }),
    ).toThrow()
  })

  it("rejects empty shot_type_ids", () => {
    expect(() =>
      PreviewPromptsRequestSchema.parse({ ...valid, shot_type_ids: [] }),
    ).toThrow()
  })

  it("rejects a non-UUID product_id", () => {
    expect(() =>
      PreviewPromptsRequestSchema.parse({ ...valid, product_id: "not-a-uuid" }),
    ).toThrow()
  })
})

describe("CreateJobRequestSchema", () => {
  const valid = {
    product_id: UUID,
    colour_id: UUID,
    country_ids: [UUID],
    shot_type_ids: [UUID],
  }

  it("parses a minimal request and defaults variations to 1", () => {
    const result = CreateJobRequestSchema.parse(valid)

    expect(result.variations).toBe(1)
  })

  it("parses with explicit variations", () => {
    const result = CreateJobRequestSchema.parse({ ...valid, variations: 5 })

    expect(result.variations).toBe(5)
  })

  it("parses with product_image_ids up to 9 items", () => {
    expect(() =>
      CreateJobRequestSchema.parse({
        ...valid,
        product_image_ids: Array(9).fill(UUID),
      }),
    ).not.toThrow()
  })

  it("rejects product_image_ids with 10 or more items", () => {
    expect(() =>
      CreateJobRequestSchema.parse({
        ...valid,
        product_image_ids: Array(10).fill(UUID),
      }),
    ).toThrow()
  })

  it("rejects variations below 1", () => {
    expect(() => CreateJobRequestSchema.parse({ ...valid, variations: 0 })).toThrow()
  })

  it("rejects variations above 10", () => {
    expect(() => CreateJobRequestSchema.parse({ ...valid, variations: 11 })).toThrow()
  })

  it("rejects empty country_ids", () => {
    expect(() =>
      CreateJobRequestSchema.parse({ ...valid, country_ids: [] }),
    ).toThrow()
  })

  it("rejects empty shot_type_ids", () => {
    expect(() =>
      CreateJobRequestSchema.parse({ ...valid, shot_type_ids: [] }),
    ).toThrow()
  })

  it("accepts prompt_template_id as null", () => {
    const result = CreateJobRequestSchema.parse({
      ...valid,
      prompt_template_id: null,
    })

    expect(result.prompt_template_id).toBeNull()
  })

  it("accepts prompt_template_id as a UUID", () => {
    const result = CreateJobRequestSchema.parse({
      ...valid,
      prompt_template_id: UUID,
    })

    expect(result.prompt_template_id).toBe(UUID)
  })

  it("accepts omitted prompt_template_id", () => {
    const result = CreateJobRequestSchema.parse(valid)

    expect(result.prompt_template_id).toBeUndefined()
  })
})
