'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { ChevronLeft, Image as ImageIcon, Loader2 } from 'lucide-react'
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
import type { SupportedLocale } from '@/types/tenant'

type Category = { id: string; name: { th?: string; en?: string } }

type Article = {
  id: string
  title: { th?: string; en?: string } | null
  slug: string
  excerpt: { th?: string; en?: string } | null
  content: { th?: unknown; en?: unknown } | null
  category_id: string | null
  cover_image_url: string | null
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
  const [excerpt, setExcerpt] = useState(article.excerpt ?? {})
  const [content, setContent] = useState(article.content ?? {})
  const [slug, setSlug] = useState(article.slug)
  const [categoryId, setCategoryId] = useState(article.category_id ?? '')
  const [coverImage, setCoverImage] = useState<string | null>(article.cover_image_url ?? null)
  const [seoTitle, setSeoTitle] = useState(article.seo_title ?? {})
  const [seoDescription, setSeoDescription] = useState(article.seo_description ?? {})
  const [seoKeywords, setSeoKeywords] = useState(
    article.seo_keywords ?? { th: [] as string[], en: [] as string[] }
  )

  // ── UI State ─────────────────────────────────────────────────────
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>('th')
  const [coverPickerOpen, setCoverPickerOpen] = useState(false)
  const [keywordInput, setKeywordInput] = useState({ th: '', en: '' })

  const router = useRouter()
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(article.status)
  const [publishedAt, setPublishedAt] = useState<string | null>(article.published_at)
  const [isStatusChanging, setIsStatusChanging] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

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
        cover_image_url: coverImage,
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
    return (v: T) => {
      setter(v)
      triggerSave()
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

  // ── Status Change ─────────────────────────────────────────────
  async function handleStatusChange(newStatus: 'draft' | 'published' | 'archived') {
    setIsStatusChanging(true)
    try {
      const res = await fetch(`/api/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('STATUS_CHANGE_FAILED')
      const data = await res.json()
      setStatus(data.status)
      setPublishedAt(data.published_at)
      toast.success(
        newStatus === 'published'
          ? 'เผยแพร่บทความแล้ว'
          : newStatus === 'draft'
            ? 'ยกเลิกการเผยแพร่แล้ว'
            : 'เก็บถาวรบทความแล้ว'
      )
    } catch {
      toast.error('เปลี่ยนสถานะไม่สำเร็จ')
    } finally {
      setIsStatusChanging(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────
  async function handleDelete() {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/articles/${article.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('DELETE_FAILED')
      toast.success('ลบบทความแล้ว')
      router.push('/blog')
    } catch {
      toast.error('ลบบทความไม่สำเร็จ')
      setIsDeleting(false)
    }
  }

  const titleDisplay =
    getLocaleValue(article.title, 'th') || getLocaleValue(article.title, 'en') || '(ไม่มีชื่อ)'

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : null

  return (
    <div className="flex flex-col gap-5">
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/blog" className="hover:text-foreground">
            Blog
          </Link>
          <ChevronLeft className="h-3 w-3 rotate-180" />
          <span className="font-medium text-foreground truncate max-w-[200px]">{titleDisplay}</span>
        </div>
        <div className="flex items-center gap-3">
          <SaveIndicator status={saveStatus} />
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
                  ชื่อบทความ
                </Label>
                <Input
                  value={getLocaleValue(title, activeLocale) ?? ''}
                  onChange={(e) => {
                    withSave(setTitle)(setLocaleValue(title, activeLocale, e.target.value))
                  }}
                  placeholder={
                    activeLocale === 'th' ? 'ชื่อบทความภาษาไทย' : 'Article title in English'
                  }
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
                  placeholder={
                    activeLocale === 'th' ? 'สรุปบทความสั้นๆ...' : 'Short article summary...'
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
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  SEO Title
                </Label>
                <Input
                  value={getLocaleValue(seoTitle, activeLocale) ?? ''}
                  onChange={(e) =>
                    withSave(setSeoTitle)(setLocaleValue(seoTitle, activeLocale, e.target.value))
                  }
                  placeholder="Title สำหรับ Search Engine"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Meta Description
                </Label>
                <Textarea
                  value={getLocaleValue(seoDescription, activeLocale) ?? ''}
                  onChange={(e) =>
                    withSave(setSeoDescription)(
                      setLocaleValue(seoDescription, activeLocale, e.target.value)
                    )
                  }
                  placeholder="คำอธิบายสั้นสำหรับ Search Engine"
                  rows={2}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Keywords
                </Label>
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
                    onChange={(e) =>
                      setKeywordInput((prev) => ({ ...prev, [activeLocale]: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword(activeLocale))}
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
                  onClick={() => withSave<string | null>(setCoverImage)(null)}
                >
                  ลบ Cover Image
                </Button>
              )}
            </CardContent>
          </Card>

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
                {publishedAt && (
                  <span className="text-[11px] text-muted-foreground">
                    {formatDate(publishedAt)}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {status === 'draft' && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleStatusChange('published')}
                    disabled={isStatusChanging}
                  >
                    {isStatusChanging && (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    )}
                    เผยแพร่บทความ
                  </Button>
                )}

                {status === 'published' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleStatusChange('draft')}
                      disabled={isStatusChanging}
                    >
                      {isStatusChanging && (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      )}
                      ยกเลิกเผยแพร่
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleStatusChange('archived')}
                      disabled={isStatusChanging}
                    >
                      {isStatusChanging && (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      )}
                      เก็บถาวร
                    </Button>
                  </>
                )}

                {status === 'archived' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleStatusChange('published')}
                    disabled={isStatusChanging}
                  >
                    {isStatusChanging && (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    )}
                    เผยแพร่อีกครั้ง
                  </Button>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => setDeleteOpen(true)}
                  disabled={isDeleting}
                >
                  ลบบทความ
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Category Card */}
          <Card>
            <CardContent className="flex flex-col gap-2 p-4">
              <span className="text-sm font-semibold">หมวดหมู่</span>
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

      {/* ── Delete Confirmation Dialog ──────────────────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบบทความนี้?</AlertDialogTitle>
            <AlertDialogDescription>
              บทความ &quot;{titleDisplay}&quot; จะถูกลบและไม่สามารถกู้คืนได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              ยืนยันลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
