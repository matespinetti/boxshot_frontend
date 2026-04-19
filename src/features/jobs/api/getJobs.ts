import { apiClient } from "@/lib/api/client"
import { JobsListResponseSchema } from "@/schemas/jobs"

interface GetJobsParams {
  page: number
  perPage: number
  status?: string
}

export async function getJobs({
  page,
  perPage,
  status,
}: GetJobsParams) {
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  })

  if (status) {
    query.set("status", status)
  }

  const data = await apiClient.get<unknown>(`/jobs?${query.toString()}`)

  return JobsListResponseSchema.parse(data)
}
