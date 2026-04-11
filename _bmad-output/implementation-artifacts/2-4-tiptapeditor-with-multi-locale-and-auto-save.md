# Story 2.4: TiptapEditor with Multi-locale and Auto-save

Status: review

## Story

As a content editor,
I want a rich text editor that supports Thai and English content in separate tabs with auto-save,
so that I can write bilingual content without losing my work.

## Acceptance Criteria

1. **TiptapEditor component** (`src/components/editor/tiptap-editor.tsx`):
   - Toolbar: Bold, Italic, Underline, Heading 2, Heading 3, Bullet List, Ordered List, Blockquote, Divider, Link (insert/remove)
   - Placeholder text แสดงเมื่อ editor ว่าง
   - Content เก็บ/รับเป็น Tiptap `JSONContent` object (ไม่ใช่ HTML string)
   - `onChange(json: JSONContent)` callback เรียกเมื่อเนื้อหาเปลี่ยน
   - Styling: border rounded, min-height 300px, prose-like typography ด้วย Tailwind

2. **LocaleTabs component** (`src/components/editor/locale-tabs.tsx`):
   - Tab 2 ภาษา: **TH** | **EN**
   - เปลี่ยน tab → editor แสดง content ของภาษานั้น
   - Content แต่ละภาษาแยกกันสนิท — ไม่ share state
   - Props: `value: { th?: JSONContent; en?: JSONContent }`, `onChange(locale, json)`, `placeholder?: { th?: string; en?: string }`

3. **Auto-save hook** (`src/components/editor/use-auto-save.ts`):
   - Debounce 2 วินาที หลังผู้ใช้หยุดพิมพ์
   - แสดง indicator: `● Saving...` → `✓ Saved` (หายไปหลัง 3 วินาที) → เงียบ
   - Error state: `⚠ Save failed` (แสดงนาน)
   - Returns `{ saveStatus, triggerSave }` — ผู้ใช้ hook นี้ส่ง async save function เข้ามา
   - **ไม่ผูก** กับ API โดยตรง — รับ `onSave: () => Promise<void>` เป็น param

4. **SaveIndicator component** (`src/components/editor/save-indicator.tsx`):
   - แสดง save status อย่างเดียว (ไม่มี logic)
   - Props: `status: 'idle' | 'saving' | 'saved' | 'error'`
   - ขนาดเล็ก text-xs, เปลี่ยนสีตาม status

5. **Tiptap v3 compatibility:**
   - Package ที่ install แล้ว: `@tiptap/react@^3`, `@tiptap/starter-kit@^3`, `@tiptap/extension-link@^3`, `@tiptap/extension-underline@^3`, `@tiptap/extension-placeholder@^3`
   - `@tiptap/extension-image` install แล้วแต่ **ยังไม่ใช้ใน story นี้** (Story 2.5 — MediaPicker)
   - ตรวจสอบ Tiptap v3 API differences จาก v2 (ถ้ามี)

6. **Export ครบจาก index:**
   - สร้าง `src/components/editor/index.ts` — export ทุก component ใน folder

7. **Tests:**
   - `TiptapEditor` render + onChange callback
   - `LocaleTabs` tab switching — content per locale ไม่ปนกัน
   - `useAutoSave` debounce behavior, status transitions

## Tasks / Subtasks

