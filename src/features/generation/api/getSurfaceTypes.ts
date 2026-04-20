import type { PaginatedResponse, SurfaceType } from "@/features/generation/types"
import { apiClient } from "@/lib/api/client"
import { SurfaceTypeSchema } from "@/schemas/entities"
import { paginatedSchema } from "@/schemas/pagination"

export async function getSurfaceTypes(): Promise<PaginatedResponse<SurfaceType>> {
  const data = await apiClient.get<unknown>("/surface-types?per_page=100")

  return paginatedSchema(SurfaceTypeSchema).parse(data)
}
