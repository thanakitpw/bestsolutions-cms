export type SupportedLocale = 'th' | 'en'

export type FeatureFlag = 'projects' | 'blog' | 'messages'

export type TenantConfig = {
  id: string
  name: string
  slug: string
  supported_locales: SupportedLocale[]
  default_locale: SupportedLocale
  enabled_features: FeatureFlag[]
}

export type LocaleContent<T = string> = {
  [K in SupportedLocale]?: T
}
