import { z } from 'zod'

const LocaleStringSchema = z.object({
  th: z.string().optional(),
  en: z.string().optional(),
})

export const ArticleSchema = z.object({
  title: LocaleStringSchema,
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  excerpt: LocaleStringSchema.optional(),
  content: z.record(z.unknown()).optional(), // Tiptap JSON per locale
  category_id: z.string().uuid().optional().nullable(),
  cover_image: z.string().url().optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  published_at: z.string().datetime().optional().nullable(),
  seo_title: LocaleStringSchema.optional(),
  seo_description: LocaleStringSchema.optional(),
  seo_keywords: z
    .object({
      th: z.array(z.string()).optional(),
      en: z.array(z.string()).optional(),
    })
    .optional(),
})

export type ArticleInput = z.infer<typeof ArticleSchema>
