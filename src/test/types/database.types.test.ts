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

    it('category_type enum contains expected values', () => {
      expect(Constants.public.Enums.category_type).toEqual(['project', 'article'])
    })

    it('category_type includes project', () => {
      expect(Constants.public.Enums.category_type).toContain('project')
    })

    it('category_type includes article', () => {
      expect(Constants.public.Enums.category_type).toContain('article')
    })

    it('page_type enum contains expected values', () => {
      expect(Constants.public.Enums.page_type).toEqual(['home', 'about', 'contact'])
    })

    it('page_type includes home', () => {
      expect(Constants.public.Enums.page_type).toContain('home')
    })

    it('page_type includes about', () => {
      expect(Constants.public.Enums.page_type).toContain('about')
    })

    it('page_type includes contact', () => {
      expect(Constants.public.Enums.page_type).toContain('contact')
    })
  })
})
