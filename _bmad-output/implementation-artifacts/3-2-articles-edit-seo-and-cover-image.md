# Story 3.2: Articles Edit, SEO, and Cover Image

Status: review

## Story

As a content editor,
I want to edit article content, excerpt, SEO metadata, and cover image with auto-save,
so that I can maintain blog articles with full bilingual content.

## Acceptance Criteria

1. **GET `/api/articles/[id]`** — fetch single article:
   - Auth: `requireRole('editor')`
   - Query: `tenant_id` + `id` + `.is('deleted_at', null)`
   - Join: `.select('*, category:categories(id, name)')`
   - Returns: article row หรือ 404

2. **PATCH `/api/articles/[id]`** — partial update:
   - Auth: `requireRole('editor')`
   - Validate with `ArticleUpdateSchema` (all fields optional)
   - Slug conflict check: ถ้า slug เปลี่ยน → ตรวจซ้ำ (ยกเว้น id ตัวเอง)
   - ถ้า `status` เปลี่ยนเป็น `'published'` และ `published_at` ยังเป็น null → set `published_at`
   - Returns: updated article row

3. **เพิ่ม `ArticleUpdateSchema`** ใน `src/lib/validations/article.ts`:
   - ทุก field optional
   - `excerpt: LocaleStringSchema.optional()` (JSONB — ไม่ใช่ plain string)
   - Export `ArticleUpdateInput` type

4. **Article Editor Page** (`src/app/(admin)/blog/[id]/page.tsx`):
   - เขียนทับ stub จาก Story 3.1
   - Server Component: `assertRole('editor')` → `getTenantId()` → fetch article + categories → `notFound()` ถ้าไม่พบ
   - Render `<ArticleEditor>` (Client Component) พร้อม initial data

5. **ArticleEditor** (`src/app/(admin)/blog/[id]/_components/article-editor.tsx`):
   - Client Component (`'use client'`)
   - Layout: 2-col (main flex-1 | sidebar w-[280px])
   - **Top bar**: breadcrumb ("/blog > ชื่อบทความ") + `SaveIndicator` + status badge
   - **Content Card** (main): Title + Excerpt (Input/Textarea per locale tab) + `LocaleTabs` สำหรับ content
   - **SEO Card** (main): seo_title, seo_description, seo_keywords (locale-aware ตาม activeLocale)
   - **Status Card** (sidebar): แสดง badge สถานะ + published_at — **placeholder สำหรับ Story 3.3** (ยังไม่มีปุ่ม Publish/Delete)
   - **Category Card** (sidebar): Select category (type='article')
   - **Cover Image Card** (sidebar): preview + ปุ่ม "เลือกรูป Cover" → `MediaPickerModal`

6. **Auto-save:**
   - `useAutoSave({ onSave, delay: 2000 })`
   - ครอบคลุมทุก field ยกเว้น `status` (status change อยู่ใน Story 3.3)
   - Error: toast (sonner) ถ้า slug conflict

7. **Tests:**
   - `src/app/api/articles/[id]/route.test.ts` — GET, PATCH (update, slug conflict, published_at)
   - `article-editor.test.tsx` — render, auto-save trigger, cover image picker

## Tasks / Subtasks

