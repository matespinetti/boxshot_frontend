import { ImageIcon, Loader2, Trash2, UploadCloud } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  useDeleteProductImage,
  useProductImages,
  useUploadProductImage,
} from "@/features/admin/products/api/products"

interface ReferenceImageUploadProps {
  productId: string
}

export function ReferenceImageUpload({ productId }: ReferenceImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const { data: images = [], isLoading } = useProductImages(productId)
  const uploadMutation = useUploadProductImage()
  const deleteMutation = useDeleteProductImage()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    let hasError = false

    // Upload sequentially to avoid swamping the backend or we can do Promise.all
    // For admin tool, sequential is fine and provides more stable error handling per file
    for (const file of Array.from(files)) {
      try {
        await uploadMutation.mutateAsync({
          productId,
          file,
          label: file.name,
        })
      } catch (err) {
        console.error("Failed to upload image:", err)
        hasError = true
      }
    }

    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    if (hasError) {
      toast.error("Some images failed to upload. Check the console for details.")
    } else {
      toast.success(`${files.length} image(s) uploaded successfully.`)
    }
  }

  const handleDelete = (imageId: string) => {
    if (!confirm("Are you sure you want to delete this reference image?")) return

    deleteMutation.mutate(
      { imageId, productId },
      {
        onSuccess: () => {
          toast.success("Image deleted successfully.")
        },
        onError: () => {
          toast.error("Failed to delete image.")
        },
      }
    )
  }

  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Reference Studio Images</h3>
          <p className="text-sm text-muted-foreground">
            Upload images of this product to be used as reference by the AI generation engine.
          </p>
        </div>
        <div>
          <input
            type="file"
            multiple
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <UploadCloud className="size-4 mr-2" />
            )}
            Upload Images
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          <Loader2 className="size-6 animate-spin mr-2" />
          Loading images...
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md bg-muted/30">
          <ImageIcon className="size-8 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">No reference images uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square rounded-md overflow-hidden border bg-muted"
            >
              <Image
                src={img.url}
                alt={img.label}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                unoptimized // Useful if images come from external buckets without Next.js optimization configured
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="size-7"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(img.id)
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="text-xs text-white truncate px-1" title={img.label}>
                  {img.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
