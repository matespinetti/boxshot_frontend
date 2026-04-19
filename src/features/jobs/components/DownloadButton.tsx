"use client"

import { Button } from "@/components/ui/button"

interface DownloadButtonProps {
  disabled?: boolean
  onClick: () => void
}

export function DownloadButton({
  disabled = false,
  onClick,
}: DownloadButtonProps) {
  return (
    <Button disabled={disabled} onClick={onClick}>
      Download ZIP
    </Button>
  )
}
