import { describe, expect, it } from "vitest"

import {
  ColourSchema,
  CountrySchema,
  InstallationTypeSchema,
  ProductSchema,
  PromptTemplateSchema,
  ShotTypeSchema,
} from "../entities"

const UUID = "550e8400-e29b-41d4-a716-446655440000"

describe("ProductSchema", () => {
  const valid = {
    id: UUID,
    name: "Chelsea",
    slug: "chelsea",
    installation_type_id: UUID,
    active: true,
  }

  it("parses a valid product", () => {
    expect(() => ProductSchema.parse(valid)).not.toThrow()
  })

  it("rejects a non-UUID id", () => {
    expect(() => ProductSchema.parse({ ...valid, id: "not-a-uuid" })).toThrow()
  })

  it("rejects a non-UUID installation_type_id", () => {
    expect(() =>
      ProductSchema.parse({ ...valid, installation_type_id: "not-a-uuid" }),
    ).toThrow()
  })
})

describe("ColourSchema", () => {
  const valid = {
    id: UUID,
    ral_code: "RAL7032",
    name: "Pebble Grey",
    hex_preview: "#b5b0a0",
    active: true,
  }

  it("parses a valid colour", () => {
    expect(() => ColourSchema.parse(valid)).not.toThrow()
  })

  it("parses hex_preview as null", () => {
    const result = ColourSchema.parse({ ...valid, hex_preview: null })

    expect(result.hex_preview).toBeNull()
  })

  it("rejects missing hex_preview (must be explicit null, not absent)", () => {
    const { hex_preview: _hexPreview, ...withoutHex } = valid

    expect(() => ColourSchema.parse(withoutHex)).toThrow()
  })
})

describe("CountrySchema", () => {
  const valid = {
    id: UUID,
    code: "UK",
    name: "United Kingdom",
    active: true,
  }

  it("parses a valid country", () => {
    expect(() => CountrySchema.parse(valid)).not.toThrow()
  })

  it("rejects a missing code field", () => {
    const { code: _code, ...withoutCode } = valid

    expect(() => CountrySchema.parse(withoutCode)).toThrow()
  })
})

describe("ShotTypeSchema", () => {
  const valid = {
    id: UUID,
    name: "PDP",
    intent: "pdp" as const,
    active: true,
  }

  it("parses valid intents: pdp, lifestyle, marketing", () => {
    expect(() =>
      ShotTypeSchema.parse({ ...valid, intent: "pdp" }),
    ).not.toThrow()
    expect(() =>
      ShotTypeSchema.parse({ ...valid, intent: "lifestyle" }),
    ).not.toThrow()
    expect(() =>
      ShotTypeSchema.parse({ ...valid, intent: "marketing" }),
    ).not.toThrow()
  })

  it("rejects an invalid intent", () => {
    expect(() =>
      ShotTypeSchema.parse({ ...valid, intent: "unknown" }),
    ).toThrow()
  })
})

describe("InstallationTypeSchema", () => {
  it("parses a valid installation type", () => {
    expect(() =>
      InstallationTypeSchema.parse({
        id: UUID,
        name: "built_in",
        label: "Built-In (Wall Integrated)",
        active: true,
      }),
    ).not.toThrow()
  })
})

describe("PromptTemplateSchema", () => {
  it("parses a valid prompt template", () => {
    expect(() =>
      PromptTemplateSchema.parse({
        id: UUID,
        name: "Standard v1",
        base_framework: "Ultra-realistic architectural photograph...",
        quality_rules: "Highly detailed textures, photorealistic...",
        version: 1,
        is_default: true,
        created_at: "2026-04-15T10:00:00Z",
      }),
    ).not.toThrow()
  })

  it("rejects a non-integer version", () => {
    expect(() =>
      PromptTemplateSchema.parse({
        id: UUID,
        name: "Standard v1",
        base_framework: "...",
        quality_rules: "...",
        version: "1",
        is_default: true,
        created_at: "2026-04-15T10:00:00Z",
      }),
    ).toThrow()
  })
})
