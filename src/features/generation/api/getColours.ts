import type { Colour, PaginatedResponse } from "@/features/generation/types"
import { apiClient } from "@/lib/api/client"
import { ColourSchema } from "@/schemas/entities"
import { paginatedSchema } from "@/schemas/pagination"

export async function getColours(): Promise<PaginatedResponse<Colour>> {
  const data = await apiClient.get<unknown>("/colours?per_page=100")

  return paginatedSchema(ColourSchema).parse(data)
}
