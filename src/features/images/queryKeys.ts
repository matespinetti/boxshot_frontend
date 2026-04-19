// Images live inside the job TanStack Query cache.
// This key mirrors jobsQueryKeys.detail without cross-feature imports.
export const imageQueryKeys = {
  jobDetail: (jobId: string) => ["jobs", jobId] as const,
}
