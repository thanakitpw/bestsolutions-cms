import { describe, it, expect } from 'vitest'
import { slugify, generateSlug } from './slugify'

describe('slugify', () => {
  it('แปลง English title เป็น slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('ลบ special characters', () => {
    expect(slugify('Project #1!')).toBe('project-1')
  })

  it('ลบ leading และ trailing hyphens', () => {
    expect(slugify('  Hello World  ')).toBe('hello-world')
  })

  it('แปลง multiple spaces เป็น single hyphen', () => {
    expect(slugify('hello   world')).toBe('hello-world')
  })

  it('แปลง uppercase เป็น lowercase', () => {
    expect(slugify('HELLO WORLD')).toBe('hello-world')
  })

  it('รับ hyphen ในข้อความได้', () => {
    expect(slugify('hello-world')).toBe('hello-world')
  })

  it('ลบ consecutive hyphens', () => {
    expect(slugify('hello--world')).toBe('hello-world')
  })
})

describe('generateSlug', () => {
  it('คืน slug จาก English title', () => {
    expect(generateSlug('My Project')).toBe('my-project')
  })

  it('คืน fallback ถ้า slug ว่าง (Thai ล้วนไม่มี mapping)', () => {
    // Thai character ที่ไม่มีใน map จะถูกแปลงเป็น charCode string ซึ่งไม่ว่าง
    const result = generateSlug('ก')
    expect(result).not.toBe('')
    expect(result.length).toBeGreaterThan(0)
  })

  it('คืน fallback item-{timestamp} ถ้า slug ว่างจริงๆ', () => {
    // กรณีที่ slug ว่างจริงๆ — ฟังก์ชันต้องคืน fallback
    // Mock slugify ให้คืน '' ไม่ได้โดยตรง แต่ทดสอบผ่านการ verify behavior
    const result = generateSlug('')
    expect(result).toMatch(/^item-\d+$/)
  })

  it('Thai title ที่มี mapping คืน slug ที่อ่านได้', () => {
    const result = generateSlug('โปรเจค')
    expect(result).toBe('project')
  })
})
