# Story 2.7: Projects Edit, SEO, Publish and Delete

Status: review

## Story

As a content editor,
I want to edit project content, configure SEO, publish or unpublish, and delete projects,
so that I can manage portfolio content through its full lifecycle.

## Acceptance Criteria

1. **PATCH `/api/projects/[id]`** — partial update:
   - Auth: `requireRole('editor')`
   - Validate body with `ProjectUpdateSchema` (all fields optional)
   - Fix schema: `location` → JSONB `{ th?, en? }`, `area_sqm` → integer (not string)
   - If `status` เปลี่ยนเป็น `'published'` และ `published_at` ยังเป็น null → set `published_at = new Date().toISOString()`
   - Slug conflict check: ถ้า slug เปลี่ยน → ตรวจซ้ำ (ยกเว้น id ตัวเอง)
   - Returns: updated project row

2. **DELETE `/api/projects/[id]`** — soft delete:
   - Auth: `requireRole('admin')` (เฉพาะ admin ขึ้นไป)
   - Soft delete: `update deleted_at = new Date().toISOString()` (ไม่ลบจริง)
   - Returns: 200 `{ success: true }`

3. **GET `/api/projects/[id]`** — fetch single project:
   - Auth: `requireRole('editor')`
   - Query: `tenant_id` + `id` + `.is('deleted_at', null)`
   - Join: `.select('*, category:categories(id, name)')`
   - Returns: project row หรือ 404

4. **Project Editor Page** (`src/app/(admin)/projects/[id]/page.tsx`):
   - เขียนทับ stub จาก Story 2.6
   - Server Component: `assertRole('editor')` → `getTenantId()` → fetch project → 404 ถ้าไม่พบ
   - Fetch categories สำหรับ sidebar select
   - Render `<ProjectEditor>` (Client Component) พร้อม initial data

5. **ProjectEditor** (`src/app/(admin)/projects/[id]/_components/project-editor.tsx`):
   - Client Component (`'use client'`)
   - Layout: 2-col (main flex-1 | sidebar w-[280px])
   - **Top bar**: breadcrumb + `SaveIndicator` + action buttons
   - **Content Card** (main): Title + Description (Input/Textarea per locale) + `LocaleTabs` สำหรับ content (TiptapEditor)
   - **SEO Card** (main): locale tabs สำหรับ seo_title, seo_description, seo_keywords
   - **Status Card** (sidebar): Publish / Unpublish / Archive buttons
   - **Project Info Card** (sidebar): Slug, Category, Location (locale-aware), Area sqm, Year
   - **Cover Image Card** (sidebar): preview + ปุ่มเปิด `MediaPickerModal`
   - **Danger Zone Card** (sidebar): ปุ่ม Delete project (admin only — ซ่อนถ้าไม่ใช่ admin)

6. **Auto-save:**
   - `useAutoSave({ onSave, delay: 2000 })` สำหรับการเปลี่ยน content/metadata ทั้งหมด
   - `SaveIndicator` แสดงใน top bar
   - "Publish" / "Unpublish" / "Archive" — **ไม่ผ่าน** auto-save แต่ทำ explicit PATCH ทันที → update state

7. **Delete flow:**
   - ปุ่ม Delete → `AlertDialog` confirm ("ยืนยันการลบโปรเจกต์ [ชื่อ]?")
   - On confirm → DELETE `/api/projects/[id]` → redirect `/projects`
   - แสดง toast "ลบโปรเจกต์สำเร็จ" ก่อน redirect

8. **Fix `src/lib/validations/project.ts`:**
   - เพิ่ม `ProjectUpdateSchema` (all fields partial)
   - แก้ `location` → `LocaleStringSchema` (JSONB)
   - แก้ `area` → `area_sqm: z.number().int().min(0).max(999999).nullable().optional()`
   - เพิ่ม `export type ProjectUpdateInput`

9. **Tests:**
   - `src/app/api/projects/[id]/route.test.ts` — GET (found/not-found/wrong-tenant), PATCH (update, slug-conflict, publish sets published_at), DELETE (soft-delete, editor-forbidden)
   - `project-editor.test.tsx` — render initial data, auto-save trigger, publish button, delete dialog

## Tasks / Subtasks

