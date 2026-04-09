import { describe, it, expect } from 'vitest'
import { Constants } from '@/types/database.types'

describe('database.types', () => {
  describe('Constants', () => {
    it('content_status enum contains expected values', () => {
      expect(Constants.public.Enums.content_status).toEqual(['draft', 'published', 'archived'])
    })

    it('user_role enum contains expected values', () => {
      expect(Constants.public.Enums.user_role).toEqual(['super_admin', 'admin', 'editor'])
    })

    it('content_status includes draft', () => {
      expect(Constants.public.Enums.content_status).toContain('draft')
    })

    it('content_status includes published', () => {
      expect(Constants.public.Enums.content_status).toContain('published')
    })

    it('content_status includes archived', () => {
      expect(Constants.public.Enums.content_status).toContain('archived')
    })

    it('user_role includes super_admin', () => {
      expect(Constants.public.Enums.user_role).toContain('super_admin')
    })

    it('user_role includes admin', () => {
      expect(Constants.public.Enums.user_role).toContain('admin')
    })

    it('user_role includes editor', () => {
      expect(Constants.public.Enums.user_role).toContain('editor')
    })
  })
})
