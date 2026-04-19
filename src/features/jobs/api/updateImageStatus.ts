import { apiClient } from "@/lib/api/client"

export async function updateImageStatus(
  imageId: string,
  status: "approved" | "rejected",
): Promise<void> {
  await apiClient.patch(`/images/${imageId}/status`, { status })
}
