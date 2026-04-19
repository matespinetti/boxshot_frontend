import { JobImageSchema } from "@/schemas/jobs"
import type { JobImage } from "@/schemas/jobs"
import { apiClient } from "@/lib/api/client"

export async function regenerateImage(imageId: string): Promise<JobImage> {
  const data = await apiClient.post<unknown>(`/images/${imageId}/regenerate`, {})
  return JobImageSchema.parse(data)
}
