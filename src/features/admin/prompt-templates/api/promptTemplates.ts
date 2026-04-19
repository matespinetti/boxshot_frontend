import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/lib/api/client"
import { type PromptTemplateAdmin } from "@/schemas/entities"

export const promptTemplatesKeys = {
  all: ["admin", "promptTemplates"] as const,
}

export function useAdminPromptTemplates() {
  return useQuery({
    queryKey: promptTemplatesKeys.all,
    queryFn: async () => {
      const data = await apiClient.get<PromptTemplateAdmin[]>("/admin/prompt-templates")
      return data
    },
  })
}

export function useCreatePromptTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Partial<PromptTemplateAdmin>) => {
      const data = await apiClient.post<PromptTemplateAdmin>("/admin/prompt-templates", payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptTemplatesKeys.all })
    },
  })
}

export function useSetDefaultPromptTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const data = await apiClient.patch<PromptTemplateAdmin>(`/admin/prompt-templates/${id}/default`, {})
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptTemplatesKeys.all })
    },
  })
}
