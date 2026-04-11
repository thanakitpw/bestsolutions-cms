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
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
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
    onUpdate({ editor }) {
      onChange(editor.getJSON())
    },
    // Tiptap v3: ต้องใส่สำหรับ Next.js App Router SSR safety
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
