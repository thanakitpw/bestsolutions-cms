import { describe, it, expect } from 'vitest'
import type { TenantConfig, LocaleContent, SupportedLocale, FeatureFlag, ContentStatus, UserRole, CategoryType, PageType, LocaleJsonContent, FeatureFlags } from '@/types/tenant'

describe('tenant types', () => {
  describe('TenantConfig', () => {
    it('accepts a valid TenantConfig object', () => {
      const config: TenantConfig = {
        id: 'uuid-1',
        name: 'Twodesk Studio',
        slug: 'twodesk',
        supported_locales: ['th', 'en'],
        default_locale: 'th',
        enabled_features: ['projects', 'messages'],
      }
      expect(config.slug).toBe('twodesk')
      expect(config.supported_locales).toContain('th')
      expect(config.default_locale).toBe('th')
      expect(config.enabled_features).toContain('projects')
      expect(config.enabled_features).not.toContain('blog')
    })
  })

  describe('LocaleContent', () => {
    it('accepts partial locale content', () => {
      const content: LocaleContent = { th: 'สวัสดี' }
      expect(content.th).toBe('สวัสดี')
      expect(content.en).toBeUndefined()
    })

    it('accepts full locale content', () => {
      const content: LocaleContent = { th: 'สวัสดี', en: 'Hello' }
      expect(content.th).toBe('สวัสดี')
      expect(content.en).toBe('Hello')
    })
  })

  describe('SupportedLocale', () => {
    it('th is a valid supported locale', () => {
      const locale: SupportedLocale = 'th'
      expect(locale).toBe('th')
    })

    it('en is a valid supported locale', () => {
      const locale: SupportedLocale = 'en'
      expect(locale).toBe('en')
    })
  })

  describe('FeatureFlag', () => {
    it('projects is a valid feature flag', () => {
      const flag: FeatureFlag = 'projects'
      expect(flag).toBe('projects')
    })

    it('blog is a valid feature flag', () => {
      const flag: FeatureFlag = 'blog'
      expect(flag).toBe('blog')
    })

    it('messages is a valid feature flag', () => {
      const flag: FeatureFlag = 'messages'
      expect(flag).toBe('messages')
    })
  })

  describe('ContentStatus', () => {
    it('draft is a valid content status', () => {
      const status: ContentStatus = 'draft'
      expect(status).toBe('draft')
    })

    it('published is a valid content status', () => {
      const status: ContentStatus = 'published'
      expect(status).toBe('published')
    })

    it('archived is a valid content status', () => {
      const status: ContentStatus = 'archived'
      expect(status).toBe('archived')
    })
  })

  describe('UserRole', () => {
    it('super_admin is a valid role', () => {
      const role: UserRole = 'super_admin'
      expect(role).toBe('super_admin')
    })

    it('admin is a valid role', () => {
      const role: UserRole = 'admin'
      expect(role).toBe('admin')
    })

    it('editor is a valid role', () => {
      const role: UserRole = 'editor'
      expect(role).toBe('editor')
    })
  })

  describe('CategoryType', () => {
    it('project is a valid category type', () => {
      const type: CategoryType = 'project'
      expect(type).toBe('project')
    })

    it('article is a valid category type', () => {
      const type: CategoryType = 'article'
      expect(type).toBe('article')
    })
  })

  describe('PageType', () => {
    it('home is a valid page type', () => {
      const type: PageType = 'home'
      expect(type).toBe('home')
    })

    it('about is a valid page type', () => {
      const type: PageType = 'about'
      expect(type).toBe('about')
    })

    it('contact is a valid page type', () => {
      const type: PageType = 'contact'
      expect(type).toBe('contact')
    })
  })

  describe('LocaleJsonContent', () => {
    it('accepts Tiptap-style JSONB content per locale', () => {
      const content: LocaleJsonContent = {
        th: { type: 'doc', content: [] },
        en: { type: 'doc', content: [] },
      }
      expect(content.th).toBeDefined()
      expect(content.en).toBeDefined()
    })
  })

  describe('FeatureFlags', () => {
    it('accepts partial feature flags', () => {
      const flags: FeatureFlags = { projects: true, messages: false }
      expect(flags.projects).toBe(true)
      expect(flags.blog).toBeUndefined()
    })
  })
})
