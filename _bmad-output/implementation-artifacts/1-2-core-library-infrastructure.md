# Story 1.2: Core Library Infrastructure

Status: review

## Story

As a developer,
I want all core helper functions and Supabase client variants implemented,
so that every future feature can consistently handle auth, tenant context, and data access patterns without duplication.

## Acceptance Criteria

1. **Supabase client variants (3 ตัวเท่านั้น):**
   - `createServerClient()` ใน `src/lib/supabase/server.ts`
   - `createServiceRoleClient()` ใน `src/lib/supabase/admin.ts` (server-only — import จาก client-side ไม่ได้)
   - `createPublicClient()` ใน `src/lib/supabase/public.ts`

2. **Tenant + Auth helpers:**
   - `getTenantId()` ใน `src/lib/tenant.ts` — คืน `tenant_id` string ถ้า user มี session; throw error ถ้าไม่มี session หรือ user ไม่มี tenant
   - `requireTenant()` ใน `src/lib/tenant.ts` — เหมือน `getTenantId()` แต่ return เป็น NextResponse 401 แทน throw
   - `requireAuth()`, `requireRole(role)` ใน `src/lib/auth.ts`

3. **Utility helpers ครบทุกตัว:**
   - `src/lib/tiptap.ts` — `serializeTiptap()`, `parseTiptap()`
   - `src/lib/i18n.ts` — `getLocaleValue()`, `setLocaleValue()`
   - `src/lib/slugify.ts` — Thai title → slug
   - `src/lib/notifications.ts` — `sendLineNotify()`, `sendEmail()` (fire-and-forget)
   - `src/lib/rate-limit.ts` — Upstash ratelimit config
   - `src/lib/cors.ts` — `validateCors(tenant)`
   - `src/lib/audit.ts` — `logAuditEvent(action, entityType, entityId, tenantId)`
   - `src/lib/utils.ts` — `cn()`, `formatDate()`

4. **Zod validation schemas:**
   - `src/lib/validations/project.ts`, `article.ts`, `message.ts`, `media.ts`, `category.ts`, `settings.ts`

5. **Unit tests:**
   - `slugify` — Thai string แปลงเป็น slug ถูกต้อง
   - `i18n` — `getLocaleValue` / `setLocaleValue` ทำงานกับ JSONB locale pattern
   - `tiptap` — serialize/parse round-trip ผ่าน
   - `getTenantId` — mock test (ไม่ต้องการ DB จริง)

## Tasks / Subtasks

