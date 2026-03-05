export default function ProcesosLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-8 w-56 rounded bg-muted" />
          <div className="mt-2 h-4 w-24 rounded bg-muted" />
        </div>
        <div className="h-10 w-36 rounded bg-muted" />
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex gap-3">
        <div className="h-10 w-64 rounded bg-muted" />
        <div className="h-10 w-44 rounded bg-muted" />
        <div className="h-10 w-52 rounded bg-muted" />
        <div className="h-10 w-48 rounded bg-muted" />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white">
        <div className="border-b px-4 py-3">
          <div className="flex gap-8">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-4 w-24 rounded bg-muted" />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b px-4 py-4">
            <div className="flex gap-8">
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} className="h-4 w-24 rounded bg-muted" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
