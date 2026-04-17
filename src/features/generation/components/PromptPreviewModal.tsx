"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { PreviewItem } from "@/features/generation/types"

interface PromptPreviewModalProps {
  open: boolean
  prompts: PreviewItem[]
  isConfirming: boolean
  onClose: () => void
  onConfirm: () => void
}

export function PromptPreviewModal({
  open,
  prompts,
  isConfirming,
  onClose,
  onConfirm,
}: PromptPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Review Prompts ({prompts.length})</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <ul className="space-y-4 p-1">
            {prompts.map((item, i) => (
              <li key={i} className="rounded border p-3">
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  {item.country_id} / {item.shot_type_id}
                </div>
                <p className="font-mono text-sm">{item.prompt}</p>
              </li>
            ))}
          </ul>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            Back
          </Button>
          <Button onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? "Generating..." : "Confirm & Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