- [x] Task 1: เพิ่ม `ArticleUpdateSchema` ใน `validations/article.ts` (AC: #3)
  - [x] เพิ่ม `ArticleUpdateSchema` ต่อจาก `ArticleCreateSchema`
  - [x] export `ArticleUpdateInput`

- [x] Task 2: Rewrite `src/app/api/articles/[id]/route.ts` (AC: #1, #2)
  - [x] GET: `requireRole` + `getTenantId` + tenant-scoped + category join
  - [x] PATCH: `ArticleUpdateSchema` + slug conflict + published_at auto-set
  - [x] **ยังไม่** implement DELETE — Story 3.3 จะเพิ่ม
  - [x] สร้าง `route.test.ts`

- [x] Task 3: สร้าง `ArticleEditor` Client Component (AC: #5, #6)
  - [x] สร้าง `src/app/(admin)/blog/[id]/_components/article-editor.tsx`
  - [x] Form state: title, excerpt, content, slug, category_id, cover_image, seo_title, seo_description, seo_keywords
  - [x] `useAutoSave` + `SaveIndicator`
  - [x] `LocaleTabs` สำหรับ content
  - [x] locale tabs สำหรับ Title/Excerpt/SEO (activeLocale)
  - [x] `MediaPickerModal` สำหรับ cover image
  - [x] Status Card: แสดง badge อย่างเดียว (ไม่มีปุ่ม — Story 3.3 เพิ่ม)

- [x] Task 4: Rewrite `blog/[id]/page.tsx` (AC: #4)
  - [x] เขียนทับ stub — Server Component
  - [x] fetch article + categories → `notFound()`
  - [x] render `<ArticleEditor>`

- [x] Task 5: Tests (AC: #7)
  - [x] `src/app/api/articles/[id]/route.test.ts`
  - [x] `article-editor.test.tsx`

## Dev Notes

### ArticleUpdateSchema

```typescript
// เพิ่มใน src/lib/validations/article.ts

const LocaleStringSchema = z.object({
  th: z.string().optional(),
  en: z.string().optional(),
})

export const ArticleUpdateSchema = z.object({
  title: LocaleStringSchema.optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug ต้องเป็นตัวเล็ก ตัวเลข และขีดกลาง')
    .optional(),
  excerpt: LocaleStringSchema.optional(),   // ← JSONB เหมือน title
  content: z
    .object({ th: z.unknown().optional(), en: z.unknown().optional() })
    .optional(),
  category_id: z.string().uuid().nullable().optional(),
  cover_image: z.string().url().nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  seo_title: LocaleStringSchema.optional(),
  seo_description: LocaleStringSchema.optional(),
  seo_keywords: z
    .object({ th: z.array(z.string()).optional(), en: z.array(z.string()).optional() })
    .optional(),
})

export type ArticleUpdateInput = z.infer<typeof ArticleUpdateSchema>
```

> **ไม่มี** `location`, `area_sqm`, `year` — articles ไม่มี fields เหล่านี้

### GET + PATCH `/api/articles/[id]`

> **Pattern เหมือน Story 2.7 (`/api/projects/[id]`)** — copy + แก้ table name + schema:

```typescript
// src/app/api/articles/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { getTenantId } from '@/lib/tenant'
import { ArticleUpdateSchema } from '@/lib/validations/article'

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
    .from('articles')
    .select('*, category:categories(id, name)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Article not found', code: 'NOT_FOUND' }, { status: 404 })
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

  const parsed = ArticleUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const updateData = parsed.data
  const supabase = createServerClient()

  // Slug conflict check
  if (updateData.slug) {
    const { data: conflict } = await supabase
      .from('articles')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('slug', updateData.slug)
      .is('deleted_at', null)
      .neq('id', id)
      .maybeSingle()

    if (conflict) {
      return NextResponse.json({ error: 'Slug already exists', code: 'SLUG_CONFLICT' }, { status: 409 })
    }
  }

  // published_at auto-set
  const finalData: Record<string, unknown> = { ...updateData }
  if (updateData.status === 'published') {
    const { data: current } = await supabase
      .from('articles')
      .select('published_at')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()
    if (current && !current.published_at) {
      finalData.published_at = new Date().toISOString()
    }
  }

  const { data, error } = await supabase
    .from('articles')
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

// DELETE — Story 3.3 จะเพิ่ม
```

### Page — Server Component

```typescript
// src/app/(admin)/blog/[id]/page.tsx
import { notFound } from 'next/navigation'
import { assertRole } from '@/lib/auth'
import { getTenantId } from '@/lib/tenant'
import { createServerClient } from '@/lib/supabase/server'
import { ArticleEditor } from './_components/article-editor'

export default async function ArticleEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await assertRole('editor')

  let tenantId: string
  try { tenantId = await getTenantId() }
  catch { notFound() }

  const { id } = await params
  const supabase = createServerClient()

  const [articleResult, categoriesResult] = await Promise.all([
    supabase
      .from('articles')
      .select('*, category:categories(id, name)')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single(),

    supabase
      .from('categories')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('type', 'article')
      .order('sort_order', { ascending: true }),
  ])

  if (articleResult.error || !articleResult.data) notFound()

  return (
    <ArticleEditor
      article={articleResult.data}
      categories={categoriesResult.data ?? []}
    />
  )
}
```

### ArticleEditor — Client Component

> **Pattern เหมือน Story 2.7 `ProjectEditor`** แต่:
> - ใช้ `excerpt` แทน `description`
> - ไม่มี Location, Area, Year
> - Status Card แสดง badge อย่างเดียว (ไม่มีปุ่ม Publish/Delete — เพิ่มใน Story 3.3)
> - Cover Image Card อยู่สูงกว่าใน sidebar (สำคัญกว่าสำหรับ blog)

```typescript
// src/app/(admin)/blog/[id]/_components/article-editor.tsx
'use client'
import { useState, useCallback } from 'react'
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
import { ChevronLeft, Image as ImageIcon } from 'lucide-react'
import type { SupportedLocale } from '@/types/tenant'

type Category = { id: string; name: { th?: string; en?: string } }

type Article = {
  id: string
  title: { th?: string; en?: string } | null
  slug: string
  excerpt: { th?: string; en?: string } | null  // ← excerpt ไม่ใช่ description
  content: { th?: unknown; en?: unknown } | null
  category_id: string | null
  cover_image: string | null
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  seo_title: { th?: string; en?: string } | null
  seo_description: { th?: string; en?: string } | null
  seo_keywords: { th?: string[]; en?: string[] } | null
}

type ArticleEditorProps = {
  article: Article
  categories: Category[]
}

export function ArticleEditor({ article, categories }: ArticleEditorProps) {
  // ── Form State ──────────────────────────────────────────────────
  const [title, setTitle] = useState(article.title ?? {})
  const [excerpt, setExcerpt] = useState(article.excerpt ?? {})   // ← excerpt
  const [content, setContent] = useState(article.content ?? {})
  const [slug, setSlug] = useState(article.slug)
  const [categoryId, setCategoryId] = useState(article.category_id ?? '')
  const [coverImage, setCoverImage] = useState(article.cover_image ?? null)
  const [seoTitle, setSeoTitle] = useState(article.seo_title ?? {})
  const [seoDescription, setSeoDescription] = useState(article.seo_description ?? {})
  const [seoKeywords, setSeoKeywords] = useState(article.seo_keywords ?? { th: [], en: [] })

  // ── UI State ─────────────────────────────────────────────────────
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>('th')
  const [coverPickerOpen, setCoverPickerOpen] = useState(false)
  const [keywordInput, setKeywordInput] = useState({ th: '', en: '' })

  // ── Auto-save ────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const res = await fetch(`/api/articles/${article.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        excerpt,
        content,
        slug,
        category_id: categoryId || null,
        cover_image: coverImage,
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_keywords: seoKeywords,
        // status ไม่รวม — Story 3.3 จัดการ
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      if (data.code === 'SLUG_CONFLICT') toast.error('Slug นี้ถูกใช้ไปแล้ว กรุณาเปลี่ยน slug')
      throw new Error(data.code ?? 'SAVE_FAILED')
    }
  }, [article.id, title, excerpt, content, slug, categoryId, coverImage, seoTitle, seoDescription, seoKeywords])

  const { saveStatus, triggerSave } = useAutoSave({ onSave: handleSave })

  function withSave<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); triggerSave() }
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
    getLocaleValue(article.title, 'th') || getLocaleValue(article.title, 'en') || '(ไม่มีชื่อ)'

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : null

  return (
    <div className="flex flex-col gap-5">
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/blog" className="hover:text-foreground">Blog</Link>
          <ChevronLeft className="h-3 w-3 rotate-180" />
          <span className="font-medium text-foreground truncate max-w-[200px]">{titleDisplay}</span>
        </div>
        <div className="flex items-center gap-3">
          <SaveIndicator status={saveStatus} />
          {/* ── Publish/Delete อยู่ใน Story 3.3 ── */}
          <Badge variant={
            article.status === 'published' ? 'default' :
            article.status === 'archived' ? 'secondary' : 'outline'
          }>
            {article.status}
          </Badge>
        </div>
      </div>

      {/* ── 2-col Layout ────────────────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* Left — Main */}
        <div className="flex flex-1 flex-col gap-5 min-w-0">

          {/* Content Card */}
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold">เนื้อหาบทความ</span>
                <Tabs value={activeLocale} onValueChange={(v) => setActiveLocale(v as SupportedLocale)}>
                  <TabsList>
                    <TabsTrigger value="th">ภาษาไทย</TabsTrigger>
                    <TabsTrigger value="en">English</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">ชื่อบทความ</Label>
                <Input
                  value={getLocaleValue(title, activeLocale) ?? ''}
                  onChange={(e) => {
                    withSave(setTitle)(setLocaleValue(title, activeLocale, e.target.value))
                  }}
                  placeholder={activeLocale === 'th' ? 'ชื่อบทความภาษาไทย' : 'Article title in English'}
                />
              </div>

              {/* Excerpt — JSONB locale-aware */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Excerpt (ย่อหน้าแรก)
                </Label>
                <Textarea
                  value={getLocaleValue(excerpt, activeLocale) ?? ''}
                  onChange={(e) => {
                    withSave(setExcerpt)(setLocaleValue(excerpt, activeLocale, e.target.value))
                  }}
                  placeholder={activeLocale === 'th' ? 'สรุปบทความสั้นๆ...' : 'Short article summary...'}
                  rows={3}
                />
              </div>

              {/* Rich Text Content */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">เนื้อหา</Label>
                <LocaleTabs
                  value={content as Record<SupportedLocale, JSONContent>}
                  onChange={(locale, json) => {
                    withSave(setContent)({ ...content, [locale]: json })
                  }}
                  placeholder={{
                    th: 'เขียนเนื้อหาบทความภาษาไทย...',
                    en: 'Write article content in English...',
                  }}
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
                  onChange={(e) => withSave(setSeoTitle)(setLocaleValue(seoTitle, activeLocale, e.target.value))}
                  placeholder="Title สำหรับ Search Engine"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Meta Description</Label>
                <Textarea
                  value={getLocaleValue(seoDescription, activeLocale) ?? ''}
                  onChange={(e) => withSave(setSeoDescription)(setLocaleValue(seoDescription, activeLocale, e.target.value))}
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
                      >×</button>
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

          {/* Cover Image Card — สำคัญ อยู่บนสุดสำหรับ blog */}
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

          {/* Status Card — แสดง badge อย่างเดียว (Story 3.3 เพิ่ม action buttons) */}
          <Card>
            <CardContent className="flex flex-col gap-2 p-4">
              <span className="text-sm font-semibold">สถานะ</span>
              <div className="flex items-center gap-2">
                <Badge variant={
                  article.status === 'published' ? 'default' :
                  article.status === 'archived' ? 'secondary' : 'outline'
                }>
                  {article.status}
                </Badge>
                {article.published_at && (
                  <span className="text-[11px] text-muted-foreground">
                    {formatDate(article.published_at)}
                  </span>
                )}
              </div>
              {/* Story 3.3 จะเพิ่ม: Publish / Unpublish / Archive / Delete buttons ที่นี่ */}
            </CardContent>
          </Card>

          {/* Category Card */}
          <Card>
            <CardContent className="flex flex-col gap-2 p-4">
              <span className="text-sm font-semibold">หมวดหมู่</span>
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
            </CardContent>
          </Card>

          {/* Slug Card */}
          <Card>
            <CardContent className="flex flex-col gap-2 p-4">
              <span className="text-sm font-semibold">URL Slug</span>
              <Input
                value={slug}
                onChange={(e) => withSave(setSlug)(e.target.value)}
                className="font-mono text-xs h-8"
              />
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ── Cover Image Picker ──────────────────────────────────── */}
      <MediaPickerModal
        open={coverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        onSelect={handleCoverSelect}
      />
    </div>
  )
}
```

### Tests

#### API Route Tests

```typescript
// src/app/api/articles/[id]/route.test.ts
import { describe, it, expect, vi } from 'vitest'
import { GET, PATCH } from './route'
import { NextRequest } from 'next/server'

const mockParams = Promise.resolve({ id: 'art-1' })

vi.mock('@/lib/auth', () => ({
  requireRole: vi.fn().mockResolvedValue({ user: { id: 'user-1' }, response: null }),
}))
vi.mock('@/lib/tenant', () => ({
  getTenantId: vi.fn().mockResolvedValue('tenant-1'),
}))

const mockArticle = {
  id: 'art-1',
  tenant_id: 'tenant-1',
  title: { th: 'ทดสอบ', en: 'Test Article' },
  slug: 'test-article',
  status: 'draft',
  deleted_at: null,
  published_at: null,
}

function createMockSupabase(singleData = mockArticle, singleError = null) {
  return {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: singleData, error: singleError }),
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => createMockSupabase()),
}))