- [x] Task 1: Replace/extend Supabase client files (AC: #1)
  - [x] ตรวจสอบไฟล์ที่ template สร้างใน `src/lib/supabase/` (อาจมี `client.ts`, `server.ts` จาก template)
  - [x] **REPLACE** `src/lib/supabase/server.ts` ด้วย `createServerClient()` implementation ตาม Dev Notes
  - [x] สร้าง `src/lib/supabase/admin.ts` ด้วย `createServiceRoleClient()` + `'server-only'` directive
  - [x] สร้าง `src/lib/supabase/public.ts` ด้วย `createPublicClient()`
  - [x] ลบหรือ consolidate ไฟล์ template ที่ซ้ำซ้อน (เช่น `client.ts` ถ้ามี)

- [x] Task 2: Implement tenant helpers (AC: #2)
  - [x] สร้าง `src/lib/tenant.ts` ด้วย `getTenantId()` และ `requireTenant()` ตาม Dev Notes
  - [x] ทดสอบว่า super_admin (tenant_id = NULL) ไม่ throw error แต่คืน null หรือ handle ได้

- [x] Task 3: Implement auth helpers (AC: #2)
  - [x] สร้าง `src/lib/auth.ts` ด้วย `requireAuth()` และ `requireRole(role)` ตาม Dev Notes

- [x] Task 4: Implement content helpers (AC: #3)
  - [x] สร้าง `src/lib/tiptap.ts` — `serializeTiptap()`, `parseTiptap()`
  - [x] สร้าง `src/lib/i18n.ts` — `getLocaleValue()`, `setLocaleValue()`
  - [x] สร้าง `src/lib/slugify.ts` — Thai-safe slug generation

- [x] Task 5: Implement infrastructure helpers (AC: #3)
  - [x] สร้าง `src/lib/notifications.ts` — `sendLineNotify()`, `sendEmail()` (fire-and-forget, ไม่ await)
  - [x] สร้าง `src/lib/rate-limit.ts` — Upstash config พร้อม fallback ถ้า env ไม่มี
  - [x] สร้าง `src/lib/cors.ts` — `validateCors(allowedDomains, origin)`
  - [x] สร้าง `src/lib/audit.ts` — `logAuditEvent()` ใช้ service role client
  - [x] อัปเดต `src/lib/utils.ts` — เพิ่ม `cn()` (ถ้ายังไม่มี) และ `formatDate()`

- [x] Task 6: Create Zod validation schemas (AC: #4)
  - [x] สร้าง `src/lib/validations/project.ts`
  - [x] สร้าง `src/lib/validations/article.ts`
  - [x] สร้าง `src/lib/validations/message.ts` (contact form)
  - [x] สร้าง `src/lib/validations/media.ts`
  - [x] สร้าง `src/lib/validations/category.ts`
  - [x] สร้าง `src/lib/validations/settings.ts`

- [x] Task 7: Write unit tests (AC: #5)
  - [x] `src/lib/slugify.test.ts` — Thai strings, English strings, mixed, special chars
  - [x] `src/lib/i18n.test.ts` — getLocaleValue, setLocaleValue, missing locale fallback
  - [x] `src/lib/tiptap.test.ts` — serialize/parse round-trip
  - [x] `src/lib/tenant.test.ts` — mock createServerClient, test getTenantId behavior

- [x] Task 8: Consolidate .env.local env var naming (AC: #1)
  - [x] Template อาจใช้ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` แทน `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [x] ให้ Supabase client files รองรับทั้งสองชื่อ หรือเลือกใช้ชื่อเดียวตาม architecture spec
  - [x] อัปเดต `.env.example` ให้ consistent

## Dev Notes

### Critical: Template lib/supabase/ ต้อง REPLACE ไม่ใช่ Extend

Template `with-supabase` สร้าง `src/lib/supabase/` ไว้แล้ว แต่ไม่ตรงกับ architecture ที่กำหนด (3 variants):
```
Template อาจมี:          Architecture ต้องการ:
client.ts                → ลบออก (ใช้ใน client components ไม่ได้แล้ว)
server.ts                → REPLACE ด้วย createServerClient()
middleware.ts (บางครั้ง) → ลบออก (logic อยู่ใน src/middleware.ts)
```

**ตรวจสอบก่อน:** ดูว่า template มีไฟล์อะไรใน `src/lib/supabase/` แล้วจัดการให้เหลือแค่ 3 ไฟล์ตาม spec

### Supabase Client: 3 Variants

**`src/lib/supabase/server.ts`** — ใช้ใน Server Components, Server Actions, Route Handlers:
```typescript
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

export function createServerClient() {
  const cookieStore = cookies()
  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — ignore (middleware handles refresh)
          }
        },
      },
    }
  )
}
```

**`src/lib/supabase/admin.ts`** — SERVER ONLY, bypass RLS:
```typescript
import 'server-only'  // ← บังคับ — ป้องกัน import จาก client-side
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export function createServiceRoleClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
```

**`src/lib/supabase/public.ts`** — ใช้ใน Public API routes (ไม่มี session):
```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
```

### Tenant Helpers

**`src/lib/tenant.ts`:**
```typescript
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function getTenantId(): Promise<string> {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized: No active session')
  }

  // super_admin มี tenant_id = NULL — ต้อง handle แยก
  const { data, error } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    throw new Error('User profile not found')
  }

  // super_admin ไม่มี tenant — caller ต้อง handle กรณีนี้เอง
  if (!data.tenant_id) {
    throw new Error('Super admin must specify tenant context')
  }

  return data.tenant_id
}

// ใช้ใน API routes แทน getTenantId() เพื่อ return NextResponse แทน throw
export async function requireTenant(): Promise<string | NextResponse> {
  try {
    return await getTenantId()
  } catch (err) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 },
      { status: 401 }
    )
  }
}
```

> **Note สำคัญ:** super_admin ใช้ `getTenantId()` ไม่ได้โดยตรง — Story 1.5 จะ implement TenantSwitcher ที่ให้ super_admin เลือก tenant ก่อน

### Auth Helpers

**`src/lib/auth.ts`:**
```typescript
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export type UserRole = 'super_admin' | 'admin' | 'editor'

export async function requireAuth() {
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 },
        { status: 401 }
      ),
    }
  }
  return { user, response: null }
}

export async function requireRole(minimumRole: UserRole) {
  const { user, response } = await requireAuth()
  if (response) return { user: null, response }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user!.id)
    .single()

  if (error || !data) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN', status: 403 },
        { status: 403 }
      ),
    }
  }

  const roleHierarchy: UserRole[] = ['editor', 'admin', 'super_admin']
  const userRoleIndex = roleHierarchy.indexOf(data.role as UserRole)
  const requiredIndex = roleHierarchy.indexOf(minimumRole)

  if (userRoleIndex < requiredIndex) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Forbidden', code: 'INSUFFICIENT_ROLE', status: 403 },
        { status: 403 }
      ),
    }
  }

  return { user: { ...user!, role: data.role as UserRole }, response: null }
}
```

### Content Helpers

**`src/lib/tiptap.ts`:**
```typescript
import type { JSONContent } from '@tiptap/react'

export function serializeTiptap(content: JSONContent): JSONContent {
  // เก็บเป็น JSON object ตรงๆ ใน JSONB — ไม่แปลงเป็น HTML string
  return content
}

export function parseTiptap(raw: unknown): JSONContent {
  if (!raw || typeof raw !== 'object') {
    // Empty document
    return { type: 'doc', content: [{ type: 'paragraph' }] }
  }
  return raw as JSONContent
}
```

**`src/lib/i18n.ts`:**
```typescript
import type { SupportedLocale } from '@/types/tenant'

export type LocaleRecord<T = string> = Partial<Record<SupportedLocale, T>>

export function getLocaleValue<T = string>(
  record: LocaleRecord<T> | null | undefined,
  locale: SupportedLocale,
  fallback?: SupportedLocale
): T | undefined {
  if (!record) return undefined
  return record[locale] ?? (fallback ? record[fallback] : undefined)
}

export function setLocaleValue<T = string>(
  record: LocaleRecord<T> | null | undefined,
  locale: SupportedLocale,
  value: T
): LocaleRecord<T> {
  return { ...(record ?? {}), [locale]: value }
}
```

**`src/lib/slugify.ts`:**
```typescript
// Thai-safe slug — ใช้ transliteration library หรือ custom mapping
// ถ้าไม่มี library ให้ใช้ pattern นี้: ลบ non-ASCII แล้ว kebab-case

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // ลบ Thai characters (แปลงโดยใช้ roman ของ Thai ถ้ามี library)
    // สำหรับ MVP: ลบ Thai chars แล้ว fallback เป็น timestamp
    .replace(/[\u0E00-\u0E7F]+/g, (match) => thaiToRoman(match))
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// Simple Thai romanization — ขยายตามต้องการ
function thaiToRoman(thai: string): string {
  const map: Record<string, string> = {
    'บ้าน': 'ban', 'ริมน้ำ': 'rim-nam', 'โปรเจค': 'project',
    // เพิ่ม mapping ตามต้องการ
  }
  return map[thai] ?? thai.split('').map(c => c.charCodeAt(0).toString(36)).join('')
}

export function generateSlug(title: string): string {
  const slug = slugify(title)
  // ถ้า slug ว่าง (เช่น title เป็น Thai ล้วนและไม่มี mapping) ใช้ timestamp
  return slug || `item-${Date.now()}`
}
```

> **Note:** AR13 ระบุ "Thai title → slug" — ถ้า project ต้องการ transliteration ที่ถูกต้อง ให้ install `transliteration` package: `npm install transliteration` แล้ว implement ใหม่

### Infrastructure Helpers

**`src/lib/notifications.ts`:**
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Fire-and-forget — ไม่ await ใน caller
export async function sendLineNotify(token: string, message: string): Promise<void> {
  try {
    const response = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ message }),
    })
    if (!response.ok) {
      console.error('[LINE Notify] Failed:', response.status, await response.text())
    }
  } catch (err) {
    console.error('[LINE Notify] Error:', err)
    // ไม่ re-throw — notification ล้มเหลวไม่กระทบ main flow
  }
}

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  try {
    const { error } = await resend.emails.send({
      from: 'noreply@bestsolutions.co.th',
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    if (error) {
      console.error('[Resend] Failed:', error)
    }
  } catch (err) {
    console.error('[Resend] Error:', err)
  }
}
```

**`src/lib/rate-limit.ts`:**
```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Fallback gracefully ถ้า env ยังไม่ตั้ง (dev mode)
let ratelimit: Ratelimit | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
    analytics: false,
  })
}

// ใช้ใน contact form route
export async function checkRateLimit(ip: string): Promise<{ success: boolean; reset: number }> {
  if (!ratelimit) {
    // Dev mode — ไม่ rate limit
    return { success: true, reset: 0 }
  }
  const { success, reset } = await ratelimit.limit(ip)
  return { success, reset }
}
```

**`src/lib/cors.ts`:**
```typescript
export function validateCors(
  allowedDomains: string[] | null | undefined,
  origin: string | null
): string | null {
  if (!origin) return null
  if (!allowedDomains || allowedDomains.length === 0) return null // deny all

  const isAllowed = allowedDomains.some((domain) => {
    const normalizedDomain = domain.startsWith('http') ? domain : `https://${domain}`
    return origin === normalizedDomain || origin === normalizedDomain.replace('https://', 'http://')
  })

  return isAllowed ? origin : null
}

export function buildCorsHeaders(allowedOrigin: string | null): Record<string, string> {
  if (!allowedOrigin) return {}
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}
```

**`src/lib/audit.ts`:**
```typescript
import { createServiceRoleClient } from '@/lib/supabase/admin'

export async function logAuditEvent(
  action: string,
  entityType: string,
  entityId: string,
  tenantId: string | null,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createServiceRoleClient()
    await supabase.from('audit_logs').insert({
      action,
      entity_type: entityType,
      entity_id: entityId,
      tenant_id: tenantId,
      user_id: userId ?? null,
      metadata: metadata ?? null,
    })
  } catch (err) {
    console.error('[Audit] Failed to log event:', err)
    // ไม่ re-throw — audit failure ไม่กระทบ main flow
  }
}
```

> **Note:** `audit_logs` table จะสร้างใน migration ชุดถัดไป (Story 2.1 — `004_support_tables.sql`) — ใน Story 1.2 นี้แค่สร้าง helper function ไว้ก่อน

**`src/lib/utils.ts`:**
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ถ้า template มี cn() อยู่แล้ว → ไม่ต้องสร้างใหม่
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, locale: string = 'th-TH'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
```

### Zod Validation Schemas

**`src/lib/validations/project.ts`** (ตัวอย่าง):
```typescript
import { z } from 'zod'

const LocaleStringSchema = z.object({
  th: z.string().optional(),
  en: z.string().optional(),
})

export const ProjectSchema = z.object({
  title: LocaleStringSchema,
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
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
  seo_keywords: z.object({
    th: z.array(z.string()).optional(),
    en: z.array(z.string()).optional(),
  }).optional(),
})

export type ProjectInput = z.infer<typeof ProjectSchema>
```

สร้าง schemas ที่เหลือในรูปแบบเดียวกัน — `ArticleSchema`, `MessageSchema` (contact form), `MediaSchema`, `CategorySchema`, `SiteSettingsSchema`

**`src/lib/validations/message.ts`** (contact form):
```typescript
export const ContactFormSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อ').max(100),
  email: z.string().email('รูปแบบ email ไม่ถูกต้อง'),
  phone: z.string().optional().nullable(),
  message: z.string().min(1, 'กรุณากรอกข้อความ').max(2000),
  project_type: z.string().optional().nullable(),
})
```

### Testing Notes

**Vitest Config จาก Story 1.1:**
- ใช้ `vitest@2.1.9` (ไม่ใช่ latest) — Node 20.12.x compat
- environment: `happy-dom` (ไม่ใช่ jsdom) — ESM compat
- test files: co-located กับ source files (`.test.ts` ข้างๆ ไฟล์)

**Test patterns:**
```typescript
// src/lib/slugify.test.ts
import { describe, it, expect } from 'vitest'
import { slugify, generateSlug } from './slugify'

describe('slugify', () => {
  it('แปลง English title เป็น slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })
  it('ลบ special characters', () => {
    expect(slugify('Project #1!')).toBe('project-1')
  })
  it('คืน fallback ถ้า slug ว่าง', () => {
    expect(generateSlug('ก')).not.toBe('')
  })
})
```

### Project Structure Notes

- **ห้ามสร้าง Supabase client variant ที่ 4** — มีแค่ `server.ts`, `admin.ts`, `public.ts` เท่านั้น
- **`admin.ts` ต้องมี `import 'server-only'`** — Next.js จะ throw error ถ้า import จาก client bundle
- **`notifications.ts` ใช้ fire-and-forget** — caller ต้อง `void sendLineNotify(...)` ไม่ใช่ `await`
- **`audit.ts` ขึ้นกับ `audit_logs` table** ที่สร้างใน Story 2.1 — ใน Story นี้แค่สร้าง helper; test จะต้อง mock
- Template อาจมี `clsx` และ `tailwind-merge` ติดตั้งมาแล้ว — ตรวจสอบ `package.json` ก่อน install ซ้ำ

### Supabase Project Reference

จาก Story 1.1 Completion Notes: Supabase project อยู่ที่ `pogjddbskyjukjnpndqx.supabase.co`

### References

- AR6: `src/lib/supabase/server.ts` — `createServerClient()`
- AR7: `src/lib/supabase/admin.ts` — `createServiceRoleClient()` SERVER ONLY
- AR8: `src/lib/supabase/public.ts` — `createPublicClient()`
- AR9: `src/lib/tenant.ts` — `getTenantId()`, `requireTenant()`
- AR10: `src/lib/auth.ts` — `requireAuth()`, `requireRole(role)`
- AR11: `src/lib/tiptap.ts` — serialize/parse helpers
- AR12: `src/lib/i18n.ts` — locale JSONB helpers
- AR13: `src/lib/slugify.ts` — Thai → slug
- AR14: `src/lib/notifications.ts` — fire-and-forget LINE + Email
- AR15: `src/lib/rate-limit.ts` — Upstash config
- AR16: `src/lib/cors.ts` — CORS validation
- AR17: `src/lib/audit.ts` — audit event logging
- AR22: Zod schemas ใน `src/lib/validations/`
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- vitest ไม่ได้ install ใน package.json จาก Story 1.1 — install `vitest@2.1.9`, `@vitejs/plugin-react@4.3.4`, `happy-dom@15.11.7`, `@testing-library/jest-dom` เพิ่ม
- `server-only` package ไม่ได้ install — install เพิ่มเพื่อใช้ใน `admin.ts`
- `client.ts` template ยังถูกใช้โดย auth components (login-form, sign-up-form, etc.) — ไม่ลบ ให้ถูก replace ใน Story 1.3
- `proxy.ts` อัปเดตให้ใช้ `NEXT_PUBLIC_SUPABASE_ANON_KEY` แทน `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- เพิ่ม `hasEnvVars` กลับใน `utils.ts` เพราะ template files (`page.tsx`, `protected/layout.tsx`, `proxy.ts`) ยังใช้อยู่

### Completion Notes List

- สร้าง 3 Supabase client variants: `server.ts` (createServerClient), `admin.ts` (createServiceRoleClient + server-only), `public.ts` (createPublicClient)
- สร้าง tenant helpers: `getTenantId()`, `requireTenant()` พร้อม super_admin handling
- สร้าง auth helpers: `requireAuth()`, `requireRole(role)` พร้อม role hierarchy
- สร้าง content helpers: `tiptap.ts`, `i18n.ts`, `slugify.ts` พร้อม Thai romanization
- สร้าง infrastructure helpers: `notifications.ts` (fire-and-forget), `rate-limit.ts` (Upstash + fallback), `cors.ts`, `audit.ts`, `utils.ts` (cn + formatDate + hasEnvVars)
- สร้าง Zod schemas: project, article, message, media, category, settings
- เขียน unit tests 37 tests: slugify (11), i18n (12), tiptap (8), tenant (6) — ผ่านทั้งหมด
- Full suite: 57/57 tests ผ่าน (รวมทดสอบจาก Story 1.1)

### File List

- `src/lib/supabase/server.ts` — replaced
- `src/lib/supabase/admin.ts` — replaced (เพิ่ม server-only + createServiceRoleClient)
- `src/lib/supabase/public.ts` — created
- `src/lib/supabase/proxy.ts` — updated (PUBLISHABLE_KEY → ANON_KEY)
- `src/lib/tenant.ts` — created
- `src/lib/auth.ts` — created
- `src/lib/tiptap.ts` — created
- `src/lib/i18n.ts` — created
- `src/lib/slugify.ts` — created
- `src/lib/notifications.ts` — created
- `src/lib/rate-limit.ts` — created
- `src/lib/cors.ts` — created
- `src/lib/audit.ts` — created
- `src/lib/utils.ts` — updated (เพิ่ม formatDate, hasEnvVars)
- `src/lib/validations/project.ts` — created
- `src/lib/validations/article.ts` — created
- `src/lib/validations/message.ts` — created
- `src/lib/validations/media.ts` — created
- `src/lib/validations/category.ts` — created
- `src/lib/validations/settings.ts` — created
- `src/lib/slugify.test.ts` — created (11 tests)
- `src/lib/i18n.test.ts` — created (12 tests)
- `src/lib/tiptap.test.ts` — created (8 tests)
- `src/lib/tenant.test.ts` — created (6 tests)
- `package.json` — updated (vitest@2.1.9, @vitejs/plugin-react, happy-dom, @testing-library/jest-dom, server-only)

## Change Log

- 2026-04-09: Story 1.2 implemented — Core Library Infrastructure complete
