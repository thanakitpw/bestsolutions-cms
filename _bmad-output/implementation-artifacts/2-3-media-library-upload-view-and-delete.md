# Story 2.3: Media Library — Upload, View, and Delete

Status: review

## Story

As a content editor,
I want to upload images directly from my computer, view them in a grid, and delete them,
so that I have a central media library to use across projects and articles.

## Acceptance Criteria

1. **Upload — Supabase Storage (file upload):**
   - Upload ไฟล์จากเครื่อง (drag-and-drop + click to browse)
   - รองรับ: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
   - ขนาดไฟล์สูงสุด: 10 MB
   - ไฟล์ถูก upload ไปยัง Supabase Storage bucket `media` → path: `{tenant_id}/{uuid}.{ext}`
   - หลัง upload สำเร็จ → INSERT row ลง `media_items` table พร้อม `public_url`, `storage_path`, `mime_type`, `size`, `width`, `height` (ถ้าได้)
   - แสดง progress bar ระหว่าง upload

2. **Rewrite API routes ให้ถูกต้อง:**
   - API route ปัจจุบัน (`/api/media/route.ts`, `/api/media/[id]/route.ts`) ยังใช้ `supabaseAdmin` (exported ผิด), query `from('media')` (table name ผิด — ต้องเป็น `media_items`), ไม่มี tenant isolation, ไม่มี auth check
   - **Rewrite ทั้งหมด** ให้ใช้ pattern ถูกต้อง: auth → `getTenantId()` → query `.eq('tenant_id', tenantId)` จาก `media_items`

3. **View — Media grid:**
   - แสดง thumbnail grid (5 columns desktop, 3 tablet, 2 mobile)
   - ข้อมูลต่อ card: thumbnail, filename, ขนาดไฟล์ (KB/MB), วันที่
   - Search: กรองจาก `filename` (client-side search บน results ที่ดึงมา)
   - Pagination: infinite scroll หรือ "Load more" button (limit 50 per page)

4. **Delete:**
   - กด delete → Confirmation dialog → ลบจาก Supabase Storage **และ** `media_items` table
   - Audit log: เรียก `logAuditEvent('delete', 'media', id, tenantId, userId, { filename })`

5. **alt_text editing:**
   - กด thumbnail → แสดง detail panel/dialog ด้านขวา
   - แสดง: preview รูป, filename, ขนาด, วันที่, URL (copy button)
   - Edit `alt_text.th` และ `alt_text.en` → Save (PATCH `/api/media/[id]`)

6. **Rewrite `src/app/(admin)/media/page.tsx`:**
   - เปลี่ยนจาก Client Component เดิม (ที่ call `/api/admin/media` — endpoint เก่า) เป็น pattern ใหม่
   - Server Component wrapper → ดึง media list จาก DB โดยตรง
   - Client Component `<MediaLibrary>` รับ `initialItems` prop
   - ใช้ Supabase Storage Upload (ไม่ใช่ URL input แบบเดิม)

7. **Tests:**
   - API routes: GET list (tenant isolation), POST upload (file validation), DELETE (storage + DB)
   - Component: MediaLibrary render, upload drag-and-drop interaction

## Tasks / Subtasks

