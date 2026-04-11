# Story 2.5: MediaPicker — Connect Editor to Media Library

Status: review

## Story

As a content editor,
I want to insert images from the Media Library directly into the rich text editor,
so that I can reuse uploaded assets without leaving the editing flow.

## Acceptance Criteria

1. **Image button ใน EditorToolbar** (`src/components/editor/editor-toolbar.tsx`):
   - เพิ่ม `Image` icon button ต่อจาก Divider button สุดท้าย
   - Click → เปิด MediaPickerModal
   - Props update: `EditorToolbar` รับ `onInsertImage?: () => void` เพิ่มเติม (optional — backward compatible)

2. **MediaPickerModal component** (`src/components/editor/media-picker-modal.tsx`):
   - เป็น Client Component (`'use client'`)
   - Props: `open: boolean`, `onClose: () => void`, `onSelect: (item: MediaItem) => void`
   - เมื่อ `open` เปลี่ยนเป็น `true` → fetch `GET /api/media?limit=100`
   - Filter: แสดงเฉพาะ `mime_type.startsWith('image/')` (กรอง PDF ออก)
   - Grid: 3-col thumbnail cards
   - แต่ละ card: square thumbnail (`<img>`) + ชื่อไฟล์ truncate
   - Click card → highlight selected (ring-2 ring-primary)
   - Footer: ปุ่ม "ยกเลิก" + ปุ่ม "เลือกรูปนี้" (disabled ถ้ายังไม่เลือก)
   - Loading state: spinner ขณะ fetch
   - Empty state: "ยังไม่มีรูปภาพ กรุณาอัปโหลดที่ Media Library ก่อน"
   - Error state: "ไม่สามารถโหลดรูปภาพได้"

3. **TiptapEditor — เพิ่ม Image extension** (`src/components/editor/tiptap-editor.tsx`):
   - Import และ configure `@tiptap/extension-image` (ติดตั้งแล้วใน Story 2.4 แต่ยังไม่ใช้)
   - Config: `inline: false, allowBase64: false`
   - HTMLAttributes: `class: 'rounded-lg max-w-full h-auto my-2'`
   - เพิ่ม state `mediaPickerOpen: boolean` ใน TiptapEditor
   - ส่ง `onInsertImage={() => setMediaPickerOpen(true)}` ให้ EditorToolbar
   - Render `<MediaPickerModal>` ภายใน TiptapEditor

4. **Image insertion logic:**
   - เมื่อ user เลือกรูปใน MediaPickerModal → `onSelect(item)` ถูกเรียก
   - TiptapEditor ดำเนินการ:
     ```typescript
     editor.chain().focus().setImage({
       src: item.public_url,
       alt: item.alt_text?.th ?? item.alt_text?.en ?? item.filename,
     }).run()
     setMediaPickerOpen(false)
     ```
   - รูปปรากฏใน editor ที่ cursor position

5. **CSS สำหรับรูปใน ProseMirror:**
   - เพิ่ม `.ProseMirror img` styles ใน `globals.css` (ต่อจาก styles เดิม)
   - Responsive + rounded + margin

6. **Export ครบ:**
   - อัปเดต `src/components/editor/index.ts` — export `MediaPickerModal`

7. **Tests:**
   - `MediaPickerModal`: render, loading, grid display, item selection, empty state
   - `EditorToolbar`: ตรวจสอบ Image button เรียก `onInsertImage`

## Tasks / Subtasks

