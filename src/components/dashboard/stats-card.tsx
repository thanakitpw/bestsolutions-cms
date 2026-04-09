import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

type StatsCardProps = {
  label: string
  value: number | null
  icon: LucideIcon
  href: string
}

export function StatsCard({ label, value, icon: Icon, href }: StatsCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-lg border border-border bg-card p-5 hover:border-primary transition-colors"
    >
      <div className="rounded-md bg-muted p-2.5 group-hover:bg-primary/5 transition-colors">
        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
      </div>
      <div>
        <p className="text-2xl font-semibold tabular-nums">
          {value === null ? '—' : value.toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Link>
  )
}
