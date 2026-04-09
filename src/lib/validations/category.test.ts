import { describe, it, expect } from 'vitest'
import { CategorySchema } from './category'

describe('CategorySchema', () => {
  describe('name locale refinement', () => {
    it('accepts when only name.th is provided', () => {
      const result = CategorySchema.safeParse({ name: { th: 'เชิงพาณิชย์' }, type: 'project', sort_order: 0 })
      expect(result.success).toBe(true)
    })

    it('accepts when only name.en is provided', () => {
      const result = CategorySchema.safeParse({ name: { en: 'Commercial' }, type: 'project', sort_order: 0 })
      expect(result.success).toBe(true)
    })

    it('accepts when both name.th and name.en are provided', () => {
      const result = CategorySchema.safeParse({
        name: { th: 'เชิงพาณิชย์', en: 'Commercial' },
        type: 'project',
        sort_order: 0,
      })
      expect(result.success).toBe(true)
    })

    it('rejects when both name.th and name.en are empty strings', () => {
      const result = CategorySchema.safeParse({ name: { th: '', en: '' }, type: 'project', sort_order: 0 })
      expect(result.success).toBe(false)
      if (!result.success) {
        const issues = result.error.issues
        expect(issues.some((i) => i.path.includes('name'))).toBe(true)
      }
    })

    it('rejects when name object is missing both locale fields', () => {
      const result = CategorySchema.safeParse({ name: {}, type: 'project', sort_order: 0 })
      expect(result.success).toBe(false)
    })

    it('rejects when name.th is whitespace only', () => {
      const result = CategorySchema.safeParse({ name: { th: '   ', en: '' }, type: 'project', sort_order: 0 })
      expect(result.success).toBe(false)
    })
  })

  describe('slug validation', () => {
    it('accepts valid slug (lowercase letters, numbers, hyphens)', () => {
      const result = CategorySchema.safeParse({
        name: { th: 'Test' },
        slug: 'my-slug-123',
        type: 'project',
        sort_order: 0,
      })
      expect(result.success).toBe(true)
    })

    it('accepts empty string slug (auto-generate)', () => {
      const result = CategorySchema.safeParse({
        name: { th: 'Test' },
        slug: '',
        type: 'project',
        sort_order: 0,
      })
      expect(result.success).toBe(true)
    })

    it('rejects slug with uppercase letters', () => {
      const result = CategorySchema.safeParse({
        name: { th: 'Test' },
        slug: 'My-Slug',
        type: 'project',
        sort_order: 0,
      })
      expect(result.success).toBe(false)
    })

    it('rejects slug with spaces', () => {
      const result = CategorySchema.safeParse({
        name: { th: 'Test' },
        slug: 'my slug',
        type: 'project',
        sort_order: 0,
      })
      expect(result.success).toBe(false)
    })

    it('rejects slug with special characters', () => {
      const result = CategorySchema.safeParse({
        name: { th: 'Test' },
        slug: 'my_slug!',
        type: 'project',
        sort_order: 0,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('type validation', () => {
    it('accepts project type', () => {
      const result = CategorySchema.safeParse({ name: { th: 'Test' }, type: 'project', sort_order: 0 })
      expect(result.success).toBe(true)
    })

    it('accepts article type', () => {
      const result = CategorySchema.safeParse({ name: { en: 'Test' }, type: 'article', sort_order: 0 })
      expect(result.success).toBe(true)
    })

    it('rejects unknown type', () => {
      const result = CategorySchema.safeParse({ name: { th: 'Test' }, type: 'blog', sort_order: 0 })
      expect(result.success).toBe(false)
    })
  })

  describe('sort_order validation', () => {
    it('accepts 0', () => {
      const result = CategorySchema.safeParse({ name: { th: 'Test' }, type: 'project', sort_order: 0 })
      expect(result.success).toBe(true)
    })

    it('rejects negative sort_order', () => {
      const result = CategorySchema.safeParse({ name: { th: 'Test' }, type: 'project', sort_order: -1 })
      expect(result.success).toBe(false)
    })

    it('rejects float sort_order', () => {
      const result = CategorySchema.safeParse({ name: { th: 'Test' }, type: 'project', sort_order: 1.5 })
      expect(result.success).toBe(false)
    })
  })

  describe('id field (optional — edit mode)', () => {
    it('accepts valid UUID id', () => {
      const result = CategorySchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: { th: 'Test' },
        type: 'project',
        sort_order: 0,
      })
      expect(result.success).toBe(true)
    })

    it('accepts when id is absent (create mode)', () => {
      const result = CategorySchema.safeParse({ name: { th: 'Test' }, type: 'project', sort_order: 0 })
      expect(result.success).toBe(true)
    })

    it('rejects non-UUID id', () => {
      const result = CategorySchema.safeParse({
        id: 'not-a-uuid',
        name: { th: 'Test' },
        type: 'project',
        sort_order: 0,
      })
      expect(result.success).toBe(false)
    })
  })
})
