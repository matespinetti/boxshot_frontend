import type { CreateJobRequest, Job } from "@/features/generation/types"
import { apiClient } from "@/lib/api/client"
import { JobSchema } from "@/schemas/jobs"

export async function createJob(body: CreateJobRequest): Promise<Job> {
  const data = await apiClient.post<unknown>("/jobs", body)

  return JobSchema.parse(data)
}
