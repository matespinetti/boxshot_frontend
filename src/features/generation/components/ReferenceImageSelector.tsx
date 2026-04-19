"use client"

import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils/cn"
import { env } from "@/lib/env"
import { getProductImages } from "@/features/generation/api/getProductImages"

interface ReferenceImageSelectorProps {
  productId: string
  value: string[]
  onChange: (value: string[]) => void
}

function resolveImageUrl(url: string, baseUrl: string) {
  return url.startsWith("http") ? url : `${baseUrl}${url}`
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
      <div className="flex gap-3 overflow-x-auto pb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex shrink-0 flex-col gap-1.5">
            <Skeleton className="h-20 w-20 rounded-lg" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
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
        <p className="text-xs text-amber-600">
          No reference images selected — text-to-image mode
        </p>
      )}
      <div className="flex gap-3 overflow-x-auto pb-1">
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
                "group flex shrink-0 flex-col gap-1.5 rounded-lg outline-none",
                isDisabled && "cursor-not-allowed opacity-40",
              )}
            >
              <div
                className={cn(
                  "relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-all",
                  isSelected
                    ? "border-primary shadow-sm"
                    : "border-transparent group-hover:border-primary/40",
                )}
              >
                <img
                  src={resolveImageUrl(img.url, baseUrl)}
                  alt={img.label}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
                {isSelected && (
                  <div className="absolute inset-0 flex items-end justify-end bg-primary/10 p-1">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                      ✓
                    </div>
                  </div>
                )}
              </div>
              <span className="max-w-[80px] truncate text-center text-xs text-muted-foreground">
                {img.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