- [x] Task 1: อัปเดต EditorToolbar (AC: #1)
  - [x] เพิ่ม prop `onInsertImage?: () => void` ใน type
  - [x] เพิ่ม `ImageIcon` import จาก `lucide-react`
  - [x] เพิ่ม `ToolbarDivider` + Image `ToolbarButton` ต่อจาก Minus button เดิม
  - [x] Image button onClick → `onInsertImage?.()`
  - [x] Image button `disabled={!onInsertImage}` เมื่อ prop ไม่ได้ถูก pass

- [x] Task 2: สร้าง MediaPickerModal (AC: #2)
  - [x] สร้าง `src/components/editor/media-picker-modal.tsx` — `'use client'`
  - [x] Define `MediaItem` type (ตาม fields ที่ GET /api/media return)
  - [x] `useEffect` fetch เมื่อ `open === true`
  - [x] useState สำหรับ: `items`, `loading`, `error`, `selectedId`
  - [x] ใช้ shadcn/ui `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`
  - [x] Grid 3-col ด้วย `overflow-y-auto max-h-[60vh]`
  - [x] แต่ละ card: `<img src={item.public_url} ... />` ขนาด square `aspect-square object-cover`
  - [x] onClick card → `setSelectedId(item.id)`
  - [x] Selected card: `ring-2 ring-primary ring-offset-2`
  - [x] ปุ่ม "เลือกรูปนี้": onClick → หา `selectedItem` → `onSelect(selectedItem)` → `onClose()`
  - [x] Reset `selectedId` เมื่อ `open` เปลี่ยนเป็น `false`

- [x] Task 3: อัปเดต TiptapEditor (AC: #3, #4)
  - [x] import `Image` จาก `@tiptap/extension-image`
  - [x] เพิ่ม `Image.configure({ inline: false, allowBase64: false, HTMLAttributes: { class: 'rounded-lg max-w-full h-auto my-2' } })` ใน extensions array
  - [x] เพิ่ม `const [mediaPickerOpen, setMediaPickerOpen] = useState(false)` — ต้องเพิ่ม `useState` import
  - [x] อัปเดต `<EditorToolbar>` call: เพิ่ม `onInsertImage={() => setMediaPickerOpen(true)}`
  - [x] เพิ่ม `<MediaPickerModal>` render ใต้ `<EditorContent>`
  - [x] Import `MediaPickerModal` จาก `'./media-picker-modal'`

- [x] Task 4: CSS สำหรับ image ใน editor (AC: #5)
  - [x] เปิด `src/app/globals.css` — เพิ่ม `.ProseMirror img` styles ต่อจาก Tiptap styles เดิม

- [x] Task 5: อัปเดต index.ts (AC: #6)
  - [x] เพิ่ม `export { MediaPickerModal } from './media-picker-modal'`
  - [x] เพิ่ม `export type { MediaItem } from './media-picker-modal'`

- [x] Task 6: Tests (AC: #7)
  - [x] สร้าง `src/components/editor/media-picker-modal.test.tsx`
  - [x] อัปเดต (หรือสร้าง) `src/components/editor/editor-toolbar.test.tsx`

## Dev Notes

### MediaItem Type

```typescript
// ตรงกับ fields ที่ GET /api/media return
export type MediaItem = {
  id: string
  filename: string
  storage_path: string
  public_url: string
  mime_type: string
  size: number
  width: number | null
  height: number | null
  alt_text: { th?: string; en?: string } | null
  created_at: string
}
```

### MediaPickerModal — Full Implementation

```typescript
// src/components/editor/media-picker-modal.tsx
'use client'
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MediaItem = {
  id: string
  filename: string
  storage_path: string
  public_url: string
  mime_type: string
  size: number
  width: number | null
  height: number | null
  alt_text: { th?: string; en?: string } | null
  created_at: string
}

type MediaPickerModalProps = {
  open: boolean
  onClose: () => void
  onSelect: (item: MediaItem) => void
}

export function MediaPickerModal({ open, onClose, onSelect }: MediaPickerModalProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Reset และ fetch เมื่อ open
  useEffect(() => {
    if (!open) {
      setSelectedId(null)
      return
    }

    setLoading(true)
    setError(null)

    fetch('/api/media?limit=100')
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed')
        return res.json() as Promise<{ data: MediaItem[] }>
      })
      .then(({ data }) => {
        // Filter เฉพาะ image types (กรอง PDF ออก)
        setItems(data.filter((item) => item.mime_type.startsWith('image/')))
      })
      .catch(() => setError('ไม่สามารถโหลดรูปภาพได้'))
      .finally(() => setLoading(false))
  }, [open])

  function handleSelect() {
    const item = items.find((i) => i.id === selectedId)
    if (!item) return
    onSelect(item)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>เลือกรูปภาพ</DialogTitle>
        </DialogHeader>

        <div className="min-h-[200px] overflow-y-auto max-h-[60vh]">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center justify-center py-16 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground text-center px-8">
              ยังไม่มีรูปภาพ กรุณาอัปโหลดที่ Media Library ก่อน
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="grid grid-cols-3 gap-3 p-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    'group relative flex flex-col gap-1.5 rounded-lg border border-border p-1.5 text-left transition-colors',
                    'hover:border-primary/50 hover:bg-muted/50',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selectedId === item.id && 'border-primary ring-2 ring-primary ring-offset-1 bg-primary/5'
                  )}
                >
                  <div className="aspect-square w-full overflow-hidden rounded-md bg-muted">
                    {/* ใช้ <img> แทน Next.js Image เพื่อหลีกเลี่ยงปัญหา config */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.public_url}
                      alt={item.alt_text?.th ?? item.alt_text?.en ?? item.filename}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="truncate text-xs text-muted-foreground px-0.5">
                    {item.filename}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={handleSelect} disabled={!selectedId}>
            เลือกรูปนี้
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### อัปเดต EditorToolbar

เพิ่ม prop `onInsertImage?: () => void` และ Image button:

```typescript
// src/components/editor/editor-toolbar.tsx
// เพิ่ม import
import { Image as ImageIcon, ... } from 'lucide-react'

// อัปเดต type
export function EditorToolbar({
  editor,
  onInsertImage,
}: {
  editor: Editor
  onInsertImage?: () => void
}) {
  // ... existing code ...

  // เพิ่ม ต่อจาก Minus (Divider) button:
  <ToolbarDivider />
  <ToolbarButton
    label="Insert Image"
    onClick={() => onInsertImage?.()}
    disabled={!onInsertImage}
  >
    <ImageIcon className="h-4 w-4" />
  </ToolbarButton>
}
```

### อัปเดต TiptapEditor

```typescript
// src/components/editor/tiptap-editor.tsx
'use client'
import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import type { JSONContent } from '@tiptap/react'
import { EditorToolbar } from './editor-toolbar'
import { MediaPickerModal } from './media-picker-modal'
import type { MediaItem } from './media-picker-modal'
import { cn } from '@/lib/utils'

// props type เหมือนเดิม — ไม่มีการเพิ่ม prop สำหรับ MediaPicker
// (TiptapEditor จัดการ state ภายในเอง)

export function TiptapEditor({ content, onChange, placeholder = 'เริ่มเขียนเนื้อหา...', className, editable = true }: TiptapEditorProps) {
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline underline-offset-2' },
      }),
      Placeholder.configure({ placeholder }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { class: 'rounded-lg max-w-full h-auto my-2' },
      }),
    ],
    content: content ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editable,
    onUpdate({ editor }) { onChange(editor.getJSON()) },
    immediatelyRender: false,
  })

  function handleImageSelect(item: MediaItem) {
    if (!editor) return
    editor.chain().focus().setImage({
      src: item.public_url,
      alt: item.alt_text?.th ?? item.alt_text?.en ?? item.filename,
    }).run()
    setMediaPickerOpen(false)
  }

  return (
    <div className={cn('rounded-lg border border-border bg-card', className)}>
      {editable && editor && (
        <EditorToolbar
          editor={editor}
          onInsertImage={() => setMediaPickerOpen(true)}
        />
      )}
      <EditorContent
        editor={editor}
        className="min-h-[300px] px-4 py-3 prose prose-sm max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[276px]"
      />
      {editable && (
        <MediaPickerModal
          open={mediaPickerOpen}
          onClose={() => setMediaPickerOpen(false)}
          onSelect={handleImageSelect}
        />
      )}
    </div>
  )
}
```

### CSS — Image ใน ProseMirror

เพิ่มใน `src/app/globals.css` ต่อจาก Tiptap styles เดิม:

```css
/* Image nodes */
.ProseMirror img {
  border-radius: 0.5rem;
  max-width: 100%;
  height: auto;
  margin: 0.5rem 0;
  display: block;
}

