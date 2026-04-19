"use client"

import type { ReactNode } from "react"

import { DataTable } from "@/components/shared"
import type { ColumnDef } from "@/components/shared"

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
  entityLabel,
  extraActions,
}: AdminTableProps<T>) {
  const resolvedColumns: ColumnDef<T>[] = onToggleDisabled
    ? [
        ...columns,
        {
          key: "__actions__",
          header: "Actions",
          render: (row) => (
            <div className="flex items-center gap-2">
              {extraActions?.(row)}
              <DisableToggle
                disabled={row.disabled ?? false}
                onToggle={() => onToggleDisabled(row)}
                entityLabel={entityLabel}
              />
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
