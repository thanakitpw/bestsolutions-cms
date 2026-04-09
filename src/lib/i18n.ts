import type { SupportedLocale } from '@/types/tenant'

export type LocaleRecord<T = string> = Partial<Record<SupportedLocale, T>>

export function getLocaleValue<T = string>(
  record: LocaleRecord<T> | null | undefined,
  locale: SupportedLocale,
  fallback?: SupportedLocale
): T | undefined {
  if (!record) return undefined
  return record[locale] ?? (fallback ? record[fallback] : undefined)
}

export function setLocaleValue<T = string>(
  record: LocaleRecord<T> | null | undefined,
  locale: SupportedLocale,
  value: T
): LocaleRecord<T> {
  return { ...(record ?? {}), [locale]: value }
}
