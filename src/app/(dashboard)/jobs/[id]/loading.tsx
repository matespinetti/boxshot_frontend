export default function JobLoadingPage() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-28 animate-pulse rounded-2xl border bg-card" />
      <div className="h-24 animate-pulse rounded-2xl border bg-card" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square animate-pulse rounded-2xl border bg-card"
          />
        ))}
      </div>
    </div>
  )
}
