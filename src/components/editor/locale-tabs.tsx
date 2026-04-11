'use client'
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TiptapEditor } from './tiptap-editor'
import type { JSONContent } from '@tiptap/react'
import type { SupportedLocale } from '@/types/tenant'

type LocaleJsonContent = Partial<Record<SupportedLocale, JSONContent>>

type LocaleTabsProps = {
  value: LocaleJsonContent
  onChange: (locale: SupportedLocale, json: JSONContent) => void
  placeholder?: Partial<Record<SupportedLocale, string>>
  className?: string
  editable?: boolean
}

export function LocaleTabs({
  value,
  onChange,
  placeholder,
  className,
  editable = true,
}: LocaleTabsProps) {
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>('th')

  return (
    <Tabs value={activeLocale} onValueChange={(v) => setActiveLocale(v as SupportedLocale)}>
      <TabsList className="mb-2">
        <TabsTrigger value="th">ภาษาไทย</TabsTrigger>
        <TabsTrigger value="en">English</TabsTrigger>
      </TabsList>

      {(['th', 'en'] as SupportedLocale[]).map((locale) => (
        <TabsContent key={locale} value={locale} className={className}>
          {/* key={locale} บน TiptapEditor บังคับ re-mount เมื่อ switch locale */}
          <TiptapEditor
            key={locale}
            content={value[locale]}
            onChange={(json) => onChange(locale, json)}
            placeholder={placeholder?.[locale]}
            editable={editable}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}
