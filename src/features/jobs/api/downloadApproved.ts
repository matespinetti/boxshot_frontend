import { env } from "@/lib/env"

export function downloadApproved(jobId: string): void {
  const url = `${env.NEXT_PUBLIC_API_URL}/jobs/${jobId}/download`
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = `${jobId}.zip`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}
