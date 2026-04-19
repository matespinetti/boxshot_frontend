"use client"

import { Button } from "@/components/ui/button"

interface BulkActionsProps {
  selectedCount: number
  eligibleCount: number
  isSubmitting: boolean
  onSelectAll: () => void
  onClear: () => void
  onApprove: () => void
  onReject: () => void
}

export function BulkActions({
  selectedCount,
  eligibleCount,
  isSubmitting,
  onSelectAll,
  onClear,
  onApprove,
  onReject,
}: BulkActionsProps) {
  if (eligibleCount === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-muted-foreground">
        {selectedCount} selected from {eligibleCount} eligible images
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onSelectAll}>
          Select all visible
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          disabled={selectedCount === 0 || isSubmitting}
        >
          Clear
        </Button>
        <Button
          size="sm"
          onClick={onApprove}
          disabled={selectedCount === 0 || isSubmitting}
        >
          Approve selected
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onReject}
          disabled={selectedCount === 0 || isSubmitting}
        >
          Reject selected
        </Button>
      </div>
    </div>
  )
}
