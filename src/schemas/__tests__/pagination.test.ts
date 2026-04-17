import { describe, expect, it } from "vitest"
import { z } from "zod"

import { paginatedSchema } from "../pagination"

const itemSchema = z.object({ id: z.string() })

describe("paginatedSchema", () => {
  it("parses a valid paginated response", () => {
    const result = paginatedSchema(itemSchema).parse({
      items: [{ id: "abc" }],
      total: 1,
      page: 1,
      per_page: 20,
      pages: 1,
    })

    expect(result.items).toEqual([{ id: "abc" }])
    expect(result.total).toBe(1)
    expect(result.pages).toBe(1)
  })

  it("throws when required pagination fields are missing", () => {
    expect(() =>
      paginatedSchema(itemSchema).parse({ items: [], total: 1 }),
    ).toThrow()
  })

  it("throws when an item does not match the item schema", () => {
    expect(() =>
      paginatedSchema(itemSchema).parse({
        items: [{ id: 123 }],
        total: 1,
        page: 1,
        per_page: 20,
        pages: 1,
      }),
    ).toThrow()
  })

  it("parses an empty items array", () => {
    const result = paginatedSchema(itemSchema).parse({
      items: [],
      total: 0,
      page: 1,
      per_page: 20,
      pages: 0,
    })

    expect(result.items).toEqual([])
  })
})
