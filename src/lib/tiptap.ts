import type { JSONContent } from '@tiptap/react'

export function serializeTiptap(content: JSONContent): JSONContent {
  // เก็บเป็น JSON object ตรงๆ ใน JSONB — ไม่แปลงเป็น HTML string
  return content
}

export function parseTiptap(raw: unknown): JSONContent {
  if (!raw || typeof raw !== 'object') {
    // Empty document
    return { type: 'doc', content: [{ type: 'paragraph' }] }
  }
  return raw as JSONContent
}
