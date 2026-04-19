import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/lib/api/client"
import { type PromptBlockOverride } from "@/schemas/entities"

export const overridesKeys = {
  all: ["admin", "overrides"] as const,
}

export function useAdminOverrides() {
  return useQuery({
    queryKey: overridesKeys.all,
    queryFn: async () => {
      const data = await apiClient.get<PromptBlockOverride[]>("/admin/overrides")
      return data
    },
  })
}

export function useCreateOverride() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Partial<PromptBlockOverride>) => {
      const data = await apiClient.post<PromptBlockOverride>("/admin/overrides", payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: overridesKeys.all })
    },
  })
}

export function useUpdateOverride() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<PromptBlockOverride> }) => {
      const data = await apiClient.patch<PromptBlockOverride>(`/admin/overrides/${id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: overridesKeys.all })
    },
  })
}

export function useDeleteOverride() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/overrides/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: overridesKeys.all })
    },
  })
}
