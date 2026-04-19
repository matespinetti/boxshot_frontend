import { apiClient } from "@/lib/api/client"
import { ColourAdminSchema, type ColourAdmin } from "@/schemas/entities"
import type { ColourFormValues } from "../schemas/colour.schema"

export async function createColour(data: ColourFormValues): Promise<ColourAdmin> {
  const response = await apiClient.post<unknown>("/admin/colours", data)
  return ColourAdminSchema.parse(response)
}
