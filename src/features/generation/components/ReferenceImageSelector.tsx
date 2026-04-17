"use client"

import { useQuery } from "@tanstack/react-query"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils/cn"
import { env } from "@/lib/env"
import { getProductImages } from "@/features/generation/api/getProductImages"

interface ReferenceImageSelectorProps {
  productId: string
  value: string[]
  onChange: (value: string[]) => void
}

export function ReferenceImageSelector({
  productId,
  value,
  onChange,
}: ReferenceImageSelectorProps) {
  const { data: images, isLoading } = useQuery({
    queryKey: ["product-images", productId],
    queryFn: () => getProductImages(productId),
    enabled: !!productId,
  })

  if (!productId) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a product to see reference images.
      </p>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded" />
        ))}
      </div>
    )
  }

  const baseUrl = new URL(env.NEXT_PUBLIC_API_URL).origin

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id))
    } else if (value.length < 9) {
      onChange([...value, id])
    }
  }

  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <p className="text-xs text-yellow-600">
          No reference images selected — text-to-image mode
        </p>
      )}
      <ScrollArea className="h-48">
        <div className="grid grid-cols-3 gap-2 p-1">
          {images?.map((img) => {
            const isSelected = value.includes(img.id)
            const isDisabled = !isSelected && value.length >= 9
            return (
              <button
                key={img.id}
                type="button"
                disabled={isDisabled}
                onClick={() => toggle(img.id)}
                aria-label={img.label || img.id}
                className={cn(
                  "relative aspect-square overflow-hidden rounded border-2 transition-colors",
                  isSelected ? "border-primary" : "border-transparent",
                  isDisabled && "cursor-not-allowed opacity-50",
                )}
              >
                <img
                  src={`${baseUrl}${img.url}`}
                  alt={img.label}
                  className="h-full w-full object-cover"
                />
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
