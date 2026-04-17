import type {
  PreviewPromptsRequest,
  PreviewResponse,
} from "@/features/generation/types"
import { apiClient } from "@/lib/api/client"
import { PreviewResponseSchema } from "@/schemas/jobs"

export async function previewPrompts(
  body: PreviewPromptsRequest,
): Promise<PreviewResponse> {
  const data = await apiClient.post<unknown>("/jobs/preview", body)

  return PreviewResponseSchema.parse(data)
}
