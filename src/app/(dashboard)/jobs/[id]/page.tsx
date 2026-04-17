import { PageHeader } from "@/components/shared"

interface JobPageProps {
  params: Promise<{ id: string }>
}

export default async function JobPage({ params }: JobPageProps) {
  const { id } = await params

  return (
    <div className="p-6">
      <PageHeader title={`Job ${id}`} description="Review generated images." />
    </div>
  )
}
