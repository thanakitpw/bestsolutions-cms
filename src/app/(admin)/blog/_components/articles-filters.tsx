'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { getLocaleValue } from '@/lib/i18n'

type Category = { id: string; name: { th?: string; en?: string } }

export function ArticlesFilters({
  categories,
  currentSearch,
  currentCategoryId,
  currentStatus,
}: {
  categories: Category[]
  currentSearch: string
  currentCategoryId: string
  currentStatus: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`?${params.toString()}`)
  }

  function handleSearch(value: string) {
    setSearch(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updateParam('search', value), 500)
  }

  const statuses = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="ค้นหาชื่อหรือ slug..."
        className="max-w-[240px]"
      />
      <div className="flex items-center gap-1">
        <button
          onClick={() => updateParam('category_id', 'all')}
          className={cn(
            'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
            currentCategoryId === 'all'
              ? 'border-foreground bg-foreground text-background'
              : 'border-border bg-background text-muted-foreground hover:border-muted-foreground'
          )}
        >
          ทั้งหมด
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => updateParam('category_id', cat.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
              currentCategoryId === cat.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:border-muted-foreground'
            )}
          >
            {getLocaleValue(cat.name, 'th') || getLocaleValue(cat.name, 'en')}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => updateParam('status', s.value)}
            className={cn(
              'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
              currentStatus === s.value
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/50'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
