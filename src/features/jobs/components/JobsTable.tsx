"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

import { EmptyState, StatusBadge } from "@/components/shared"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ROUTES } from "@/constants/routes"
import { getJobs } from "@/features/jobs/api/getJobs"
import { jobsQueryKeys } from "@/features/jobs/queryKeys"

const PER_PAGE = 10
const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Idle", value: "idle" },
  { label: "Generating", value: "generating" },
  { label: "Complete", value: "complete" },
  { label: "Failed", value: "failed" },
] as const

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function JobsTable() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState("all")

  const normalizedStatus = status === "all" ? undefined : status

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: jobsQueryKeys.list({
      page,
      perPage: PER_PAGE,
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
    }),
    queryFn: () =>
      getJobs({
        page,
        perPage: PER_PAGE,
        ...(normalizedStatus ? { status: normalizedStatus } : {}),
      }),
  })

  const items = data?.items ?? []
  const totalPages = Math.max(1, data?.pages ?? 1)

  function handleStatusChange(nextStatus: string) {
    setStatus(nextStatus)
    setPage(1)
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage)
  }

  if (isError) {
    return (
      <EmptyState
        title="Could not load jobs"
        description="Try refreshing the jobs list."
        action={{ label: "Retry", onClick: () => void refetch() }}
      />
    )
  }

  if (!isLoading && items.length === 0) {
    if (normalizedStatus) {
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                variant={status === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusChange(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
          <EmptyState
            title="No jobs match this filter"
            description="Try a different status to see more jobs."
          />
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              variant={status === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusChange(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
        <EmptyState
          title="No jobs yet"
          description="Create a job from Generate and it will show up here."
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={status === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Open</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>Loading...</TableCell>
                    <TableCell>Loading...</TableCell>
                    <TableCell>Loading...</TableCell>
                    <TableCell>Loading...</TableCell>
                    <TableCell className="text-right">Loading...</TableCell>
                  </TableRow>
                ))
              : items.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs">{job.id}</TableCell>
                    <TableCell>
                      <StatusBadge status={job.status} />
                    </TableCell>
                    <TableCell>
                      {job.completed_images} / {job.total_images}
                    </TableCell>
                    <TableCell>{formatDate(job.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={ROUTES.job(job.id)}
                        className={buttonVariants({ size: "sm", variant: "outline" })}
                      >
                        View job
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
