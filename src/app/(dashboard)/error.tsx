"use client"

import { Button } from "@/components/ui/button"

interface DashboardErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({
  error,
  reset,
}: DashboardErrorProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4">
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
