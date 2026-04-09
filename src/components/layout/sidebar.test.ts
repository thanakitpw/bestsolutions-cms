import { describe, it, expect } from 'vitest'
import { buildMenuSections } from '@/lib/sidebar-menu'

describe('buildMenuSections', () => {
  describe('super_admin', () => {
    it('shows all menu items regardless of enabled_features', () => {
      const sections = buildMenuSections([], true)
      const allItems = sections.flatMap((s) => s.items)
      expect(allItems.every((item) => item.show)).toBe(true)
    })

    it('shows Projects when super_admin even with empty features', () => {
      const sections = buildMenuSections([], true)
      const content = sections.find((s) => s.section === 'CONTENT')
      const projects = content?.items.find((i) => i.label === 'Projects')
      expect(projects?.show).toBe(true)
    })

    it('shows Blog when super_admin even with empty features', () => {
      const sections = buildMenuSections([], true)
      const content = sections.find((s) => s.section === 'CONTENT')
      const blog = content?.items.find((i) => i.label === 'Blog')
      expect(blog?.show).toBe(true)
    })

    it('shows Messages when super_admin even with empty features', () => {
      const sections = buildMenuSections([], true)
      const comm = sections.find((s) => s.section === 'COMMUNICATION')
      const messages = comm?.items.find((i) => i.label === 'Messages')
      expect(messages?.show).toBe(true)
    })
  })

  describe('regular user — feature flags', () => {
    it('hides Projects when not in enabled_features', () => {
      const sections = buildMenuSections(['blog', 'messages'], false)
      const content = sections.find((s) => s.section === 'CONTENT')
      const projects = content?.items.find((i) => i.label === 'Projects')
      expect(projects?.show).toBe(false)
    })

    it('shows Projects when in enabled_features', () => {
      const sections = buildMenuSections(['projects'], false)
      const content = sections.find((s) => s.section === 'CONTENT')
      const projects = content?.items.find((i) => i.label === 'Projects')
      expect(projects?.show).toBe(true)
    })

    it('hides Blog when not in enabled_features', () => {
      const sections = buildMenuSections(['projects', 'messages'], false)
      const content = sections.find((s) => s.section === 'CONTENT')
      const blog = content?.items.find((i) => i.label === 'Blog')
      expect(blog?.show).toBe(false)
    })

    it('shows Blog when in enabled_features', () => {
      const sections = buildMenuSections(['blog'], false)
      const content = sections.find((s) => s.section === 'CONTENT')
      const blog = content?.items.find((i) => i.label === 'Blog')
      expect(blog?.show).toBe(true)
    })

    it('hides Messages when not in enabled_features', () => {
      const sections = buildMenuSections(['projects', 'blog'], false)
      const comm = sections.find((s) => s.section === 'COMMUNICATION')
      const messages = comm?.items.find((i) => i.label === 'Messages')
      expect(messages?.show).toBe(false)
    })

    it('shows Messages when in enabled_features', () => {
      const sections = buildMenuSections(['messages'], false)
      const comm = sections.find((s) => s.section === 'COMMUNICATION')
      const messages = comm?.items.find((i) => i.label === 'Messages')
      expect(messages?.show).toBe(true)
    })

    it('always shows Media regardless of features', () => {
      const sections = buildMenuSections([], false)
      const assets = sections.find((s) => s.section === 'ASSETS')
      const media = assets?.items.find((i) => i.label === 'Media')
      expect(media?.show).toBe(true)
    })

    it('always shows Settings regardless of features', () => {
      const sections = buildMenuSections([], false)
      const system = sections.find((s) => s.section === 'SYSTEM')
      const settings = system?.items.find((i) => i.label === 'Settings')
      expect(settings?.show).toBe(true)
    })

    it('always shows Analytics regardless of features', () => {
      const sections = buildMenuSections([], false)
      const system = sections.find((s) => s.section === 'SYSTEM')
      const analytics = system?.items.find((i) => i.label === 'Analytics')
      expect(analytics?.show).toBe(true)
    })

    it('shows all featured items when all features enabled', () => {
      const sections = buildMenuSections(['projects', 'blog', 'messages'], false)
      const allItems = sections.flatMap((s) => s.items)
      expect(allItems.every((item) => item.show)).toBe(true)
    })
  })

  describe('section structure', () => {
    it('returns 4 sections in correct order', () => {
      const sections = buildMenuSections([], true)
      expect(sections.map((s) => s.section)).toEqual([
        'CONTENT',
        'COMMUNICATION',
        'ASSETS',
        'SYSTEM',
      ])
    })

    it('CONTENT section has Projects and Blog', () => {
      const sections = buildMenuSections([], true)
      const content = sections.find((s) => s.section === 'CONTENT')
      const labels = content?.items.map((i) => i.label)
      expect(labels).toContain('Projects')
      expect(labels).toContain('Blog')
    })

    it('SYSTEM section has Settings and Analytics', () => {
      const sections = buildMenuSections([], true)
      const system = sections.find((s) => s.section === 'SYSTEM')
      const labels = system?.items.map((i) => i.label)
      expect(labels).toContain('Settings')
      expect(labels).toContain('Analytics')
    })
  })
})
