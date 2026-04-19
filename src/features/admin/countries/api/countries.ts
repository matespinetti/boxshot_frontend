import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import { type CountryAdmin } from "@/schemas/entities"
import { type CountryFormValues } from "../schemas/country.schema"

export const countryKeys = {
  all: ["admin", "countries"] as const,
}

export function useAdminCountries() {
  return useQuery({
    queryKey: countryKeys.all,
    queryFn: async () => {
      const data = await apiClient.get<CountryAdmin[]>("/admin/countries")
      return data
    },
  })
}

export function useCreateCountry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CountryFormValues) => {
      const data = await apiClient.post<CountryAdmin>("/admin/countries", payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: countryKeys.all })
    },
  })
}

export function useUpdateCountry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CountryFormValues> & { active?: boolean } }) => {
      const data = await apiClient.patch<CountryAdmin>(`/admin/countries/${id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: countryKeys.all })
    },
  })
}

export function useDeleteCountry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/countries/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: countryKeys.all })
    },
  })
}
