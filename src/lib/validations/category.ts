import { z } from 'zod'

const LocaleStringSchema = z.object({
  th: z.string().optional(),
  en: z.string().optional(),
})

export const CategorySchema = z
  .object({
    id: z.string().uuid().optional(),  // optional — used in edit mode
    name: LocaleStringSchema,
    slug: z
      .string()
      .min(1, 'Slug ต้องไม่ว่าง')
      .regex(/^[a-z0-9-]+$/, 'Slug: ตัวเล็ก, ตัวเลข, และ - เท่านั้น')
      .optional()
      .or(z.literal('')),  // empty string → auto-generate
    type: z.enum(['project', 'article']),
    sort_order: z.number().int().min(0).default(0),
  })
  .refine(
    (data) => Boolean(data.name.th?.trim() || data.name.en?.trim()),
    { message: 'ต้องมีชื่อ (ไทย หรือ อังกฤษ) อย่างน้อย 1 ภาษา', path: ['name'] }
  )

export type CategoryInput = z.infer<typeof CategorySchema>
