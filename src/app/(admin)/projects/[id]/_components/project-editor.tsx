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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
  area: string | null
  year: number | null
  cover_image_url: string | null
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
  const [areaSqm, setAreaSqm] = useState<string>(
    project.area ?? ''
  )
  const [year, setYear] = useState<string>(project.year != null ? String(project.year) : '')
  const [coverImage, setCoverImage] = useState(project.cover_image_url ?? null)
  const [status, setStatus] = useState(project.status)
  const [seoTitle, setSeoTitle] = useState(project.seo_title ?? {})
  const [seoDescription, setSeoDescription] = useState(project.seo_description ?? {})
  const [seoKeywords, setSeoKeywords] = useState(
    project.seo_keywords ?? { th: [], en: [] }
  )

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
        area: areaSqm || null,
        year: year ? Number(year) : null,
        cover_image_url: coverImage,
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_keywords: seoKeywords,
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      if (data.code === 'SLUG_CONFLICT') {
        toast.error('Slug นี้ถูกใช้ไปแล้ว กรุณาเปลี่ยน slug')
      }
      throw new Error(data.code ?? 'SAVE_FAILED')
    }
  }, [
    project.id,
    title,
    description,
    content,
    slug,
    categoryId,
    location,
    areaSqm,
    year,
    coverImage,
    seoTitle,
    seoDescription,
    seoKeywords,
  ])

  const { saveStatus, triggerSave } = useAutoSave({ onSave: handleSave })

  // ── Helper: trigger save after state change ───────────────────────
  function withSave<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v)
      triggerSave()
    }
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
      const label = {
        draft: 'ย้ายเป็น Draft สำเร็จ',
        published: 'Publish สำเร็จ',
        archived: 'Archive สำเร็จ',
      }
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
    setSeoKeywords((prev) => ({ ...prev, [locale]: [...current, kw] }))
    setKeywordInput((prev) => ({ ...prev, [locale]: '' }))
    triggerSave()
  }

  function removeKeyword(locale: SupportedLocale, kw: string) {
    setSeoKeywords((prev) => ({
      ...prev,
      [locale]: (prev[locale] ?? []).filter((k) => k !== kw),
    }))
    triggerSave()
  }

  const titleDisplay =
    getLocaleValue(project.title, 'th') || getLocaleValue(project.title, 'en') || '(ไม่มีชื่อ)'

  return (
    <div className="flex flex-col gap-5">
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/projects" className="hover:text-foreground">
            Projects
          </Link>
          <ChevronLeft className="h-3 w-3 rotate-180" />
          <span className="max-w-[200px] truncate font-medium text-foreground">
            {titleDisplay}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <SaveIndicator status={saveStatus} />
          {status === 'published' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeStatus('draft')}
              disabled={publishing}
            >
              Unpublish
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => changeStatus('published')}
              disabled={publishing}
            >
              {publishing ? 'กำลัง Publish...' : 'Publish'}
            </Button>
          )}
        </div>
      </div>

      {/* ── Main 2-col Layout ────────────────────────────────────── */}
      <div className="flex items-start gap-6">
        {/* Left — Main Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {/* Content Card */}
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold">เนื้อหาโปรเจกต์</span>
                <Tabs
                  value={activeLocale}
                  onValueChange={(v) => setActiveLocale(v as SupportedLocale)}
                >
                  <TabsList>
                    <TabsTrigger value="th">ภาษาไทย</TabsTrigger>
                    <TabsTrigger value="en">English</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  ชื่อโปรเจกต์
                </Label>
                <Input
                  value={getLocaleValue(title, activeLocale) ?? ''}
                  onChange={(e) => {
                    const updated = setLocaleValue(title, activeLocale, e.target.value)
                    withSave(setTitle)(updated)
                  }}
                  placeholder={
                    activeLocale === 'th' ? 'ชื่อโปรเจกต์ภาษาไทย' : 'Project name in English'
                  }
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  คำอธิบายย่อ
                </Label>
                <Textarea
                  value={getLocaleValue(description, activeLocale) ?? ''}
                  onChange={(e) => {
                    const updated = setLocaleValue(description, activeLocale, e.target.value)
                    withSave(setDescription)(updated)
                  }}
                  placeholder={
                    activeLocale === 'th' ? 'คำอธิบายโปรเจกต์...' : 'Project description...'
                  }
                  rows={3}
                />
              </div>

              {/* Rich Text Content */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  เนื้อหา
                </Label>
                <LocaleTabs
                  value={content as Record<SupportedLocale, JSONContent>}
                  onChange={(locale, json) => {
                    const updated = { ...content, [locale]: json }
                    withSave(setContent)(updated)
                  }}
                  placeholder={{
                    th: 'เขียนเนื้อหาโปรเจกต์ภาษาไทย...',
                    en: 'Write project content in English...',
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
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  SEO Title
                </Label>
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
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Meta Description
                </Label>
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
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Keywords
                </Label>
                <div className="mb-1 flex flex-wrap gap-1.5">
                  {(seoKeywords[activeLocale] ?? []).map((kw) => (
                    <Badge key={kw} variant="secondary" className="gap-1 text-[11px]">
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
                    onChange={(e) =>
                      setKeywordInput((prev) => ({ ...prev, [activeLocale]: e.target.value }))
                    }
                    onKeyDown={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), addKeyword(activeLocale))
                    }
                    placeholder="+ เพิ่ม keyword แล้ว Enter"
                    className="text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addKeyword(activeLocale)}
                  >
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
                <Badge
                  variant={
                    status === 'published'
                      ? 'default'
                      : status === 'archived'
                        ? 'secondary'
                        : 'outline'
                  }
                >
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
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Slug
                </Label>
                <Input
                  value={slug}
                  onChange={(e) => withSave(setSlug)(e.target.value)}
                  className="h-8 font-mono text-xs"
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  หมวดหมู่
                </Label>
                <Select value={categoryId} onValueChange={(v) => withSave(setCategoryId)(v ?? '')}>
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
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    พื้นที่ (ตร.ม.)
                  </Label>
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
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    ปี
                  </Label>
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
                  className="w-full text-xs text-muted-foreground"
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

      <MediaPickerModal
        open={coverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        onSelect={handleCoverSelect}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบโปรเจกต์</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบ &quot;{titleDisplay}&quot; ใช่หรือไม่? โปรเจกต์จะถูกซ่อนจากระบบ (soft
              delete)
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
