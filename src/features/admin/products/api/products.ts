import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/lib/api/client"
import { type ProductAdmin, type ProductImage } from "@/schemas/entities"
import { type ProductFormValues } from "../schemas/product.schema"

// --- Products CRUD ---

export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const data = await apiClient.get<ProductAdmin[]>("/admin/products")
      return data
    },
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ProductFormValues) => {
      const data = await apiClient.post<ProductAdmin>("/admin/products", payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<ProductFormValues & { active: boolean }>
    }) => {
      const data = await apiClient.patch<ProductAdmin>(`/admin/products/${id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] })
    },
  })
}

// --- Product Images ---

export function useProductImages(productId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "products", productId, "images"],
    queryFn: async () => {
      if (!productId) return []
      const data = await apiClient.get<ProductImage[]>(`/admin/products/${productId}/images`)
      return data
    },
    enabled: !!productId,
  })
}

export function useUploadProductImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      productId,
      file,
      label = "",
    }: {
      productId: string
      file: File
      label?: string
    }) => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("label", label)

      // We bypass the standard apiClient JSON handling for FormData
      // Our API client might support it, but native fetch is safer for multipart.
      // Wait, our apiClient uses standard fetch, let's see if we can use it.
      // The `apiClient` automatically sets Content-Type to application/json by default.
      // We must pass FormData and let the browser set the boundary headers.
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/admin/products/${productId}/images/upload`, {
        method: "POST",
        body: formData,
        // Don't set Content-Type header manually, let browser set it with boundary
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      return response.json() as Promise<ProductImage>
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products", variables.productId, "images"] })
    },
  })
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ imageId }: { imageId: string; productId: string }) => {
      const data = await apiClient.delete<void>(`/admin/product-images/${imageId}`)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products", variables.productId, "images"] })
    },
  })
}
