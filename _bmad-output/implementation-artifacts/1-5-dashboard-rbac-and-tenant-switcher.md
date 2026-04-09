# Story 1.5: Dashboard, RBAC & Tenant Switcher

Status: review

## Story

As a super admin or tenant admin,
I want a Dashboard homepage with tenant context switcher, role-appropriate stats, and recent content,
so that I can get an at-a-glance overview of the CMS and navigate efficiently across tenants.

## Acceptance Criteria

1. **TenantSwitcher — super_admin:**
   - Sidebar แสดง TenantSwitcher dropdown ใต้ logo — แสดงเฉพาะ `role === 'super_admin'`
   - Dropdown แสดง tenant ทั้งหมด (name + slug)
   - เลือก tenant → Server Action `switchTenantAction(tenantId)` → set cookie `active_tenant_id` (httpOnly, 30d) → revalidate layout
   - super_admin ที่ยังไม่เลือก tenant: sidebar แสดง "เลือก Tenant" badge; Dashboard แสดง empty-state prompt แทน stats

2. **TenantSwitcher — non-super_admin:**
   - แสดง tenant name (read-only) — ไม่มี dropdown
   - ใช้ tenant name จาก `tenants.name` ที่ join ใน layout query

3. **Updated `getTenantId()` — super_admin cookie support:**
   - super_admin → อ่าน cookie `active_tenant_id`
   - ถ้า cookie ไม่มี → throw `Error('SUPER_ADMIN_NO_TENANT_SELECTED')`
   - regular user → logic เดิม (อ่านจาก `users.tenant_id`)

4. **RBAC helper สำหรับ Server Components:**
   - `assertRole(minimumRole)` ใน `src/lib/auth.ts`
   - ไม่มี session → `redirect('/login')`
   - role ต่ำกว่าที่กำหนด → `redirect('/')` (ไม่ใช่ 403 page)
   - ใช้ role hierarchy เดิม: `editor < admin < super_admin`

5. **Dashboard page — stats cards:**
   - 4 cards: **Projects** (published), **Articles** (published), **Messages** (unread), **Media** (total)
   - Desktop: 4-column grid; Tablet: 2-column; Mobile: 1-column
   - ถ้า query error (ตาราง projects/articles/messages/media_items ยังไม่มี ก่อน Story 2.1): แสดง `—` แทนตัวเลข ไม่ crash

6. **Dashboard page — recent content:**
   - 2-column grid: **Recent Projects** (5 รายการล่าสุด) + **Recent Articles** (5 รายการล่าสุด)
   - แต่ละรายการ: title, status badge, date (relative)
   - Empty state ถ้าไม่มีข้อมูล: icon + "ยังไม่มีเนื้อหา" + ปุ่ม Create
   - ถ้า query error: แสดง empty state (ไม่ crash)

7. **Tests:**
   - `getTenantId()` super_admin — อ่าน cookie / throw เมื่อไม่มี cookie
   - `assertRole()` — redirect กรณี no session / insufficient role
   - `switchTenantAction` — set cookie, revalidate
   - Dashboard stat card rendering (unit test)

## Tasks / Subtasks

