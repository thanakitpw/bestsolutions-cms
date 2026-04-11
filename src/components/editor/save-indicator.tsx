import { cn } from '@/lib/utils'
import type { SaveStatus } from './use-auto-save'

type SaveIndicatorProps = {
  status: SaveStatus
  className?: string
}

const CONFIG: Record<SaveStatus, { text: string; className: string }> = {
  idle:   { text: '',               className: 'opacity-0' },
  saving: { text: '● Saving...',    className: 'text-muted-foreground' },
  saved:  { text: '✓ Saved',        className: 'text-green-600' },
  error:  { text: '⚠ Save failed',  className: 'text-destructive' },
}

export function SaveIndicator({ status, className }: SaveIndicatorProps) {
  const { text, className: statusClass } = CONFIG[status]
  return (
    <span
      className={cn(
        'text-xs transition-opacity duration-300',
        statusClass,
        className
      )}
      aria-live="polite"
    >
      {text}
    </span>
  )
}
