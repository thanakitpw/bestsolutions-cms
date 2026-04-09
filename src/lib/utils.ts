import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Template compatibility — ตรวจสอบว่า Supabase env vars ถูกตั้งค่าแล้วหรือไม่
export const hasEnvVars =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)

export function formatDate(date: string | Date, locale: string = 'th-TH'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
