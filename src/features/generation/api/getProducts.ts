import type { PaginatedResponse, Product } from "@/features/generation/types"
import { apiClient } from "@/lib/api/client"
import { ProductSchema } from "@/schemas/entities"
import { paginatedSchema } from "@/schemas/pagination"

export async function getProducts(): Promise<PaginatedResponse<Product>> {
  const data = await apiClient.get<unknown>("/products?per_page=100")

  return paginatedSchema(ProductSchema).parse(data)
}
