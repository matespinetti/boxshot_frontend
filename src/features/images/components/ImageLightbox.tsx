"use client"

import { useEffect } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { StatusBadge } from "@/components/shared"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { JobImage } from "@/features/images/types"
import { resolveImageUrl } from "@/lib/utils/resolveImageUrl"

interface ImageLightboxProps {
  images: JobImage[]
  openIndex: number | null
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

export function ImageLightbox({
  images,
  openIndex,
  onClose,
  onNext,
  onPrev,
}: ImageLightboxProps) {
  const isOpen = openIndex !== null
  const image = isOpen ? images[openIndex] : null
  const hasPrev = isOpen && openIndex > 0
  const hasNext = isOpen && openIndex < images.length - 1

  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && hasPrev) onPrev()
      if (e.key === "ArrowRight" && hasNext) onNext()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [isOpen, hasPrev, hasNext, onPrev, onNext])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        className="flex max-h-[90vh] w-full flex-col gap-4 sm:max-w-4xl"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="sr-only">
            {image
              ? `${image.product_name} ${image.country_name} ${image.shot_type_name}`
              : "Image"}
          </DialogTitle>
        </DialogHeader>

        {image && (
          <>
            <div className="relative flex items-center justify-center">
              {hasPrev && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 z-10"
                  onClick={onPrev}
                  aria-label="Previous image"
                >
                  <ChevronLeftIcon className="size-5" />
                </Button>
              )}

              <img
                src={resolveImageUrl(image.image_url!)}
                alt={`${image.product_name} ${image.country_code} ${image.shot_type_name}`}
                className="max-h-[60vh] w-full object-contain"
              />

              {hasNext && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 z-10"
                  onClick={onNext}
                  aria-label="Next image"
                >
                  <ChevronRightIcon className="size-5" />
                </Button>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground">
              {openIndex! + 1} / {images.length}
            </p>

            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <div>
                <p className="font-medium">{image.country_name}</p>
                <p className="text-sm text-muted-foreground">
                  {image.shot_type_name} · V{image.variation_number} ·{" "}
                  {image.product_name} · {image.ral_code}
                </p>
              </div>
              <StatusBadge status={image.status} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
