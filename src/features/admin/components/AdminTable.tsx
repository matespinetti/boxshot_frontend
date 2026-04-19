"use client"

import type { ReactNode } from "react"

import { DataTable } from "@/components/shared"
import type { ColumnDef } from "@/components/shared"

import { Button } from "@/components/ui/button"
import { Eye, Pencil } from "lucide-react"

import { DisableToggle } from "./DisableToggle"

type WithDisabled = { disabled?: boolean }

interface AdminTableProps<T extends WithDisabled> {
  columns: ColumnDef<T>[]
  data: T[]
  total: number
  page: number
  perPage: number
  onPageChange: (page: number) => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  sortKey?: string
  sortDir?: "asc" | "desc"
  onSortChange?: (key: string, dir: "asc" | "desc") => void
  isLoading?: boolean
  /** When provided, appends an Actions column with a DisableToggle for each row */
  onToggleDisabled?: (row: T) => void
  /** Standard action for editing a row */
  onEdit?: (row: T) => void
  /** Standard action for viewing a row */
  onView?: (row: T) => void
  entityLabel?: string
  /** Optional extra actions rendered alongside DisableToggle */
  extraActions?: (row: T) => ReactNode
}

export function AdminTable<T extends WithDisabled>({
  columns,
  data,
  total,
  page,
  perPage,
  onPageChange,
  searchValue,
  onSearchChange,
  sortKey,
  sortDir,
  onSortChange,
  isLoading,
  onToggleDisabled,
  onEdit,
  onView,
  entityLabel,
  extraActions,
}: AdminTableProps<T>) {
  const hasActions = !!onToggleDisabled || !!onEdit || !!onView || !!extraActions

  const resolvedColumns: ColumnDef<T>[] = hasActions
    ? [
        ...columns,
        {
          key: "__actions__",
          header: "Actions",
          render: (row) => (
            <div className="flex items-center gap-2">
              {onView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(row)}
                  title="View Details"
                >
                  <Eye className="size-4 mr-2" />
                  View
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(row)}
                  title="Edit"
                >
                  <Pencil className="size-4 mr-2" />
                  Edit
                </Button>
              )}
              {extraActions?.(row)}
              {onToggleDisabled && (
                <DisableToggle
                  disabled={row.disabled ?? false}
                  onToggle={() => onToggleDisabled(row)}
                  entityLabel={entityLabel}
                />
              )}
            </div>
          ),
        },
      ]
    : columns

  return (
    <DataTable<T>
      columns={resolvedColumns}
      data={data}
      total={total}
      page={page}
      perPage={perPage}
      onPageChange={onPageChange}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={onSortChange}
      isLoading={isLoading}
    />
  )
}
