import { apiClient } from "@/lib/api/client"

export async function regenerateImage(imageId: string): Promise<void> {
  await apiClient.post(`/images/${imageId}/regenerate`, {})
}
