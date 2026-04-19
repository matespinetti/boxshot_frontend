import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/lib/api/client"
import { type ShotTypeAdmin } from "@/schemas/entities"

export const shotTypesKeys = {
  all: ["admin", "shotTypes"] as const,
}

export function useAdminShotTypes() {
  return useQuery({
    queryKey: shotTypesKeys.all,
    queryFn: async () => {
      const data = await apiClient.get<ShotTypeAdmin[]>("/admin/shot-types")
      return data
    },
  })
}

export function useCreateShotType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Partial<ShotTypeAdmin>) => {
      const data = await apiClient.post<ShotTypeAdmin>("/admin/shot-types", payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shotTypesKeys.all })
    },
  })
}

export function useUpdateShotType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<ShotTypeAdmin> }) => {
      const data = await apiClient.patch<ShotTypeAdmin>(`/admin/shot-types/${id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shotTypesKeys.all })
    },
  })
}
