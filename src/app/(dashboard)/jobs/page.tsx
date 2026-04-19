import { PageHeader } from "@/components/shared"
import { JobsTable } from "@/features/jobs/components/JobsTable"

export default function JobsPage() {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Jobs"
        description="Track generation progress and open review workspaces."
      />
      <JobsTable />
    </div>
  )
}
