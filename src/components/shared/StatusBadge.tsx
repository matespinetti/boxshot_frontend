import { Badge } from "@/components/ui/badge"
import {
  STATUS_COLORS,
  STATUS_LABELS,
  type ImageStatus,
  type JobStatus,
} from "@/constants/status"
import { cn } from "@/lib/utils/cn"

interface StatusBadgeProps {
  status: ImageStatus | JobStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700"
  const label = STATUS_LABELS[status] ?? status

  return <Badge className={cn(colorClass)}>{label}</Badge>
}
