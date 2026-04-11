# Story 2.6: Projects List and Create

Status: review

## Story

As a content editor,
I want to see all projects in a list and create a new project quickly,
so that I can manage portfolio content efficiently.

## Acceptance Criteria

1. **GET `/api/projects`** — list projects (tenant-scoped, paginated):
   - Auth: `requireRole('editor')`
   - Soft-delete filter: `.is('deleted_at', null)`
   - Query params: `search` (title th/en + slug), `category_id` (UUID | 'all'), `status` ('all' | 'draft' | 'published' | 'archived'), `page` (default 1), `limit` (default 12, max 50)
   - Join categories: `.select('id, title, slug, status, cover_image, created_at, published_at, category:categories(id, name)')`
   - Returns: `{ data: ProjectListItem[], total: number, page, limit, totalPages }`

2. **POST `/api/projects`** — create project:
   - Auth: `requireRole('editor')`
   - Body: `{ title: { th?, en? }, slug: string, category_id?: UUID | null }`
   - Validation: title ต้องมีอย่างน้อย 1 ภาษา; slug: lowercase + ตัวเลข + ขีดกลาง
   - Slug unique ภายใน tenant: ถ้าซ้ำ → 409 + `SLUG_CONFLICT`
   - Insert: `status: 'draft'`, `tenant_id` จาก session
   - Returns: created project row (201)

3. **Projects List Page** (`src/app/(admin)/projects/page.tsx`):
   - เขียนใหม่เป็น **Server Component** (ลบ `'use client'` เดิม)
   - `assertRole('editor')` ที่ top — redirect ถ้าไม่มีสิทธิ์
   - ถ้า super_admin ไม่ได้เลือก tenant: แสดง `SelectTenantPrompt` (import จาก dashboard/component เดิม หรือสร้าง inline message)
   - อ่าน `searchParams` (URL params) — fetch projects + categories
   - ส่งข้อมูลลง Client Components: `ProjectsFilters` + `NewProjectDialog`
   - แสดง table rows inline (ไม่ต้องเป็น Client Component)
   - แต่ละ row: Title, Category, Status, Created date, "Edit" link → `/projects/[id]`
   - Pagination: `<Link>` components (URL-based)

4. **ProjectsFilters** (`src/app/(admin)/projects/_components/projects-filters.tsx`):
   - Client Component (`'use client'`)
   - Props: `categories: { id: string; name: { th?: string; en?: string } }[]`, `searchParams`
   - Search input: debounce 500ms → `router.push` เพื่ออัปเดต URL `?search=...`
   - Category tabs: "ทั้งหมด" + แต่ละ category (แสดงชื่อ TH preferred)
   - Status filter: dropdown/tabs `all | draft | published | archived`
   - เมื่อ filter เปลี่ยน → reset `page=1`

5. **NewProjectDialog** (`src/app/(admin)/projects/_components/new-project-dialog.tsx`):
   - Client Component (`'use client'`)
   - Props: `categories: { id: string; name: { th?: string; en?: string } }[]`
   - Dialog fields:
     - Title TH + Title EN tabs (Input — ไม่ใช่ Tiptap ในขั้นตอนนี้)
     - Slug (auto-generate จาก EN title, editable)
     - Category (Select — optional)
   - Submit → POST `/api/projects` → redirect to `/projects/[newId]` ด้วย `router.push`
   - Loading state บน submit button
   - Error: แสดง toast (sonner) ถ้า slug ซ้ำหรือ error อื่น

6. **Stub `src/app/(admin)/projects/[id]/page.tsx`**:
   - เขียนใหม่เป็น placeholder Server Component เพื่อป้องกัน compile error
   - แสดง: "กำลังพัฒนา Project Editor..." + ปุ่ม Back
   - ลบ import `RichTextEditor from '@/components/admin/RichTextEditor'` (ไม่มีไฟล์นี้)
   - Story 2.7 จะ implement เต็ม