describe('GET /api/articles/[id]', () => {
  it('returns article when found', async () => {
    const req = new NextRequest('http://localhost/api/articles/art-1')
    const res = await GET(req, { params: mockParams })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('art-1')
  })

  it('returns 404 when article not found', async () => {
    const { createServerClient } = await import('@/lib/supabase/server')
    vi.mocked(createServerClient).mockReturnValueOnce(
      createMockSupabase(null as never, { code: 'PGRST116' } as never) as never
    )
    const req = new NextRequest('http://localhost/api/articles/not-found')
    const res = await GET(req, { params: Promise.resolve({ id: 'not-found' }) })
    expect(res.status).toBe(404)
  })

  it('returns 401 when not authenticated', async () => {
    const { requireRole } = await import('@/lib/auth')
    vi.mocked(requireRole).mockResolvedValueOnce({
      user: null,
      response: new Response(null, { status: 401 }),
    } as never)
    const req = new NextRequest('http://localhost/api/articles/art-1')
    const res = await GET(req, { params: mockParams })
    expect(res.status).toBe(401)
  })
})

describe('PATCH /api/articles/[id]', () => {
  it('updates article fields', async () => {
    const req = new NextRequest('http://localhost/api/articles/art-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: { th: 'อัปเดต' } }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: mockParams })
    expect(res.status).toBe(200)
  })

  it('returns 422 for invalid slug', async () => {
    const req = new NextRequest('http://localhost/api/articles/art-1', {
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
    conflictMock.maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'other-art' }, error: null })
    vi.mocked(createServerClient).mockReturnValueOnce(conflictMock as never)

    const req = new NextRequest('http://localhost/api/articles/art-1', {
      method: 'PATCH',
      body: JSON.stringify({ slug: 'existing-slug' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: mockParams })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.code).toBe('SLUG_CONFLICT')
  })

  it('returns 422 for invalid excerpt type (non-object)', async () => {
    const req = new NextRequest('http://localhost/api/articles/art-1', {
      method: 'PATCH',
      body: JSON.stringify({ excerpt: 'plain string not allowed' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: mockParams })
    // excerpt ต้องเป็น object { th?, en? }
    expect(res.status).toBe(422)
  })
})
```

### ข้อควรระวัง

#### 1. `excerpt` เป็น JSONB ไม่ใช่ plain string
```typescript
// ❌ ผิด — excerpt เป็น TEXT field (เดิมใน old schema)
const [excerpt, setExcerpt] = useState(article.excerpt ?? '')

// ✅ ถูก — excerpt เป็น JSONB { th?, en? }
const [excerpt, setExcerpt] = useState(article.excerpt ?? {})
// ใช้ getLocaleValue(excerpt, activeLocale) ในการแสดงผล
// ใช้ setLocaleValue(excerpt, activeLocale, value) ในการอัปเดต
```

#### 2. Story 3.3 จะ extend `ArticleEditor`
Status Card ใน story นี้แสดงแค่ badge  
Story 3.3 จะเพิ่ม Publish/Unpublish/Archive/Delete buttons  
→ comment `{/* Story 3.3 จะเพิ่ม: ... ที่นี่ */}` ไว้เป็น placeholder

#### 3. DELETE ยังไม่ implement
`route.ts` ใน story นี้มีแค่ GET + PATCH  
Story 3.3 จะเพิ่ม DELETE handler  
→ อย่าสร้าง DELETE ใน story นี้

#### 4. Cover Image อยู่บนสุดของ sidebar
สำหรับ blog, cover image สำคัญกว่าสำหรับ SEO/social sharing  
→ ใส่ Cover Image Card เป็น card แรกในซีกขวา (ต่างจาก ProjectEditor ที่ Cover อยู่ล่าง)

#### 5. `withSave` helper — `setCoverImage` ต้อง handle null
```typescript
// cover_image ลบได้ (null)
onClick={() => withSave(setCoverImage)(null)}
// withSave<string | null> — ต้องระวัง generic type inference
```

#### 6. `ArticleUpdateSchema` test — excerpt ต้องเป็น object
Validation test: `excerpt: 'plain string'` ต้องผ่าน fail (422)  
เพราะ `ArticleUpdateSchema.excerpt = LocaleStringSchema` ซึ่งต้องเป็น `{ th?, en? }`

#### 7. categories type='article' ทั้งใน page.tsx และ API
```typescript
// Page (Server Component):
.eq('type', 'article')

// NewsArticle categories ไม่ใช้ type='project'
```

### Key Learnings จาก Story 2.7

| ประเด็น | การจัดการ |
|---------|-----------|
| Pattern เหมือน ProjectEditor | copy + ลบ location/area_sqm/year + เปลี่ยน description→excerpt |
| Status actions แยก Story | Story 3.2 แค่ badge — Story 3.3 เพิ่ม buttons |
| DELETE แยก Story | route.ts ใน 3.2 มีแค่ GET+PATCH |
| Cover image อยู่บนสุด sidebar | สำคัญกว่าสำหรับ blog (SEO, social) |
| `excerpt` เป็น JSONB | LocaleStringSchema เหมือน title/description |
| `withSave` closure | handleSave ต้อง useCallback ครอบ |

### References

- FR-05: Articles edit and manage
- FR-10: Rich text editor (TiptapEditor reuse จาก Story 2.4)
- FR-11: Multi-locale (LocaleTabs reuse)
- FR-12: Auto-save (useAutoSave reuse)
- Story 2.4: `LocaleTabs`, `useAutoSave`, `SaveIndicator`
- Story 2.5: `MediaPickerModal`
- Story 2.7: Pattern เดียวกัน (ProjectEditor)
- Story 3.3: Publish/Delete จะ extend story นี้
- [Source: src/app/(admin)/blog/[id]/page.tsx] (stub — เขียนทับ)
- [Source: src/app/api/articles/[id]/route.ts] (old — เขียนทับ)
- [Source: src/lib/validations/article.ts] (เพิ่ม ArticleUpdateSchema)

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- Fixed unhandled rejection in `article-editor.test.tsx`: mock `useAutoSave.triggerSave` เพิ่ม `.catch(() => {})` กับ `onSave()` เพื่อป้องกัน unhandled rejection ใน slug conflict test

### Completion Notes List
- **Task 1**: เพิ่ม `ArticleUpdateSchema` + `ArticleUpdateInput` ใน `src/lib/validations/article.ts` — ทุก field optional, `excerpt` ใช้ `LocaleStringSchema` (JSONB)
- **Task 2**: Rewrite `src/app/api/articles/[id]/route.ts` — GET (tenant-scoped + category join), PATCH (ArticleUpdateSchema + slug conflict + published_at auto-set), ไม่มี DELETE (Story 3.3)
- **Task 3**: สร้าง `src/app/(admin)/blog/[id]/_components/article-editor.tsx` — 2-col layout, useAutoSave, LocaleTabs, MediaPickerModal, Status Card แค่ badge (Story 3.3 เพิ่ม action buttons)
- **Task 4**: Rewrite `src/app/(admin)/blog/[id]/page.tsx` — Server Component, assertRole + getTenantId + parallel fetch article+categories → notFound ถ้าไม่พบ
- **Task 5**: สร้าง tests ครบทุก AC — route.test.ts (9 cases), article-editor.test.tsx (15 cases)
- **ผลการรัน tests**: 356 passed, 0 failed, 0 errors (2026-04-11)

### File List

**Rewritten:**
- `src/app/(admin)/blog/[id]/page.tsx` (Server Component)
- `src/app/api/articles/[id]/route.ts` (GET + PATCH — ไม่มี DELETE)

**Updated:**
- `src/lib/validations/article.ts` (เพิ่ม ArticleUpdateSchema)

**New:**
- `src/app/(admin)/blog/[id]/_components/article-editor.tsx`
- `src/app/api/articles/[id]/route.test.ts`
- `src/app/(admin)/blog/[id]/_components/article-editor.test.tsx`

### Change Log
- 2026-04-11: Story 3.2 implementation complete — ArticleUpdateSchema, GET+PATCH route, ArticleEditor component, Server Component page, full test suite (356 passed)
