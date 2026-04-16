export enum ImageStatus {
  Pending = "pending",
  Generating = "generating",
  Complete = "complete",
  Failed = "failed",
  Approved = "approved",
  Rejected = "rejected",
}

export enum JobStatus {
  Idle = "idle",
  Generating = "generating",
  Complete = "complete",
  Failed = "failed",
}

export const STATUS_LABELS: Record<string, string> = {
  [ImageStatus.Pending]: "Pending",
  [ImageStatus.Generating]: "Generating",
  [ImageStatus.Complete]: "Complete",
  [ImageStatus.Failed]: "Failed",
  [ImageStatus.Approved]: "Approved",
  [ImageStatus.Rejected]: "Rejected",
  [JobStatus.Idle]: "Idle",
}

export const STATUS_COLORS: Record<string, string> = {
  [ImageStatus.Pending]: "bg-gray-100 text-gray-700",
  [ImageStatus.Generating]: "bg-blue-100 text-blue-700",
  [ImageStatus.Complete]: "bg-green-100 text-green-800",
  [ImageStatus.Failed]: "bg-red-100 text-red-700",
  [ImageStatus.Approved]: "bg-emerald-100 text-emerald-800",
  [ImageStatus.Rejected]: "bg-zinc-100 text-zinc-500",
  [JobStatus.Idle]: "bg-gray-100 text-gray-700",
}
