import type { Job } from "@/features/jobs/types"
import { apiClient } from "@/lib/api/client"
import { JobSchema } from "@/schemas/jobs"

export async function getJob(jobId: string): Promise<Job> {
  const data = await apiClient.get<unknown>(`/jobs/${jobId}`)

  return JobSchema.parse(data)
}
