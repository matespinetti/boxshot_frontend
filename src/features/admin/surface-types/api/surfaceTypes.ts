import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/lib/api/client"
import { type SurfaceTypeAdmin } from "@/schemas/entities"
import { type SurfaceTypeFormValues } from "../schemas/surface-type.schema"

export const surfaceTypesKeys = {
  all: ["admin", "surfaceTypes"] as const,
}

export function useAdminSurfaceTypes() {
  return useQuery({
    queryKey: surfaceTypesKeys.all,
    queryFn: async () => {
      const data = await apiClient.get<SurfaceTypeAdmin[]>("/admin/surface-types")
      return data
    },
  })
}

export function useCreateSurfaceType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SurfaceTypeFormValues) => {
      const data = await apiClient.post<SurfaceTypeAdmin>(
        "/admin/surface-types",
        payload,
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: surfaceTypesKeys.all })
    },
  })
}

export function useUpdateSurfaceType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<SurfaceTypeFormValues & { active: boolean }>
    }) => {
      const data = await apiClient.patch<SurfaceTypeAdmin>(
        `/admin/surface-types/${id}`,
        payload,
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: surfaceTypesKeys.all })
    },
  })
}
