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
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? '')}>
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