- [x] Task 1: สร้าง TiptapEditor component (AC: #1, #5)
  - [x] สร้าง `src/components/editor/tiptap-editor.tsx` — `'use client'`
  - [x] Setup extensions: `StarterKit`, `Underline`, `Link`, `Placeholder`
  - [x] Toolbar buttons ตาม AC#1 (icon จาก `lucide-react`)
  - [x] Active state: toolbar button highlight เมื่อ cursor อยู่ใน heading/bold/etc.
  - [x] Props: `content?: JSONContent`, `onChange: (json: JSONContent) => void`, `placeholder?: string`, `className?: string`, `editable?: boolean` (default true)
  - [x] `key` prop ต้องเปลี่ยนเมื่อ locale เปลี่ยน เพื่อ re-mount editor (ไม่ใช้ `setContent`)

- [x] Task 2: สร้าง LocaleTabs component (AC: #2)
  - [x] สร้าง `src/components/editor/locale-tabs.tsx` — `'use client'`
  - [x] ใช้ shadcn/ui `Tabs` component
  - [x] แต่ละ tab render `TiptapEditor` ของตัวเอง (mount/unmount เมื่อ switch tab)
  - [x] Pass `key={locale}` ให้ TiptapEditor เพื่อ re-mount เมื่อ switch
  - [x] Props: `value: LocaleJsonContent`, `onChange: (locale: SupportedLocale, json: JSONContent) => void`, `placeholder?: Partial<Record<SupportedLocale, string>>`, `className?: string`

- [x] Task 3: สร้าง useAutoSave hook (AC: #3)
  - [x] สร้าง `src/components/editor/use-auto-save.ts`
  - [x] รับ param: `onSave: () => Promise<void>`, `delay?: number` (default 2000ms)
  - [x] ใช้ `useRef` สำหรับ debounce timeout
  - [x] Returns: `{ saveStatus: 'idle' | 'saving' | 'saved' | 'error', triggerSave: () => void }`
  - [x] `triggerSave()` → cancel previous timeout → set new timeout 2s → เมื่อ run: set 'saving' → call onSave() → set 'saved' → timeout 3s → set 'idle'
  - [x] Error: onSave() throw → set 'error' (ไม่ auto-reset)

- [x] Task 4: สร้าง SaveIndicator component (AC: #4)
  - [x] สร้าง `src/components/editor/save-indicator.tsx`
  - [x] Pure display component — ไม่มี logic
  - [x] Status colors: `saving` = muted, `saved` = green-600, `error` = destructive, `idle` = hidden

- [x] Task 5: สร้าง index.ts (AC: #6)
  - [x] สร้าง `src/components/editor/index.ts`
  - [x] Export: `TiptapEditor`, `LocaleTabs`, `SaveIndicator`, `useAutoSave`

- [x] Task 6: Tests (AC: #7)
  - [x] `src/components/editor/tiptap-editor.test.tsx`
  - [x] `src/components/editor/locale-tabs.test.tsx`
  - [x] `src/components/editor/use-auto-save.test.ts`

## Dev Notes

### Tiptap v3 Setup

```typescript
// src/components/editor/tiptap-editor.tsx
'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import type { JSONContent } from '@tiptap/react'
import { EditorToolbar } from './editor-toolbar'
import { cn } from '@/lib/utils'

type TiptapEditorProps = {
  content?: JSONContent
  onChange: (json: JSONContent) => void
  placeholder?: string
  className?: string
  editable?: boolean
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = 'เริ่มเขียนเนื้อหา...',
  className,
  editable = true,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // StarterKit v3: ไม่ต้องปิด dropcursor/gapcursor แยก
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline underline-offset-2' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: content ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editable,
    onUpdate({ editor }) {
      onChange(editor.getJSON())
    },
    // Tiptap v3: ใช้ immediatelyRender: false สำหรับ SSR safety
    immediatelyRender: false,
  })

  return (
    <div className={cn('rounded-lg border border-border bg-card', className)}>
      {editable && editor && <EditorToolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className="min-h-[300px] px-4 py-3 prose prose-sm max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[276px]"
      />
    </div>
  )
}
```

> **Tiptap v3 SSR:** ต้องใส่ `immediatelyRender: false` เพื่อป้องกัน hydration mismatch ใน Next.js App Router

### EditorToolbar Component

```typescript
// src/components/editor/editor-toolbar.tsx
'use client'
import type { Editor } from '@tiptap/react'
import { cn } from '@/lib/utils'
import {
  Bold, Italic, Underline as UnderlineIcon, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Link as LinkIcon, Unlink,
} from 'lucide-react'

type ToolbarButtonProps = {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
  label: string
}

function ToolbarButton({ onClick, active, disabled, children, label }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors',
        'hover:bg-muted hover:text-foreground',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        active && 'bg-muted text-foreground'
      )}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="mx-1 h-5 w-px bg-border" />
}

export function EditorToolbar({ editor }: { editor: Editor }) {
  function setLink() {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL', prev ?? 'https://')
    if (url === null) return  // cancelled
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5">
      {/* Text formatting */}
      <ToolbarButton label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}>
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarButton label="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton label="Bullet List" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Ordered List" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
        <Quote className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Link */}
      <ToolbarButton label="Insert Link" onClick={setLink} active={editor.isActive('link')}>
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Remove Link"
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
      >
        <Unlink className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Horizontal Rule */}
      <ToolbarButton label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="h-4 w-4" />
      </ToolbarButton>
    </div>
  )
}
```

### LocaleTabs Component

```typescript
// src/components/editor/locale-tabs.tsx
'use client'
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TiptapEditor } from './tiptap-editor'
import type { JSONContent } from '@tiptap/react'
import type { SupportedLocale } from '@/types/tenant'

type LocaleJsonContent = Partial<Record<SupportedLocale, JSONContent>>

type LocaleTabsProps = {
  value: LocaleJsonContent
  onChange: (locale: SupportedLocale, json: JSONContent) => void
  placeholder?: Partial<Record<SupportedLocale, string>>
  className?: string
  editable?: boolean
}

export function LocaleTabs({
  value,
  onChange,
  placeholder,
  className,
  editable = true,
}: LocaleTabsProps) {
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>('th')

  return (
    <Tabs value={activeLocale} onValueChange={(v) => setActiveLocale(v as SupportedLocale)}>
      <TabsList className="mb-2">
        <TabsTrigger value="th">ภาษาไทย</TabsTrigger>
        <TabsTrigger value="en">English</TabsTrigger>
      </TabsList>

      {(['th', 'en'] as SupportedLocale[]).map((locale) => (
        <TabsContent key={locale} value={locale} className={className}>
          {/* key={locale} บน TiptapEditor ทำให้ re-mount เมื่อ switch tab */}
          <TiptapEditor
            key={locale}
            content={value[locale]}
            onChange={(json) => onChange(locale, json)}
            placeholder={placeholder?.[locale]}
            editable={editable}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}
```

> **หมายเหตุ:** ใช้ `key={locale}` บน `TiptapEditor` เพื่อบังคับ re-mount editor ทุกครั้งที่ switch locale  
> ไม่ใช้ `editor.commands.setContent()` เพราะทำให้ history ปนกันระหว่าง locale

### useAutoSave Hook

```typescript
// src/components/editor/use-auto-save.ts
import { useRef, useState, useCallback } from 'react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type UseAutoSaveOptions = {
  onSave: () => Promise<void>
  delay?: number  // milliseconds, default 2000
}

type UseAutoSaveReturn = {
  saveStatus: SaveStatus
  triggerSave: () => void
  saveNow: () => Promise<void>  // manual immediate save
}

export function useAutoSave({ onSave, delay = 2000 }: UseAutoSaveOptions): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const executeSave = useCallback(async () => {
    setSaveStatus('saving')
    try {
      await onSave()
      setSaveStatus('saved')
      // Reset to idle หลัง 3 วินาที
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 3000)
    } catch {
      setSaveStatus('error')
    }
  }, [onSave])

  const triggerSave = useCallback(() => {
    // Cancel pending debounce
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)

    // Schedule save
    debounceRef.current = setTimeout(executeSave, delay)
  }, [executeSave, delay])

  const saveNow = useCallback(async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    await executeSave()
  }, [executeSave])

  return { saveStatus, triggerSave, saveNow }
}
```

### SaveIndicator Component

```typescript
// src/components/editor/save-indicator.tsx
import { cn } from '@/lib/utils'
import type { SaveStatus } from './use-auto-save'

type SaveIndicatorProps = {
  status: SaveStatus
  className?: string
}

const CONFIG: Record<SaveStatus, { text: string; className: string }> = {
  idle:   { text: '',             className: 'opacity-0' },
  saving: { text: '● Saving...', className: 'text-muted-foreground' },
  saved:  { text: '✓ Saved',     className: 'text-green-600' },
  error:  { text: '⚠ Save failed', className: 'text-destructive' },
}

export function SaveIndicator({ status, className }: SaveIndicatorProps) {
  const { text, className: statusClass } = CONFIG[status]
  return (
    <span
      className={cn(
        'text-xs transition-opacity duration-300',
        statusClass,
        className
      )}
      aria-live="polite"
    >
      {text}
    </span>
  )
}
```

### การใช้งานร่วมกัน (ตัวอย่างจาก Story 2.6)

```typescript
// ตัวอย่างการใช้ใน project editor (Stories 2.6/2.7 จะ implement จริง)
'use client'
import { useState, useCallback } from 'react'
import { LocaleTabs } from '@/components/editor'
import { SaveIndicator, useAutoSave } from '@/components/editor'
import type { JSONContent } from '@tiptap/react'
import type { SupportedLocale } from '@/types/tenant'

export function ProjectContentEditor({ projectId }: { projectId: string }) {
  const [content, setContent] = useState<Partial<Record<SupportedLocale, JSONContent>>>({})

  const handleSave = useCallback(async () => {
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
  }, [content, projectId])

  const { saveStatus, triggerSave } = useAutoSave({ onSave: handleSave })

  function handleContentChange(locale: SupportedLocale, json: JSONContent) {
    setContent(prev => ({ ...prev, [locale]: json }))
    triggerSave()
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Content</span>
        <SaveIndicator status={saveStatus} />
      </div>
      <LocaleTabs
        value={content}
        onChange={handleContentChange}
        placeholder={{ th: 'เริ่มเขียนเนื้อหา...', en: 'Start writing content...' }}
      />
    </div>
  )
}
```

### Tiptap v3 CSS — Editor Prose Styles

เพิ่ม CSS สำหรับ editor content ใน `globals.css`:

```css
/* Tiptap editor prose styles */
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: hsl(var(--muted-foreground));
  pointer-events: none;
  height: 0;
}

.ProseMirror {
  > * + * { margin-top: 0.75em; }

  h2 { font-size: 1.25rem; font-weight: 600; line-height: 1.4; }
  h3 { font-size: 1.1rem; font-weight: 600; line-height: 1.4; }
  p { line-height: 1.7; }

  ul { list-style-type: disc; padding-left: 1.5rem; }
  ol { list-style-type: decimal; padding-left: 1.5rem; }
  li { margin-top: 0.25rem; }

  blockquote {
    border-left: 3px solid hsl(var(--border));
    padding-left: 1rem;
    color: hsl(var(--muted-foreground));
    font-style: italic;
    margin: 1rem 0;
  }

  hr { border: none; border-top: 1px solid hsl(var(--border)); margin: 1.5rem 0; }

  a { color: hsl(var(--primary)); text-decoration: underline; text-underline-offset: 2px; }
}
```

### index.ts — Barrel Export

```typescript
// src/components/editor/index.ts
export { TiptapEditor } from './tiptap-editor'
export { EditorToolbar } from './editor-toolbar'
export { LocaleTabs } from './locale-tabs'
export { SaveIndicator } from './save-indicator'
export { useAutoSave } from './use-auto-save'
export type { SaveStatus } from './use-auto-save'
```

### ข้อควรระวัง

#### 1. `immediatelyRender: false` — บังคับสำหรับ Next.js App Router
ถ้าไม่ใส่ → hydration mismatch error ใน development  
Tiptap v3 เพิ่ม option นี้มาโดยเฉพาะสำหรับ SSR frameworks

#### 2. `key={locale}` แทน `setContent()`
```typescript
// ❌ อย่าทำ — share editor instance ระหว่าง locale, history ปนกัน
<TiptapEditor content={value[activeLocale]} ... />

// ✅ ถูก — re-mount editor ใหม่ทุกครั้ง
<TiptapEditor key={locale} content={value[locale]} ... />
```

#### 3. `react-hook-form` ยังไม่ได้ install
`package.json` ไม่มี `react-hook-form` หรือ `@hookform/resolvers`  
Story นี้ไม่ต้องใช้ (TiptapEditor ไม่ผ่าน RHF)  
→ Project form (Story 2.6) จะ install ถ้าจำเป็น

#### 4. Tiptap `@tiptap/extension-image` — ยังไม่ใช้
Install แล้วแต่ MediaPicker integration อยู่ใน Story 2.5  
→ ห้าม configure Image extension ใน Story นี้ (จะทำให้ Story 2.5 ซับซ้อนกว่า)

#### 5. Window.prompt สำหรับ Link — เพียงพอสำหรับ MVP
การใช้ `window.prompt()` สำหรับ insert link ง่ายที่สุดและเพียงพอ  
→ ถ้าต้องการ custom dialog ให้ทำใน Epic 3+ (ไม่ใช่ story นี้)

#### 6. Tests — Tiptap กับ happy-dom
Tiptap ใช้ browser APIs หลายตัว — happy-dom รองรับส่วนใหญ่แต่อาจ fail บางส่วน  
→ ถ้า test ล้มเหลวเพราะ editor DOM: ให้ mock `useEditor()` return null แล้วทดสอบเฉพาะ props rendering  
→ `useAutoSave` test ด้วย `vi.useFakeTimers()` เพื่อควบคุม debounce timing

```typescript
// ตัวอย่าง: mock useEditor สำหรับ unit test
vi.mock('@tiptap/react', () => ({
  useEditor: () => null,
  EditorContent: ({ className }: { className?: string }) =>
    <div data-testid="editor-content" className={className} />,
}))
```

#### 7. Auto-save และ `onSave` closure
`onSave` prop ใน `useAutoSave` ต้อง wrap ด้วย `useCallback` ฝั่ง caller  
→ ไม่เช่นนั้น `triggerSave` จะถูก recreate ทุก render → debounce ไม่ทำงาน

### Key Learnings จาก Story 1.x–2.3

| ประเด็น | การจัดการ |
|---------|-----------|
| Tiptap ติดตั้ง v3 แล้ว (ไม่ใช่ v2) | ใช้ v3 API: `immediatelyRender: false` |
| `components/editor/` directory ว่างอยู่ | สร้างทุกไฟล์ใหม่ทั้งหมด |
| existing `RichTextEditor` ใน admin/ | Story นี้ไม่แตะ — ปล่อยไว้ (Story 2.6 จะ replace) |
| vitest@2.1.9 + happy-dom | mock `useEditor` ถ้า DOM API fail |
| `sonner` สำหรับ toast | SaveIndicator ไม่ใช้ toast — เป็น inline indicator |

### References

- FR-10: Rich text editor สำหรับ Projects
- FR-11: Multi-locale content (th/en)
- FR-12: Auto-save with visual indicator
- FR-20: Rich text editor สำหรับ Articles (ใช้ component เดียวกัน)
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: src/lib/tiptap.ts]
- [Source: src/lib/i18n.ts]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (2026-04-11)

### Debug Log References

- **TiptapEditor test**: mock `useEditor` return null — happy-dom ไม่รองรับ browser APIs ที่ Tiptap ต้องการ (ตาม Dev Notes ข้อ 6)
- **LocaleTabs test**: shadcn/ui Tabs ใช้ `aria-selected` แทน `data-state` ใน happy-dom — แก้ test assertion accordingly
- **SaveIndicator test**: `<span aria-live>` ไม่มี implicit role="status" ใน happy-dom — ใช้ `querySelector('[aria-live]')` แทน `getByRole('status')`

### Completion Notes List

- ✅ Task 1: สร้าง `editor-toolbar.tsx` + `tiptap-editor.tsx` พร้อม Tiptap v3 config (`immediatelyRender: false` สำหรับ SSR) — 7 tests pass
- ✅ Task 2: สร้าง `locale-tabs.tsx` ด้วย shadcn/ui Tabs, `key={locale}` บน TiptapEditor เพื่อ re-mount แทน setContent — 7 tests pass
- ✅ Task 3: สร้าง `use-auto-save.ts` hook พร้อม debounce 2s, saved→idle reset 3s, error no-reset — 12 tests pass
- ✅ Task 4: สร้าง `save-indicator.tsx` pure display component พร้อม aria-live="polite" — 7 tests pass
- ✅ Task 5: สร้าง `index.ts` barrel export ทุก component
- ✅ Task 6: Tests ครอบคลุม AC#1–7 ทั้งหมด
- ✅ เพิ่ม Tiptap ProseMirror CSS ใน `globals.css`
- ✅ Full test suite: 238/238 tests pass, zero regressions

### File List

- `src/components/editor/tiptap-editor.tsx` (new)
- `src/components/editor/editor-toolbar.tsx` (new)
- `src/components/editor/locale-tabs.tsx` (new)
- `src/components/editor/use-auto-save.ts` (new)
- `src/components/editor/save-indicator.tsx` (new)
- `src/components/editor/index.ts` (new)
- `src/components/editor/tiptap-editor.test.tsx` (new)
- `src/components/editor/locale-tabs.test.tsx` (new)
- `src/components/editor/use-auto-save.test.ts` (new)
- `src/components/editor/save-indicator.test.tsx` (new)
- `src/app/globals.css` (modified — เพิ่ม Tiptap ProseMirror styles)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified — 2-4 → review)

### Change Log

- 2026-04-11: Story 2.4 implemented — TiptapEditor, LocaleTabs, useAutoSave, SaveIndicator, EditorToolbar components created with full tests (33 new tests, 238 total pass)
