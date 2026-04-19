"use client"

import type { UseQueryResult } from "@tanstack/react-query"
import { useQuery } from "@tanstack/react-query"

import { getJob } from "@/features/jobs/api/getJob"
import { jobsQueryKeys } from "@/features/jobs/queryKeys"
import type { Job } from "@/features/jobs/types"

const TERMINAL_STATUSES = ["complete", "failed"] as const

function isTerminal(status: string | undefined): boolean {
  return !status || (TERMINAL_STATUSES as readonly string[]).includes(status)
}

export function useJobPolling(jobId: string): UseQueryResult<Job> {
  return useQuery({
    queryKey: jobsQueryKeys.detail(jobId),
    queryFn: () => getJob(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status

      return isTerminal(status) ? false : 2000
    },
  })
}
