import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/lib/api/client"
import { type InstallationTypeAdmin } from "@/schemas/entities"

export const installationTypesKeys = {
  all: ["admin", "installationTypes"] as const,
}

export function useAdminInstallationTypes() {
  return useQuery({
    queryKey: installationTypesKeys.all,
    queryFn: async () => {
      const data = await apiClient.get<InstallationTypeAdmin[]>("/admin/installation-types")
      return data
    },
  })
}

export function useCreateInstallationType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Partial<InstallationTypeAdmin>) => {
      const data = await apiClient.post<InstallationTypeAdmin>("/admin/installation-types", payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: installationTypesKeys.all })
    },
  })
}

export function useUpdateInstallationType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<InstallationTypeAdmin> }) => {
      const data = await apiClient.patch<InstallationTypeAdmin>(`/admin/installation-types/${id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: installationTypesKeys.all })
    },
  })
}
