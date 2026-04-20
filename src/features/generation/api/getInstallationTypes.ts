import type {
  InstallationType,
  PaginatedResponse,
} from "@/features/generation/types"
import { apiClient } from "@/lib/api/client"
import { InstallationTypeSchema } from "@/schemas/entities"
import { paginatedSchema } from "@/schemas/pagination"

export async function getInstallationTypes(): Promise<
  PaginatedResponse<InstallationType>
> {
  const data = await apiClient.get<unknown>("/installation-types?per_page=100")

  return paginatedSchema(InstallationTypeSchema).parse(data)
}
