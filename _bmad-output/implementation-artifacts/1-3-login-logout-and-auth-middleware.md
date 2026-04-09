# Story 1.3: Login, Logout & Auth Middleware

Status: review

## Story

As an admin,
I want to log in with email and password, be protected by auth middleware, and log out securely,
so that only authenticated users can access the CMS.

## Acceptance Criteria

1. **Middleware protection:**
   - User ที่ยังไม่ login เข้าถึง admin routes ใดๆ → redirect ไป `/login` อัตโนมัติ
   - URL ที่พยายามเข้าถูกเก็บไว้เป็น `redirectTo` query param เพื่อ redirect หลัง login สำเร็จ

2. **Login flow:**
   - กรอก email + password ที่ถูกต้อง → authenticate ผ่าน Supabase Auth → redirect ไป dashboard (`/`)
   - Session เป็น cookie-based ผ่าน `@supabase/ssr`
   - กรอกผิด → แสดง error "อีเมลหรือรหัสผ่านไม่ถูกต้อง" ใต้ form; password field ถูก clear

3. **Logout:**
   - กด Logout → session invalidated → redirect ไป `/login`
   - กด Back button หลัง logout → ไม่สามารถกลับเข้า admin ได้ (middleware redirect)

## Tasks / Subtasks

- [x] Task 1: Rewrite src/middleware.ts (AC: #1)
  - [x] เขียน middleware ใหม่ให้ protect `/` และทุก route ที่ไม่ใช่ `/login` และ `/api/public/*`
  - [x] redirect unauthenticated users ไปที่ `/login?redirectTo={originalPath}`
  - [x] redirect authenticated users ที่เข้า `/login` ไปที่ `/` (ไม่ให้ login ซ้ำ)
  - [x] อนุญาต `/api/public/*` ผ่านโดยไม่ต้อง auth
  - [x] ลบ logic ที่อ้างถึง `/auth/login` ออก (template path เก่า)

- [x] Task 2: สร้าง login page ใหม่ที่ถูกต้อง (AC: #2)
  - [x] สร้าง `src/app/(auth)/login/page.tsx` และ `src/app/(auth)/layout.tsx`
  - [x] สร้าง Server Action `src/app/(auth)/login/actions.ts` สำหรับ login (ไม่ใช้ `createClient()` จาก client.ts)
  - [x] สร้าง `src/components/auth/login-form.tsx` ใหม่ที่ใช้ Server Action แทน client-side Supabase
  - [x] redirect ไปที่ `redirectTo` param หลัง login สำเร็จ; fallback ไป `/`

- [x] Task 3: สร้าง logout ใหม่ (AC: #3)
  - [x] สร้าง `src/app/(auth)/logout/actions.ts` — Server Action ที่เรียก `supabase.auth.signOut()`
  - [x] หลัง sign out redirect ไป `/login`

- [x] Task 4: Redirect template routes ไปยัง path ใหม่ (AC: #1, #2)
  - [x] `src/app/auth/` ทั้ง directory ถูกลบออก (middleware handles /auth/* → redirect /login)
  - [x] `src/app/login/page.tsx` ถูกลบ (conflict กับ `(auth)/login/page.tsx`)
  - [x] ลบ template components: sign-up-form, forgot-password-form, update-password-form, logout-button, login-form (template)
  - [x] `src/app/protected/` ถูกลบออกทั้ง directory
  - [x] `src/app/page.tsx` (template root) ถูกลบ (conflict กับ `(admin)/page.tsx`)

- [x] Task 5: เปลี่ยน (dashboard) → (admin) route group (AC: #1)
  - [x] ตรวจสอบ: ไม่มี hard-coded `(dashboard)` ใน import paths
  - [x] rename `src/app/(dashboard)/` → `src/app/(admin)/` สำเร็จ
  - [x] ไม่มี hard-coded path `/protected` หรือ `/dashboard` ใน middleware

- [x] Task 6: ลบ client.ts (Supabase client สำหรับ client-side) (AC: #2)
  - [x] ตรวจสอบ dependencies ทั้งหมด → ไม่มีเหลือหลังลบ template files
  - [x] ลบ `src/lib/supabase/client.ts` สำเร็จ

- [x] Task 7: Unit test (AC: #1, #2, #3)
  - [x] Test middleware logic: unauthenticated → redirect `/login`, authenticated → pass (12 tests)
  - [x] Test login Server Action: mock Supabase, test error handling (4 tests)
  - [x] Test logout: mock Supabase signOut (2 tests)

## Dev Notes

### Critical: Template Route Structure ต้อง Remap

Template สร้าง route structure ที่ไม่ตรงกับ architecture:

```
Template มีอยู่:                  Architecture ต้องการ:
src/app/auth/login/page.tsx    → src/app/(auth)/login/page.tsx
src/app/auth/sign-up/...       → ❌ ลบออก (ไม่มี self-signup ใน CMS)
src/app/protected/page.tsx     → ❌ ลบออก (template placeholder)
src/app/(dashboard)/           → src/app/(admin)/ (rename หรือ alias)
src/app/login/page.tsx         → อาจเป็น path ที่ถูกต้องแล้ว — ตรวจสอบ
```

**Middleware เดิม** redirect ไป `/auth/login` — ต้องเปลี่ยนเป็น `/login`

### Middleware: Implementation ใหม่

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/public']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // อนุญาต public paths ผ่านทันที
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // อนุญาต static assets ผ่านทันที
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: ต้องเรียก getClaims() ทันทีหลัง createServerClient
  // ห้ามมี code ระหว่างสองบรรทัดนี้
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  if (!user) {
    // ไม่มี session → redirect ไป /login พร้อมเก็บ path ปัจจุบัน
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // มี session และพยายามเข้า /login → redirect ไป dashboard
  if (pathname === '/login') {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/'
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

> **Note:** ใช้ `getClaims()` แทน `getUser()` ใน middleware เพราะ Vercel Fluid Compute แนะนำ — เหมือนที่ template ใช้ใน `proxy.ts`

### Login: Server Action Pattern

**ไม่ใช้** `createClient()` (client.ts) ใน login — ใช้ Server Action แทน:

```typescript
// src/app/(auth)/login/actions.ts
'use server'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string | null

  const supabase = createServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // ส่ง error กลับไป — ใช้ URL search params หรือ useActionState
    return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
  }

  redirect(redirectTo || '/')
}
```

**Login Form** — ใช้ `useActionState` (React 19 / Next.js 15):

```typescript
// src/components/auth/login-form.tsx
'use client'
import { useActionState } from 'react'
import { loginAction } from '@/app/(auth)/login/actions'

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, null)

  return (
    <form action={formAction}>
      <input type="hidden" name="redirectTo" value={redirectTo ?? '/'} />
      {/* email field */}
      {/* password field — ถ้า state?.error มี ต้อง clear value โดย key trick */}
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  )
}
```

> **Password Clear Pattern:** ใช้ `key={state?.error ? Date.now() : 'password'}` บน password Input เพื่อ force re-render และ clear value เมื่อมี error

### Logout: Server Action Pattern

```typescript
// src/app/(auth)/logout/actions.ts
'use server'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function logoutAction() {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

Logout button ใน sidebar จะ call `logoutAction` โดยตรง (สร้างใน Story 1.4)

### Route Group (auth) Layout

```typescript
// src/app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
```

### Login Page

```typescript
// src/app/(auth)/login/page.tsx
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string }
}) {
  return <LoginForm redirectTo={searchParams.redirectTo} />
}
```

### Template Cleanup Strategy

Template สร้าง auth pages หลายหน้าที่ CMS ไม่ต้องการ (self sign-up, forgot password ฯลฯ):

**ตัวเลือก A (แนะนำ):** เพิ่ม redirect ใน middleware สำหรับ `/auth/*` paths:
```typescript
// ใน middleware — ก่อน return
if (pathname.startsWith('/auth/')) {
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/login'
  return NextResponse.redirect(loginUrl)
}
```

**ตัวเลือก B:** ลบ directory `src/app/auth/` ทั้งหมด  
→ ง่ายกว่าถ้าไม่มี component อื่น import จาก path นี้

**ตรวจสอบก่อน:** `grep -r "from.*app/auth" src/` หรือ `grep -r '"/auth/' src/`

### (dashboard) vs (admin) Route Group

Architecture spec ใช้ `(admin)` แต่ template สร้าง `(dashboard)`:
- **ถ้า rename ได้:** `mv src/app/(dashboard) src/app/(admin)` — Next.js route groups ไม่ส่งผลกับ URL
- **ถ้า rename ยาก (มี import ที่ hard-code path):** ใช้ `(dashboard)` ไปก่อนและ note ไว้ — ไม่กระทบ functionality

### client.ts ของ Template

`src/lib/supabase/client.ts` สร้าง Supabase client สำหรับ browser — **ไม่ตรงกับ architecture** ที่กำหนด 3 variants เท่านั้น

หลัง Task 6 ถ้ายังมี dependency เหลือ (เช่น template components อื่นใช้อยู่) → note ไว้; ลบใน Story ถัดไปที่ refactor components นั้น

### สิ่งที่ story นี้ไม่ทำ

- ❌ สร้าง sidebar / admin shell → Story 1.4
- ❌ สร้าง dashboard หน้าจริง → Story 1.4/1.5
- ❌ Logout button ใน UI → Story 1.4 (sidebar)
- ❌ Password reset flow → ไม่ใช่ MVP scope

### Key Learning จาก Story 1.1–1.2

| ประเด็น | การจัดการ |
|---------|-----------|
| Template ใช้ `NEXT_PUBLIC_SUPABASE_ANON_KEY` แล้ว (หลัง 1.2 fix) | ใช้ได้เลย |
| vitest@2.1.9 + happy-dom | ใช้ในทุก test ใหม่ |
| `client.ts` ยังถูกใช้โดย template auth components | Task 6 จัดการ |
| getClaims() ใช้ใน middleware (ไม่ใช่ getUser) | ตาม pattern ของ proxy.ts เดิม |

### References

- AC: Epics.md Story 1.3 — Login, Logout & Auth Middleware
- Architecture: `src/middleware.ts` — auth guard + route protection
- Architecture: Route groups `(auth)` and `(admin)` 
- Architecture: Cookie-based session via `@supabase/ssr`
- Architecture: Server Actions for mutations
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_None_

### Completion Notes List

- Middleware rewritten ใช้ `getClaims()` ตาม pattern ของ proxy.ts เดิม; ลบ dependency กับ `updateSession` จาก proxy
- Route group rename: `(dashboard)` → `(admin)` สำเร็จ ไม่มี hard-coded imports
- Template cleanup: ลบ `src/app/auth/`, `src/app/login/`, `src/app/protected/`, `src/app/page.tsx` (template root), และ template auth components ทั้งหมด
- `client.ts` ถูกลบสำเร็จ — ไม่มี dependency เหลือหลังลบ template files
- Middleware test ใช้ `vi.spyOn(NextResponse, 'next').mockImplementation(...)` เพราะ `NextResponse.next({ request })` ใน happy-dom environment ไม่รองรับ Next.js internal Headers check โดยตรง
- Login form คง UI design (two-column) จาก `src/app/login/page.tsx` เดิม แต่ใช้ Server Action + `useActionState` แทน client-side Supabase
- Tests: 73/73 ผ่าน (เพิ่มใหม่ 18 tests: 12 middleware + 4 login action + 2 logout action)

### File List

**Created:**
- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/login/actions.ts`
- `src/app/(auth)/logout/actions.ts`
- `src/components/auth/login-form.tsx`
- `src/test/middleware.test.ts`
- `src/test/login-action.test.ts`
- `src/test/logout-action.test.ts`

**Modified:**
- `src/middleware.ts` — rewritten with getClaims(), redirectTo param, /auth/* redirect, /api/public bypass

**Renamed:**
- `src/app/(dashboard)/` → `src/app/(admin)/`

**Deleted:**
- `src/app/auth/` (entire directory: login, sign-up, sign-up-success, forgot-password, update-password, error, confirm)
- `src/app/login/page.tsx`
- `src/app/protected/` (entire directory)
- `src/app/page.tsx` (template root)
- `src/lib/supabase/client.ts`
- `src/components/login-form.tsx` (template)
- `src/components/sign-up-form.tsx`
- `src/components/forgot-password-form.tsx`
- `src/components/logout-button.tsx`
- `src/components/update-password-form.tsx`
- `src/components/tutorial/` (entire directory)

## Change Log

- 2026-04-09 — Story 1.3 implemented: middleware rewrite, (auth) route group, Server Action login/logout, template cleanup, (dashboard)→(admin) rename, client.ts deleted. 73/73 tests pass.
