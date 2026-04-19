"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ImageFilters } from "@/features/jobs/hooks/useImageFilters"
import type { JobImage } from "@/features/jobs/types"

interface GridFiltersProps {
  images: JobImage[]
  filters: ImageFilters
  onFiltersChange: (next: Partial<ImageFilters>) => void
}

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Generating", value: "generating" },
  { label: "Complete", value: "complete" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Failed", value: "failed" },
] as const

export function GridFilters({
  images,
  filters,
  onFiltersChange,
}: GridFiltersProps) {
  const countryOptions = Array.from(
    new Map(images.map((image) => [image.country_id, image.country_name])).entries(),
  )
  const shotTypeOptions = Array.from(
    new Map(
      images.map((image) => [image.shot_type_id, image.shot_type_name]),
    ).entries(),
  )
  const hasActiveFilters =
    filters.status !== "all" || filters.country_id !== "" || filters.shot_type_id !== ""
  const selectedCountryName =
    countryOptions.find(([id]) => id === filters.country_id)?.[1] ?? undefined
  const selectedShotTypeName =
    shotTypeOptions.find(([id]) => id === filters.shot_type_id)?.[1] ?? undefined

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            size="sm"
            variant={filters.status === filter.value ? "default" : "outline"}
            onClick={() => onFiltersChange({ status: filter.value })}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <Select
          value={filters.country_id || "all-countries"}
          onValueChange={(value) =>
            onFiltersChange({
              country_id:
                value && value !== "all-countries" ? value : "",
            })
          }
        >
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="All countries">
              {filters.country_id ? selectedCountryName : "All countries"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-countries">All countries</SelectItem>
            {countryOptions.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.shot_type_id || "all-shot-types"}
          onValueChange={(value) =>
            onFiltersChange({
              shot_type_id:
                value && value !== "all-shot-types" ? value : "",
            })
          }
        >
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="All shot types">
              {filters.shot_type_id ? selectedShotTypeName : "All shot types"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-shot-types">All shot types</SelectItem>
            {shotTypeOptions.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onFiltersChange({
                status: "all",
                country_id: "",
                shot_type_id: "",
              })
            }
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
