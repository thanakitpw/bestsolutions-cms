import { describe, it, expect } from 'vitest'
import type { TenantConfig, LocaleContent, SupportedLocale, FeatureFlag } from '@/types/tenant'

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
})
