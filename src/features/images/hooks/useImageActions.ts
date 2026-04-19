"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { Job } from "@/schemas/jobs"
import { updateImageStatus } from "@/features/images/api/updateImageStatus"
import { regenerateImage } from "@/features/images/api/regenerateImage"
import { imageQueryKeys } from "@/features/images/queryKeys"

export function useImageActions(jobId: string) {
  const queryClient = useQueryClient()
  const queryKey = imageQueryKeys.jobDetail(jobId)

  const statusMutation = useMutation({
    mutationFn: ({
      imageId,
      status,
    }: {
      imageId: string
      status: "approved" | "rejected"
    }) => updateImageStatus(imageId, status),

    onMutate: async ({ imageId, status }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Job>(queryKey)
      queryClient.setQueryData<Job>(queryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          images: old.images.map((img) =>
            img.id === imageId ? { ...img, status } : img,
          ),
        }
      })
      return { previous }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
      toast.error("Failed to update image status.")
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const regenMutation = useMutation({
    mutationFn: ({ imageId }: { imageId: string }) => regenerateImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
    onError: () => {
      toast.error("Failed to regenerate image.")
    },
  })

  return {
    approve: (imageId: string) =>
      statusMutation.mutateAsync({ imageId, status: "approved" }),
    reject: (imageId: string) =>
      statusMutation.mutateAsync({ imageId, status: "rejected" }),
    regenerate: (imageId: string) =>
      regenMutation.mutateAsync({ imageId }),
    isUpdating: (imageId: string) =>
      statusMutation.isPending &&
      statusMutation.variables?.imageId === imageId,
    isRegenerating: (imageId: string) =>
      regenMutation.isPending &&
      regenMutation.variables?.imageId === imageId,
  }
}
