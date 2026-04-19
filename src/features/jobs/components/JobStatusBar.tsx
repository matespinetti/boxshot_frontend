"use client"

import { StatusBadge } from "@/components/shared"
import type { Job } from "@/features/jobs/types"

interface JobStatusBarProps {
  job: Job
}

function getStatusCopy(status: Job["status"]): string {
  switch (status) {
    case "failed":
      return "Generation stopped before all images completed."
    case "complete":
      return "Generation finished. Review and approve the final set."
    case "idle":
      return "The job is queued and waiting to start."
    default:
      return "Images appear as soon as each render finishes."
  }
}

export function JobStatusBar({ job }: JobStatusBarProps) {
  const progress =
    job.total_images === 0
      ? 0
      : Math.round((job.completed_images / job.total_images) * 100)

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <StatusBadge status={job.status} />
            <p className="text-sm text-muted-foreground">
              {job.completed_images} of {job.total_images} complete
            </p>
          </div>
          <p className="text-sm text-muted-foreground">{getStatusCopy(job.status)}</p>
        </div>
        <p className="text-sm font-medium">{progress}%</p>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="h-2 rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
