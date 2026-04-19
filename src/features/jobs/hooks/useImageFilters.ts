"use client"

import { parseAsString, useQueryStates } from "nuqs"

import type { JobImage } from "@/features/jobs/types"

export interface ImageFilters {
  status: string
  country_id: string
  shot_type_id: string
}

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

      if (filters.country_id && image.country_id !== filters.country_id) {
        return false
      }

      if (filters.shot_type_id && image.shot_type_id !== filters.shot_type_id) {
        return false
      }

      return true
    })

  return { filters, setFilters, filterImages }
}
