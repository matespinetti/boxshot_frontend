"use client"

import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { EmptyState, PageHeader } from "@/components/shared"
import { downloadApproved } from "@/features/jobs/api/downloadApproved"
import { updateImageStatus } from "@/features/jobs/api/updateImageStatus"
import type { ImageFilters } from "@/features/jobs/hooks/useImageFilters"
import { useImageFilters } from "@/features/jobs/hooks/useImageFilters"
import { useJobPolling } from "@/features/jobs/hooks/useJobPolling"
import { jobsQueryKeys } from "@/features/jobs/queryKeys"
import {
  imageSelectionStore,
  useImageSelectionStore,
} from "@/features/jobs/stores/useImageSelectionStore"
import type { JobImage } from "@/features/jobs/types"
import { BulkActions } from "./BulkActions"
import { DownloadButton } from "./DownloadButton"
import { GridFilters } from "./GridFilters"
import { ImageGrid } from "./ImageGrid"
import { JobStatusBar } from "./JobStatusBar"

interface JobResultsViewProps {
  jobId: string
}

function isSelectableImage(image: JobImage): boolean {
  return image.status === "complete"
}

export function JobResultsView({ jobId }: JobResultsViewProps) {
  const queryClient = useQueryClient()
  const jobQuery = useJobPolling(jobId)
  const { filters, setFilters, filterImages } = useImageFilters()
  const { selectedIds } = useImageSelectionStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    imageSelectionStore.setJob(jobId)
  }, [jobId])

  if (jobQuery.isPending && !jobQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeader title={`Job ${jobId}`} description="Review generated images." />
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Loading job results...
        </div>
      </div>
    )
  }

  if (jobQuery.isError || !jobQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeader title={`Job ${jobId}`} description="Review generated images." />
        <EmptyState
          title="Could not load this job"
          description="Try again to refresh the results workspace."
          action={{ label: "Retry", onClick: () => void jobQuery.refetch() }}
        />
      </div>
    )
  }

  const job = jobQuery.data
  const filteredImages = filterImages(job.images)
  const eligibleImages = filteredImages.filter(isSelectableImage)
  const selectedEligibleIds = selectedIds.filter((id) =>
    eligibleImages.some((image) => image.id === id),
  )

  async function handleFiltersChange(next: Partial<ImageFilters>) {
    await setFilters(next)
  }

  async function handleBulkUpdate(status: "approved" | "rejected") {
    if (selectedEligibleIds.length === 0) return

    setIsSubmitting(true)
    try {
      await Promise.all(
        selectedEligibleIds.map((imageId) => updateImageStatus(imageId, status)),
      )
      imageSelectionStore.clear()
      await queryClient.invalidateQueries({
        queryKey: jobsQueryKeys.detail(jobId),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Job ${job.id}`}
        description="Review generated images."
        action={
          <DownloadButton
            onClick={() => downloadApproved(job.id)}
            disabled={!job.images.some((image) => image.status === "approved")}
          />
        }
      />

      <JobStatusBar job={job} />

      {job.images.length === 0 ? (
        <EmptyState
          title="Images are on the way"
          description="This job has started, but no image records are ready to review yet."
        />
      ) : (
        <>
          <GridFilters
            images={job.images}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
          <BulkActions
            selectedCount={selectedEligibleIds.length}
            eligibleCount={eligibleImages.length}
            isSubmitting={isSubmitting}
            onSelectAll={() =>
              imageSelectionStore.replaceSelected(
                eligibleImages.map((image) => image.id),
              )
            }
            onClear={() => imageSelectionStore.clear()}
            onApprove={() => void handleBulkUpdate("approved")}
            onReject={() => void handleBulkUpdate("rejected")}
          />
          <ImageGrid
            images={filteredImages}
            selectedIds={selectedIds}
            onToggleSelect={(imageId) => imageSelectionStore.toggle(imageId)}
            isSelectable={isSelectableImage}
          />
        </>
      )}
    </div>
  )
}
