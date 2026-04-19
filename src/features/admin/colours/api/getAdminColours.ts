import { apiClient } from "@/lib/api/client"
import { ColourAdminSchema, type ColourAdmin } from "@/schemas/entities"
import { z } from "zod"

export async function getAdminColours(): Promise<ColourAdmin[]> {
  const data = await apiClient.get<unknown>("/admin/colours")
  return z.array(ColourAdminSchema).parse(data)
}
