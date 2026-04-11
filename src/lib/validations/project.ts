import { z } from 'zod'

const LocaleStringSchema = z.object({
  th: z.string().optional(),
  en: z.string().optional(),
})

export const ProjectSchema = z.object({
  title: LocaleStringSchema,
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  description: LocaleStringSchema.optional(),
  content: z.record(z.string(), z.unknown()).optional(), // Tiptap JSON per locale
  category_id: z.string().uuid().optional().nullable(),
  location: LocaleStringSchema.optional().nullable(),
  area: z.string().nullable().optional(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  cover_image_url: z.string().url().optional().nullable(),
  gallery_urls: z.array(z.string().url()).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  seo_title: LocaleStringSchema.optional(),
  seo_description: LocaleStringSchema.optional(),
  seo_keywords: z
    .object({
      th: z.array(z.string()).optional(),
      en: z.array(z.string()).optional(),
    })
    .optional(),
})

export type ProjectInput = z.infer<typeof ProjectSchema>

export const ProjectUpdateSchema = z.object({
  title: LocaleStringSchema.optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug ต้องเป็นตัวเล็ก ตัวเลข และขีดกลาง')
    .optional(),
  description: LocaleStringSchema.optional(),
  content: z
    .object({ th: z.unknown().optional(), en: z.unknown().optional() })
    .optional(),
  category_id: z.string().uuid().nullable().optional(),
  location: LocaleStringSchema.optional(),
  area: z.string().nullable().optional(),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  cover_image_url: z.string().url().nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  seo_title: LocaleStringSchema.optional(),
  seo_description: LocaleStringSchema.optional(),
  seo_keywords: z
    .object({
      th: z.array(z.string()).optional(),
      en: z.array(z.string()).optional(),
    })
    .optional(),
})

export type ProjectUpdateInput = z.infer<typeof ProjectUpdateSchema>

export const ProjectCreateSchema = z.object({
  title: z
    .object({
      th: z.string().optional(),
      en: z.string().optional(),
    })
    .refine((d) => (d.th ?? '').trim().length > 0 || (d.en ?? '').trim().length > 0, {
      message: 'กรุณากรอกชื่อโปรเจกต์อย่างน้อย 1 ภาษา',
    }),
  slug: z
    .string()
    .min(1, 'กรุณากรอก slug')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug ต้องเป็นตัวเล็ก ตัวเลข และขีดกลางเท่านั้น'),
  category_id: z.string().uuid().nullable().optional(),
})

export type ProjectCreateInput = z.infer<typeof ProjectCreateSchema>
