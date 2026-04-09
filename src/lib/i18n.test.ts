import { describe, it, expect } from 'vitest'
import { getLocaleValue, setLocaleValue } from './i18n'
import type { LocaleRecord } from './i18n'

describe('getLocaleValue', () => {
  it('คืนค่าตาม locale ที่ระบุ', () => {
    const record: LocaleRecord = { th: 'สวัสดี', en: 'Hello' }
    expect(getLocaleValue(record, 'th')).toBe('สวัสดี')
    expect(getLocaleValue(record, 'en')).toBe('Hello')
  })

  it('คืน undefined ถ้า locale ไม่มีค่า', () => {
    const record: LocaleRecord = { th: 'สวัสดี' }
    expect(getLocaleValue(record, 'en')).toBeUndefined()
  })

  it('คืนค่า fallback locale ถ้า locale หลักไม่มีค่า', () => {
    const record: LocaleRecord = { th: 'สวัสดี' }
    expect(getLocaleValue(record, 'en', 'th')).toBe('สวัสดี')
  })

  it('คืน undefined ถ้า record เป็น null', () => {
    expect(getLocaleValue(null, 'th')).toBeUndefined()
  })

  it('คืน undefined ถ้า record เป็น undefined', () => {
    expect(getLocaleValue(undefined, 'th')).toBeUndefined()
  })

  it('คืน undefined ถ้าทั้ง locale และ fallback ไม่มีค่า', () => {
    const record: LocaleRecord = {}
    expect(getLocaleValue(record, 'en', 'th')).toBeUndefined()
  })

  it('ทำงานกับ generic type ที่ไม่ใช่ string', () => {
    const record: LocaleRecord<number> = { th: 42, en: 100 }
    expect(getLocaleValue(record, 'th')).toBe(42)
  })
})

describe('setLocaleValue', () => {
  it('เพิ่ม locale value ใหม่', () => {
    const record: LocaleRecord = { th: 'สวัสดี' }
    const result = setLocaleValue(record, 'en', 'Hello')
    expect(result).toEqual({ th: 'สวัสดี', en: 'Hello' })
  })

  it('อัปเดต locale value ที่มีอยู่แล้ว', () => {
    const record: LocaleRecord = { th: 'สวัสดี', en: 'Hi' }
    const result = setLocaleValue(record, 'en', 'Hello')
    expect(result).toEqual({ th: 'สวัสดี', en: 'Hello' })
  })

  it('ทำงานได้ถ้า record เป็น null', () => {
    const result = setLocaleValue(null, 'th', 'สวัสดี')
    expect(result).toEqual({ th: 'สวัสดี' })
  })

  it('ทำงานได้ถ้า record เป็น undefined', () => {
    const result = setLocaleValue(undefined, 'en', 'Hello')
    expect(result).toEqual({ en: 'Hello' })
  })

  it('ไม่แก้ไข original record (immutable)', () => {
    const original: LocaleRecord = { th: 'สวัสดี' }
    setLocaleValue(original, 'en', 'Hello')
    expect(original).toEqual({ th: 'สวัสดี' })
  })
})
