"use client"

import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

interface RegenerateDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function RegenerateDialog({ open, onConfirm, onCancel }: RegenerateDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Regenerate image"
      description="A new image will be created using the same prompt. The original stays in the grid."
      confirmLabel="Regenerate"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
