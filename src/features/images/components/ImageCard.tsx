"use client"

import { useState } from "react"
import {
  CheckIcon,
  DownloadIcon,
  Loader2,
  RefreshCcwIcon,
  XIcon,
} from "lucide-react"

import { StatusBadge } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { useImageActions } from "@/features/images/hooks/useImageActions"
import { RegenerateDialog } from "@/features/images/components/RegenerateDialog"
import type { JobImage } from "@/features/images/types"
import { resolveImageUrl } from "@/lib/utils/resolveImageUrl"

interface ImageCardProps {
  image: JobImage
  jobId: string
  selected: boolean
  onToggleSelect: (imageId: string) => void
  isSelectable: (image: JobImage) => boolean
  onOpenLightbox: (imageId: string) => void
}

const REGENERABLE_STATUSES: Array<JobImage["status"]> = [
  "complete",
  "approved",
  "rejected",
  "failed",
]

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

function downloadImage(url: string, filename: string) {
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.target = "_blank"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function ImageCard({
  image,
  jobId,
  selected,
  onToggleSelect,
  isSelectable,
  onOpenLightbox,
}: ImageCardProps) {
  const [regenDialogOpen, setRegenDialogOpen] = useState(false)
  const { approve, reject, regenerate, isUpdating, isRegenerating } =
    useImageActions(jobId)

  const selectable = isSelectable(image)
  const hasImage = !!image.image_url
  const updating = isUpdating(image.id)
  const regenerating = isRegenerating(image.id)
  const busy = updating || regenerating

  function handleRegenerate() {
    setRegenDialogOpen(false)
    void regenerate(image.id)
  }

  function handleDownload() {
    if (!image.image_url) return
    const absUrl = resolveImageUrl(image.image_url)
    const filename = `${image.product_name}_${image.ral_code}_${image.country_code}_${image.shot_type_name}_V${image.variation_number}.jpg`
    downloadImage(absUrl, filename)
  }

  return (
    <>
      <RegenerateDialog
        open={regenDialogOpen}
        onConfirm={handleRegenerate}
        onCancel={() => setRegenDialogOpen(false)}
      />

      <article className="overflow-hidden rounded-2xl border bg-card">
        <div className="group relative aspect-square bg-muted">
          {hasImage ? (
            <img
              src={resolveImageUrl(image.image_url!)}
              alt={`${image.product_name} ${image.country_code} ${image.shot_type_name}`}
              className="h-full w-full cursor-pointer object-cover"
              onClick={() => onOpenLightbox(image.id)}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
              {getPlaceholderCopy(image.status)}
            </div>
          )}

          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="size-8 animate-spin text-white" />
            </div>
          )}

          {!busy && hasImage && (
            <div className="absolute inset-0 flex items-end justify-center gap-2 bg-black/40 pb-3 opacity-0 transition-opacity group-hover:opacity-100">
              {image.status !== "approved" && (
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="size-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    void approve(image.id)
                  }}
                  aria-label="Approve"
                >
                  <CheckIcon className="size-4" />
                </Button>
              )}
              {image.status !== "rejected" && (
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="size-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    void reject(image.id)
                  }}
                  aria-label="Reject"
                >
                  <XIcon className="size-4" />
                </Button>
              )}
              {REGENERABLE_STATUSES.includes(image.status) && (
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="size-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    setRegenDialogOpen(true)
                  }}
                  aria-label="Regenerate"
                >
                  <RefreshCcwIcon className="size-4" />
                </Button>
              )}
              {hasImage && (
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="size-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownload()
                  }}
                  aria-label="Download"
                >
                  <DownloadIcon className="size-4" />
                </Button>
              )}
            </div>
          )}

          <div className="absolute top-2 left-2">
            <StatusBadge status={image.status} />
          </div>

          {selectable && (
            <Button
              type="button"
              size="sm"
              variant={selected ? "default" : "outline"}
              className="absolute top-2 right-2"
              onClick={(e) => {
                e.stopPropagation()
                onToggleSelect(image.id)
              }}
              aria-label={`Select image ${image.variation_number}`}
            >
              {selected ? "Selected" : "Select"}
            </Button>
          )}
        </div>

        <div className="space-y-1 p-4">
          <p className="font-medium">{image.country_name}</p>
          <p className="text-sm text-muted-foreground">
            {image.shot_type_name} · V{image.variation_number}
          </p>
          <p className="text-sm text-muted-foreground">
            {image.product_name} · {image.ral_code}
          </p>
        </div>
      </article>
    </>
  )
}