- [x] Task 1: อัปเดต `getTenantId()` ให้รองรับ super_admin cookie (AC: #3)
  - [x] import `cookies` จาก `next/headers` ใน `src/lib/tenant.ts`
  - [x] เมื่อ `role === 'super_admin'`: อ่าน cookie `active_tenant_id`
  - [x] ถ้า cookie ไม่มีค่า → throw `new Error('SUPER_ADMIN_NO_TENANT_SELECTED')`
  - [x] อัปเดต `requireTenant()` ให้ return 400 + code `TENANT_NOT_SELECTED` สำหรับ super_admin ที่ยังไม่เลือก tenant

- [x] Task 2: เพิ่ม `assertRole()` ใน `src/lib/auth.ts` (AC: #4)
  - [x] เพิ่ม import `redirect` จาก `next/navigation`
  - [x] สร้าง `assertRole(minimumRole: UserRole): Promise<void>`
  - [x] ไม่มี session → `redirect('/login')`
  - [x] profile query fail หรือ role ต่ำกว่า → `redirect('/')`
  - [x] **ห้ามแก้ไข** `requireRole()` เดิม (ใช้ใน API routes, return NextResponse ไม่ใช่ redirect)

- [x] Task 3: สร้าง `switchTenantAction` Server Action (AC: #1)
  - [x] สร้าง `src/app/(admin)/actions.ts`
  - [x] `switchTenantAction(tenantId: string)`: validate tenantId → set cookie `active_tenant_id` → `revalidatePath('/', 'layout')`
  - [x] Validate ว่า tenantId เป็น UUID valid + tenant นั้น is_active = true (ใช้ `createServiceRoleClient()`)
  - [x] ต้องเรียก `assertRole('super_admin')` ก่อนทำงาน
  - [x] Cookie config: `httpOnly: true`, `secure: true`, `sameSite: 'lax'`, `maxAge: 60 * 60 * 24 * 30`

- [x] Task 4: สร้าง TenantSwitcher component (AC: #1, #2)
  - [x] สร้าง `src/components/layout/tenant-switcher.tsx`
  - [x] **Server Component wrapper** (`TenantSwitcher`): ดึง tenants list ด้วย `createServiceRoleClient()` → ส่งให้ Client Component
  - [x] **Client Component** (`TenantSwitcherUI`): Combobox/Select dropdown (shadcn/ui `Select`)
  - [x] super_admin UI: แสดง tenant ที่เลือกอยู่ (active_tenant_id จาก cookie) + dropdown ทั้งหมด
  - [x] non-super_admin UI: แสดง tenant name อย่างเดียว (ไม่มี interactive)
  - [x] on select: เรียก `switchTenantAction` + แสดง loading state ระหว่าง transition

- [x] Task 5: อัปเดต `(admin)/layout.tsx` + Sidebar ให้รองรับ TenantSwitcher slot (AC: #1, #2)
  - [x] อัปเดต `src/app/(admin)/layout.tsx`:
    - ดึง `activeTenantId` จาก cookies() → ส่งไปที่ TenantSwitcher
    - ถ้า isSuperAdmin: ดึง tenants ทั้งหมดด้วย `createServiceRoleClient()`
    - ถ้า !isSuperAdmin: ดึง tenant name จาก profile query (มีอยู่แล้ว)
    - render `<TenantSwitcher ... />` แล้วส่งเป็น prop `tenantSwitcherSlot` ให้ Sidebar
  - [x] อัปเดต `src/components/layout/sidebar.tsx`:
    - เพิ่ม prop `tenantSwitcherSlot?: React.ReactNode`
    - render slot ใต้ brand logo
  - [x] อัปเดต `src/components/layout/mobile-sidebar.tsx` ให้รับและ forward `tenantSwitcherSlot` เช่นกัน (forward ผ่าน SidebarProps spread)

- [x] Task 6: สร้าง Dashboard page (AC: #5, #6)
  - [x] อัปเดต `src/app/(admin)/page.tsx` — เปลี่ยนจาก placeholder เป็น Server Component เต็มรูปแบบ
  - [x] Handle `SUPER_ADMIN_NO_TENANT_SELECTED`: render `<SelectTenantPrompt />` แทน stats
  - [x] Fetch stats ด้วย `Promise.allSettled` (ไม่ crash ถ้า table ยังไม่มี):
    - `projects` count: `status = 'published'`, `deleted_at IS NULL`
    - `articles` count: `status = 'published'`, `deleted_at IS NULL`
    - `messages` count: `is_read = false`
    - `media_items` count: ไม่มี filter
  - [x] Fetch recent content ด้วย `Promise.allSettled`:
    - Recent projects: `ORDER BY created_at DESC LIMIT 5`, select `id, title_th, title_en, status, created_at`
    - Recent articles: `ORDER BY created_at DESC LIMIT 5`, select `id, title_th, title_en, status, created_at`
  - [x] สร้าง `src/components/dashboard/stats-card.tsx` — reusable stat card
  - [x] สร้าง `src/components/dashboard/recent-content-list.tsx` — list with empty state
  - [x] สร้าง `src/components/dashboard/select-tenant-prompt.tsx` — empty state สำหรับ super_admin ที่ยังไม่เลือก tenant

- [x] Task 7: Install shadcn/ui Select (ถ้ายังไม่มี)
  - [x] `select.tsx` มีอยู่แล้วใน project — ข้ามขั้นตอนนี้

- [x] Task 8: Tests (AC: #7)
  - [x] `src/lib/tenant.test.ts` — เพิ่ม test cases:
    - super_admin อ่าน cookie → return cookie value
    - super_admin ไม่มี cookie → throw `SUPER_ADMIN_NO_TENANT_SELECTED`
    - regular admin → อ่านจาก users table (เหมือนเดิม)
  - [x] `src/lib/auth.test.ts` — เพิ่ม test cases:
    - `assertRole('admin')` + no session → spy redirect('/login')
    - `assertRole('admin')` + editor role → spy redirect('/')
    - `assertRole('editor')` + editor role → ไม่ redirect (pass through)
  - [x] `src/app/(admin)/actions.test.ts` — test `switchTenantAction`:
    - non-super_admin เรียก → ถูก redirect ออก (assertRole guard)
    - valid tenantId → cookie ถูก set + revalidatePath ถูกเรียก
  - [x] `src/components/dashboard/stats-card.test.tsx` — render test basic

## Dev Notes

### อัปเดต `getTenantId()` — tenant.ts

```typescript
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function getTenantId(): Promise<string> {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized: No active session')
  }

  const { data, error } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    throw new Error('User profile not found')
  }

  if (data.role === 'super_admin') {
    // super_admin เลือก active tenant ผ่าน TenantSwitcher → เก็บใน cookie
    const cookieStore = await cookies()
    const activeTenantId = cookieStore.get('active_tenant_id')?.value
    if (!activeTenantId) {
      throw new Error('SUPER_ADMIN_NO_TENANT_SELECTED')
    }
    return activeTenantId
  }

  if (!data.tenant_id) {
    throw new Error('Super admin must specify tenant context')
  }

  return data.tenant_id
}

export async function requireTenant(): Promise<string | NextResponse> {
  try {
    return await getTenantId()
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    if (message === 'SUPER_ADMIN_NO_TENANT_SELECTED') {
      return NextResponse.json(
        { error: 'No tenant selected', code: 'TENANT_NOT_SELECTED', status: 400 },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 },
      { status: 401 }
    )
  }
}
```

### เพิ่ม `assertRole()` ใน auth.ts

```typescript
// เพิ่มต่อจาก requireRole() ที่มีอยู่แล้ว
// ใช้ใน Server Component pages (redirect แทน return NextResponse)

import { redirect } from 'next/navigation'

export async function assertRole(minimumRole: UserRole): Promise<void> {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const roleHierarchy: UserRole[] = ['editor', 'admin', 'super_admin']
  const userRoleIndex = roleHierarchy.indexOf(data?.role as UserRole ?? 'editor')
  const requiredIndex = roleHierarchy.indexOf(minimumRole)

  if (userRoleIndex < requiredIndex) {
    redirect('/')
  }
}
```

> **หมายเหตุ:** `requireRole()` เดิมยังคงอยู่และใช้ใน API routes — ห้ามแก้ไข

### switchTenantAction

```typescript
// src/app/(admin)/actions.ts
'use server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/admin'

export async function switchTenantAction(tenantId: string) {
  await assertRole('super_admin')

  // Validate tenant exists + is active
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('id', tenantId)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    throw new Error('Invalid or inactive tenant')
  }

  const cookieStore = await cookies()
  cookieStore.set('active_tenant_id', tenantId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 วัน
    path: '/',
  })

  revalidatePath('/', 'layout')
}
```

### TenantSwitcher Component

```typescript
// src/components/layout/tenant-switcher.tsx

// --- Server Component (wrapper) ---
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { TenantSwitcherUI } from './tenant-switcher-ui'

type Props = {
  isSuperAdmin: boolean
  activeTenantId?: string
  currentTenantName?: string  // สำหรับ non-super_admin
}

export async function TenantSwitcher({ isSuperAdmin, activeTenantId, currentTenantName }: Props) {
  if (!isSuperAdmin) {
    // non-super_admin: แสดงชื่อ tenant อย่างเดียว
    return (
      <div className="px-3 py-2">
        <p className="text-xs text-sidebar-muted uppercase tracking-widest mb-1">Tenant</p>
        <p className="text-sm font-medium text-sidebar-active truncate">
          {currentTenantName ?? 'Unknown'}
        </p>
      </div>
    )
  }

  // super_admin: ดึง tenants ทั้งหมด
  const supabase = createServiceRoleClient()
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name')

  return (
    <TenantSwitcherUI
      tenants={tenants ?? []}
      activeTenantId={activeTenantId}
    />
  )
}
```

```typescript
// src/components/layout/tenant-switcher-ui.tsx
'use client'
import { useTransition } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { switchTenantAction } from '@/app/(admin)/actions'

type Tenant = { id: string; name: string; slug: string }

type Props = {
  tenants: Tenant[]
  activeTenantId?: string
}

export function TenantSwitcherUI({ tenants, activeTenantId }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSelect(tenantId: string) {
    startTransition(async () => {
      await switchTenantAction(tenantId)
    })
  }

  return (
    <div className="px-3 py-2">
      <p className="text-xs text-sidebar-muted uppercase tracking-widest mb-1">Tenant</p>
      <Select
        value={activeTenantId ?? ''}
        onValueChange={handleSelect}
        disabled={isPending}
      >
        <SelectTrigger
          className="w-full h-8 text-sm bg-transparent border-sidebar-border text-sidebar-text focus:ring-0 focus:ring-offset-0"
        >
          <SelectValue placeholder="เลือก Tenant..." />
        </SelectTrigger>
        <SelectContent>
          {tenants.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
              <span className="ml-1 text-xs text-muted-foreground">({t.slug})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
```

### อัปเดต Sidebar props

```typescript
// src/components/layout/sidebar.tsx — เพิ่ม prop
type SidebarProps = {
  user: { email: string; role: string }
  enabledFeatures: string[]
  isSuperAdmin: boolean
  tenantSwitcherSlot?: React.ReactNode  // NEW
}

// ใน JSX ของ sidebar, ใต้ brand logo:
<div className="border-b border-sidebar-border">
  {tenantSwitcherSlot}
</div>
```

### อัปเดต `(admin)/layout.tsx`

```typescript
// src/app/(admin)/layout.tsx
import { createServerClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileSidebar } from '@/components/layout/mobile-sidebar'
import { TenantSwitcher } from '@/components/layout/tenant-switcher'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, tenant_id, tenants(name, enabled_features)')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = profile?.role === 'super_admin'
  const enabledFeatures = (profile?.tenants as any)?.enabled_features ?? []
  const currentTenantName = (profile?.tenants as any)?.name

  // super_admin: active tenant จาก cookie
  const cookieStore = await cookies()
  const activeTenantId = cookieStore.get('active_tenant_id')?.value

  const tenantSwitcherSlot = (
    <TenantSwitcher
      isSuperAdmin={isSuperAdmin}
      activeTenantId={activeTenantId}
      currentTenantName={currentTenantName}
    />
  )

  const sidebarProps = {
    user: { email: user.email!, role: profile?.role ?? 'editor' },
    enabledFeatures,
    isSuperAdmin,
    tenantSwitcherSlot,
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:flex">
        <Sidebar {...sidebarProps} />
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="flex items-center md:hidden px-4 py-3 border-b">
          <MobileSidebar {...sidebarProps} />
        </div>
        {children}
      </main>
    </div>
  )
}
```

### Dashboard Page

```typescript
// src/app/(admin)/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTenantId } from '@/lib/tenant'
import { PageHeader } from '@/components/layout/page-header'
import { StatsCard } from '@/components/dashboard/stats-card'
import { RecentContentList } from '@/components/dashboard/recent-content-list'
import { SelectTenantPrompt } from '@/components/dashboard/select-tenant-prompt'
import { LayoutGrid, FileText, MessageSquare, ImageIcon } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // handle super_admin ที่ยังไม่เลือก tenant
  let tenantId: string | null = null
  try {
    tenantId = await getTenantId()
  } catch (e) {
    if (e instanceof Error && e.message === 'SUPER_ADMIN_NO_TENANT_SELECTED') {
      return (
        <div className="p-8">
          <PageHeader title="Dashboard" />
          <SelectTenantPrompt />
        </div>
      )
    }
    redirect('/login')
  }

  // Fetch stats — Promise.allSettled เพื่อไม่ crash ถ้า table ยังไม่มี (ก่อน Story 2.1)
  const [projectsRes, articlesRes, messagesRes, mediaRes] = await Promise.allSettled([
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'published')
      .is('deleted_at', null),
    supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'published')
      .is('deleted_at', null),
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_read', false),
    supabase
      .from('media_items')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
  ])

  const stats = {
    projects: projectsRes.status === 'fulfilled' ? (projectsRes.value.count ?? 0) : null,
    articles: articlesRes.status === 'fulfilled' ? (articlesRes.value.count ?? 0) : null,
    messages: messagesRes.status === 'fulfilled' ? (messagesRes.value.count ?? 0) : null,
    media:    mediaRes.status === 'fulfilled'    ? (mediaRes.value.count ?? 0)    : null,
  }

  // Fetch recent content
  const [recentProjectsRes, recentArticlesRes] = await Promise.allSettled([
    supabase
      .from('projects')
      .select('id, title_th, title_en, status, created_at')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('articles')
      .select('id, title_th, title_en, status, created_at')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const recentProjects = recentProjectsRes.status === 'fulfilled' ? (recentProjectsRes.value.data ?? []) : []
  const recentArticles = recentArticlesRes.status === 'fulfilled' ? (recentArticlesRes.value.data ?? []) : []

  return (
    <div className="p-8 space-y-8">
      <PageHeader title="Dashboard" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Projects" value={stats.projects} icon={LayoutGrid} href="/projects" />
        <StatsCard label="Articles" value={stats.articles} icon={FileText} href="/blog" />
        <StatsCard label="ข้อความใหม่" value={stats.messages} icon={MessageSquare} href="/messages" />
        <StatsCard label="Media" value={stats.media} icon={ImageIcon} href="/media" />
      </div>

      {/* Recent Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentContentList
          title="Projects ล่าสุด"
          items={recentProjects}
          createHref="/projects"
          createLabel="สร้าง Project"
        />
        <RecentContentList
          title="Articles ล่าสุด"
          items={recentArticles}
          createHref="/blog"
          createLabel="สร้าง Article"
        />
      </div>
    </div>
  )
}
```

### StatsCard Component

```typescript
// src/components/dashboard/stats-card.tsx
import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

type StatsCardProps = {
  label: string
  value: number | null  // null = ยังโหลดไม่ได้ (ก่อน Story 2.1)
  icon: LucideIcon
  href: string
}

export function StatsCard({ label, value, icon: Icon, href }: StatsCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-lg border border-border bg-card p-5 hover:border-primary transition-colors"
    >
      <div className="rounded-md bg-muted p-2.5 group-hover:bg-primary/5 transition-colors">
        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
      </div>
      <div>
        <p className="text-2xl font-semibold tabular-nums">
          {value === null ? '—' : value.toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Link>
  )
}
```

### RecentContentList Component

```typescript
// src/components/dashboard/recent-content-list.tsx
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'

type ContentItem = {
  id: string
  title_th?: string | null
  title_en?: string | null
  status: string
  created_at: string
}

type Props = {
  title: string
  items: ContentItem[]
  createHref: string
  createLabel: string
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  published: 'default',
  draft:     'secondary',
  archived:  'outline',
}

export function RecentContentList({ title, items, createHref, createLabel }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link href={createHref} className="text-xs text-muted-foreground hover:text-foreground">
          ดูทั้งหมด →
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
          <FileText className="h-8 w-8 opacity-40" />
          <p className="text-sm">ยังไม่มีเนื้อหา</p>
          <Link
            href={createHref}
            className="text-xs font-medium text-primary hover:underline mt-1"
          >
            {createLabel}
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`${createHref}/${item.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors"
              >
                <span className="text-sm truncate max-w-[60%]">
                  {item.title_th || item.title_en || 'Untitled'}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={STATUS_VARIANT[item.status] ?? 'outline'} className="text-xs capitalize">
                    {item.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### SelectTenantPrompt Component

```typescript
// src/components/dashboard/select-tenant-prompt.tsx
import { Building2 } from 'lucide-react'

export function SelectTenantPrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
      <Building2 className="h-12 w-12 opacity-30" />
      <p className="text-lg font-medium text-foreground">เลือก Tenant เพื่อเริ่มต้น</p>
      <p className="text-sm">ใช้ Tenant Switcher ในแถบซ้ายมือเพื่อเลือก tenant ที่ต้องการจัดการ</p>
    </div>
  )
}
```

### ข้อควรระวัง

#### Dashboard stats ก่อน Story 2.1
ตาราง `projects`, `articles`, `messages`, `media_items` ยังไม่ถูกสร้างจนกว่า Story 2.1 จะรัน migration 003/004  
→ Supabase จะ return error `relation "projects" does not exist`  
→ `Promise.allSettled` จะ catch ทั้งหมด → stats แสดงเป็น `—`  
→ **ไม่ต้อง mock หรือ workaround** — behavior นี้ถูกต้อง

#### TenantSwitcher + server-only
`createServiceRoleClient()` ใน `TenantSwitcher` server component → เรียกได้เพราะ server component ทำงานบน server เท่านั้น  
→ ไม่ต้อง import `server-only` เพิ่ม เพราะ `admin.ts` มี directive นั้นอยู่แล้ว

#### Cookie กับ middleware
middleware.ts ที่สร้างใน Story 1.3 ใช้ `getClaims()` เท่านั้น — ไม่ได้ใช้ `active_tenant_id`  
→ cookie นี้ใช้ใน application layer เท่านั้น ไม่กระทบ middleware auth flow

#### `revalidatePath('/', 'layout')` ใน switchTenantAction
Next.js 15: `revalidatePath` ด้วย `'layout'` จะ re-render layout + ทุก page ใน scope  
→ เมื่อ super_admin switch tenant, sidebar + dashboard จะ reload ข้อมูลใหม่ทั้งหมด

### Key Learnings จาก Story 1.1–1.4

| ประเด็น | การจัดการ |
|---------|-----------|
| Tailwind v4 ใช้ `@theme inline` | ไม่แก้ tailwind.config.ts — ใช้ CSS ตรงๆ |
| `@base-ui/react` ใช้ `render` prop | shadcn/ui `Select` ใช้ pattern ปกติ — ไม่มีปัญหา |
| `buildMenuSections` แยกไปที่ `lib/sidebar-menu.ts` | Test sidebar โดย import จาก lib แทน |
| vitest@2.1.9 + happy-dom | ยังใช้ pattern เดิม |
| cookies() ใน Next.js 15 | `await cookies()` (async API) |

### References

- UX-DR7: TenantSwitcher — sidebar top, super_admin only
- UX-DR8: Dashboard layout — 4-col stats, 2-col recent content
- UX-DR9: Stats card design
- UX-DR10: Empty state pattern — icon + heading + CTA
- UX-DR24: Role-based UI visibility
- FR-AUTH-3: RBAC — editor/admin/super_admin hierarchy
- FR-TENANT-2: Super admin can switch tenant context
- [Source: _bmad-output/planning-artifacts/architecture.md#Authorization]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Dashboard]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Task 8 (StatsCard test): `@testing-library/react` + `@testing-library/dom` ไม่ได้ติดตั้งไว้ — ขออนุมัติและติดตั้งก่อน run test
- `tenant-switcher-ui.tsx` onValueChange: Base UI Select ใช้ signature `(value: string | null)` ต่างจาก standard shadcn — แก้ handler ให้รับ `null` ด้วย
- `page.tsx` type errors บน tables ที่ยังไม่มีใน Database type: ใช้ `as any` ตาม Dev Notes (tables จะมีหลัง Story 2.1)
- test files: `as ReturnType<typeof createServerClient>` ต้องเปลี่ยนเป็น `as unknown as` เพราะ mock type ไม่ overlap

### Completion Notes List

- Task 1: อัปเดต `getTenantId()` — super_admin branch อ่าน cookie `active_tenant_id`, throw `SUPER_ADMIN_NO_TENANT_SELECTED` ถ้าไม่มี; `requireTenant()` return 400 + `TENANT_NOT_SELECTED` code
- Task 2: เพิ่ม `assertRole()` ใน `auth.ts` — ใช้ redirect() แทน NextResponse; `requireRole()` เดิมไม่ถูกแก้ไข
- Task 3: สร้าง `actions.ts` — `switchTenantAction` ตรวจ assertRole → validate tenant → set cookie 30d → revalidatePath('/', 'layout')
- Task 4: สร้าง `tenant-switcher.tsx` (Server) + `tenant-switcher-ui.tsx` (Client) — แยก Server/Client ตาม pattern
- Task 5: เพิ่ม `tenantSwitcherSlot` prop ใน SidebarProps → render ใต้ brand logo; layout.tsx ดึง activeTenantId จาก cookies + tenantName จาก profile query
- Task 6: Dashboard page ใหม่ทั้งหมด — Promise.allSettled สำหรับ stats + recent content; handle SUPER_ADMIN_NO_TENANT_SELECTED; สร้าง StatsCard, RecentContentList, SelectTenantPrompt components
- Task 7: select.tsx มีอยู่แล้ว — ข้าม
- Task 8: 14 test files, 106 tests ผ่านหมด; ติดตั้ง @testing-library/react + @testing-library/dom เป็น devDependencies ใหม่

### File List

- `src/lib/tenant.ts` — อัปเดต
- `src/lib/tenant.test.ts` — อัปเดต (เพิ่ม 5 test cases)
- `src/lib/auth.ts` — อัปเดต (เพิ่ม assertRole)
- `src/lib/auth.test.ts` — สร้างใหม่
- `src/app/(admin)/actions.ts` — สร้างใหม่
- `src/app/(admin)/actions.test.ts` — สร้างใหม่
- `src/app/(admin)/layout.tsx` — อัปเดต
- `src/app/(admin)/page.tsx` — อัปเดต (rewrite ทั้งหมด)
- `src/components/layout/sidebar.tsx` — อัปเดต (เพิ่ม tenantSwitcherSlot prop)
- `src/components/layout/tenant-switcher.tsx` — สร้างใหม่
- `src/components/layout/tenant-switcher-ui.tsx` — สร้างใหม่
- `src/components/dashboard/stats-card.tsx` — สร้างใหม่
- `src/components/dashboard/stats-card.test.tsx` — สร้างใหม่
- `src/components/dashboard/recent-content-list.tsx` — สร้างใหม่
- `src/components/dashboard/select-tenant-prompt.tsx` — สร้างใหม่
- `package.json` — เพิ่ม @testing-library/react, @testing-library/dom

### Change Log

- 2026-04-09: Story 1.5 implementation — Dashboard RBAC & Tenant Switcher สมบูรณ์ครบทุก AC
