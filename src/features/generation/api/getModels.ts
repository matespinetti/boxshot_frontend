import { z } from "zod"

import type { Model } from "@/features/generation/types"
import { apiClient } from "@/lib/api/client"
import { ModelSchema } from "@/schemas/entities"

export async function getModels(): Promise<Model[]> {
  const data = await apiClient.get<unknown>("/models")

  return z.array(ModelSchema).parse(data)
}