- [x] Task 1: สร้าง Supabase Storage bucket (AC: #1)
  - [x] สร้าง bucket `media` ผ่าน Supabase MCP หรือ Dashboard
  - [x] ตั้ง bucket เป็น **public** (เพื่อให้ public_url ใช้ได้โดยตรง)
  - [x] Storage policy: authenticated users upload/delete ได้เฉพาะ path ขึ้นต้นด้วย `{tenant_id}/`

- [x] Task 2: Rewrite `/api/media/route.ts` — GET + POST (AC: #2, #1)
  - [x] **ลบ** code เดิมทั้งหมด — rewrite ใหม่
  - [x] GET `/api/media`: auth → `getTenantId()` → query `media_items` + `.eq('tenant_id', tenantId)` → order by `created_at DESC` → paginate (limit/offset จาก query params)
  - [x] POST `/api/media`: รับ `multipart/form-data` (ไฟล์จริง) → validate mime_type + size → upload ไป Supabase Storage → INSERT `media_items` → return row
  - [x] ใช้ `createServiceRoleClient()` สำหรับ Storage upload (bypass RLS)
  - [x] ใช้ `createServerClient()` สำหรับ `media_items` INSERT (user session)

- [x] Task 3: Rewrite `/api/media/[id]/route.ts` — GET + PATCH + DELETE (AC: #2, #4, #5)
  - [x] **ลบ** code เดิมทั้งหมด — rewrite ใหม่
  - [x] GET `/api/media/[id]`: ดึง media item เดียว (ตรวจสอบ tenant ownership)
  - [x] PATCH `/api/media/[id]`: update `alt_text` JSONB → validate → update `media_items`
  - [x] DELETE `/api/media/[id]`: ดึง `storage_path` → ลบจาก Supabase Storage → ลบจาก `media_items` → `logAuditEvent`
  - [x] ทุก handler: auth check → `getTenantId()` → verify ownership `.eq('tenant_id', tenantId)`

- [x] Task 4: อัปเดต `MediaSchema` ใน validations (AC: #1, #5)
  - [x] แก้ `src/lib/validations/media.ts` ให้ match กับ `media_items` table จริง
  - [x] เพิ่ม schema สำหรับ `altTextUpdate`: `{ th?: string, en?: string }`
  - [x] เพิ่ม file validation constants: `ALLOWED_MIME_TYPES`, `MAX_FILE_SIZE`

- [x] Task 5: Rewrite `src/app/(admin)/media/page.tsx` (AC: #6)
  - [x] เปลี่ยนเป็น **Server Component** (ลบ `'use client'`)
  - [x] ดึง initial media items จาก DB โดยตรง (ไม่ผ่าน API)
  - [x] render `<MediaLibrary initialItems={...} tenantId={tenantId} />` Client Component

- [x] Task 6: สร้าง `MediaLibrary` Client Component (AC: #3, #4, #5)
  - [x] สร้าง `src/components/media/media-library.tsx` — `'use client'`
  - [x] Grid: thumbnail cards พร้อม hover overlay (delete button)
  - [x] Search input: กรอง local state
  - [x] Load more button (fetch page 2+)
  - [x] กด thumbnail → เปิด `<MediaDetailPanel>`
  - [x] ปุ่ม Delete → เปิด Confirmation dialog → เรียก DELETE API

- [x] Task 7: สร้าง `MediaUploadZone` Client Component (AC: #1)
  - [x] สร้าง `src/components/media/media-upload-zone.tsx` — `'use client'`
  - [x] Drag-and-drop zone (HTML5 DragEvent + `<input type="file" multiple accept="image/*">`)
  - [x] Validate: mime type, file size ก่อน upload
  - [x] Upload: `FormData` → POST `/api/media` → update parent state
  - [x] Progress: indeterminate spinner (MVP — ไม่ใช้ XHR)
  - [x] หลัง upload: toast success + append ไฟล์ใหม่ใน grid

- [x] Task 8: สร้าง `MediaDetailPanel` Component (AC: #5)
  - [x] สร้าง `src/components/media/media-detail-panel.tsx`
  - [x] แสดง: preview (ใช้ `<img>` สำหรับ Supabase URL), filename, size, date, public_url
  - [x] Copy URL button (copy `public_url` ไป clipboard)
  - [x] Edit `alt_text.th` / `alt_text.en` → PATCH API → toast

- [x] Task 9: Tests (AC: #7)
  - [x] `src/app/api/media/route.test.ts` — GET (tenant isolation), POST (mime validation, size limit)
  - [x] `src/app/api/media/[id]/route.test.ts` — DELETE (storage + DB), PATCH (alt_text update)
  - [x] `src/components/media/media-library.test.tsx` — render grid, search filter

## Dev Notes

### Supabase Storage — Upload Pattern

```typescript
// src/app/api/media/route.ts — POST handler
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { getTenantId } from '@/lib/tenant'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10 MB

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(
    { error: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 }, { status: 401 }
  )

  const tenantId = await getTenantId()
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100)
  const offset = Number(searchParams.get('offset') ?? 0)

  const { data, error, count } = await supabase
    .from('media_items')
    .select('id, filename, storage_path, public_url, mime_type, size, width, height, alt_text, created_at', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json(
    { error: 'Failed to fetch media', code: 'DB_ERROR', status: 500 }, { status: 500 }
  )

  return NextResponse.json({ data: data ?? [], total: count ?? 0, limit, offset })
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(
    { error: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 }, { status: 401 }
  )

  const tenantId = await getTenantId()

  // รับ multipart/form-data
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json(
    { error: 'No file provided', code: 'NO_FILE', status: 400 }, { status: 400 }
  )

  // Validate mime type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) return NextResponse.json(
    { error: 'File type not allowed', code: 'INVALID_MIME', status: 422 }, { status: 422 }
  )

  // Validate size
  if (file.size > MAX_FILE_SIZE) return NextResponse.json(
    { error: 'File too large (max 10MB)', code: 'FILE_TOO_LARGE', status: 422 }, { status: 422 }
  )

  // Generate storage path: {tenant_id}/{uuid}.{ext}
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const uuid = crypto.randomUUID()
  const storagePath = `${tenantId}/${uuid}.${ext}`

  // Upload ไปยัง Supabase Storage (ใช้ service role — bypass Storage RLS)
  const adminClient = createServiceRoleClient()
  const arrayBuffer = await file.arrayBuffer()
  const { error: storageError } = await adminClient.storage
    .from('media')
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })

  if (storageError) return NextResponse.json(
    { error: 'Upload failed', code: 'STORAGE_ERROR', status: 500 }, { status: 500 }
  )

  // Get public URL
  const { data: { publicUrl } } = adminClient.storage
    .from('media')
    .getPublicUrl(storagePath)

  // INSERT metadata ลง media_items
  const { data: item, error: dbError } = await supabase
    .from('media_items')
    .insert({
      tenant_id: tenantId,
      filename: file.name,
      storage_path: storagePath,
      public_url: publicUrl,
      mime_type: file.type,
      size: file.size,
    })
    .select()
    .single()

  if (dbError) {
    // cleanup: ลบไฟล์จาก storage ถ้า DB insert ล้มเหลว
    await adminClient.storage.from('media').remove([storagePath])
    return NextResponse.json(
      { error: 'Failed to save media record', code: 'DB_ERROR', status: 500 }, { status: 500 }
    )
  }

  return NextResponse.json(item, { status: 201 })
}
```

### DELETE — ลบทั้ง Storage + DB

```typescript
// src/app/api/media/[id]/route.ts — DELETE handler
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(
    { error: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 }, { status: 401 }
  )

  const tenantId = await getTenantId()
  const { id } = await params

  // ดึง storage_path (ต้องรู้ก่อนลบ)
  const { data: item } = await supabase
    .from('media_items')
    .select('id, filename, storage_path')
    .eq('id', id)
    .eq('tenant_id', tenantId)  // ← tenant isolation
    .single()

  if (!item) return NextResponse.json(
    { error: 'Not found', code: 'NOT_FOUND', status: 404 }, { status: 404 }
  )

  // ลบจาก Supabase Storage (service role)
  const adminClient = createServiceRoleClient()
  const { error: storageError } = await adminClient.storage
    .from('media')
    .remove([item.storage_path])

  if (storageError) {
    console.error('[Media] Storage delete failed:', storageError)
    // ดำเนินการต่อ — ลบ DB record ได้ถึงแม้ storage fail
  }

  // ลบ DB record
  await supabase
    .from('media_items')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  // Audit log — fire-and-forget
  logAuditEvent('delete', 'media', id, tenantId, user.id, { filename: item.filename })

  return NextResponse.json({ success: true })
}
```

### PATCH — alt_text update

```typescript
// src/app/api/media/[id]/route.ts — PATCH handler
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(
    { error: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 }, { status: 401 }
  )

  const tenantId = await getTenantId()
  const { id } = await params
  const body = await request.json()

  // Validate: { alt_text: { th?: string, en?: string } }
  const AltTextSchema = z.object({
    alt_text: z.object({
      th: z.string().optional(),
      en: z.string().optional(),
    }),
  })

  const result = AltTextSchema.safeParse(body)
  if (!result.success) return NextResponse.json(
    { error: 'Validation failed', code: 'VALIDATION_ERROR', status: 422 }, { status: 422 }
  )

  const { data: updated, error } = await supabase
    .from('media_items')
    .update({ alt_text: result.data.alt_text })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) return NextResponse.json(
    { error: 'Update failed', code: 'DB_ERROR', status: 500 }, { status: 500 }
  )

  return NextResponse.json(updated)
}
```

### MediaUploadZone Component

```typescript
// src/components/media/media-upload-zone.tsx
'use client'
import { useRef, useState, useCallback } from 'react'
import { Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 10 * 1024 * 1024

type UploadItem = {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

type Props = {
  onUploaded: (item: { id: string; public_url: string; filename: string; [key: string]: unknown }) => void
}

export function MediaUploadZone({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [queue, setQueue] = useState<UploadItem[]>([])

  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) return `${file.name}: ไม่รองรับไฟล์ประเภทนี้`
    if (file.size > MAX_SIZE) return `${file.name}: ขนาดไฟล์เกิน 10 MB`
    return null
  }

  async function uploadFile(file: File, index: number) {
    setQueue(q => q.map((item, i) => i === index ? { ...item, status: 'uploading', progress: 0 } : item))

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/media', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) {
        setQueue(q => q.map((item, i) => i === index ? { ...item, status: 'error', error: json.error } : item))
        toast({ variant: 'destructive', title: json.error ?? 'Upload ล้มเหลว' })
        return
      }

      setQueue(q => q.map((item, i) => i === index ? { ...item, status: 'done', progress: 100 } : item))
      onUploaded(json)
      toast({ title: `${file.name} อัปโหลดสำเร็จ` })
    } catch {
      setQueue(q => q.map((item, i) => i === index ? { ...item, status: 'error', error: 'Network error' } : item))
    }
  }

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const validFiles: File[] = []

    Array.from(files).forEach(file => {
      const error = validateFile(file)
      if (error) {
        toast({ variant: 'destructive', title: error })
      } else {
        validFiles.push(file)
      }
    })

    if (validFiles.length === 0) return

    setQueue(prev => {
      const startIndex = prev.length
      const newItems: UploadItem[] = validFiles.map(f => ({ file: f, progress: 0, status: 'pending' }))
      // Upload ทีละไฟล์หลัง add ลง queue
      validFiles.forEach((file, i) => {
        uploadFile(file, startIndex + i)
      })
      return [...prev, ...newItems]
    })
  }, [])

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/40'
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือก</p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, GIF สูงสุด 10 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Upload Queue */}
      {queue.filter(q => q.status !== 'done').length > 0 && (
        <div className="space-y-2">
          {queue.map((item, i) => item.status !== 'done' && (
            <div key={i} className="flex items-center gap-3 rounded-md border border-border p-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.file.name}</p>
                {item.status === 'uploading' && (
                  <div className="mt-1 h-1 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
                {item.status === 'error' && (
                  <p className="text-xs text-destructive mt-0.5">{item.error}</p>
                )}
              </div>
              {item.status === 'error' && (
                <button onClick={() => setQueue(q => q.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Media Library Page — Server Component

```typescript
// src/app/(admin)/media/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { MediaLibrary } from '@/components/media/media-library'

export default async function MediaPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let tenantId: string
  try {
    tenantId = await getTenantId()
  } catch {
    redirect('/login')
  }

  const { data: initialItems } = await supabase
    .from('media_items')
    .select('id, filename, public_url, mime_type, size, width, height, alt_text, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-8 space-y-6">
      <PageHeader title="Media Library" />
      <MediaLibrary initialItems={initialItems ?? []} tenantId={tenantId} />
    </div>
  )
}
```

### MediaLibrary Client Component (โครงสร้าง)

```typescript
// src/components/media/media-library.tsx
'use client'
import { useState } from 'react'
import { Search, ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MediaUploadZone } from './media-upload-zone'
import { MediaCard } from './media-card'
import { MediaDetailPanel } from './media-detail-panel'
import { DeleteMediaDialog } from './delete-media-dialog'
import { toast } from '@/components/ui/use-toast'

type MediaItem = {
  id: string
  filename: string
  public_url: string
  mime_type: string
  size: number
  width?: number | null
  height?: number | null
  alt_text?: { th?: string; en?: string } | null
  created_at: string
}

export function MediaLibrary({ initialItems, tenantId }: { initialItems: MediaItem[]; tenantId: string }) {
  const [items, setItems] = useState(initialItems)
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null)

  // Client-side search
  const filtered = search
    ? items.filter(i => i.filename.toLowerCase().includes(search.toLowerCase()))
    : items

  function handleUploaded(newItem: MediaItem) {
    setItems(prev => [newItem, ...prev])
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/media/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems(prev => prev.filter(i => i.id !== id))
      setDeleteTarget(null)
      if (selectedItem?.id === id) setSelectedItem(null)
      toast({ title: 'ลบไฟล์แล้ว' })
    } else {
      const json = await res.json()
      toast({ variant: 'destructive', title: json.error ?? 'ลบไม่สำเร็จ' })
    }
  }

  return (
    <div className="space-y-5">
      {/* Upload Zone */}
      <MediaUploadZone onUploaded={handleUploaded as any} />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ค้นหาจากชื่อไฟล์..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-lg border border-dashed">
          <ImageIcon className="h-10 w-10 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">
            {search ? 'ไม่พบไฟล์ที่ค้นหา' : 'ยังไม่มีรูปภาพ — อัปโหลดไฟล์ด้านบน'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onClick={() => setSelectedItem(item)}
              onDelete={() => setDeleteTarget(item)}
            />
          ))}
        </div>
      )}

      {/* Detail Panel */}
      {selectedItem && (
        <MediaDetailPanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdated={(updated) => setItems(prev => prev.map(i => i.id === updated.id ? updated : i))}
          onDelete={() => { setDeleteTarget(selectedItem); setSelectedItem(null) }}
        />
      )}

      {/* Delete Dialog */}
      {deleteTarget && (
        <DeleteMediaDialog
          item={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
```

### อัปเดต MediaSchema

```typescript
// src/lib/validations/media.ts — rewrite
import { z } from 'zod'

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
export const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10 MB

export const AltTextUpdateSchema = z.object({
  alt_text: z.object({
    th: z.string().max(500).optional(),
    en: z.string().max(500).optional(),
  }),
})

export const MediaItemSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  storage_path: z.string(),
  public_url: z.string().url(),
  mime_type: z.string(),
  size: z.number().int().positive(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  alt_text: z.object({ th: z.string().optional(), en: z.string().optional() }).nullable().optional(),
  created_at: z.string(),
})

export type AltTextUpdateInput = z.infer<typeof AltTextUpdateSchema>
export type MediaItemType = z.infer<typeof MediaItemSchema>
```

### Supabase Storage — Bucket Setup

Storage bucket ต้องสร้างก่อน upload ได้ — ทำผ่าน Supabase Dashboard หรือ MCP:

```sql
-- ถ้าใช้ SQL (Supabase Storage API):
-- ทำผ่าน Dashboard: Storage → New Bucket → Name: "media" → Public: true

-- Storage RLS policy (ผ่าน Dashboard หรือ SQL):
-- Allow authenticated users to upload to their tenant folder
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES (
  'media',
  'tenant_upload',
  $$ (auth.uid() IS NOT NULL) AND (storage.foldername(name))[1] = (
    SELECT tenant_id::text FROM public.users WHERE id = auth.uid()
  ) $$
);
```

> **หมายเหตุ:** Supabase Storage policies ตั้งค่าได้ใน Dashboard → Storage → Policies  
> Path pattern: `{tenant_id}/{uuid}.{ext}` — folder name คือ tenant_id

### ข้อควรระวัง

#### 1. Rewrite ไฟล์เก่า — ห้ามต่อยอด
API route เดิม (`/api/media/route.ts`, `/api/media/[id]/route.ts`) ใช้:
- `supabaseAdmin` (exported name ผิด — ต้องใช้ `createServiceRoleClient()`)
- `from('media')` (table name ผิด — ต้องเป็น `media_items`)
- ไม่มี auth check, ไม่มี tenant isolation
- **ต้อง rewrite ทั้งหมด** — ห้าม append

#### 2. page.tsx เดิมเป็น Client Component — เปลี่ยนเป็น Server Component
เดิม `'use client'` + call `/api/admin/media` (endpoint เก่า)  
→ ลบ `'use client'` ออก → server component ดึงข้อมูลตรงจาก DB → ส่ง initial data ไป Client Component

#### 3. Storage upload ใช้ `createServiceRoleClient()` — DB insert ใช้ `createServerClient()`
- Storage: ต้องใช้ service role เพื่อ bypass Storage RLS (path policy)
- `media_items` INSERT: ใช้ user session (`createServerClient()`) — RLS จะ protect
- **อย่าใช้ service role สำหรับ DB queries ถ้าไม่จำเป็น**

#### 4. Progress bar — fetch ไม่ได้ track upload progress
`fetch()` ไม่รองรับ upload progress โดยตรง  
→ ให้แสดง indeterminate spinner แทน progress bar  
หรือใช้ `XMLHttpRequest` กับ `xhr.upload.addEventListener('progress', ...)` ถ้าต้องการ % จริง  
→ **สำหรับ MVP: indeterminate spinner พอ** — ไม่ต้องใช้ XHR

#### 5. Next.js `Image` vs `<img>` สำหรับ Supabase Storage URLs
Supabase Storage public URLs ต้องเพิ่ม domain ใน `next.config.ts`:
```typescript
// next.config.ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
  ],
}
```
→ ใช้ Next.js `<Image>` component สำหรับ thumbnail (auto-optimize)  
→ ใช้ `<img>` สำหรับ preview ในขณะ upload (URL.createObjectURL ไม่ผ่าน next/image)

### Key Learnings จาก Story 1.x–2.2

| ประเด็น | การจัดการ |
|---------|-----------|
| API routes เก่าใช้ endpoint `/api/admin/media` | Rewrite เป็น `/api/media` (ตาม architecture) |
| `supabaseAdmin` export ผิด | ใช้ `createServiceRoleClient()` เสมอ |
| table `media` ≠ `media_items` | ตาม schema จาก migration 004 — ต้อง `media_items` |
| `alt_text` เป็น JSONB `{"th":"...","en":"..."}` | ไม่ใช่ plain TEXT |
| vitest@2.1.9 + happy-dom | ใช้ pattern เดิม |

### References

- FR-32: Media upload (file types, size limit)
- FR-33: Supabase Storage integration
- FR-34: thumbnail display
- FR-35: alt_text multi-locale
- FR-36: Media delete (Storage + DB)
- FR-37: Media search
- FR-38: Audit log on delete
- [Source: _bmad-output/planning-artifacts/architecture.md#Image Processing]
- [Source: supabase/migrations/004_support_tables.sql#media_items]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- Tests 2 ล้มเหลวครั้งแรก: empty FormData และ File.size override ไม่ทำงานกับ happy-dom → แก้โดย mock `request.formData()` ด้วย `vi.spyOn`

### Completion Notes List
- สร้าง Supabase Storage bucket `media` (public, 10MB limit) ผ่าน MCP + RLS policies 3 ข้อ (tenant_upload, tenant_delete, public_read)
- Rewrite `/api/media/route.ts` — GET paginated + POST multipart upload พร้อม storage cleanup ถ้า DB fail
- Rewrite `/api/media/[id]/route.ts` — GET single + PATCH alt_text + DELETE (storage + DB + audit log)
- Rewrite `src/lib/validations/media.ts` — `ALLOWED_MIME_TYPES`, `MAX_FILE_SIZE`, `AltTextUpdateSchema`, `MediaItemSchema`
- เพิ่ม Supabase Storage remote pattern ใน `next.config.ts`
- เปลี่ยน `media/page.tsx` จาก Client Component เป็น Server Component
- สร้าง 5 components: `media-library.tsx`, `media-card.tsx`, `media-upload-zone.tsx`, `media-detail-panel.tsx`, `delete-media-dialog.tsx`
- เขียน tests 23 cases (API + Component) — 205/205 ผ่าน
- Progress bar ใช้ indeterminate spinner (ตาม Dev Notes: fetch ไม่รองรับ upload progress)

### File List
- `supabase/migrations/007_create_media_storage_bucket.sql` (via MCP)
- `next.config.ts` — เพิ่ม Supabase Storage remote patterns
- `src/lib/validations/media.ts` — rewrite
- `src/app/api/media/route.ts` — rewrite
- `src/app/api/media/[id]/route.ts` — rewrite
- `src/app/(admin)/media/page.tsx` — rewrite (Server Component)
- `src/components/media/media-library.tsx` — new
- `src/components/media/media-card.tsx` — new
- `src/components/media/media-upload-zone.tsx` — new
- `src/components/media/media-detail-panel.tsx` — new
- `src/components/media/delete-media-dialog.tsx` — new
- `src/app/api/media/route.test.ts` — new (10 tests)
- `src/app/api/media/[id]/route.test.ts` — new (7 tests)
- `src/components/media/media-library.test.tsx` — new (8 tests)

### Change Log
- 2026-04-09: Story 2.3 implementation complete — Media Library Upload/View/Delete พร้อม tenant isolation, Storage integration, tests 205/205 pass
