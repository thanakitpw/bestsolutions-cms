# Story 3.1: Articles List and Create

Status: review

## Story

As a content editor,
I want to see all blog articles in a list and create a new article quickly,
so that I can manage blog content efficiently.

## Acceptance Criteria

1. **GET `/api/articles`** — list articles (tenant-scoped, paginated):
   - Auth: `requireRole('editor')`
   - Soft-delete filter: `.is('deleted_at', null)`
   - Query params: `search` (title th/en + slug), `category_id` (UUID | 'all'), `status` ('all' | 'draft' | 'published' | 'archived'), `page` (default 1), `limit` (default 12, max 50)
   - Join categories: `.select('id, title, slug, excerpt, status, cover_image, created_at, published_at, category:categories(id, name)')`
   - Order: `published_at DESC NULLS LAST, created_at DESC`
   - Returns: `{ data: ArticleListItem[], total: number, page, limit, totalPages }`

2. **POST `/api/articles`** — create article:
   - Auth: `requireRole('editor')`
   - Body: `{ title: { th?, en? }, slug: string, category_id?: UUID | null }`
   - Validate with `ArticleCreateSchema`
   - Slug unique ภายใน tenant (`.is('deleted_at', null)`)
   - Slug conflict → 409 + `SLUG_CONFLICT`
   - Insert: `status: 'draft'`, `tenant_id`
   - Returns: created article row (201)

3. **Blog List Page** (`src/app/(admin)/blog/page.tsx`):
   - เขียนใหม่เป็น **Server Component** (ลบ `'use client'` เดิม)
   - `assertRole('editor')` + `getTenantId()` (catch → แสดง message เหมือน projects page)
   - อ่าน `searchParams` → fetch articles + categories (type='article') in parallel
   - Table rows: Title, Category, Published date, Status, "Edit" link → `/blog/[id]`
   - Pagination: `<Link>` components (URL-based)

4. **ArticlesFilters** (`src/app/(admin)/blog/_components/articles-filters.tsx`):
   - Client Component — เหมือน `ProjectsFilters` แต่สำหรับ articles
   - Props: `categories[]`, `currentSearch`, `currentCategoryId`, `currentStatus`
   - Search input (debounce 500ms), category tabs, status filter

5. **NewArticleDialog** (`src/app/(admin)/blog/_components/new-article-dialog.tsx`):
   - Client Component
   - Fields: Title (TH/EN tabs), Slug (auto-gen จาก EN), Category (optional)
   - Submit → POST `/api/articles` → redirect to `/blog/[newId]`
   - Error: slug ซ้ำ → toast (sonner)

6. **Stub `src/app/(admin)/blog/[id]/page.tsx`**:
   - เขียนทับเป็น placeholder Server Component
   - ลบ import เดิมที่อาจ compile error
   - Story 3.2 จะ implement เต็ม

7. **เพิ่ม `ArticleCreateSchema`** ใน `src/lib/validations/article.ts`:
   - เหมือน `ProjectCreateSchema` แต่สำหรับ article
   - Export `ArticleCreateInput` type

8. **Tests:**
   - `src/app/api/articles/route.test.ts` — GET (list, filters, soft-delete), POST (success, slug conflict, validation)
   - `new-article-dialog.test.tsx` — render, slug auto-gen, submit

## Tasks / Subtasks

