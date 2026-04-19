"use client"

import { useEffect, useState } from "react"

import { EmptyState, StatusBadge } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { JobImage } from "@/features/jobs/types"
import { env } from "@/lib/env"

interface ImageGridProps {
  images: JobImage[]
  selectedIds: string[]
  onToggleSelect: (imageId: string) => void
  isSelectable: (image: JobImage) => boolean
  pageSize?: number
}

function getPlaceholderCopy(status: JobImage["status"]): string {
  switch (status) {
    case "generating":
      return "Rendering in progress"
    case "failed":
      return "Render failed"
    default:
      return "Image still pending"
  }
}

function resolveImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl
  }

  return `${new URL(env.NEXT_PUBLIC_API_URL).origin}${imageUrl}`
}

export function ImageGrid({
  images,
  selectedIds,
  onToggleSelect,
  isSelectable,
  pageSize = 12,
}: ImageGridProps) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(images.length / pageSize))

  useEffect(() => {
    setPage(1)
  }, [images.length])

  const pageImages = images.slice((page - 1) * pageSize, page * pageSize)

  if (images.length === 0) {
    return (
      <EmptyState
        title="No images match these filters"
        description="Adjust the filters to bring more results into view."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pageImages.map((image) => {
          const selected = selectedIds.includes(image.id)
          const selectable = isSelectable(image)

          return (
            <article
              key={image.id}
              className="overflow-hidden rounded-2xl border bg-card"
            >
              <div className="relative aspect-square bg-muted">
                {image.image_url ? (
                  <img
                    src={resolveImageUrl(image.image_url)}
                    alt={`${image.product_name} ${image.country_code} ${image.shot_type_name}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                    {getPlaceholderCopy(image.status)}
                  </div>
                )}

                {selectable && (
                  <Button
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    className="absolute top-3 right-3"
                    onClick={() => onToggleSelect(image.id)}
                    aria-label={`Select image ${image.variation_number}`}
                  >
                    {selected ? "Selected" : "Select"}
                  </Button>
                )}
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{image.country_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {image.shot_type_name} · V{image.variation_number}
                    </p>
                  </div>
                  <StatusBadge status={image.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {image.product_name} · {image.ral_code}
                </p>
              </div>
            </article>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