.ProseMirror img.ProseMirror-selectednode {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}
```

### Index.ts — อัปเดต

```typescript
// src/components/editor/index.ts
export { TiptapEditor } from './tiptap-editor'
export { EditorToolbar } from './editor-toolbar'
export { LocaleTabs } from './locale-tabs'
export { SaveIndicator } from './save-indicator'
export { MediaPickerModal } from './media-picker-modal'
export { useAutoSave } from './use-auto-save'
export type { SaveStatus } from './use-auto-save'
export type { MediaItem } from './media-picker-modal'
```

### Tests

#### MediaPickerModal Tests

```typescript
// src/components/editor/media-picker-modal.test.tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MediaPickerModal } from './media-picker-modal'

const mockImages = [
  {
    id: 'img-1',
    filename: 'photo.jpg',
    storage_path: 'tenant-1/photo.jpg',
    public_url: 'https://storage.example.com/photo.jpg',
    mime_type: 'image/jpeg',
    size: 102400,
    width: 800,
    height: 600,
    alt_text: { th: 'รูปภาพ', en: 'photo' },
    created_at: '2026-04-11T00:00:00Z',
  },
  {
    id: 'img-2',
    filename: 'logo.png',
    storage_path: 'tenant-1/logo.png',
    public_url: 'https://storage.example.com/logo.png',
    mime_type: 'image/png',
    size: 50000,
    width: 200,
    height: 200,
    alt_text: null,
    created_at: '2026-04-10T00:00:00Z',
  },
]

