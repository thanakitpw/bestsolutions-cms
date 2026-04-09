import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'

type ContentItem = {
  id: string
  title_th?: string | null
  title_en?: string | null
  status: string
  created_at: string
}

type Props = {
  title: string
  items: ContentItem[]
  createHref: string
  createLabel: string
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  published: 'default',
  draft: 'secondary',
  archived: 'outline',
}

export function RecentContentList({ title, items, createHref, createLabel }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link href={createHref} className="text-xs text-muted-foreground hover:text-foreground">
          ดูทั้งหมด →
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
          <FileText className="h-8 w-8 opacity-40" />
          <p className="text-sm">ยังไม่มีเนื้อหา</p>
          <Link
            href={createHref}
            className="text-xs font-medium text-primary hover:underline mt-1"
          >
            {createLabel}
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`${createHref}/${item.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors"
              >
                <span className="text-sm truncate max-w-[60%]">
                  {item.title_th || item.title_en || 'Untitled'}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={STATUS_VARIANT[item.status] ?? 'outline'} className="text-xs capitalize">
                    {item.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
