import { JobResultsView } from "@/features/jobs/components/JobResultsView"

interface JobPageProps {
  params: Promise<{ id: string }>
}

export default async function JobPage({ params }: JobPageProps) {
  const { id } = await params

  return (
    <div className="p-6">
      <JobResultsView jobId={id} />
    </div>
  )
}