const mockPdf = {
  id: 'pdf-1',
  filename: 'doc.pdf',
  storage_path: 'tenant-1/doc.pdf',
  public_url: 'https://storage.example.com/doc.pdf',
  mime_type: 'application/pdf',
  size: 200000,
  width: null,
  height: null,
  alt_text: null,
  created_at: '2026-04-09T00:00:00Z',
}

describe('MediaPickerModal', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockImages }),
    } as Response)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders nothing when closed', () => {
    render(<MediaPickerModal open={false} onClose={vi.fn()} onSelect={vi.fn()} />)
    // Dialog ปิด — ไม่มี title ใน DOM
    expect(screen.queryByText('เลือกรูปภาพ')).not.toBeInTheDocument()
  })

  it('shows loading spinner on open', () => {
    // fetch ไม่ resolve ทันที
    vi.spyOn(global, 'fetch').mockReturnValue(new Promise(() => {}))
    render(<MediaPickerModal open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    // Loading indicator present
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('displays image grid after fetch', async () => {
    render(<MediaPickerModal open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('photo.jpg')).toBeInTheDocument()
      expect(screen.getByText('logo.png')).toBeInTheDocument()
    })
  })

  it('filters out non-image items (PDF)', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: [...mockImages, mockPdf] }),
    } as Response)
    render(<MediaPickerModal open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    await waitFor(() => {
      expect(screen.queryByText('doc.pdf')).not.toBeInTheDocument()
    })
  })

  it('select button is disabled until item is clicked', async () => {
    render(<MediaPickerModal open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    await waitFor(() => screen.getByText('photo.jpg'))
    expect(screen.getByRole('button', { name: 'เลือกรูปนี้' })).toBeDisabled()
  })

  it('calls onSelect with correct item and closes', async () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(<MediaPickerModal open={true} onClose={onClose} onSelect={onSelect} />)
    await waitFor(() => screen.getByText('photo.jpg'))

    // Click image card
    fireEvent.click(screen.getByText('photo.jpg').closest('button')!)
    // Click เลือกรูปนี้
    fireEvent.click(screen.getByRole('button', { name: 'เลือกรูปนี้' }))

    expect(onSelect).toHaveBeenCalledWith(mockImages[0])
    expect(onClose).toHaveBeenCalled()
  })

  it('shows empty state when no images', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response)
    render(<MediaPickerModal open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText(/ยังไม่มีรูปภาพ/)).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false } as Response)
    render(<MediaPickerModal open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('ไม่สามารถโหลดรูปภาพได้')).toBeInTheDocument()
    })
  })

  it('resets selection when closed and reopened', async () => {
    const { rerender } = render(
      <MediaPickerModal open={true} onClose={vi.fn()} onSelect={vi.fn()} />
    )
    await waitFor(() => screen.getByText('photo.jpg'))
    fireEvent.click(screen.getByText('photo.jpg').closest('button')!)
    expect(screen.getByRole('button', { name: 'เลือกรูปนี้' })).toBeEnabled()

    // Close
    rerender(<MediaPickerModal open={false} onClose={vi.fn()} onSelect={vi.fn()} />)
    // Reopen
    rerender(<MediaPickerModal open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    await waitFor(() => screen.getByText('photo.jpg'))
    // Selection should be reset
    expect(screen.getByRole('button', { name: 'เลือกรูปนี้' })).toBeDisabled()
  })
})
```

#### EditorToolbar Image Button Test

ถ้ามี `editor-toolbar.test.tsx` อยู่แล้ว: เพิ่ม test case นี้  
ถ้าไม่มี: สร้างไฟล์ใหม่

```typescript
// เพิ่มใน editor-toolbar test (หรือสร้างใหม่)
describe('EditorToolbar — image button', () => {
  it('calls onInsertImage when image button is clicked', () => {
    const mockEditor = {
      isActive: vi.fn().mockReturnValue(false),
      getAttributes: vi.fn().mockReturnValue({}),
      chain: vi.fn().mockReturnThis(),
      focus: vi.fn().mockReturnThis(),
    } as unknown as Editor

    const onInsertImage = vi.fn()
    render(<EditorToolbar editor={mockEditor} onInsertImage={onInsertImage} />)

    const imageBtn = screen.getByRole('button', { name: 'Insert Image' })
    fireEvent.click(imageBtn)
    expect(onInsertImage).toHaveBeenCalledTimes(1)
  })

  it('image button is disabled when onInsertImage is not provided', () => {
    const mockEditor = {
      isActive: vi.fn().mockReturnValue(false),
      getAttributes: vi.fn().mockReturnValue({}),
    } as unknown as Editor

    render(<EditorToolbar editor={mockEditor} />)
    const imageBtn = screen.getByRole('button', { name: 'Insert Image' })
    expect(imageBtn).toBeDisabled()
  })
})
```

### ข้อควรระวัง

#### 1. `@tiptap/extension-image` v3 — `setImage` command
Tiptap v3 ใช้ `editor.chain().focus().setImage({ src, alt }).run()`  
ถ้า `editor` เป็น `null` (ก่อน mount) ต้อง guard:
```typescript
if (!editor) return
editor.chain().focus().setImage({ src: item.public_url, alt: ... }).run()
```

#### 2. `<img>` แทน Next.js `<Image>` ในใน picker modal
ใช้ `<img>` ธรรมดาแทน `<Image>` เพื่อ:
- หลีกเลี่ยง `width`/`height` required props (ข้อมูลอาจเป็น null)
- ไม่ต้อง config `next.config.ts` remotePatterns เพิ่ม (ทำแล้วใน Story 2.3)
- ต้องเพิ่ม `{/* eslint-disable-next-line @next/next/no-img-element */}` comment ข้างบน

#### 3. Dialog vs Sheet
ใช้ `Dialog` (ไม่ใช่ `Sheet` หรือ `Drawer`) เพราะ:
- MediaPicker เป็น modal กลาง ไม่ใช่ sidebar
- `max-w-2xl` ให้ grid 3-col แสดงได้พอดี

#### 4. `ScrollArea` ไม่มีใน project
ตรวจสอบแล้ว `src/components/ui/scroll-area.tsx` **ไม่มี** — ใช้ `overflow-y-auto max-h-[60vh]` บน `<div>` แทน

#### 5. `useState` ใน TiptapEditor
TiptapEditor เดิมเป็น `'use client'` อยู่แล้ว แต่ไม่ได้ import `useState`  
ต้อง import เพิ่ม: `import { useState } from 'react'`

#### 6. Image ใน ProseMirror — node selection
เมื่อ click รูปใน editor → `ProseMirror-selectednode` class จะถูกเพิ่ม  
ต้องมี CSS สำหรับ class นี้ (outline) เพื่อ UX ที่ดี

#### 7. Tests — Dialog ใน happy-dom
shadcn/ui `Dialog` ใช้ Radix UI Portal — render ออกนอก component tree  
ถ้า test ไม่พบ Dialog content: ให้ใช้ `screen.getByRole('dialog')` แทน query ปกติ  
บางครั้ง Radix Portal ต้องการ `container: document.body` ใน render options

#### 8. `editable={false}` — ต้องซ่อน MediaPickerModal
เมื่อ `editable={false}` (read-only view):  
- toolbar ไม่แสดง (มีอยู่แล้ว)
- MediaPickerModal ต้องไม่ render ด้วย → ใช้ `{editable && <MediaPickerModal ... />}`

### Key Learnings จาก Story 2.1–2.4

| ประเด็น | การจัดการ |
|---------|-----------|
| `@tiptap/extension-image` ติดตั้งแล้ว | ไม่ต้อง install ใหม่ — แค่ import และใช้ |
| `ScrollArea` ไม่มีใน project | ใช้ `overflow-y-auto` บน div แทน |
| fetch ใน Client Component | ใช้ `useEffect` + `fetch('/api/media')` — cookies ส่งอัตโนมัติ |
| Dialog ใน happy-dom test | ใช้ `waitFor` + `screen.getByRole('dialog')` |
| `<img>` ESLint warning | ใส่ comment `eslint-disable-next-line @next/next/no-img-element` |
| เดิม TiptapEditor ไม่มี useState import | ต้องเพิ่ม `useState` เข้า React import |

### References

- FR-10: Rich text editor สำหรับ Projects
- FR-13: แทรกรูปภาพจาก Media Library ใน editor
- Story 2.3: `/api/media` GET endpoint + `media_items` schema
- Story 2.4: `TiptapEditor`, `EditorToolbar` ที่สร้างไว้แล้ว
- [Source: src/components/editor/tiptap-editor.tsx]
- [Source: src/components/editor/editor-toolbar.tsx]
- [Source: src/app/api/media/route.ts]
- [Source: src/components/ui/dialog.tsx]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

ไม่มี blocking issues — implementation ตรงตาม Dev Notes ทุกจุด

### Completion Notes List

- Task 1: เพิ่ม `onInsertImage?: () => void` prop ใน `EditorToolbar` + `ImageIcon` button พร้อม disabled state เมื่อ prop ไม่ถูก pass
- Task 2: สร้าง `MediaPickerModal` ด้วย shadcn Dialog, fetch `/api/media?limit=100`, filter image-only, 3-col grid, loading/empty/error states, selectedId highlight, reset on close
- Task 3: อัปเดต `TiptapEditor` — เพิ่ม `useState` import, `@tiptap/extension-image` configure, `mediaPickerOpen` state, ส่ง `onInsertImage` ให้ toolbar, render `<MediaPickerModal>` wrapped in `{editable && ...}`
- Task 4: เพิ่ม `.ProseMirror img` + `.ProseMirror img.ProseMirror-selectednode` styles ใน `globals.css`
- Task 5: export `MediaPickerModal` และ `MediaItem` type จาก `index.ts`
- Task 6: สร้าง `media-picker-modal.test.tsx` (9 tests) + `editor-toolbar.test.tsx` (6 tests) — ผ่าน 15/15 ไม่มี regression (253 tests total)

### File List

**New:**
- `src/components/editor/media-picker-modal.tsx`
- `src/components/editor/media-picker-modal.test.tsx`

**Modified:**
- `src/components/editor/tiptap-editor.tsx` (add Image extension + MediaPickerModal state)
- `src/components/editor/editor-toolbar.tsx` (add onInsertImage prop + Image button)
- `src/components/editor/index.ts` (export MediaPickerModal + MediaItem type)
- `src/app/globals.css` (add ProseMirror img styles)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (2-5 → review)

### Change Log

- 2026-04-11: Story 2.5 implemented — MediaPickerModal created, EditorToolbar updated with image button, TiptapEditor wired with Image extension + modal state, CSS added for ProseMirror images, index.ts exports updated, 15 new tests added (253 total passing)
