"use client"

import { useQuery } from "@tanstack/react-query"
import { ImageIcon, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils/cn"
import { env } from "@/lib/env"
import { getProductImages } from "@/features/generation/api/getProductImages"
import type { ProductImage } from "@/schemas/entities"

interface ReferenceImageSelectorProps {
  productId: string
  value: string[]
  onChange: (value: string[]) => void
}

function resolveImageUrl(url: string, baseUrl: string) {
  return url.startsWith("http") ? url : `${baseUrl}${url}`
}

function ImageThumb({
  img,
  baseUrl,
  size = "md",
}: {
  img: ProductImage
  baseUrl: string
  size?: "sm" | "md"
}) {
  return (
    <img
      src={resolveImageUrl(img.url, baseUrl)}
      alt={img.label}
      className={cn("object-cover", size === "sm" ? "h-full w-full" : "h-full w-full")}
      onError={(e) => {
        e.currentTarget.style.display = "none"
      }}
    />
  )
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

  const baseUrl = new URL(env.NEXT_PUBLIC_API_URL).origin

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id))
    } else if (value.length < 9) {
      onChange([...value, id])
    }
  }

  const selectedImages = images?.filter((img) => value.includes(img.id)) ?? []

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger
            disabled={isLoading}
            render={
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={isLoading}
              />
            }
          >
            {isLoading ? (
              <>
                <ImageIcon className="size-4" />
                Loading…
              </>
            ) : (
              <>
                <ImageIcon className="size-4" />
                Choose images…
                {value.length > 0 && (
                  <Badge className="ml-0.5 px-1.5">{value.length}</Badge>
                )}
              </>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Select up to 9 — click to toggle
                </p>
                {value.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => onChange([])}
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2">
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
                      title={img.label}
                      className={cn(
                        "relative aspect-square overflow-hidden rounded-md border-2 transition-all",
                        isSelected
                          ? "border-primary shadow-sm"
                          : "border-transparent hover:border-primary/40",
                        isDisabled && "cursor-not-allowed opacity-40",
                      )}
                    >
                      <ImageThumb img={img} baseUrl={baseUrl} />
                      {isSelected && (
                        <div className="absolute inset-0 flex items-end justify-end bg-primary/10 p-1">
                          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                            ✓
                          </div>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              {value.length === 0 && (
                <p className="text-xs text-amber-600">
                  No images selected — text-to-image mode
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {selectedImages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedImages.map((img) => (
            <div
              key={img.id}
              className="group relative h-12 w-12 overflow-hidden rounded-md border-2 border-primary"
              title={img.label}
            >
              <ImageThumb img={img} baseUrl={baseUrl} size="sm" />
              <button
                type="button"
                onClick={() => toggle(img.id)}
                aria-label={`Remove ${img.label ?? img.id}`}
                className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100"
              >
                <X className="size-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
