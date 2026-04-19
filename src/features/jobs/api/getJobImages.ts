import type { JobImage } from "@/features/jobs/types"

import { getJob } from "./getJob"

export async function getJobImages(jobId: string): Promise<JobImage[]> {
  const job = await getJob(jobId)

  return job.images
}
