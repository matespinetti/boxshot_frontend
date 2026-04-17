"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSearchParams, useRouter } from "next/navigation"
import {
  useQueryStates,
  parseAsString,
  parseAsArrayOf,
  parseAsInteger,
} from "nuqs"
import { z } from "zod"
import { toast } from "sonner"
import {
  CreateJobRequestSchema,
} from "@/features/generation/schemas/generation.schema"
import { previewPrompts } from "@/features/generation/api/previewPrompts"
import { createJob } from "@/features/generation/api/createJob"
import type { PreviewResponse } from "@/features/generation/types"

// Use input type so RHF field types match what the user enters (variations optional)
type FormValues = z.input<typeof CreateJobRequestSchema>

export function useGenerationForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(CreateJobRequestSchema) as any,
    mode: "onSubmit",
    defaultValues: {
      product_id: searchParams.get("product_id") ?? "",
      colour_id: searchParams.get("colour_id") ?? "",
      country_ids:
        searchParams.get("country_ids")?.split(",").filter(Boolean) ?? [],
      shot_type_ids:
        searchParams.get("shot_type_ids")?.split(",").filter(Boolean) ?? [],
      variations: Number(searchParams.get("variations")) || 1,
      product_image_ids:
        searchParams.get("product_image_ids")?.split(",").filter(Boolean) ?? [],
    },
  })

  const [, setParams] = useQueryStates(
    {
      product_id: parseAsString.withDefault(""),
      colour_id: parseAsString.withDefault(""),
      country_ids: parseAsArrayOf(parseAsString).withDefault([]),
      shot_type_ids: parseAsArrayOf(parseAsString).withDefault([]),
      variations: parseAsInteger.withDefault(1),
      product_image_ids: parseAsArrayOf(parseAsString).withDefault([]),
    },
    { history: "replace" },
  )

  const values = form.watch()

  useEffect(() => {
    void setParams({
      product_id: values.product_id ?? "",
      colour_id: values.colour_id ?? "",
      country_ids: values.country_ids ?? [],
      shot_type_ids: values.shot_type_ids ?? [],
      variations: values.variations ?? 1,
      product_image_ids: values.product_image_ids ?? [],
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)])

  const prevProductId = useRef(values.product_id)
  useEffect(() => {
    if (prevProductId.current && prevProductId.current !== values.product_id) {
      form.setValue("colour_id", "")
      form.setValue("product_image_ids", [])
    }
    prevProductId.current = values.product_id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.product_id])

  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const totalImages =
    (values.country_ids?.length ?? 0) *
    (values.shot_type_ids?.length ?? 0) *
    (values.variations || 1)

  const handlePreview = async (data: FormValues) => {
    setIsPreviewing(true)
    try {
      const preview = await previewPrompts({
        product_id: data.product_id,
        colour_id: data.colour_id,
        country_ids: data.country_ids,
        shot_type_ids: data.shot_type_ids,
        ...(data.prompt_template_id != null
          ? { prompt_template_id: data.prompt_template_id }
          : {}),
      })
      setPreviewData(preview)
    } catch {
      toast.error("Failed to preview prompts")
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleConfirm = async () => {
    const data = form.getValues()
    setIsCreating(true)
    try {
      const job = await createJob({
        product_id: data.product_id,
        colour_id: data.colour_id,
        country_ids: data.country_ids,
        shot_type_ids: data.shot_type_ids,
        variations: data.variations ?? 1,
        ...(data.prompt_template_id != null
          ? { prompt_template_id: data.prompt_template_id }
          : {}),
        ...(data.product_image_ids?.length
          ? { product_image_ids: data.product_image_ids }
          : {}),
      })
      router.push(`/jobs/${job.id}`)
    } catch {
      toast.error("Failed to create job")
      setIsCreating(false)
    }
  }

  const handleCloseModal = () => setPreviewData(null)

  return {
    form,
    totalImages,
    previewData,
    isPreviewing,
    isCreating,
    onSubmit: form.handleSubmit(handlePreview),
    handleConfirm,
    handleCloseModal,
  }
}
