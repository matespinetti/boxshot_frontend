import { Suspense } from "react"
import { PageHeader } from "@/components/shared"
import { GenerationPanel } from "@/features/generation/components/GenerationPanel"

export default function GeneratePage() {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Generate"
        description="Select options and generate product images."
      />
      <Suspense>
        <GenerationPanel />
      </Suspense>
    </div>
  )
}
