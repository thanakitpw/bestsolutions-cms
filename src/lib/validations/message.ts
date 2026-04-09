import { z } from 'zod'

export const ContactFormSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อ').max(100),
  email: z.string().email('รูปแบบ email ไม่ถูกต้อง'),
  phone: z.string().optional().nullable(),
  message: z.string().min(1, 'กรุณากรอกข้อความ').max(2000),
  project_type: z.string().optional().nullable(),
})

export type ContactFormInput = z.infer<typeof ContactFormSchema>