7. **Tests:**
   - `src/app/api/projects/route.test.ts` — GET list (search, filter, pagination, soft-delete), POST create (success, slug conflict, validation)
   - `NewProjectDialog`: render, slug auto-gen, submit flow

## Tasks / Subtasks

- [x] Task 1: Rewrite `GET /api/projects` + `POST /api/projects` (AC: #1, #2)
  - [x] เปิด `src/app/api/projects/route.ts` — เขียนใหม่ทั้งหมด
  - [x] GET: `requireRole` → `getTenantId` → query with join + filters + pagination
  - [x] GET: JSONB search — `.or('slug.ilike.%search%,title->>th.ilike.%search%,title->>en.ilike.%search%')`
  - [x] POST: validate `ProjectCreateSchema` → check slug uniqueness → insert `status: 'draft'`
  - [x] ไม่แตะ `src/app/api/projects/[id]/route.ts` — Story 2.7 จัดการ
  - [x] สร้าง test file `src/app/api/projects/route.test.ts`

- [x] Task 2: สร้าง `_components/` folder + sub-components (AC: #4, #5)
  - [x] สร้าง `src/app/(admin)/projects/_components/projects-filters.tsx`
  - [x] สร้าง `src/app/(admin)/projects/_components/new-project-dialog.tsx`

- [x] Task 3: Rewrite `projects/page.tsx` เป็น Server Component (AC: #3)
  - [x] ลบ `'use client'` ทั้งหมด
  - [x] `assertRole('editor')` + try/catch `getTenantId()`
  - [x] Fetch projects + categories (parallel ด้วย `Promise.all`)
  - [x] Table rows inline JSX
  - [x] URL-based pagination ด้วย `<Link>`

- [x] Task 4: Stub `[id]/page.tsx` (AC: #6)
  - [x] เขียนทับ `src/app/(admin)/projects/[id]/page.tsx` ด้วย minimal placeholder
  - [x] ลบ import `RichTextEditor` ที่ทำให้ compile error

- [x] Task 5: Tests (AC: #7)
  - [x] `src/app/api/projects/route.test.ts` — ≥ 8 test cases
  - [x] `new-project-dialog.test.tsx` — render + submit

## Dev Notes

### ProjectCreateSchema (Zod)

```typescript
// สร้างใน route.ts หรือแยกไปใน src/lib/validations/project.ts
import { z } from 'zod'

const ProjectCreateSchema = z.object({
  title: z.object({
    th: z.string().optional(),
    en: z.string().optional(),
  }).refine((d) => (d.th ?? '').trim() || (d.en ?? '').trim(), {
    message: 'กรุณากรอกชื่อโปรเจกต์อย่างน้อย 1 ภาษา',
  }),
  slug: z
    .string()
    .min(1, 'กรุณากรอก slug')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug ต้องเป็นตัวเล็ก ตัวเลข และขีดกลางเท่านั้น'),
  category_id: z.string().uuid().nullable().optional(),
})
```

### GET `/api/projects` — Full Implementation

```typescript
// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { getTenantId } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  const { user, response } = await requireRole('editor')
  if (response) return response

  let tenantId: string
  try {
    tenantId = await getTenantId()
  } catch {
    return NextResponse.json(
      { error: 'No tenant selected', code: 'TENANT_NOT_SELECTED' },
      { status: 400 }
    )
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
    .from('projects')
    .select(
      'id, title, slug, status, cover_image, created_at, published_at, category:categories(id, name)',
      { count: 'exact' }
    )
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(
      `slug.ilike.%${search}%,title->>th.ilike.%${search}%,title->>en.ilike.%${search}%`
    )
  }
  if (categoryId !== 'all') {
    query = query.eq('category_id', categoryId)
  }
  if (status !== 'all') {
    query = query.eq('status', status)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch projects', code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}
```

### POST `/api/projects` — Create

```typescript
export async function POST(request: NextRequest) {
  const { user, response } = await requireRole('editor')
  if (response) return response

  let tenantId: string
  try {
    tenantId = await getTenantId()
  } catch {
    return NextResponse.json(
      { error: 'No tenant selected', code: 'TENANT_NOT_SELECTED' },
      { status: 400 }
    )
  }

  const body = await request.json()
  const parsed = ProjectCreateSchema.safeParse(body)
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
    .from('projects')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'Slug already exists', code: 'SLUG_CONFLICT' },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from('projects')
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
    return NextResponse.json({ error: 'Failed to create project', code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

### Projects List Page — Server Component

```typescript
// src/app/(admin)/projects/page.tsx
import Link from 'next/link'
import { assertRole } from '@/lib/auth'
import { getTenantId } from '@/lib/tenant'
import { createServerClient } from '@/lib/supabase/server'
import { getLocaleValue } from '@/lib/i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProjectsFilters } from './_components/projects-filters'
import { NewProjectDialog } from './_components/new-project-dialog'

type SearchParams = Promise<{
  search?: string
  category_id?: string
  status?: string
  page?: string
}>

export default async function ProjectsListPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  await assertRole('editor')

  // Try to get tenant ID
  let tenantId: string
  try {
    tenantId = await getTenantId()
  } catch {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <p className="text-sm">กรุณาเลือก tenant ก่อนเข้าถึงหน้า Projects</p>
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

  // Fetch categories + projects in parallel
  const [categoriesResult, projectsResult] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('type', 'project')
      .order('sort_order', { ascending: true }),

    supabase
      .from('projects')
      .select(
        'id, title, slug, status, cover_image, created_at, category:categories(id, name)',
        { count: 'exact' }
      )
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      // filters applied below
      .range((page - 1) * limit, page * limit - 1),
  ])

  // NOTE: filters (search/category/status) ใส่ตรงนี้ก็ได้ หรือ delegate ไป API
  // สำหรับ Server Component ตรงๆ ใส่ filter ใน query ก่อน range:
  // → ใน implementation จริงให้ใส่ filter condition ก่อน .range()

  const categories = categoriesResult.data ?? []
  const projects = projectsResult.data ?? []
  const total = projectsResult.count ?? 0
  const totalPages = Math.ceil(total / limit)

  const statusBadgeVariant = (s: string) => {
    if (s === 'published') return 'default'
    if (s === 'archived') return 'secondary'
    return 'outline'  // draft
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            จัดการผลงานทั้งหมด {total > 0 && `(${total} รายการ)`}
          </p>
        </div>
        <NewProjectDialog categories={categories} />
      </div>

      {/* Filters */}
      <ProjectsFilters
        categories={categories}
        currentSearch={search}
        currentCategoryId={categoryId}
        currentStatus={status}
      />

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_160px_100px_120px_80px] gap-3 border-b border-border bg-muted/40 px-4 py-2.5">
          {['ชื่อโปรเจกต์', 'หมวดหมู่', 'สถานะ', 'วันที่สร้าง', ''].map((h) => (
            <span key={h} className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {h}
            </span>
          ))}
        </div>

        {/* Table Body */}
        {projects.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {search || categoryId !== 'all' || status !== 'all'
              ? 'ไม่พบโปรเจกต์ที่ตรงกับการค้นหา'
              : 'ยังไม่มีโปรเจกต์ กด "New Project" เพื่อสร้างรายการแรก'}
          </div>
        ) : (
          projects.map((project) => {
            const title =
              getLocaleValue(project.title as Record<string, string>, 'th') ||
              getLocaleValue(project.title as Record<string, string>, 'en') ||
              '(ไม่มีชื่อ)'
            const categoryName = project.category
              ? getLocaleValue((project.category as { name: Record<string, string> }).name, 'th') ||
                getLocaleValue((project.category as { name: Record<string, string> }).name, 'en')
              : null
            const createdAt = new Date(project.created_at).toLocaleDateString('th-TH', {
              year: 'numeric', month: 'short', day: 'numeric',
            })

            return (
              <div
                key={project.id}
                className="grid grid-cols-[1fr_160px_100px_120px_80px] gap-3 items-center border-b border-border/50 px-4 py-3 transition-colors last:border-0 hover:bg-muted/30"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="truncate text-sm font-medium">{title}</span>
                  <span className="truncate text-xs text-muted-foreground">{project.slug}</span>
                </div>
                <span className="text-sm text-muted-foreground truncate">
                  {categoryName ?? <span className="text-muted-foreground/50">—</span>}
                </span>
                <Badge variant={statusBadgeVariant(project.status)} className="w-fit text-[10px]">
                  {project.status}
                </Badge>
                <span className="text-xs text-muted-foreground">{createdAt}</span>
                <Link
                  href={`/projects/${project.id}`}
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

> **หมายเหตุ:** การใส่ filter conditions ใน query ของ page.tsx ให้ใส่ก่อน `.range()` โดยใช้ pattern เดียวกับ `GET /api/projects` route เหนือขึ้นไป

### ProjectsFilters — Client Component

```typescript
// src/app/(admin)/projects/_components/projects-filters.tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { getLocaleValue } from '@/lib/i18n'

type Category = { id: string; name: { th?: string; en?: string } }

type ProjectsFiltersProps = {
  categories: Category[]
  currentSearch: string
  currentCategoryId: string
  currentStatus: string
}

export function ProjectsFilters({
  categories,
  currentSearch,
  currentCategoryId,
  currentStatus,
}: ProjectsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentSearch)

  // Debounce search → update URL
  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')  // reset pagination
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  // Debounce search input
  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value)
      const timer = setTimeout(() => updateParam('search', value), 500)
      return () => clearTimeout(timer)
    },
    [updateParam]
  )

  const statuses = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <Input
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="ค้นหาชื่อหรือ slug..."
        className="max-w-[240px]"
      />

      {/* Category Tabs */}
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

      {/* Status Filter */}
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
```

> **หมายเหตุ Debounce ใน useEffect:** pattern `setTimeout` ใน callback ไม่ return cleanup ได้ตรงๆ  
> ให้ใช้ `useEffect` + `useRef` แทนถ้าต้องการ cleanup ที่ถูกต้อง:
> ```typescript
> const debounceRef = useRef<ReturnType<typeof setTimeout>>()
> // ใน handler:
> clearTimeout(debounceRef.current)
> debounceRef.current = setTimeout(() => updateParam('search', value), 500)
> ```

### NewProjectDialog — Client Component

```typescript
// src/app/(admin)/projects/_components/new-project-dialog.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'
import { getLocaleValue } from '@/lib/i18n'

type Category = { id: string; name: { th?: string; en?: string } }

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function NewProjectDialog({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [titleLocale, setTitleLocale] = useState<'th' | 'en'>('th')
  const [titleTh, setTitleTh] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [categoryId, setCategoryId] = useState<string>('')

  function handleTitleChange(locale: 'th' | 'en', value: string) {
    if (locale === 'th') {
      setTitleTh(value)
    } else {
      setTitleEn(value)
      if (!slugEdited) {
        setSlug(generateSlug(value))
      }
    }
  }

  function reset() {
    setTitleTh('')
    setTitleEn('')
    setSlug('')
    setSlugEdited(false)
    setCategoryId('')
    setTitleLocale('th')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titleTh.trim() && !titleEn.trim()) {
      toast.error('กรุณากรอกชื่อโปรเจกต์อย่างน้อย 1 ภาษา')
      return
    }
    if (!slug.trim()) {
      toast.error('กรุณากรอก slug')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/projects', {
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
        if (data.code === 'SLUG_CONFLICT') {
          toast.error('Slug นี้ถูกใช้ไปแล้ว กรุณาเปลี่ยน slug')
        } else {
          toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
        }
        return
      }

      const project = await res.json()
      toast.success('สร้างโปรเจกต์สำเร็จ')
      setOpen(false)
      reset()
      router.push(`/projects/${project.id}`)
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
        New Project
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); setOpen(v) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>สร้างโปรเจกต์ใหม่</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Title — locale tabs */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                ชื่อโปรเจกต์
              </Label>
              <Tabs value={titleLocale} onValueChange={(v) => setTitleLocale(v as 'th' | 'en')}>
                <TabsList className="mb-2">
                  <TabsTrigger value="th">ภาษาไทย</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                </TabsList>
              </Tabs>
              {titleLocale === 'th' ? (
                <Input
                  value={titleTh}
                  onChange={(e) => handleTitleChange('th', e.target.value)}
                  placeholder="ชื่อโปรเจกต์ภาษาไทย"
                  autoFocus
                />
              ) : (
                <Input
                  value={titleEn}
                  onChange={(e) => handleTitleChange('en', e.target.value)}
                  placeholder="Project name in English"
                  autoFocus
                />
              )}
            </div>

            {/* Slug */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                URL Slug
              </Label>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                  setSlugEdited(true)
                }}
                placeholder="project-name"
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                ตัวเล็ก ตัวเลข และขีดกลางเท่านั้น
              </p>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                หมวดหมู่ (optional)
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวดหมู่..." />
                </SelectTrigger>
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
              <Button type="button" variant="outline" onClick={() => { reset(); setOpen(false) }}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'กำลังสร้าง...' : 'สร้างโปรเจกต์'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

### Stub `[id]/page.tsx` — Placeholder

```typescript
// src/app/(admin)/projects/[id]/page.tsx
// ← ลบ 'use client' + ลบ RichTextEditor import
// Story 2.7 จะ implement เต็ม

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { assertRole } from '@/lib/auth'

export default async function ProjectEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await assertRole('editor')
  const { id } = await params

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
      <p className="text-sm">Project Editor กำลังพัฒนา...</p>
      <p className="text-xs font-mono text-muted-foreground/60">ID: {id}</p>
      <Link href="/projects">
        <Button variant="outline" size="sm">← กลับไปรายการโปรเจกต์</Button>
      </Link>
    </div>
  )
}
```

### Tests

#### API Route Tests

```typescript
// src/app/api/projects/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from './route'
import { NextRequest } from 'next/server'

// Mock ตาม pattern ของ route.test.ts ไฟล์อื่น (2.2, 2.3)
vi.mock('@/lib/auth', () => ({
  requireRole: vi.fn().mockResolvedValue({ user: { id: 'user-1' }, response: null }),
}))
vi.mock('@/lib/tenant', () => ({
  getTenantId: vi.fn().mockResolvedValue('tenant-1'),
}))
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
    insert: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: { id: 'proj-1', slug: 'test-project', title: { th: 'ทดสอบ' }, status: 'draft' }, error: null }),
  })),
}))

