"use client"

import { useState } from "react"

import { EmptyState } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { ImageCard } from "@/features/images/components/ImageCard"
import { ImageLightbox } from "@/features/images/components/ImageLightbox"
import type { JobImage } from "@/features/jobs/types"

interface ImageGridProps {
  images: JobImage[]
  jobId: string
  selectedIds: string[]
  onToggleSelect: (imageId: string) => void
  isSelectable: (image: JobImage) => boolean
  pageSize?: number
}

export function ImageGrid({
  images,
  jobId,
  selectedIds,
  onToggleSelect,
  isSelectable,
  pageSize = 12,
}: ImageGridProps) {
  const [page, setPage] = useState(1)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const totalPages = Math.max(1, Math.ceil(images.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageImages = images.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  function handleOpenLightbox(imageId: string) {
    const index = images.findIndex((img) => img.id === imageId)
    if (index !== -1) setLightboxIndex(index)
  }

  if (images.length === 0) {
    return (
      <EmptyState
        title="No images match these filters"
        description="Adjust the filters to bring more results into view."
      />
    )
  }

  return (
    <>
      <ImageLightbox
        images={images}
        openIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onPrev={() => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
        onNext={() =>
          setLightboxIndex((i) =>
            i !== null && i < images.length - 1 ? i + 1 : i,
          )
        }
      />

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pageImages.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              jobId={jobId}
              selected={selectedIds.includes(image.id)}
              onToggleSelect={onToggleSelect}
              isSelectable={isSelectable}
              onOpenLightbox={handleOpenLightbox}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
