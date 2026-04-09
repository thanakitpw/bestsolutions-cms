import { describe, it, expect } from 'vitest'
import { serializeTiptap, parseTiptap } from './tiptap'
import type { JSONContent } from '@tiptap/react'

describe('serializeTiptap', () => {
  it('คืน JSON object เดิมโดยไม่แปลง', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
    }
    expect(serializeTiptap(content)).toEqual(content)
  })

  it('คืน object เดิม (reference equality)', () => {
    const content: JSONContent = { type: 'doc', content: [] }
    expect(serializeTiptap(content)).toBe(content)
  })
})

describe('parseTiptap', () => {
  it('คืน JSONContent จาก object ที่ถูกต้อง', () => {
    const raw = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
    }
    expect(parseTiptap(raw)).toEqual(raw)
  })

  it('คืน empty document ถ้า raw เป็น null', () => {
    const result = parseTiptap(null)
    expect(result).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] })
  })

  it('คืน empty document ถ้า raw เป็น undefined', () => {
    const result = parseTiptap(undefined)
    expect(result).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] })
  })

  it('คืน empty document ถ้า raw เป็น string', () => {
    const result = parseTiptap('invalid')
    expect(result).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] })
  })

  it('คืน empty document ถ้า raw เป็น number', () => {
    const result = parseTiptap(42)
    expect(result).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] })
  })

  it('serialize → parse round-trip ผ่าน', () => {
    const original: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'สวัสดี ภาษาไทย' }],
        },
      ],
    }
    const serialized = serializeTiptap(original)
    const parsed = parseTiptap(serialized)
    expect(parsed).toEqual(original)
  })
})
