import { z } from "zod"
import { apiClient } from "@/lib/api/client"
import { ProductImageSchema } from "@/schemas/entities"
import type { ProductImage } from "@/features/generation/types"

export async function getProductImages(productId: string): Promise<ProductImage[]> {
  const data = await apiClient.get<unknown>(`/admin/products/${productId}/images`)
  return z.array(ProductImageSchema).parse(data)
}
