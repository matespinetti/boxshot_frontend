import { apiClient } from "@/lib/api/client"
import { ColourAdminSchema, type ColourAdmin } from "@/schemas/entities"

export async function updateColour(
  id: string,
  data: Partial<ColourAdmin>,
): Promise<ColourAdmin> {
  const response = await apiClient.patch<unknown>(`/admin/colours/${id}`, data)
  return ColourAdminSchema.parse(response)
}
