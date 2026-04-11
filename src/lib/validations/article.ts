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
  content: z.record(z.string(), z.unknown()).optional(), // Tiptap JSON per locale
  category_id: z.string().uuid().optional().nullable(),
  cover_image_url: z.string().url().optional().nullable(),
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

export const ArticleCreateSchema = z.object({
  title: z
    .object({
      th: z.string().optional(),
      en: z.string().optional(),
    })
    .refine(
      (d) => (d.th ?? '').trim().length > 0 || (d.en ?? '').trim().length > 0,
      { message: 'กรุณากรอกชื่อบทความอย่างน้อย 1 ภาษา' }
    ),
  slug: z
    .string()
    .min(1, 'กรุณากรอก slug')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug ต้องเป็นตัวเล็ก ตัวเลข และขีดกลางเท่านั้น'),
  category_id: z.string().uuid().nullable().optional(),
})

export type ArticleCreateInput = z.infer<typeof ArticleCreateSchema>

export const ArticleUpdateSchema = z.object({
  title: LocaleStringSchema.optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug ต้องเป็นตัวเล็ก ตัวเลข และขีดกลาง')
    .optional(),
  excerpt: LocaleStringSchema.optional(),
  content: z
    .object({ th: z.unknown().optional(), en: z.unknown().optional() })
    .optional(),
  category_id: z.string().uuid().nullable().optional(),
  cover_image_url: z.string().url().nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  seo_title: LocaleStringSchema.optional(),
  seo_description: LocaleStringSchema.optional(),
  seo_keywords: z
    .object({ th: z.array(z.string()).optional(), en: z.array(z.string()).optional() })
    .optional(),
})

export type ArticleUpdateInput = z.infer<typeof ArticleUpdateSchema>
