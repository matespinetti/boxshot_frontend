import type { PaginatedResponse, ShotType } from "@/features/generation/types"
import { apiClient } from "@/lib/api/client"
import { ShotTypeSchema } from "@/schemas/entities"
import { paginatedSchema } from "@/schemas/pagination"

export async function getShotTypes(): Promise<PaginatedResponse<ShotType>> {
  const data = await apiClient.get<unknown>("/shot-types?per_page=100")

  return paginatedSchema(ShotTypeSchema).parse(data)
}
