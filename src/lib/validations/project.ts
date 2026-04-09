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
  content: z.record(z.unknown()).optional(), // Tiptap JSON per locale
  category_id: z.string().uuid().optional().nullable(),
  location: z.string().optional().nullable(),
  area: z.string().optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  cover_image: z.string().url().optional().nullable(),
  gallery: z.array(z.string().url()).optional(),
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
