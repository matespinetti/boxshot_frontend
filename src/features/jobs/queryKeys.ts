export const jobsQueryKeys = {
  list: (params: { page: number; perPage: number; status?: string }) =>
    ["jobs", "list", params] as const,
  detail: (id: string) => ["jobs", id] as const,
}
