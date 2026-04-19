"use client"

import { EmptyState, PageHeader } from "@/components/shared"

interface JobErrorPageProps {
  reset: () => void
}

export default function JobErrorPage({ reset }: JobErrorPageProps) {
  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Job error" description="The review workspace could not load." />
      <EmptyState
        title="Could not load this job"
        description="Try again to reload the page."
        action={{ label: "Retry", onClick: reset }}
      />
    </div>
  )
}
