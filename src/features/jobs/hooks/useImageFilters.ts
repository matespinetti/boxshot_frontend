"use client"

import { parseAsString, useQueryStates } from "nuqs"

import type { JobImage } from "@/features/jobs/types"

export function useImageFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      status: parseAsString.withDefault("all"),
      country_id: parseAsString.withDefault(""),
      shot_type_id: parseAsString.withDefault(""),
    },
    { history: "replace" },
  )

  const filterImages = (images: JobImage[]) =>
    images.filter((image) => {
      if (filters.status !== "all" && image.status !== filters.status) {
        return false
      }

      return true
    })

  return { filters, setFilters, filterImages }
}
