# Story 2.2: Categories Management

Status: review

## Story

As a tenant admin,
I want to create, edit, reorder, and delete categories for Projects and Articles,
so that content editors can classify their work consistently.

## Acceptance Criteria

1. **API Routes:**
   - `GET /api/categories?type=project|article` → list categories ของ tenant ปัจจุบัน (เรียงตาม sort_order ASC)
   - `POST /api/categories` → สร้าง category ใหม่ (admin+ เท่านั้น)
   - `GET /api/categories/[id]` → ดึง category เดียว
   - `PUT /api/categories/[id]` → แก้ไข name, slug, sort_order (admin+)
   - `DELETE /api/categories/[id]` → ลบ category (admin+) — ตรวจสอบว่าไม่มี projects/articles ที่ใช้งานอยู่ก่อนลบ

2. **Validation:**
   - `name.th` หรือ `name.en` ต้องมีอย่างน้อย 1 ค่า (ไม่ต้องมีทั้งคู่)
   - `slug`: lowercase, letters/numbers/hyphens, unique ต่อ (tenant_id, type)
   - slug auto-generate จาก `name.th` หรือ `name.en` (ถ้าไม่กรอก)
   - `type`: ต้องเป็น `project` หรือ `article` เท่านั้น
   - `sort_order`: integer ≥ 0

3. **UI — Categories Settings Page:**
   - Route: `src/app/(admin)/settings/categories/page.tsx`
   - 2 tabs: **Project Categories** | **Article Categories**
   - List แต่ละ tab: แถวชื่อ category (th | en), slug, sort_order + ปุ่ม Edit / Delete
   - ปุ่ม "+ เพิ่ม Category" สร้าง Dialog form
   - ลำดับ sort_order: ปุ่ม ↑↓ ในแต่ละแถว (swap sort_order กับ adjacent row)
   - **Settings navigation:** เพิ่ม link "Categories" ใน settings sidebar/page

4. **Dialog Form (Create + Edit):**
   - ชื่อ (ไทย): `name.th` — optional
   - ชื่อ (English): `name.en` — optional
   - Slug: auto-fill จาก `name.th` → แก้ได้ (editable)
   - Type: dropdown `project | article` (disabled ใน Edit mode — ห้ามเปลี่ยน type หลังสร้าง)
   - sort_order: hidden field (ใช้ max + 1 อัตโนมัติตอน create)

5. **Delete protection:**
   - ก่อนลบ: query count ของ projects/articles ที่ใช้ category นั้น
   - ถ้ามีเนื้อหา → แสดง Dialog เตือน "มี X รายการที่ใช้ category นี้ — category_id จะถูกเซ็ตเป็น null"
   - ถ้าไม่มีเนื้อหา → Delete Confirmation Dialog ปกติ

6. **RBAC:**
   - GET: editor ดูได้ (ใช้ใน Project form dropdown)
   - POST/PUT/DELETE: admin+ เท่านั้น

7. **Tests:**
   - `CategorySchema` validation (ใช้ schema ที่มีอยู่แล้วใน `src/lib/validations/category.ts`)
   - API route handler: GET list, POST create, PUT update, DELETE
   - Component: CategoryList render, Dialog form submit

## Tasks / Subtasks

