import { z } from 'zod'

export const MediaSchema = z.object({
  filename: z.string().min(1),
  original_name: z.string().min(1),
  mime_type: z.string().min(1),
  size: z.number().int().positive(),
  url: z.string().url(),
  alt_text: z.string().optional().nullable(),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  folder: z.string().optional().nullable(),
})

export type MediaInput = z.infer<typeof MediaSchema>