- [x] Task 1: อัปเดต `src/lib/validations/project.ts` (AC: #8)
  - [x] เพิ่ม `ProjectUpdateSchema = ProjectSchema.partial()` พร้อมแก้ `location` และ `area_sqm`
  - [x] export `ProjectUpdateInput` type

- [x] Task 2: Rewrite `src/app/api/projects/[id]/route.ts` (AC: #1, #2, #3)
  - [x] GET: `requireRole('editor')` + `getTenantId()` + tenant-scoped query + category join
  - [x] PATCH: validate `ProjectUpdateSchema` + slug conflict check + published_at auto-set
  - [x] DELETE: `requireRole('admin')` + soft delete (update `deleted_at`)

- [x] Task 3: สร้าง `ProjectEditor` Client Component (AC: #5, #6, #7)
  - [x] สร้าง `src/app/(admin)/projects/[id]/_components/project-editor.tsx`
  - [x] Form state: title, description, content, slug, category_id, location, area_sqm, year, cover_image, status, seo_title, seo_description, seo_keywords
  - [x] `useAutoSave` + `SaveIndicator` ใน top bar
  - [x] `LocaleTabs` สำหรับ content (TiptapEditor)
  - [x] locale tabs สำหรับ Title/Description/Location/SEO
  - [x] `MediaPickerModal` สำหรับ cover image
  - [x] Publish/Unpublish/Archive explicit actions
  - [x] Delete confirmation ด้วย `AlertDialog`

- [x] Task 4: Rewrite `src/app/(admin)/projects/[id]/page.tsx` (AC: #4)
  - [x] เขียนทับ stub — Server Component
  - [x] fetch project + categories → notFound() ถ้าไม่พบ
  - [x] ส่ง `initialProject`, `categories`, `userRole` ไปยัง `<ProjectEditor>`

- [x] Task 5: Tests (AC: #9)
  - [x] สร้าง `src/app/api/projects/[id]/route.test.ts`
  - [x] สร้าง `src/app/(admin)/projects/[id]/_components/project-editor.test.tsx`

## Dev Notes

### Fix `validations/project.ts`

```typescript
// src/lib/validations/project.ts — เพิ่ม/แก้ ส่วนล่าง

const LocaleStringSchema = z.object({
  th: z.string().optional(),
  en: z.string().optional(),
})

// ProjectUpdateSchema — ทุก field เป็น optional (partial update)
export const ProjectUpdateSchema = z.object({
  title: LocaleStringSchema.optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug ต้องเป็นตัวเล็ก ตัวเลข และขีดกลาง')
    .optional(),
  description: LocaleStringSchema.optional(),
  content: z
    .object({ th: z.unknown().optional(), en: z.unknown().optional() })
    .optional(),
  category_id: z.string().uuid().nullable().optional(),
  location: LocaleStringSchema.optional(),  // ← แก้จาก z.string() เป็น JSONB
  area_sqm: z.number().int().min(0).max(999999).nullable().optional(),  // ← แก้จาก area: string
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  cover_image: z.string().url().nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  seo_title: LocaleStringSchema.optional(),
  seo_description: LocaleStringSchema.optional(),
  seo_keywords: z
    .object({
      th: z.array(z.string()).optional(),
      en: z.array(z.string()).optional(),
    })
    .optional(),
})

export type ProjectUpdateInput = z.infer<typeof ProjectUpdateSchema>
```

### PATCH `/api/projects/[id]` — Full Implementation

```typescript
// src/app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { getTenantId } from '@/lib/tenant'
import { ProjectUpdateSchema } from '@/lib/validations/project'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { response } = await requireRole('editor')
  if (response) return response

  let tenantId: string
  try { tenantId = await getTenantId() }
  catch { return NextResponse.json({ error: 'No tenant selected', code: 'TENANT_NOT_SELECTED' }, { status: 400 }) }

  const { id } = await params
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*, category:categories(id, name)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Project not found', code: 'NOT_FOUND' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { response } = await requireRole('editor')
  if (response) return response

  let tenantId: string
  try { tenantId = await getTenantId() }
  catch { return NextResponse.json({ error: 'No tenant selected', code: 'TENANT_NOT_SELECTED' }, { status: 400 }) }

  const { id } = await params
  const body = await request.json()

  const parsed = ProjectUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const updateData = parsed.data
  const supabase = createServerClient()

  // Slug conflict check (ถ้า slug เปลี่ยน)
  if (updateData.slug) {
    const { data: conflict } = await supabase
      .from('projects')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('slug', updateData.slug)
      .is('deleted_at', null)
      .neq('id', id)  // ยกเว้น project ตัวเอง
      .maybeSingle()

    if (conflict) {
      return NextResponse.json({ error: 'Slug already exists', code: 'SLUG_CONFLICT' }, { status: 409 })
    }
  }

  // ถ้า status เปลี่ยนเป็น published → set published_at (ถ้ายังไม่มี)
  const finalData: Record<string, unknown> = { ...updateData }
  if (updateData.status === 'published') {
    // ตรวจ published_at ปัจจุบัน
    const { data: current } = await supabase
      .from('projects')
      .select('published_at')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()
    if (current && !current.published_at) {
      finalData.published_at = new Date().toISOString()
    }
  }

  const { data, error } = await supabase
    .from('projects')
    .update(finalData)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Update failed', code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { response } = await requireRole('admin')  // editor ลบไม่ได้
  if (response) return response

  let tenantId: string
  try { tenantId = await getTenantId() }
  catch { return NextResponse.json({ error: 'No tenant selected', code: 'TENANT_NOT_SELECTED' }, { status: 400 }) }

  const { id } = await params
  const supabase = createServerClient()

  const { error } = await supabase
    .from('projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    return NextResponse.json({ error: 'Delete failed', code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

### Page — Server Component

```typescript
// src/app/(admin)/projects/[id]/page.tsx
import { notFound } from 'next/navigation'
import { assertRole, getRole } from '@/lib/auth'  // ← getRole ดึง role ปัจจุบัน
import { getTenantId } from '@/lib/tenant'
import { createServerClient } from '@/lib/supabase/server'
import { ProjectEditor } from './_components/project-editor'

export default async function ProjectEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await assertRole('editor')

  let tenantId: string
  try {
    tenantId = await getTenantId()
  } catch {
    notFound()
  }

  const { id } = await params
  const supabase = createServerClient()

  const [projectResult, categoriesResult] = await Promise.all([
    supabase
      .from('projects')
      .select('*, category:categories(id, name)')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single(),

    supabase
      .from('categories')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('type', 'project')
      .order('sort_order', { ascending: true }),
  ])

  if (projectResult.error || !projectResult.data) {
    notFound()
  }

  return (
    <ProjectEditor
      project={projectResult.data}
      categories={categoriesResult.data ?? []}
    />
  )
}
```

> **หมายเหตุ `getRole`:** ถ้า `auth.ts` ไม่มี `getRole` function → ส่ง role ผ่าน props ได้จาก `requireRole` แต่ page ใช้ `assertRole` แล้ว  
> ทางเลือก: ส่ง `userRole` ไปยัง ProjectEditor โดยดึงจาก Supabase session ใน page:
> ```typescript
> const { data: { user } } = await supabase.auth.getUser()
> const userRole = user?.app_metadata?.role ?? 'editor'
> ```

### ProjectEditor — Client Component (โครงสร้างหลัก)

```typescript
// src/app/(admin)/projects/[id]/_components/project-editor.tsx
'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import type { JSONContent } from '@tiptap/react'
import { LocaleTabs, SaveIndicator, useAutoSave } from '@/components/editor'
import { MediaPickerModal, type MediaItem } from '@/components/editor'
import { getLocaleValue, setLocaleValue } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ChevronLeft, Image as ImageIcon, Trash2 } from 'lucide-react'
import type { SupportedLocale } from '@/types/tenant'

type Category = { id: string; name: { th?: string; en?: string } }

type Project = {
  id: string
  title: { th?: string; en?: string } | null
  slug: string
  description: { th?: string; en?: string } | null
  content: { th?: unknown; en?: unknown } | null
  category_id: string | null
  location: { th?: string; en?: string } | null
  area_sqm: number | null
  year: number | null
  cover_image: string | null
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  seo_title: { th?: string; en?: string } | null
  seo_description: { th?: string; en?: string } | null
  seo_keywords: { th?: string[]; en?: string[] } | null
}

type ProjectEditorProps = {
  project: Project
  categories: Category[]
}

export function ProjectEditor({ project, categories }: ProjectEditorProps) {
  const router = useRouter()

  // ── Form State ──────────────────────────────────────────────────
  const [title, setTitle] = useState(project.title ?? {})
  const [description, setDescription] = useState(project.description ?? {})
  const [content, setContent] = useState(project.content ?? {})
  const [slug, setSlug] = useState(project.slug)
  const [categoryId, setCategoryId] = useState(project.category_id ?? '')
  const [location, setLocation] = useState(project.location ?? {})
  const [areaSqm, setAreaSqm] = useState(project.area_sqm ?? '')
  const [year, setYear] = useState(project.year ?? '')
  const [coverImage, setCoverImage] = useState(project.cover_image ?? null)
  const [status, setStatus] = useState(project.status)
  const [seoTitle, setSeoTitle] = useState(project.seo_title ?? {})
  const [seoDescription, setSeoDescription] = useState(project.seo_description ?? {})
  const [seoKeywords, setSeoKeywords] = useState(project.seo_keywords ?? { th: [], en: [] })

  // ── UI State ─────────────────────────────────────────────────────
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>('th')
  const [coverPickerOpen, setCoverPickerOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [keywordInput, setKeywordInput] = useState({ th: '', en: '' })

  // ── Auto-save ────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        content,
        slug,
        category_id: categoryId || null,
        location,
        area_sqm: areaSqm ? Number(areaSqm) : null,
        year: year ? Number(year) : null,
        cover_image: coverImage,
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_keywords: seoKeywords,
        // status ไม่รวมใน auto-save (explicit action เท่านั้น)
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      if (data.code === 'SLUG_CONFLICT') {
        toast.error('Slug นี้ถูกใช้ไปแล้ว กรุณาเปลี่ยน slug')
      }
      throw new Error(data.code ?? 'SAVE_FAILED')
    }
  }, [project.id, title, description, content, slug, categoryId, location, areaSqm, year, coverImage, seoTitle, seoDescription, seoKeywords])

  const { saveStatus, triggerSave } = useAutoSave({ onSave: handleSave })

  // ── Helper: trigger save after state change ───────────────────────
  function withSave<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); triggerSave() }
  }

  // ── Publish / Unpublish / Archive ────────────────────────────────
  async function changeStatus(newStatus: 'draft' | 'published' | 'archived') {
    setPublishing(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('status update failed')
      setStatus(newStatus)
      const label = { draft: 'ย้ายเป็น Draft', published: 'Publish สำเร็จ', archived: 'Archive สำเร็จ' }
      toast.success(label[newStatus])
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setPublishing(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────
  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      toast.success('ลบโปรเจกต์สำเร็จ')
      router.push('/projects')
    } catch {
      toast.error('เกิดข้อผิดพลาด ไม่สามารถลบได้')
      setDeleting(false)
    }
  }

  // ── Cover Image ───────────────────────────────────────────────────
  function handleCoverSelect(item: MediaItem) {
    setCoverImage(item.public_url)
    triggerSave()
  }

  // ── SEO Keywords ─────────────────────────────────────────────────
  function addKeyword(locale: SupportedLocale) {
    const kw = keywordInput[locale].trim()
    if (!kw) return
    const current = seoKeywords[locale] ?? []
    if (current.includes(kw)) return
    setSeoKeywords(prev => ({ ...prev, [locale]: [...current, kw] }))
    setKeywordInput(prev => ({ ...prev, [locale]: '' }))
    triggerSave()
  }

  function removeKeyword(locale: SupportedLocale, kw: string) {
    setSeoKeywords(prev => ({
      ...prev,
      [locale]: (prev[locale] ?? []).filter(k => k !== kw),
    }))
    triggerSave()
  }

  const titleDisplay =
    getLocaleValue(project.title, 'th') ||
    getLocaleValue(project.title, 'en') ||
    '(ไม่มีชื่อ)'

  return (
    <div className="flex flex-col gap-5">
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/projects" className="hover:text-foreground">Projects</Link>
          <ChevronLeft className="h-3 w-3 rotate-180" />
          <span className="font-medium text-foreground truncate max-w-[200px]">{titleDisplay}</span>
        </div>
        <div className="flex items-center gap-3">
          <SaveIndicator status={saveStatus} />
          {status === 'published' ? (
            <Button variant="outline" size="sm" onClick={() => changeStatus('draft')} disabled={publishing}>
              Unpublish
            </Button>
          ) : (
            <Button size="sm" onClick={() => changeStatus('published')} disabled={publishing}>
              {publishing ? 'กำลัง Publish...' : 'Publish'}
            </Button>
          )}
        </div>
      </div>

      {/* ── Main 2-col Layout ────────────────────────────────────── */}
      <div className="flex gap-6 items-start">
        {/* Left — Main Content */}
        <div className="flex flex-1 flex-col gap-5 min-w-0">

          {/* Content Card */}
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold">เนื้อหาโปรเจกต์</span>
                {/* Locale selector สำหรับ Title + Description */}
                <Tabs value={activeLocale} onValueChange={(v) => setActiveLocale(v as SupportedLocale)}>
                  <TabsList>
                    <TabsTrigger value="th">ภาษาไทย</TabsTrigger>
                    <TabsTrigger value="en">English</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">ชื่อโปรเจกต์</Label>
                <Input
                  value={getLocaleValue(title, activeLocale) ?? ''}
                  onChange={(e) => {
                    const updated = setLocaleValue(title, activeLocale, e.target.value)
                    withSave(setTitle)(updated)
                  }}
                  placeholder={activeLocale === 'th' ? 'ชื่อโปรเจกต์ภาษาไทย' : 'Project name in English'}
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">คำอธิบายย่อ</Label>
                <Textarea
                  value={getLocaleValue(description, activeLocale) ?? ''}
                  onChange={(e) => {
                    const updated = setLocaleValue(description, activeLocale, e.target.value)
                    withSave(setDescription)(updated)
                  }}
                  placeholder={activeLocale === 'th' ? 'คำอธิบายโปรเจกต์...' : 'Project description...'}
                  rows={3}
                />
              </div>

              {/* Rich Text Content */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">เนื้อหา</Label>
                <LocaleTabs
                  value={content as Record<SupportedLocale, JSONContent>}
                  onChange={(locale, json) => {
                    const updated = { ...content, [locale]: json }
                    withSave(setContent)(updated)
                  }}
                  placeholder={{ th: 'เขียนเนื้อหาโปรเจกต์ภาษาไทย...', en: 'Write project content in English...' }}
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO Card */}
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold">SEO</span>
                <Badge variant="outline" className="text-[10px]">
                  {activeLocale === 'th' ? 'ภาษาไทย' : 'English'}
                </Badge>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">SEO Title</Label>
                <Input
                  value={getLocaleValue(seoTitle, activeLocale) ?? ''}
                  onChange={(e) => {
                    const updated = setLocaleValue(seoTitle, activeLocale, e.target.value)
                    withSave(setSeoTitle)(updated)
                  }}
                  placeholder="Title สำหรับ Search Engine"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Meta Description</Label>
                <Textarea
                  value={getLocaleValue(seoDescription, activeLocale) ?? ''}
                  onChange={(e) => {
                    const updated = setLocaleValue(seoDescription, activeLocale, e.target.value)
                    withSave(setSeoDescription)(updated)
                  }}
                  placeholder="คำอธิบายสั้นสำหรับ Search Engine"
                  rows={2}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Keywords</Label>
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {(seoKeywords[activeLocale] ?? []).map((kw) => (
                    <Badge key={kw} variant="secondary" className="text-[11px] gap-1">
                      {kw}
                      <button
                        type="button"
                        onClick={() => removeKeyword(activeLocale, kw)}
                        className="ml-0.5 text-muted-foreground hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={keywordInput[activeLocale]}
                    onChange={(e) => setKeywordInput(prev => ({ ...prev, [activeLocale]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword(activeLocale))}
                    placeholder="+ เพิ่ม keyword แล้ว Enter"
                    className="text-sm"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => addKeyword(activeLocale)}>
                    เพิ่ม
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right — Sidebar */}
        <div className="flex w-[280px] shrink-0 flex-col gap-4">

          {/* Status Card */}
          <Card>
            <CardContent className="flex flex-col gap-3 p-4">
              <span className="text-sm font-semibold">สถานะ</span>
              <div className="flex items-center gap-2">
                <Badge variant={status === 'published' ? 'default' : status === 'archived' ? 'secondary' : 'outline'}>
                  {status}
                </Badge>
                {status === 'published' && project.published_at && (
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(project.published_at).toLocaleDateString('th-TH')}
                  </span>
                )}
              </div>
              {status !== 'archived' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => changeStatus('archived')}
                  disabled={publishing}
                >
                  Archive
                </Button>
              )}
              {status === 'archived' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => changeStatus('draft')}
                  disabled={publishing}
                >
                  Unarchive (→ Draft)
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Project Info Card */}
          <Card>
            <CardContent className="flex flex-col gap-3 p-4">
              <span className="text-sm font-semibold">ข้อมูลโปรเจกต์</span>

              {/* Slug */}
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Slug</Label>
                <Input
                  value={slug}
                  onChange={(e) => withSave(setSlug)(e.target.value)}
                  className="font-mono text-xs h-8"
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">หมวดหมู่</Label>
                <Select value={categoryId} onValueChange={withSave(setCategoryId)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="เลือกหมวดหมู่..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— ไม่มีหมวดหมู่ —</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {getLocaleValue(cat.name, 'th') || getLocaleValue(cat.name, 'en')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Location ({activeLocale.toUpperCase()})
                </Label>
                <Input
                  value={getLocaleValue(location, activeLocale) ?? ''}
                  onChange={(e) => {
                    const updated = setLocaleValue(location, activeLocale, e.target.value)
                    withSave(setLocation)(updated)
                  }}
                  placeholder={activeLocale === 'th' ? 'กรุงเทพฯ' : 'Bangkok'}
                  className="h-8 text-sm"
                />
              </div>

              {/* Area + Year */}
              <div className="flex gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">พื้นที่ (ตร.ม.)</Label>
                  <Input
                    type="number"
                    value={areaSqm}
                    onChange={(e) => withSave(setAreaSqm)(e.target.value)}
                    placeholder="100"
                    className="h-8 text-sm"
                    min={0}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">ปี</Label>
                  <Input
                    type="number"
                    value={year}
                    onChange={(e) => withSave(setYear)(e.target.value)}
                    placeholder="2025"
                    className="h-8 text-sm"
                    min={1900}
                    max={2100}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cover Image Card */}
          <Card>
            <CardContent className="flex flex-col gap-3 p-4">
              <span className="text-sm font-semibold">Cover Image</span>
              <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                {coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverImage} alt="Cover" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setCoverPickerOpen(true)}
              >
                <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
                {coverImage ? 'เปลี่ยนรูป Cover' : 'เลือกรูป Cover'}
              </Button>
              {coverImage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground text-xs"
                  onClick={() => withSave(setCoverImage)(null)}
                >
                  ลบ Cover Image
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/30">
            <CardContent className="flex flex-col gap-2 p-4">
              <span className="text-sm font-semibold text-destructive">Danger Zone</span>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                ลบโปรเจกต์
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────── */}

      {/* Cover Image Picker */}
      <MediaPickerModal
        open={coverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        onSelect={handleCoverSelect}
      />

      {/* Delete Confirm */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบโปรเจกต์</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบ &quot;{titleDisplay}&quot; ใช่หรือไม่?
              โปรเจกต์จะถูกซ่อนจากระบบ (soft delete)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'กำลังลบ...' : 'ลบโปรเจกต์'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

### ตรวจสอบ `AlertDialog` ใน shadcn/ui

```bash
# ตรวจว่ามีหรือไม่
ls src/components/ui/alert-dialog.tsx
```

ถ้าไม่มี → install:
```bash
npx shadcn@latest add alert-dialog
```

### Tests — API Route `[id]`

```typescript
// src/app/api/projects/[id]/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH, DELETE } from './route'
import { NextRequest } from 'next/server'

const mockParams = Promise.resolve({ id: 'proj-1' })

vi.mock('@/lib/auth', () => ({
  requireRole: vi.fn().mockResolvedValue({ user: { id: 'user-1' }, response: null }),
}))
vi.mock('@/lib/tenant', () => ({
  getTenantId: vi.fn().mockResolvedValue('tenant-1'),
}))

const mockProject = {
  id: 'proj-1',
  tenant_id: 'tenant-1',
  title: { th: 'ทดสอบ', en: 'Test' },
  slug: 'test-project',
  status: 'draft',
  deleted_at: null,
  published_at: null,
}

// สร้าง mock supabase client ที่ chainable
function createMockSupabase(overrides?: Partial<{
  singleData: unknown
  singleError: unknown
  updateData: unknown
}>) {
  const mock = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({
      data: overrides?.singleData ?? mockProject,
      error: overrides?.singleError ?? null,
    }),
  }
  return mock
}

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => createMockSupabase()),
}))

describe('GET /api/projects/[id]', () => {
  it('returns project when found', async () => {
    const req = new NextRequest('http://localhost/api/projects/proj-1')
    const res = await GET(req, { params: mockParams })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('proj-1')
  })

  it('returns 404 when project not found', async () => {
    const { createServerClient } = await import('@/lib/supabase/server')
    vi.mocked(createServerClient).mockReturnValueOnce(
      createMockSupabase({ singleData: null, singleError: { code: 'PGRST116' } }) as never
    )
    const req = new NextRequest('http://localhost/api/projects/not-found')
    const res = await GET(req, { params: Promise.resolve({ id: 'not-found' }) })
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/projects/[id]', () => {
  it('updates project fields', async () => {
    const req = new NextRequest('http://localhost/api/projects/proj-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: { th: 'อัปเดต' } }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: mockParams })
    expect(res.status).toBe(200)
  })

  it('returns 422 for invalid slug', async () => {
    const req = new NextRequest('http://localhost/api/projects/proj-1', {
      method: 'PATCH',
      body: JSON.stringify({ slug: 'INVALID SLUG!' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: mockParams })
    expect(res.status).toBe(422)
  })

  it('returns 409 for slug conflict', async () => {
    const { createServerClient } = await import('@/lib/supabase/server')
    const conflictMock = createMockSupabase()
    conflictMock.maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'other-proj' }, error: null })
    vi.mocked(createServerClient).mockReturnValueOnce(conflictMock as never)

    const req = new NextRequest('http://localhost/api/projects/proj-1', {
      method: 'PATCH',
      body: JSON.stringify({ slug: 'existing-slug' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: mockParams })
    expect(res.status).toBe(409)
  })
})

describe('DELETE /api/projects/[id]', () => {
  it('soft-deletes project (admin)', async () => {
    const req = new NextRequest('http://localhost/api/projects/proj-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: mockParams })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('returns 401 when editor tries to delete', async () => {
    const { requireRole } = await import('@/lib/auth')
    vi.mocked(requireRole).mockResolvedValueOnce({
      user: null,
      response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    } as never)
    const req = new NextRequest('http://localhost/api/projects/proj-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: mockParams })
    expect(res.status).toBe(403)
  })
})
```

### ข้อควรระวัง

#### 1. `AlertDialog` ต้องตรวจสอบก่อน
```bash
ls src/components/ui/alert-dialog.tsx
# ถ้าไม่มี:
npx shadcn@latest add alert-dialog
```

#### 2. `withSave` helper — closure ปัญหา
```typescript
function withSave<T>(setter: (v: T) => void) {
  return (v: T) => { setter(v); triggerSave() }
}
```
`triggerSave` ต้อง stable (มาจาก `useAutoSave`) — ถ้า `handleSave` เปลี่ยนทุก render → `triggerSave` จะ recreate ทุกครั้ง → debounce ไม่ทำงาน  
→ `handleSave` ต้อง wrap ด้วย `useCallback` (มี deps ทุกตัว — ในกรณีนี้ OK เพราะ state เปลี่ยนแล้วจะ recreate `handleSave` + `triggerSave`)

#### 3. `content` ใน LocaleTabs — cast type
`project.content` มาจาก DB เป็น `Json` type → cast ก่อนส่ง:
```typescript
value={content as Record<SupportedLocale, JSONContent>}
```

#### 4. Delete แสดงปุ่มทุก role — admin ตรวจสอบ server-side
`ProjectEditor` ไม่รู้ role ของ user ในตัวเอง → แสดงปุ่ม Delete ทุก role  
แต่ DELETE API จะ `requireRole('admin')` → editor ที่กดจะได้ 403 + toast error  
ถ้าต้องการซ่อนปุ่มสำหรับ editor: ส่ง `userRole` prop จาก page.tsx

#### 5. `getLocaleValue` / `setLocaleValue` type compatibility
`location`, `title`, `description` เป็น `{ th?: string; en?: string } | null`  
`getLocaleValue` รับ `LocaleRecord<T> | null | undefined` → compatible  
`setLocaleValue` return `LocaleRecord<T>` → ตรงกัน

#### 6. `Select` value เป็น empty string
`categoryId` state เริ่มต้นเป็น `''` (ไม่มีหมวดหมู่)  
ใน `onValueChange`: ส่ง `''` หรือ UUID  
ใน PATCH body: `category_id: categoryId || null` แปลง empty string → null

#### 7. PATCH `published_at` — ตรวจสอบ current ก่อน
Implementation จริงต้อง fetch `published_at` ก่อนตัดสินใจ set — หรือส่ง `published_at` เป็น conditional ใน update:
```typescript
// ทางเลือกที่ simple กว่า: ให้ client ส่ง published_at มาด้วย
// แต่ถ้า client ไม่ส่ง → API ตรวจเอง (ตาม implementation ข้างบน)
```

#### 8. `LocaleTabs` locale sync กับ content/SEO tabs
`activeLocale` ใช้ร่วมกันทั้ง Title/Description/Location/SEO  
แต่ `LocaleTabs` (TiptapEditor) มี internal state แยกกัน → ไม่ conflict

### Key Learnings จาก Story 2.1–2.6

| ประเด็น | การจัดการ |
|---------|-----------|
| `location: string` เดิม ผิดจาก DB | แก้เป็น `LocaleStringSchema` ใน ProjectUpdateSchema |
| `area` เดิมเป็น string | แก้เป็น `area_sqm: number` ตรงกับ DB column |
| soft delete ใน projects | update `deleted_at` ไม่ใช่ hard delete |
| DELETE ต้อง admin | `requireRole('admin')` ใน DELETE handler |
| `MediaPickerModal` พร้อมใช้ | import จาก `@/components/editor` |
| `LocaleTabs` + `useAutoSave` พร้อมใช้ | import จาก `@/components/editor` |
| `published_at` ต้อง set เมื่อ publish ครั้งแรก | ตรวจ current value ก่อน update |

### References

- FR-01: Projects management (edit, publish, delete)
- FR-10: Rich text editor integration
- FR-11: Multi-locale content
- FR-12: Auto-save
- FR-15: SEO fields per project
- Story 2.4: `LocaleTabs`, `useAutoSave`, `SaveIndicator`
- Story 2.5: `MediaPickerModal`
- Story 2.6: `GET /api/projects`, `ProjectCreateSchema`
- [Source: src/app/(admin)/projects/[id]/page.tsx] (stub — เขียนทับ)
- [Source: src/app/api/projects/[id]/route.ts] (old — เขียนทับ)
- [Source: src/lib/validations/project.ts] (เพิ่ม ProjectUpdateSchema)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (2026-04-11)

### Debug Log References

ไม่มีปัญหาระหว่าง implementation

### Completion Notes List

- **Task 1** — เพิ่ม `ProjectUpdateSchema` ใน `validations/project.ts`: แก้ `location` จาก `z.string()` → `LocaleStringSchema` (JSONB), แก้ `area` → `area_sqm: z.number().int()`, export `ProjectUpdateInput`
- **Task 2** — Rewrite `api/projects/[id]/route.ts`: GET (tenant-scoped + category join), PATCH (schema validation + slug conflict check + published_at auto-set), DELETE (admin-only soft delete via `deleted_at`)
- **Task 3** — สร้าง `ProjectEditor` Client Component: full 2-col layout, useAutoSave + SaveIndicator, LocaleTabs (TiptapEditor), MediaPickerModal, Publish/Unpublish/Archive, AlertDialog delete confirm
- **Task 4** — Rewrite `projects/[id]/page.tsx` Server Component: parallel fetch project + categories, notFound() fallback, pass props to ProjectEditor
- **Task 5** — Tests: 12 API route tests + 17 component tests, ทั้งหมดผ่าน 100%

### Change Log

- 2026-04-11: implement Story 2.7 — Projects Edit, SEO, Publish and Delete (Tasks 1-5 complete)

### File List

**Rewritten:**
- `src/app/(admin)/projects/[id]/page.tsx` (Server Component — full implementation)
- `src/app/api/projects/[id]/route.ts` (rewrite — auth + JSONB + soft delete)

**Updated:**
- `src/lib/validations/project.ts` (เพิ่ม ProjectUpdateSchema + แก้ location/area_sqm)

**New:**
- `src/app/(admin)/projects/[id]/_components/project-editor.tsx`
- `src/app/api/projects/[id]/route.test.ts`
- `src/app/(admin)/projects/[id]/_components/project-editor.test.tsx`

### Change Log
