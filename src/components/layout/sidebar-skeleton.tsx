import { Skeleton } from '@/components/ui/skeleton'

export function SidebarSkeleton() {
  return (
    <aside
      className="w-60 h-screen bg-sidebar-bg border-r border-sidebar-border p-4 shrink-0"
      aria-hidden="true"
    >
      {/* Header */}
      <Skeleton className="h-6 w-32 mb-8 bg-white/10" />

      {/* Nav items */}
      <div className="space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full bg-white/10" />
        ))}
      </div>

      {/* User section */}
      <div className="absolute bottom-4 left-4 right-4 space-y-2">
        <Skeleton className="h-4 w-36 bg-white/10" />
        <Skeleton className="h-9 w-full bg-white/10" />
      </div>
    </aside>
  )
}
