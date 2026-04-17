import type { Country, PaginatedResponse } from "@/features/generation/types"
import { apiClient } from "@/lib/api/client"
import { CountrySchema } from "@/schemas/entities"
import { paginatedSchema } from "@/schemas/pagination"

export async function getCountries(): Promise<PaginatedResponse<Country>> {
  const data = await apiClient.get<unknown>("/countries?per_page=100")

  return paginatedSchema(CountrySchema).parse(data)
}
