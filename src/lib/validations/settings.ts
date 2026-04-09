import { z } from 'zod'

const LocaleStringSchema = z.object({
  th: z.string().optional(),
  en: z.string().optional(),
})

export const SiteSettingsSchema = z.object({
  site_name: LocaleStringSchema.optional(),
  tagline: LocaleStringSchema.optional(),
  logo_url: z.string().url().optional().nullable(),
  favicon_url: z.string().url().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  contact_address: LocaleStringSchema.optional(),
  allowed_domains: z.array(z.string()).optional(),
  ga_tracking_id: z.string().optional().nullable(),
  notify_email: z.string().email().optional().nullable(),
  notify_email_enabled: z.boolean().default(false),
  notify_line_token: z.string().optional().nullable(),
  notify_line_enabled: z.boolean().default(false),
  seo_title: LocaleStringSchema.optional(),
  seo_description: LocaleStringSchema.optional(),
  seo_keywords: z
    .object({
      th: z.array(z.string()).optional(),
      en: z.array(z.string()).optional(),
    })
    .optional(),
  social_links: z
    .object({
      facebook: z.string().url().optional(),
      instagram: z.string().url().optional(),
      line: z.string().optional(),
      youtube: z.string().url().optional(),
    })
    .optional(),
})

export type SiteSettingsInput = z.infer<typeof SiteSettingsSchema>
