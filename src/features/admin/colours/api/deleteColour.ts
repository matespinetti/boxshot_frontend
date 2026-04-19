import { apiClient } from "@/lib/api/client"

export async function deleteColour(id: string): Promise<void> {
  await apiClient.delete(`/admin/colours/${id}`)
}
