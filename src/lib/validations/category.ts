import { z } from 'zod'

const LocaleStringSchema = z.object({
  th: z.string().optional(),
  en: z.string().optional(),
})

export const CategorySchema = z.object({
  name: LocaleStringSchema,
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  description: LocaleStringSchema.optional(),
  type: z.enum(['project', 'article']),
  sort_order: z.number().int().min(0).default(0),
})

export type CategoryInput = z.infer<typeof CategorySchema>