describe('GET /api/projects', () => {
  it('returns project list', async () => {
    const req = new NextRequest('http://localhost/api/projects')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('total')
    expect(body).toHaveProperty('totalPages')
  })

  it('returns 400 when no tenant selected', async () => {
    const { getTenantId } = await import('@/lib/tenant')
    vi.mocked(getTenantId).mockRejectedValueOnce(new Error('SUPER_ADMIN_NO_TENANT_SELECTED'))
    const req = new NextRequest('http://localhost/api/projects')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('TENANT_NOT_SELECTED')
  })

  it('returns 401 when not authenticated', async () => {
    const { requireRole } = await import('@/lib/auth')
    vi.mocked(requireRole).mockResolvedValueOnce({
      user: null,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    } as never)
    const req = new NextRequest('http://localhost/api/projects')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})

describe('POST /api/projects', () => {
  it('creates project successfully', async () => {
    const req = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ title: { th: 'ทดสอบ' }, slug: 'test-project' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it('returns 422 when title is missing', async () => {
    const req = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ title: {}, slug: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('returns 422 when slug is invalid', async () => {
    const req = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ title: { th: 'ทดสอบ' }, slug: 'Invalid Slug!' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('returns 409 when slug conflicts', async () => {
    const supabaseModule = await import('@/lib/supabase/server')
    const mockClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing-1' }, error: null }),
    }
    vi.mocked(supabaseModule.createServerClient).mockReturnValueOnce(mockClient as never)

    const req = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ title: { th: 'ทดสอบ' }, slug: 'existing-slug' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.code).toBe('SLUG_CONFLICT')
  })
})
```

### ข้อควรระวัง

#### 1. `getLocaleValue` type — JSONB cast
`project.title` จาก Supabase return เป็น `Json` type  
ต้อง cast ก่อนใช้: `project.title as Record<string, string>` หรือ `project.title as { th?: string; en?: string }`

#### 2. Supabase JSONB Filter ใน PostgREST
JSONB text search syntax: `title->>th.ilike.*search*`  
ใน `.or()` string: `title->>th.ilike.%search%` (ใช้ `%` ใน URL — Supabase JS handles encoding)

#### 3. Categories Join ใน Projects Query
`category:categories(id, name)` — Supabase PostgREST auto-join ผ่าน FK `category_id`  
ถ้า category ถูกลบหรือเป็น null → `project.category` จะเป็น `null` (ไม่ใช่ error)

#### 4. `searchParams` เป็น Promise ใน Next.js App Router
```typescript
// ❌ Next.js 15+ — searchParams ต้อง await
const search = searchParams.search  // error

// ✅ ถูก
const params = await searchParams
const search = params.search
```

#### 5. URL Params ใน Pagination Links
ใช้ `URLSearchParams` แทน string concat:
```typescript
// ✅ ป้องกัน encoding issues
new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: '2' })
```
แต่ `params` จาก `await searchParams` เป็น object ธรรมดา ไม่ใช่ `URLSearchParams`  
→ ใช้: `new URLSearchParams({ ...params, page: String(nextPage) })`

#### 6. `_components` folder
Next.js App Router: folder ที่ขึ้นต้นด้วย `_` จะ **ไม่** ถูก treat เป็น route  
→ `_components/` เหมาะสำหรับ UI components ที่ private ต่อ route นี้

#### 7. `requireRole` return type
```typescript
const { user, response } = await requireRole('editor')
if (response) return response  // NextResponse (auth error)
// user พร้อมใช้
```

#### 8. อย่า import จาก `@/lib/supabase/admin` ใน route.ts
`createServiceRoleClient()` bypass RLS — projects API ต้องใช้ `createServerClient()` เพื่อให้ RLS ทำงาน  
(Media upload เป็นข้อยกเว้นเพราะ Supabase Storage ต้องการ service role)

#### 9. ตรวจสอบว่า `react-hook-form` ยังไม่มี
`NewProjectDialog` ใช้ `useState` จัดการ form state โดยตรง (ไม่ต้องใช้ RHF)  
Story 2.7 จะตัดสินใจว่าจะ install RHF หรือไม่

### Key Learnings จาก Story 2.1–2.5

| ประเด็น | การจัดการ |
|---------|-----------|
| `supabaseAdmin` deprecated | ใช้ `createServiceRoleClient()` หรือ `createServerClient()` |
| Old flat schema `title_th/title_en` | ใช้ JSONB `title: { th, en }` แทน |
| `/api/admin/projects` endpoint | ใช้ `/api/projects` (ไม่มี admin prefix) |
| `react-hook-form` ยังไม่ได้ install | จัดการ form state ด้วย `useState` |
| `getLocaleValue` สำหรับ JSONB | cast type ก่อน: `as Record<string, string>` |
| categories type: `project` | filter `.eq('type', 'project')` เมื่อ fetch สำหรับ projects |

### References

- FR-01: Projects list and management
- FR-02: Create project with title + slug + category
- Story 2.1: `projects` table schema (JSONB fields, soft delete, RLS)
- Story 2.2: `categories` table + API (type: 'project')
- [Source: src/app/(admin)/projects/page.tsx] (เดิม — เขียนทับ)
- [Source: src/app/(admin)/projects/[id]/page.tsx] (stub — Story 2.7 rewrite)
- [Source: src/app/api/projects/route.ts] (เดิม — เขียนทับ)
- [Source: src/lib/validations/project.ts]
- [Source: src/lib/auth.ts] (requireRole, assertRole)
- [Source: src/lib/tenant.ts] (getTenantId)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- TS error: `cover_image` ไม่มีใน DB types → แก้เป็น `cover_image_url` ทั้งใน route.ts และ page.tsx
- TS error: `status` type `string` ไม่ตรงกับ DB enum → ใช้ `validStatuses.includes()` + cast
- TS error: `useRef<T>()` ต้องใส่ initial value → `useRef<... | undefined>(undefined)`
- TS error: `Select onValueChange` รับ `string | null` → ใช้ `(v) => setCategoryId(v ?? '')`
- TS error: `getLocaleValue` cast ต้องเป็น `{ th?: string; en?: string }` ไม่ใช่ `Record<string, string>`
- `[id]/route.ts` มี pre-existing error (supabaseAdmin deprecated) — story ระบุห้ามแตะ

### Completion Notes List

- **Task 1**: เขียนใหม่ `src/app/api/projects/route.ts` ทั้งหมด ใช้ `requireRole`, `getTenantId`, `ProjectCreateSchema` (ใหม่ใน validations/project.ts), JSONB search filter, soft-delete filter, pagination; slug uniqueness check ก่อน insert
- **Task 2**: สร้าง `_components/projects-filters.tsx` (debounce ด้วย useRef pattern ที่ถูกต้อง) และ `_components/new-project-dialog.tsx` (slug auto-gen จาก EN title, toast feedback, redirect หลัง create)
- **Task 3**: เขียนใหม่ `projects/page.tsx` เป็น Server Component — `assertRole`, `getTenantId`, `Promise.all` สำหรับ parallel fetch, filter conditions ก่อน `.range()`, URL-based pagination
- **Task 4**: stub `[id]/page.tsx` ลบ `RichTextEditor` import ที่ทำให้ compile error
- **Task 5**: สร้าง `route.test.ts` (14 test cases — ครอบ GET list/filter/search/error, POST create/validation/conflict/error) และ `new-project-dialog.test.tsx` (8 test cases — render, slug auto-gen, manual slug lock, validation, submit success, conflict, generic error)

### File List

**Rewritten:**
- `src/app/(admin)/projects/page.tsx` (Server Component — rewrite)
- `src/app/(admin)/projects/[id]/page.tsx` (Stub — remove broken imports)
- `src/app/api/projects/route.ts` (rewrite — new auth + JSONB schema)

**New:**
- `src/app/(admin)/projects/_components/projects-filters.tsx`
- `src/app/(admin)/projects/_components/new-project-dialog.tsx`
- `src/app/api/projects/route.test.ts`
- `src/app/(admin)/projects/_components/new-project-dialog.test.tsx`

**Not touched:**
- `src/app/api/projects/[id]/route.ts` (Story 2.7)
- `src/lib/validations/project.ts` (Story 2.7 อาจอัปเดต)

### Change Log

- 2026-04-11: Story 2.6 implementation complete — rewrite projects API route, create _components, rewrite page to Server Component, stub [id] page, 22 new tests all passing