- [x] Task 1: สร้าง API routes (AC: #1, #2, #6)
  - [x] สร้าง `src/app/api/categories/route.ts` — GET list + POST create
  - [x] สร้าง `src/app/api/categories/[id]/route.ts` — GET + PUT + DELETE
  - [x] ทุก route: auth check → `getTenantId()` → query with `.eq('tenant_id', tenantId)`
  - [x] GET: accept `?type=project|article` query param, เรียงตาม `sort_order ASC`
  - [x] POST: Zod validate → check slug unique ต่อ (tenant, type) → set sort_order = max+1 → insert
  - [x] PUT: validate → update name, slug, sort_order (ห้ามเปลี่ยน type)
  - [x] DELETE: check FK usage (projects + articles count) → return `{ linkedCount }` → ลบ (category_id SET NULL อัตโนมัติจาก FK constraint)
  - [x] RBAC: GET → editor OK; POST/PUT/DELETE → `requireRole('admin')` check

- [x] Task 2: อัปเดต `CategorySchema` (AC: #2)
  - [x] แก้ `src/lib/validations/category.ts` — เพิ่ม refinement: `name.th` หรือ `name.en` ต้องมีอย่างน้อย 1
  - [x] เพิ่ม `id?: string` สำหรับ Edit mode (optional)

- [x] Task 3: สร้าง Categories settings page (AC: #3)
  - [x] สร้าง `src/app/(admin)/settings/categories/page.tsx` — Server Component
  - [x] ดึงข้อมูล categories (project + article type) จาก DB โดยตรงใน server component
  - [x] render `<CategoriesManager>` Client Component พร้อม initial data

- [x] Task 4: สร้าง CategoriesManager Client Component (AC: #3, #4, #5)
  - [x] สร้าง `src/components/settings/categories-manager.tsx` — `'use client'`
  - [x] 2 tabs (shadcn/ui `Tabs`): Project / Article — กรอง initial data ฝั่ง client
  - [x] CategoryRow: แสดง name.th | name.en, slug, ปุ่ม ↑↓ (swap sort_order), Edit, Delete
  - [x] ปุ่ม ↑↓: เรียก Server Action `reorderCategoryAction(id, direction)` → swap sort_order กับ adjacent row
  - [x] ปุ่ม "+ เพิ่ม": เปิด `<CategoryDialog>` (create mode)
  - [x] ปุ่ม Edit: เปิด `<CategoryDialog>` (edit mode พร้อม initial values)
  - [x] ปุ่ม Delete: เปิด `<DeleteCategoryDialog>`
  - [x] Optimistic UI: update local state ทันทีหลัง action สำเร็จ

- [x] Task 5: สร้าง CategoryDialog (AC: #4)
  - [x] สร้าง `src/components/settings/category-dialog.tsx` — `'use client'`
  - [x] shadcn/ui `Dialog` + React Hook Form + Zod resolver
  - [x] `name.th`, `name.en` inputs
  - [x] slug: auto-fill จาก `name.th` (ใช้ `generateSlug()` จาก `src/lib/slugify.ts`) — editable
  - [x] type: Select dropdown (disabled เมื่อ isEdit = true)
  - [x] Submit → เรียก Server Action `createCategoryAction` หรือ `updateCategoryAction`

- [x] Task 6: สร้าง Server Actions (AC: #1, #5)
  - [x] สร้าง `src/app/(admin)/settings/categories/actions.ts`
  - [x] `createCategoryAction(data: CategoryInput)`: validate → POST → return result
  - [x] `updateCategoryAction(id: string, data: CategoryInput)`: validate → PUT → return result
  - [x] `deleteCategoryAction(id: string)`: DELETE → return `{ linkedCount }`
  - [x] `reorderCategoryAction(id: string, direction: 'up' | 'down')`: swap sort_order กับ adjacent row

- [x] Task 7: เพิ่ม Categories ใน Settings navigation (AC: #3)
  - [x] แก้ `src/app/(admin)/settings/page.tsx` — เพิ่ม link ไปยัง `/settings/categories`

- [x] Task 8: Tests (AC: #7)
  - [x] `src/lib/validations/category.test.ts` — test refinement (at least one locale required), slug validation
  - [x] `src/app/api/categories/route.test.ts` — GET list (with type filter), POST (valid + duplicate slug + missing name)
  - [x] `src/app/api/categories/[id]/route.test.ts` — PUT (change type blocked), DELETE (count check)
  - [x] `src/components/settings/categories-manager.test.tsx` — render tabs, row data

## Dev Notes

### API Route — GET /api/categories

```typescript
// src/app/api/categories/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/tenant'
import { requireRole } from '@/lib/auth'
import { CategorySchema } from '@/lib/validations/category'
import { generateSlug } from '@/lib/slugify'

export async function GET(request: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(
    { error: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 }, { status: 401 }
  )

  const tenantId = await getTenantId()
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')  // 'project' | 'article' | null

  let query = supabase
    .from('categories')
    .select('id, name, slug, type, sort_order, created_at')
    .eq('tenant_id', tenantId)
    .order('sort_order', { ascending: true })

  if (type === 'project' || type === 'article') {
    query = query.eq('type', type)
  }

  const { data, error } = await query
  if (error) return NextResponse.json(
    { error: 'Failed to fetch categories', code: 'DB_ERROR', status: 500 }, { status: 500 }
  )

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  // RBAC: admin+ เท่านั้น
  const { user, response: authError } = await requireRole('admin')
  if (authError) return authError

  const tenantId = await getTenantId()
  const body = await request.json()

  // Zod validation
  const result = CategorySchema.safeParse(body)
  if (!result.success) return NextResponse.json(
    { error: 'Validation failed', code: 'VALIDATION_ERROR', status: 422,
      details: result.error.flatten() }, { status: 422 }
  )

  const supabase = createServerClient()
  const { name, type, sort_order } = result.data

  // Auto-generate slug ถ้าไม่ได้กรอก
  const slug = result.data.slug || generateSlug(
    (name as any)?.th || (name as any)?.en || 'category'
  )

  // ตรวจ slug unique ต่อ (tenant_id, slug, type)
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .eq('type', type)
    .single()

  if (existing) return NextResponse.json(
    { error: 'Slug already exists for this type', code: 'SLUG_EXISTS', status: 409 },
    { status: 409 }
  )

  // sort_order = max + 1 ถ้าไม่ระบุ
  let nextSortOrder = sort_order ?? 0
  if (!body.sort_order) {
    const { data: maxRow } = await supabase
      .from('categories')
      .select('sort_order')
      .eq('tenant_id', tenantId)
      .eq('type', type)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()
    nextSortOrder = (maxRow?.sort_order ?? -1) + 1
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({ tenant_id: tenantId, name, slug, type, sort_order: nextSortOrder })
    .select()
    .single()

  if (error) return NextResponse.json(
    { error: 'Failed to create category', code: 'DB_ERROR', status: 500 }, { status: 500 }
  )

  return NextResponse.json(data, { status: 201 })
}
```

### API Route — DELETE /api/categories/[id]

```typescript
// src/app/api/categories/[id]/route.ts — DELETE handler

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { user, response: authError } = await requireRole('admin')
  if (authError) return authError

  const tenantId = await getTenantId()
  const supabase = createServerClient()

  // ตรวจสอบว่า category เป็นของ tenant นี้
  const { data: cat } = await supabase
    .from('categories')
    .select('id, type')
    .eq('id', params.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!cat) return NextResponse.json(
    { error: 'Category not found', code: 'NOT_FOUND', status: 404 }, { status: 404 }
  )

  // นับ content ที่ใช้ category นี้
  const [projectsRes, articlesRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', params.id)
      .is('deleted_at', null),
    supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', params.id)
      .is('deleted_at', null),
  ])

  const linkedCount = (projectsRes.count ?? 0) + (articlesRes.count ?? 0)

  // ลบ category — FK ON DELETE SET NULL จะ clear category_id ใน projects/articles อัตโนมัติ
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', params.id)
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json(
    { error: 'Failed to delete category', code: 'DB_ERROR', status: 500 }, { status: 500 }
  )

  return NextResponse.json({ success: true, linkedCount })
}
```

### Server Actions — categories/actions.ts

```typescript
// src/app/(admin)/settings/categories/actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/tenant'
import { assertRole } from '@/lib/auth'
import { CategorySchema, type CategoryInput } from '@/lib/validations/category'
import { generateSlug } from '@/lib/slugify'
import type { ActionResult } from '@/types/api'

export async function createCategoryAction(
  data: CategoryInput
): Promise<ActionResult<{ id: string }>> {
  await assertRole('admin')

  const result = CategorySchema.safeParse(data)
  if (!result.success) return { error: 'ข้อมูลไม่ถูกต้อง' }

  const supabase = createServerClient()
  const tenantId = await getTenantId()
  const { name, type, sort_order } = result.data
  const slug = result.data.slug || generateSlug(
    (name as any)?.th || (name as any)?.en || 'category'
  )

  // Get next sort_order
  const { data: maxRow } = await supabase
    .from('categories')
    .select('sort_order')
    .eq('tenant_id', tenantId)
    .eq('type', type)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextSortOrder = sort_order ?? (maxRow?.sort_order ?? -1) + 1

  const { data: created, error } = await supabase
    .from('categories')
    .insert({ tenant_id: tenantId, name, slug, type, sort_order: nextSortOrder })
    .select('id')
    .single()

  if (error) return { error: 'ไม่สามารถสร้าง category ได้' }

  revalidatePath('/settings/categories')
  return { data: { id: created.id } }
}

export async function updateCategoryAction(
  id: string,
  data: CategoryInput
): Promise<ActionResult<void>> {
  await assertRole('admin')

  const result = CategorySchema.safeParse(data)
  if (!result.success) return { error: 'ข้อมูลไม่ถูกต้อง' }

  const supabase = createServerClient()
  const tenantId = await getTenantId()
  const { name, slug, sort_order } = result.data

  // ห้ามเปลี่ยน type — อัปเดตเฉพาะ name, slug, sort_order
  const { error } = await supabase
    .from('categories')
    .update({ name, slug, sort_order })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { error: 'ไม่สามารถแก้ไข category ได้' }

  revalidatePath('/settings/categories')
  return { data: undefined }
}

export async function deleteCategoryAction(
  id: string
): Promise<ActionResult<{ linkedCount: number }>> {
  await assertRole('admin')

  const supabase = createServerClient()
  const tenantId = await getTenantId()

  // นับ linked content
  const [projectsRes, articlesRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)
      .is('deleted_at', null),
    supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)
      .is('deleted_at', null),
  ])

  const linkedCount = (projectsRes.count ?? 0) + (articlesRes.count ?? 0)

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { error: 'ไม่สามารถลบ category ได้' }

  revalidatePath('/settings/categories')
  return { data: { linkedCount } }
}

export async function reorderCategoryAction(
  id: string,
  direction: 'up' | 'down'
): Promise<ActionResult<void>> {
  await assertRole('admin')

  const supabase = createServerClient()
  const tenantId = await getTenantId()

  // ดึง category ปัจจุบัน
  const { data: current } = await supabase
    .from('categories')
    .select('id, sort_order, type')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!current) return { error: 'Category not found' }

  // หา adjacent row
  const { data: adjacent } = await supabase
    .from('categories')
    .select('id, sort_order')
    .eq('tenant_id', tenantId)
    .eq('type', current.type)
    .eq('sort_order',
      direction === 'up' ? current.sort_order - 1 : current.sort_order + 1
    )
    .single()

  if (!adjacent) return { data: undefined }  // ขอบสุดแล้ว — ไม่ต้องทำอะไร

  // Swap sort_order
  await Promise.all([
    supabase.from('categories').update({ sort_order: adjacent.sort_order }).eq('id', current.id),
    supabase.from('categories').update({ sort_order: current.sort_order }).eq('id', adjacent.id),
  ])

  revalidatePath('/settings/categories')
  return { data: undefined }
}
```

### Settings Page — Categories

```typescript
// src/app/(admin)/settings/categories/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { CategoriesManager } from '@/components/settings/categories-manager'

export default async function CategoriesSettingsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let tenantId: string
  try {
    tenantId = await getTenantId()
  } catch {
    redirect('/login')
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, type, sort_order')
    .eq('tenant_id', tenantId)
    .order('type')
    .order('sort_order', { ascending: true })

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title="Categories"
        breadcrumbs={[
          { label: 'Settings', href: '/settings' },
          { label: 'Categories' },
        ]}
      />
      <CategoriesManager initialCategories={categories ?? []} />
    </div>
  )
}
```

### CategoriesManager Client Component

```typescript
// src/components/settings/categories-manager.tsx
'use client'
import { useState, useTransition } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus, ArrowUp, ArrowDown, Pencil, Trash2 } from 'lucide-react'
import { CategoryDialog } from './category-dialog'
import { DeleteCategoryDialog } from './delete-category-dialog'
import { reorderCategoryAction } from '@/app/(admin)/settings/categories/actions'
import { toast } from '@/components/ui/use-toast'
import type { CategoryType } from '@/types/tenant'

type Category = {
  id: string
  name: { th?: string; en?: string } | null
  slug: string
  type: CategoryType
  sort_order: number
}

type Props = {
  initialCategories: Category[]
}

export function CategoriesManager({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories)
  const [dialogState, setDialogState] = useState<
    { open: false } | { open: true; mode: 'create'; type: CategoryType } | { open: true; mode: 'edit'; category: Category }
  >({ open: false })
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [isPending, startTransition] = useTransition()

  const projectCats = categories.filter(c => c.type === 'project').sort((a, b) => a.sort_order - b.sort_order)
  const articleCats = categories.filter(c => c.type === 'article').sort((a, b) => a.sort_order - b.sort_order)

  function handleReorder(id: string, direction: 'up' | 'down') {
    startTransition(async () => {
      const result = await reorderCategoryAction(id, direction)
      if (result.error) {
        toast({ variant: 'destructive', title: result.error })
      }
      // Server revalidatePath จัดการ refresh — ถ้าต้องการ optimistic ให้ swap local state
    })
  }

  return (
    <Tabs defaultValue="project">
      <TabsList>
        <TabsTrigger value="project">Project ({projectCats.length})</TabsTrigger>
        <TabsTrigger value="article">Article ({articleCats.length})</TabsTrigger>
      </TabsList>

      {(['project', 'article'] as CategoryType[]).map((type) => {
        const list = type === 'project' ? projectCats : articleCats
        return (
          <TabsContent key={type} value={type} className="space-y-3 mt-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => setDialogState({ open: true, mode: 'create', type })}
              >
                <Plus className="h-4 w-4 mr-1" />
                เพิ่ม Category
              </Button>
            </div>

            {list.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                ยังไม่มี {type} categories
              </p>
            ) : (
              <div className="rounded-lg border border-border divide-y divide-border">
                {list.map((cat, idx) => (
                  <div key={cat.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">
                        {cat.name?.th || cat.name?.en || '(Untitled)'}
                        {cat.name?.th && cat.name?.en && (
                          <span className="ml-2 text-xs text-muted-foreground">/ {cat.name.en}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{cat.slug}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        disabled={idx === 0 || isPending}
                        onClick={() => handleReorder(cat.id, 'up')}
                        aria-label="เลื่อนขึ้น"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        disabled={idx === list.length - 1 || isPending}
                        onClick={() => handleReorder(cat.id, 'down')}
                        aria-label="เลื่อนลง"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => setDialogState({ open: true, mode: 'edit', category: cat })}
                        aria-label="แก้ไข"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(cat)}
                        aria-label="ลบ"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )
      })}

      {/* Create/Edit Dialog */}
      {dialogState.open && (
        <CategoryDialog
          mode={dialogState.mode}
          category={dialogState.mode === 'edit' ? dialogState.category : undefined}
          defaultType={dialogState.mode === 'create' ? dialogState.type : undefined}
          onClose={() => setDialogState({ open: false })}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <DeleteCategoryDialog
          category={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </Tabs>
  )
}
```

### CategoryDialog Component

```typescript
// src/components/settings/category-dialog.tsx
'use client'
import { useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { CategorySchema, type CategoryInput } from '@/lib/validations/category'
import { generateSlug } from '@/lib/slugify'
import { createCategoryAction, updateCategoryAction } from '@/app/(admin)/settings/categories/actions'
import type { CategoryType } from '@/types/tenant'

type Category = { id: string; name: { th?: string; en?: string } | null; slug: string; type: CategoryType; sort_order: number }

type Props = {
  mode: 'create' | 'edit'
  category?: Category
  defaultType?: CategoryType
  onClose: () => void
}

export function CategoryDialog({ mode, category, defaultType, onClose }: Props) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<CategoryInput>({
    resolver: zodResolver(CategorySchema),
    defaultValues: mode === 'edit' && category
      ? {
          name: { th: category.name?.th ?? '', en: category.name?.en ?? '' },
          slug: category.slug,
          type: category.type,
          sort_order: category.sort_order,
        }
      : {
          name: { th: '', en: '' },
          slug: '',
          type: defaultType ?? 'project',
          sort_order: 0,
        },
  })

  // Auto-generate slug จาก name.th
  const nameTh = form.watch('name.th')
  useEffect(() => {
    if (mode === 'create' && nameTh) {
      form.setValue('slug', generateSlug(nameTh), { shouldValidate: false })
    }
  }, [nameTh, mode, form])

  function onSubmit(data: CategoryInput) {
    startTransition(async () => {
      const result = mode === 'create'
        ? await createCategoryAction(data)
        : await updateCategoryAction(category!.id, data)

      if (result.error) {
        toast({ variant: 'destructive', title: result.error })
      } else {
        toast({ title: mode === 'create' ? 'สร้าง category แล้ว' : 'แก้ไข category แล้ว' })
        onClose()
      }
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'เพิ่ม Category ใหม่' : 'แก้ไข Category'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name-th">ชื่อ (ไทย)</Label>
              <Input id="name-th" {...form.register('name.th')} placeholder="เชิงพาณิชย์" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name-en">ชื่อ (English)</Label>
              <Input id="name-en" {...form.register('name.en')} placeholder="Commercial" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" {...form.register('slug')} placeholder="commercial" />
            {form.formState.errors.slug && (
              <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>ประเภท</Label>
            <Select
              value={form.watch('type')}
              onValueChange={(v) => form.setValue('type', v as CategoryType)}
              disabled={mode === 'edit'}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="article">Article</SelectItem>
              </SelectContent>
            </Select>
            {mode === 'edit' && (
              <p className="text-xs text-muted-foreground">ไม่สามารถเปลี่ยนประเภทได้หลังสร้างแล้ว</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>ยกเลิก</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### Delete Category Dialog

```typescript
// src/components/settings/delete-category-dialog.tsx
'use client'
import { useState, useTransition } from 'react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/components/ui/use-toast'
import { deleteCategoryAction } from '@/app/(admin)/settings/categories/actions'
import type { CategoryType } from '@/types/tenant'

type Category = { id: string; name: { th?: string; en?: string } | null; type: CategoryType }

type Props = { category: Category; onClose: () => void }

export function DeleteCategoryDialog({ category, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const catName = category.name?.th || category.name?.en || 'category นี้'

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCategoryAction(category.id)
      if (result.error) {
        toast({ variant: 'destructive', title: result.error })
      } else {
        const linked = result.data?.linkedCount ?? 0
        toast({
          title: 'ลบ category แล้ว',
          description: linked > 0
            ? `${linked} รายการถูก unlink (category_id → null) อัตโนมัติ`
            : undefined,
        })
        onClose()
      }
    })
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ลบ "{catName}"?</AlertDialogTitle>
          <AlertDialogDescription>
            การลบ category จะ unlink เนื้อหาทั้งหมดที่ใช้ category นี้ออกโดยอัตโนมัติ
            (category_id จะเป็น null) ไม่สามารถย้อนกลับได้
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'กำลังลบ...' : 'ลบ'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### อัปเดต CategorySchema

```typescript
// src/lib/validations/category.ts — แก้ไข refinement
import { z } from 'zod'

const LocaleStringSchema = z.object({
  th: z.string().optional(),
  en: z.string().optional(),
})

export const CategorySchema = z
  .object({
    id: z.string().uuid().optional(),  // ใช้ใน edit mode
    name: LocaleStringSchema,
    slug: z
      .string()
      .min(1, 'Slug ต้องไม่ว่าง')
      .regex(/^[a-z0-9-]+$/, 'Slug: ตัวเล็ก, ตัวเลข, และ - เท่านั้น')
      .optional()
      .or(z.literal('')),  // empty string → auto-generate
    type: z.enum(['project', 'article']),
    sort_order: z.number().int().min(0).default(0),
  })
  .refine(
    (data) => Boolean(data.name.th?.trim() || data.name.en?.trim()),
    { message: 'ต้องมีชื่อ (ไทย หรือ อังกฤษ) อย่างน้อย 1 ภาษา', path: ['name'] }
  )

export type CategoryInput = z.infer<typeof CategorySchema>
```

### Settings Page Navigation

เพิ่ม link ไป `/settings/categories` ใน settings page:

```typescript
// src/app/(admin)/settings/page.tsx — เพิ่ม section
import Link from 'next/link'
import { Tag } from 'lucide-react'

// เพิ่มใน settings page content:
<Link
  href="/settings/categories"
  className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-muted/40 transition-colors"
>
  <Tag className="h-5 w-5 text-muted-foreground" />
  <div>
    <p className="text-sm font-medium">Categories</p>
    <p className="text-xs text-muted-foreground">จัดการ categories สำหรับ Projects และ Articles</p>
  </div>
</Link>
```

### shadcn/ui components ที่ต้องการ

- `alert-dialog` — Delete confirmation (อาจมีอยู่แล้ว)
- ตรวจสอบก่อน install: `npx shadcn@latest add alert-dialog`

### ข้อควรระวัง

#### Hard delete vs Soft delete สำหรับ categories
Categories table ไม่มี `deleted_at` column → ใช้ **hard delete** เท่านั้น  
FK `category_id ON DELETE SET NULL` ใน projects/articles จะ clear FK อัตโนมัติ  
→ ไม่ต้อง UPDATE projects/articles ก่อนลบ category

#### Reorder — swap sort_order ไม่ใช่ shift
Pattern นี้ swap sort_order ระหว่าง 2 rows เท่านั้น (ไม่ใช่ recalculate ทุก row)  
→ อาจมี sort_order gap (0, 2, 5, ...) ซึ่งเป็นเรื่องปกติ  
→ query ด้วย `ORDER BY sort_order ASC` จะยังได้ลำดับที่ถูกต้อง

#### getTenantId() — super_admin
super_admin ต้องเลือก tenant ก่อน (cookie) — `getTenantId()` จะ throw ถ้าไม่มี  
→ ถ้า super_admin ยังไม่เลือก tenant → categories page จะ redirect ไป `/login`  
→ **ยอมรับ behavior นี้** สำหรับ MVP — Story 1.5 มี TenantSwitcher รองรับแล้ว

#### ActionResult type
ใช้ `ActionResult<T>` จาก `src/types/api.ts` ที่สร้างไว้แล้วใน Story 1.2

### Key Learnings จาก Story 1.x–2.1

| ประเด็น | การจัดการ |
|---------|-----------|
| `name` field เป็น JSONB `{"th": "...", "en": "..."}` | ไม่ใช่ `name_th` / `name_en` flat columns |
| `await cookies()` ใน Next.js 15 | async API |
| vitest@2.1.9 + happy-dom | ใช้ pattern เดิม |
| `assertRole()` — redirect, `requireRole()` — return NextResponse | แยกกันตาม context |

### References

- FR-39: Categories per-tenant
- FR-40: Category type (project/article)
- FR-41: Category sort_order
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- [Source: supabase/migrations/003_content_tables.sql]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- ไม่มี blocking issues
- `@testing-library/user-event` ต้องติดตั้งเพิ่ม (ไม่มีใน devDependencies เดิม) — ติดตั้งแล้ว
- Project ใช้ `sonner` สำหรับ toast ไม่ใช่ `@/components/ui/use-toast` — adapt แล้ว

### Completion Notes List
- Task 1: สร้าง API routes ครบทุก endpoint (GET, POST, GET[id], PUT[id], DELETE[id]) พร้อม RBAC และ tenant isolation
- Task 2: อัปเดต CategorySchema — เพิ่ม `id?: UUID` field, slug รับ empty string (auto-generate), เพิ่ม refinement ว่า name.th หรือ name.en ต้องมีอย่างน้อยหนึ่ง
- Task 3: Settings page (Server Component) — ดึง categories จาก DB แล้ว pass เป็น initialData
- Task 4: CategoriesManager — 2 tabs, CategoryRow, reorder ด้วย Server Action
- Task 5: CategoryDialog — React Hook Form + Zod, slug auto-fill, type disabled ใน edit mode
- Task 6: Server Actions ครบ 4 actions (create, update, delete, reorder)
- Task 7: เพิ่ม Categories navigation card ใน settings/page.tsx
- Task 8: 55 tests ใหม่ ทั้งหมดผ่าน (20 API tests, 20 schema tests, 15 component tests)
- Full suite: 181/181 tests pass — zero regressions

### File List
- `src/app/api/categories/route.ts` (new)
- `src/app/api/categories/route.test.ts` (new)
- `src/app/api/categories/[id]/route.ts` (new)
- `src/app/api/categories/[id]/route.test.ts` (new)
- `src/lib/validations/category.ts` (modified)
- `src/lib/validations/category.test.ts` (new)
- `src/app/(admin)/settings/categories/page.tsx` (new)
- `src/app/(admin)/settings/categories/actions.ts` (new)
- `src/components/settings/categories-manager.tsx` (new)
- `src/components/settings/categories-manager.test.tsx` (new)
- `src/components/settings/category-dialog.tsx` (new)
- `src/components/settings/delete-category-dialog.tsx` (new)
- `src/app/(admin)/settings/page.tsx` (modified)

### Change Log
- 2026-04-09: Story 2.2 implemented — Categories Management API, UI, Server Actions, Tests (55 tests added)