- [x] Task 1: เพิ่ม `ArticleCreateSchema` ใน `validations/article.ts` (AC: #7)
  - [x] เพิ่ม `ArticleCreateSchema` ต่อจาก `ArticleSchema` เดิม
  - [x] export `ArticleCreateInput` type

- [x] Task 2: Rewrite `GET /api/articles` + `POST /api/articles` (AC: #1, #2)
  - [x] เปิด `src/app/api/articles/route.ts` — เขียนใหม่ทั้งหมด
  - [x] GET: `requireRole` → `getTenantId` → query + join + filters + pagination
  - [x] GET: JSONB search ใช้ `.or('slug.ilike.%search%,title->>th.ilike.%search%,title->>en.ilike.%search%')`
  - [x] GET: order `published_at DESC NULLS LAST, created_at DESC`
  - [x] POST: validate `ArticleCreateSchema` → slug unique check → insert
  - [x] สร้าง `src/app/api/articles/route.test.ts`

- [x] Task 3: สร้าง `_components/` sub-components (AC: #4, #5)
  - [x] สร้าง `src/app/(admin)/blog/_components/articles-filters.tsx`
  - [x] สร้าง `src/app/(admin)/blog/_components/new-article-dialog.tsx`
  - [x] สร้าง test: `new-article-dialog.test.tsx`

- [x] Task 4: Rewrite `blog/page.tsx` เป็น Server Component (AC: #3)
  - [x] ลบ `'use client'`
  - [x] fetch articles + categories (type='article') parallel
  - [x] Table rows + pagination ด้วย Link

- [x] Task 5: Stub `blog/[id]/page.tsx` (AC: #6)
  - [x] เขียนทับด้วย placeholder — ลบ imports เก่า

## Dev Notes

### ArticleCreateSchema

```typescript
// เพิ่มใน src/lib/validations/article.ts

export const ArticleCreateSchema = z.object({
  title: z
    .object({
      th: z.string().optional(),
      en: z.string().optional(),
    })
    .refine(
      (d) => (d.th ?? '').trim().length > 0 || (d.en ?? '').trim().length > 0,
      { message: 'กรุณากรอกชื่อบทความอย่างน้อย 1 ภาษา' }
    ),
  slug: z
    .string()
    .min(1, 'กรุณากรอก slug')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug ต้องเป็นตัวเล็ก ตัวเลข และขีดกลางเท่านั้น'),
  category_id: z.string().uuid().nullable().optional(),
})

export type ArticleCreateInput = z.infer<typeof ArticleCreateSchema>
```

### GET + POST `/api/articles` — Full Implementation

> **Pattern เหมือน Story 2.6 (`/api/projects`) ทุกอย่าง** — copy + แก้ชื่อ table + field:

```typescript
// src/app/api/articles/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { getTenantId } from '@/lib/tenant'
import { ArticleCreateSchema } from '@/lib/validations/article'

export async function GET(request: NextRequest) {
  const { response } = await requireRole('editor')
  if (response) return response

  let tenantId: string
  try { tenantId = await getTenantId() }
  catch {
    return NextResponse.json({ error: 'No tenant selected', code: 'TENANT_NOT_SELECTED' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.trim() ?? ''
  const categoryId = searchParams.get('category_id') ?? 'all'
  const status = searchParams.get('status') ?? 'all'
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = Math.min(Number(searchParams.get('limit') ?? 12), 50)
  const offset = (page - 1) * limit

  const supabase = createServerClient()

  let query = supabase
    .from('articles')
    .select(
      'id, title, slug, excerpt, status, cover_image, created_at, published_at, category:categories(id, name)',
      { count: 'exact' }
    )
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(
      `slug.ilike.%${search}%,title->>th.ilike.%${search}%,title->>en.ilike.%${search}%`
    )
  }
  if (categoryId !== 'all') query = query.eq('category_id', categoryId)
  if (status !== 'all') query = query.eq('status', status)

  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch articles', code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}

export async function POST(request: NextRequest) {
  const { response } = await requireRole('editor')
  if (response) return response

  let tenantId: string
  try { tenantId = await getTenantId() }
  catch {
    return NextResponse.json({ error: 'No tenant selected', code: 'TENANT_NOT_SELECTED' }, { status: 400 })
  }

  const body = await request.json()
  const parsed = ArticleCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { title, slug, category_id } = parsed.data
  const supabase = createServerClient()

  // Slug uniqueness check
  const { data: existing } = await supabase
    .from('articles')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Slug already exists', code: 'SLUG_CONFLICT' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('articles')
    .insert({
      tenant_id: tenantId,
      title,
      slug,
      category_id: category_id ?? null,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create article', code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

### Blog List Page — Server Component

```typescript
// src/app/(admin)/blog/page.tsx
import Link from 'next/link'
import { assertRole } from '@/lib/auth'
import { getTenantId } from '@/lib/tenant'
import { createServerClient } from '@/lib/supabase/server'
import { getLocaleValue } from '@/lib/i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArticlesFilters } from './_components/articles-filters'
import { NewArticleDialog } from './_components/new-article-dialog'

type SearchParams = Promise<{
  search?: string
  category_id?: string
  status?: string
  page?: string
}>

export default async function BlogListPage({ searchParams }: { searchParams: SearchParams }) {
  await assertRole('editor')

  let tenantId: string
  try {
    tenantId = await getTenantId()
  } catch {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <p className="text-sm">กรุณาเลือก tenant ก่อนเข้าถึงหน้า Blog</p>
        <Link href="/" className="text-sm text-primary underline underline-offset-2">
          กลับไปหน้า Dashboard
        </Link>
      </div>
    )
  }

  const params = await searchParams
  const search = params.search ?? ''
  const categoryId = params.category_id ?? 'all'
  const status = params.status ?? 'all'
  const page = Math.max(1, Number(params.page ?? 1))
  const limit = 12

  const supabase = createServerClient()

  const [categoriesResult, articlesResult] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('type', 'article')
      .order('sort_order', { ascending: true }),

    // NOTE: apply filters before .range() ใน implementation จริง
    supabase
      .from('articles')
      .select(
        'id, title, slug, status, cover_image, created_at, published_at, category:categories(id, name)',
        { count: 'exact' }
      )
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1),
  ])

  const categories = categoriesResult.data ?? []
  const articles = articlesResult.data ?? []
  const total = articlesResult.count ?? 0
  const totalPages = Math.ceil(total / limit)

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const statusBadgeVariant = (s: string) => {
    if (s === 'published') return 'default' as const
    if (s === 'archived') return 'secondary' as const
    return 'outline' as const
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Articles</h1>
          <p className="text-sm text-muted-foreground">
            จัดการบทความทั้งหมด {total > 0 && `(${total} รายการ)`}
          </p>
        </div>
        <NewArticleDialog categories={categories} />
      </div>

      {/* Filters */}
      <ArticlesFilters
        categories={categories}
        currentSearch={search}
        currentCategoryId={categoryId}
        currentStatus={status}
      />

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="grid grid-cols-[1fr_160px_110px_100px_80px] gap-3 border-b border-border bg-muted/40 px-4 py-2.5">
          {['ชื่อบทความ', 'หมวดหมู่', 'วันที่เผยแพร่', 'สถานะ', ''].map((h) => (
            <span key={h} className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {h}
            </span>
          ))}
        </div>

        {articles.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {search || categoryId !== 'all' || status !== 'all'
              ? 'ไม่พบบทความที่ตรงกับการค้นหา'
              : 'ยังไม่มีบทความ กด "New Article" เพื่อสร้างบทความแรก'}
          </div>
        ) : (
          articles.map((article) => {
            const title =
              getLocaleValue(article.title as Record<string, string>, 'th') ||
              getLocaleValue(article.title as Record<string, string>, 'en') ||
              '(ไม่มีชื่อ)'
            const categoryName = article.category
              ? getLocaleValue((article.category as { name: Record<string, string> }).name, 'th') ||
                getLocaleValue((article.category as { name: Record<string, string> }).name, 'en')
              : null

            return (
              <div
                key={article.id}
                className="grid grid-cols-[1fr_160px_110px_100px_80px] gap-3 items-center border-b border-border/50 px-4 py-3 transition-colors last:border-0 hover:bg-muted/30"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="truncate text-sm font-medium">{title}</span>
                  <span className="truncate text-xs text-muted-foreground">{article.slug}</span>
                </div>
                <span className="text-sm text-muted-foreground truncate">
                  {categoryName ?? <span className="text-muted-foreground/50">—</span>}
                </span>
                <span className="text-xs text-muted-foreground">{formatDate(article.published_at)}</span>
                <Badge variant={statusBadgeVariant(article.status)} className="w-fit text-[10px]">
                  {article.status}
                </Badge>
                <Link
                  href={`/blog/${article.id}`}
                  className="text-xs text-primary hover:underline underline-offset-2"
                >
                  Edit
                </Link>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            หน้า {page} จาก {totalPages} ({total} รายการ)
          </span>
          <div className="flex gap-1">
            {page > 1 && (
              <Link href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}>
                <Button variant="outline" size="sm">← ก่อนหน้า</Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}>
                <Button variant="outline" size="sm">ถัดไป →</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

> **หมายเหตุ:** ใส่ search/category/status filter conditions ก่อน `.range()` ใน query จริง — pattern เหมือนกับ Story 2.6

### ArticlesFilters — Client Component

> **Pattern เหมือน `ProjectsFilters` ทุกอย่าง** — copy + แก้ชื่อ param + route:

```typescript
// src/app/(admin)/blog/_components/articles-filters.tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { getLocaleValue } from '@/lib/i18n'

type Category = { id: string; name: { th?: string; en?: string } }

export function ArticlesFilters({ categories, currentSearch, currentCategoryId, currentStatus }: {
  categories: Category[]
  currentSearch: string
  currentCategoryId: string
  currentStatus: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

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
              currentStatus === s.value ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

### NewArticleDialog — Client Component

> **Pattern เหมือน `NewProjectDialog` ทุกอย่าง** — copy + แก้ endpoint + route:

```typescript
// src/app/(admin)/blog/_components/new-article-dialog.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'
import { getLocaleValue } from '@/lib/i18n'

type Category = { id: string; name: { th?: string; en?: string } }

function generateSlug(text: string): string {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function NewArticleDialog({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [titleLocale, setTitleLocale] = useState<'th' | 'en'>('th')
  const [titleTh, setTitleTh] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [categoryId, setCategoryId] = useState('')

  function handleTitleChange(locale: 'th' | 'en', value: string) {
    if (locale === 'th') { setTitleTh(value) }
    else {
      setTitleEn(value)
      if (!slugEdited) setSlug(generateSlug(value))
    }
  }

  function reset() {
    setTitleTh(''); setTitleEn(''); setSlug('');
    setSlugEdited(false); setCategoryId(''); setTitleLocale('th')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titleTh.trim() && !titleEn.trim()) {
      toast.error('กรุณากรอกชื่อบทความอย่างน้อย 1 ภาษา')
      return
    }
    if (!slug.trim()) { toast.error('กรุณากรอก slug'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: { th: titleTh || undefined, en: titleEn || undefined },
          slug,
          category_id: categoryId || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        if (data.code === 'SLUG_CONFLICT') toast.error('Slug นี้ถูกใช้ไปแล้ว กรุณาเปลี่ยน slug')
        else toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
        return
      }
      const article = await res.json()
      toast.success('สร้างบทความสำเร็จ')
      setOpen(false); reset()
      router.push(`/blog/${article.id}`)
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        New Article
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); setOpen(v) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>สร้างบทความใหม่</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">ชื่อบทความ</Label>
              <Tabs value={titleLocale} onValueChange={(v) => setTitleLocale(v as 'th' | 'en')}>
                <TabsList className="mb-2">
                  <TabsTrigger value="th">ภาษาไทย</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                </TabsList>
              </Tabs>
              {titleLocale === 'th' ? (
                <Input value={titleTh} onChange={(e) => handleTitleChange('th', e.target.value)} placeholder="ชื่อบทความภาษาไทย" autoFocus />
              ) : (
                <Input value={titleEn} onChange={(e) => handleTitleChange('en', e.target.value)} placeholder="Article title in English" autoFocus />
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">URL Slug</Label>
              <Input
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugEdited(true) }}
                placeholder="article-title"
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">ตัวเล็ก ตัวเลข และขีดกลางเท่านั้น</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">หมวดหมู่ (optional)</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่..." /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {getLocaleValue(cat.name, 'th') || getLocaleValue(cat.name, 'en')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { reset(); setOpen(false) }}>ยกเลิก</Button>
              <Button type="submit" disabled={loading}>{loading ? 'กำลังสร้าง...' : 'สร้างบทความ'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

### Stub `blog/[id]/page.tsx`

```typescript
// src/app/(admin)/blog/[id]/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { assertRole } from '@/lib/auth'

export default async function ArticleEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await assertRole('editor')
  const { id } = await params

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
      <p className="text-sm">Article Editor กำลังพัฒนา...</p>
      <p className="text-xs font-mono text-muted-foreground/60">ID: {id}</p>
      <Link href="/blog">
        <Button variant="outline" size="sm">← กลับไปรายการบทความ</Button>
      </Link>
    </div>
  )
}
```

### ข้อควรระวัง

#### 1. Categories type = `'article'` เสมอ
```typescript
// ❌ ผิด — ดึงทุก type
supabase.from('categories').select('id, name').eq('tenant_id', tenantId)

// ✅ ถูก — เฉพาะ article categories
supabase.from('categories').select('id, name').eq('tenant_id', tenantId).eq('type', 'article')
```

#### 2. Order บน articles — 2 columns
Articles ต้องการ published_at ก่อน created_at:
```typescript
.order('published_at', { ascending: false, nullsFirst: false })
.order('created_at', { ascending: false })
```
Supabase รองรับ chained `.order()` — ไม่ต้องใช้ raw SQL

#### 3. `excerpt` ≠ `description`
Articles ใช้ field `excerpt` (JSONB) ไม่ใช่ `description` เหมือน projects  
→ ในการ select: `id, title, slug, excerpt, status, ...`

#### 4. Route: `/blog/[id]` ไม่ใช่ `/articles/[id]`
Page route ใช้ `/blog` ตาม Next.js folder structure  
API route ใช้ `/api/articles` ตาม resource naming

#### 5. `supabaseAdmin` deprecated — ห้ามใช้
Route เดิมใช้ `import { supabaseAdmin } from '@/lib/supabase/admin'` — **ต้องเขียนใหม่**  
ใช้ `createServerClient()` สำหรับ DB queries (RLS-aware)

#### 6. `articles` table ไม่มี `location`, `area_sqm`, `year`
Articles simpler กว่า Projects — ไม่มี metadata เหล่านั้น  
→ `insert` payload: `tenant_id, title, slug, category_id, status` เท่านั้น

#### 7. Pattern เดียวกับ Story 2.6 ทุกอย่าง
ถ้าติดปัญหา URL params, searchParams await, debounce — ดู Story 2.6 dev notes ได้เลย

### Key Learnings จาก Story 2.6

| ประเด็น | การจัดการ |
|---------|-----------|
| `searchParams` ต้อง await | `const params = await searchParams` ก่อนใช้ |
| Filter ใส่ก่อน `.range()` | query chain: filter → order → range |
| `_components/` folder | Next.js ignore route สำหรับ folder ที่ขึ้น `_` |
| debounce ใน Client Component | ใช้ `useRef` + `clearTimeout` (ไม่ return cleanup ใน handler) |
| `getLocaleValue` + JSONB cast | `article.title as Record<string, string>` ก่อนส่ง |
| categories type filter | `.eq('type', 'article')` เสมอ |

### References

- FR-05: Articles (Blog) list and management
- FR-06: Create article with title + slug + category
- Story 2.1: `articles` table schema (JSONB fields, soft delete, RLS)
- Story 2.2: `categories` table (type: 'article')
- Story 2.6: Projects list — pattern เดียวกันทั้งหมด
- [Source: src/app/(admin)/blog/page.tsx] (เดิม — เขียนทับ)
- [Source: src/app/(admin)/blog/[id]/page.tsx] (เดิม — stub)
- [Source: src/app/api/articles/route.ts] (เดิม — เขียนทับ)
- [Source: src/lib/validations/article.ts] (เพิ่ม ArticleCreateSchema)

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
ไม่มี — implementation ตรงไปตรงมา ไม่ต้องแก้ bug ระหว่างทาง

### Completion Notes List
- Task 1: เพิ่ม `ArticleCreateSchema` + `ArticleCreateInput` ใน `article.ts` — pattern เดียวกับ `ProjectCreateSchema`
- Task 2: Rewrite `route.ts` ทั้งหมด ลบ `supabaseAdmin` deprecated → ใช้ `createServerClient()`, เพิ่ม `requireRole`, `getTenantId`, soft-delete filter, JSONB search, dual-order; สร้าง 16 unit tests ผ่านทั้งหมด
- Task 3: สร้าง `ArticlesFilters` (Client Component, debounce 500ms, category tabs + status filter) และ `NewArticleDialog` (Client Component, auto-gen slug จาก EN title, slug conflict toast); สร้าง 9 unit tests ผ่านทั้งหมด
- Task 4: Rewrite `blog/page.tsx` เป็น Server Component — ลบ `'use client'`, fetch categories (type='article') + articles ใน `Promise.all`, ใส่ search/category/status filter ก่อน `.range()`, pagination ด้วย `<Link>`
- Task 5: Stub `blog/[id]/page.tsx` — ลบ imports เก่าทั้งหมด, เขียนเป็น placeholder Server Component พร้อม `assertRole('editor')`
- Full regression suite: **330/330 tests pass**

### File List

**Rewritten:**
- `src/app/(admin)/blog/page.tsx` (Server Component)
- `src/app/(admin)/blog/[id]/page.tsx` (Stub)
- `src/app/api/articles/route.ts` (rewrite)

**Updated:**
- `src/lib/validations/article.ts` (เพิ่ม ArticleCreateSchema + ArticleCreateInput)

**New:**
- `src/app/(admin)/blog/_components/articles-filters.tsx`
- `src/app/(admin)/blog/_components/new-article-dialog.tsx`
- `src/app/api/articles/route.test.ts`
- `src/app/(admin)/blog/_components/new-article-dialog.test.tsx`

### Change Log
- 2026-04-11: Story 3.1 implementation complete — Articles list + create (API rewrite, Server Component page, client filters, new article dialog, stub editor page, 25 new tests)
