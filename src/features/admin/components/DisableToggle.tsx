"use client"

import { useState } from "react"

import { ConfirmDialog } from "@/components/shared"
import { Button } from "@/components/ui/button"

interface DisableToggleProps {
  disabled: boolean
  onToggle: () => void
  entityLabel?: string
}

export function DisableToggle({
  disabled,
  onToggle,
  entityLabel = "this item",
}: DisableToggleProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleClick() {
    setConfirmOpen(true)
  }

  function handleConfirm() {
    setConfirmOpen(false)
    onToggle()
  }

  function handleCancel() {
    setConfirmOpen(false)
  }

  return (
    <>
      <Button
        variant={disabled ? "outline" : "destructive"}
        size="sm"
        onClick={handleClick}
      >
        {disabled ? "Enable" : "Disable"}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        title={disabled ? `Enable ${entityLabel}?` : `Disable ${entityLabel}?`}
        description={
          disabled
            ? "This will make the item active again."
            : "This will hide the item from users."
        }
        confirmLabel={disabled ? "Enable" : "Disable"}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  )
}
