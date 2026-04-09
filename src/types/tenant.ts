export type ContentStatus = 'draft' | 'published' | 'archived'
export type UserRole = 'super_admin' | 'admin' | 'editor'
export type CategoryType = 'project' | 'article'
export type PageType = 'home' | 'about' | 'contact'
export type SupportedLocale = 'th' | 'en'

export type LocaleContent = Partial<Record<SupportedLocale, string>>
export type LocaleJsonContent = Partial<Record<SupportedLocale, Record<string, unknown>>>  // Tiptap JSON

export type FeatureFlags = {
  projects?: boolean
  blog?: boolean
  messages?: boolean
}

export type FeatureFlag = 'projects' | 'blog' | 'messages'

export type TenantConfig = {
  id: string
  name: string
  slug: string
  supported_locales: SupportedLocale[]
  default_locale: SupportedLocale
  enabled_features: FeatureFlag[]
}
