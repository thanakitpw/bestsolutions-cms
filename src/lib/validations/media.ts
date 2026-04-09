import { z } from 'zod'

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export const AltTextUpdateSchema = z.object({
  alt_text: z.object({
    th: z.string().max(500).optional(),
    en: z.string().max(500).optional(),
  }),
})

export const MediaItemSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  storage_path: z.string(),
  public_url: z.string().url(),
  mime_type: z.string(),
  size: z.number().int().positive(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  alt_text: z.object({ th: z.string().optional(), en: z.string().optional() }).nullable().optional(),
  created_at: z.string(),
})

export type AltTextUpdateInput = z.infer<typeof AltTextUpdateSchema>
export type MediaItemType = z.infer<typeof MediaItemSchema>
