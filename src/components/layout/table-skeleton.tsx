import { Skeleton } from '@/components/ui/skeleton'

type TableSkeletonProps = {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="w-full space-y-2" aria-hidden="true">
      {/* Header row */}
      <div className="flex gap-4 px-4 py-3 border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton
              key={j}
              className="h-4 flex-1"
              style={{ opacity: 1 - i * 0.1 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
