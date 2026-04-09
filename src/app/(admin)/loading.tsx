import { TableSkeleton } from '@/components/layout/table-skeleton'

export default function AdminLoading() {
  return (
    <div className="px-8 pt-8 pb-4">
      {/* Page header skeleton */}
      <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
      {/* Content skeleton */}
      <TableSkeleton rows={8} columns={4} />
    </div>
  )
}
