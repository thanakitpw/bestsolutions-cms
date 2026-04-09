# Story 1.4: Admin Shell — Design System & Sidebar Layout

Status: review

## Story

As an admin,
I want a professional admin shell with dark sidebar, consistent design system, and responsive layout,
so that I can navigate the CMS efficiently on any device.

## Acceptance Criteria

1. **Design system (CSS variables + typography):**
   - CSS variables ครบตาม spec ใน `globals.css`: `--background`, `--foreground`, `--muted`, `--muted-foreground`, `--border`, `--primary`, `--primary-foreground`, `--destructive`, `--ring`, `--sidebar-bg`, `--sidebar-text`, `--sidebar-active`, `--sidebar-border`
   - Font `Noto Sans Thai` โหลดสำเร็จ — ทดสอบดูที่ภาษาไทยใน UI

2. **Sidebar — Desktop (≥1024px):**
   - Sidebar ดำ (`#141414`) กว้าง 240px ซ้ายมือ
   - Grouped sections: **CONTENT** (Projects, Blog), **COMMUNICATION** (Messages), **ASSETS** (Media), **SYSTEM** (Settings, Analytics) — section labels ALL CAPS
   - Active menu item: สีขาว + highlight background
   - User profile (email, role) + Logout button ด้านล่าง sidebar
   - Feature-flag aware: ซ่อน menu items ของ features ที่ tenant ไม่ได้เปิด (`enabled_features`)

3. **Sidebar — Tablet (768–1023px):**
   - Collapse เป็น icon-only 56px
   - Hover บน icon แสดง tooltip ชื่อ menu item

4. **Sidebar — Mobile (<768px):**
   - ซ่อน sidebar → แสดง hamburger icon บน topbar
   - กด hamburger → เปิด sidebar overlay

5. **Loading states:**
   - Skeleton loading แทน spinner ทุกที่ — รูปร่างต้อง match content
   - Sidebar + Topbar โหลดก่อน content เสมอ

6. **Accessibility:**
   - ทุก interactive element มี focus ring ดำชัดเจน (`--ring`)
   - Touch targets ทุกปุ่มขนาด min 44×44px
   - Keyboard navigation ผ่าน Tab/Shift+Tab ทุก menu item

## Tasks / Subtasks

- [x] Task 1: Setup design system tokens ใน globals.css (AC: #1)
  - [x] เพิ่ม CSS variables ทั้งหมดตาม spec ใน `src/app/globals.css`
  - [x] ตั้งค่า Tailwind config ให้ใช้ CSS variables แทน hardcoded colors
  - [x] Install + setup `Noto Sans Thai` via Google Fonts ใน `src/app/layout.tsx`
  - [x] ตั้ง `--font-sans` ใน globals.css ให้ apply ทั้ง app

- [x] Task 2: สร้าง Sidebar component (AC: #2, #3, #4)
  - [x] สร้าง `src/components/layout/sidebar.tsx`
  - [x] Implement grouped sections ด้วย hardcoded menu structure (feature flags ใน Task 3)
  - [x] Active state: เช็ค `usePathname()` จาก next/navigation
  - [x] Icon สำหรับแต่ละ menu item (Lucide React)
  - [x] User profile section ด้านล่าง: แสดง email, role badge, Logout button
  - [x] Logout button เรียก `logoutAction` จาก `src/app/(auth)/logout/actions.ts`
  - [x] Collapse state: `useState` สำหรับ expanded/collapsed
  - [x] Tooltip สำหรับ collapsed state ใช้ shadcn/ui `Tooltip`

- [x] Task 3: Feature-flag aware sidebar (AC: #2)
  - [x] ดึง `enabled_features` จาก tenant ของ current user (query `site_settings` หรือ `tenants` table)
  - [x] ซ่อน "Blog" ถ้า `blog` ไม่ใน `enabled_features`
  - [x] ซ่อน "Messages" ถ้า `messages` ไม่ใน `enabled_features`
  - [x] ซ่อน "Projects" ถ้า `projects` ไม่ใน `enabled_features`
  - [x] super_admin เห็น menu ทั้งหมดเสมอ (ไม่กรอง feature flags)

- [x] Task 4: สร้าง (admin) layout (AC: #2, #5)
  - [x] อัปเดต `src/app/(admin)/layout.tsx` ให้ render Sidebar + main content area
  - [x] สร้าง `src/app/(admin)/loading.tsx` — Skeleton สำหรับ admin content

- [x] Task 5: สร้าง PageHeader component (AC: #1)
  - [x] สร้าง `src/components/layout/page-header.tsx`
  - [x] Props: `title`, `breadcrumbs`, `actions` (React nodes)
  - [x] Breadcrumb format: `[Tenant Name] > [Section] > [Item]`
  - [x] Primary action button วางขวาบน (1 ปุ่มเท่านั้น)

- [x] Task 6: Responsive — Tablet + Mobile (AC: #3, #4)
  - [x] Tailwind breakpoints: `lg:` สำหรับ desktop, `md:` สำหรับ tablet
  - [x] Tablet: sidebar `w-14` (56px) icon-only, `hidden` text
  - [x] Mobile: sidebar `hidden`, topbar มี hamburger button (`Sheet` component จาก shadcn/ui)
  - [x] Mobile overlay: ใช้ shadcn/ui `Sheet` sliding panel

- [x] Task 7: Skeleton loading states (AC: #5)
  - [x] สร้าง `src/components/layout/sidebar-skeleton.tsx` — placeholder sidebar
  - [x] สร้าง skeleton สำหรับ table rows (ใช้ใน Projects/Blog/Messages list)
  - [x] ตรวจสอบว่า `src/app/(admin)/loading.tsx` ใช้ Skeleton ไม่ใช่ spinner

- [x] Task 8: Accessibility audit (AC: #6)
  - [x] เพิ่ม `focus-visible:ring-2 focus-visible:ring-ring` ในทุก interactive element
  - [x] ตรวจสอบ touch targets ≥44px (`min-h-11 min-w-11`)
  - [x] เพิ่ม `aria-label` ทุก icon-only button
  - [x] ตรวจสอบ keyboard navigation ผ่าน Tab

- [x] Task 9: Install shadcn/ui components ที่ต้องการ
  - [x] `npx shadcn@latest add tooltip` — สำหรับ sidebar collapsed tooltips
  - [x] `npx shadcn@latest add sheet` — สำหรับ mobile sidebar overlay (มีอยู่แล้ว)
  - [x] `npx shadcn@latest add skeleton` — สำหรับ loading states
  - [x] `npx shadcn@latest add badge` — สำหรับ role badge และ status badges (มีอยู่แล้ว)

## Dev Notes

### CSS Variables — globals.css

เพิ่ม/แก้ไขใน `src/app/globals.css` (:root section):

```css
@layer base {
  :root {
    --background:         0 0% 100%;
    --foreground:         0 0% 6%;
    --card:               0 0% 100%;
    --card-foreground:    0 0% 6%;
    --muted:              0 0% 96%;
    --muted-foreground:   0 0% 45%;
    --border:             0 0% 89%;
    --input:              0 0% 89%;
    --primary:            0 0% 9%;
    --primary-foreground: 0 0% 100%;
    --destructive:        0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --ring:               0 0% 9%;
    --radius:             0.5rem;

    /* Sidebar — dark */
    --sidebar-bg:         0 0% 8%;     /* #141414 */
    --sidebar-text:       0 0% 85%;    /* #D9D9D9 */
    --sidebar-active:     0 0% 100%;   /* #FFFFFF */
    --sidebar-border:     0 0% 15%;    /* #262626 */
    --sidebar-muted:      0 0% 55%;    /* เทากลาง สำหรับ section labels */
  }
}
```

**Tailwind config** — เพิ่ม sidebar colors ใน `tailwind.config.ts`:
```typescript
theme: {
  extend: {
    colors: {
      sidebar: {
        bg: 'hsl(var(--sidebar-bg))',
        text: 'hsl(var(--sidebar-text))',
        active: 'hsl(var(--sidebar-active))',
        border: 'hsl(var(--sidebar-border))',
        muted: 'hsl(var(--sidebar-muted))',
      },
    },
  },
}
```

### Font Setup — Noto Sans Thai

ใน `src/app/layout.tsx`:
```typescript
import { Noto_Sans_Thai } from 'next/font/google'

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={notoSansThai.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
```

ใน `globals.css`:
```css
body {
  font-family: var(--font-sans), system-ui, sans-serif;
}
```

Tailwind config:
```typescript
fontFamily: {
  sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
},
```

### Sidebar Structure

```
sidebar (w-60 lg:w-60 md:w-14)
├── [top] Logo / Brand name
├── [TenantSwitcher] ← Story 1.5 จะเพิ่ม
├── [sections]
│   ├── CONTENT (section label)
│   │   ├── Projects (LayoutGrid icon)
│   │   └── Blog (FileText icon) ← ซ่อนถ้า !enabled_features.includes('blog')
│   ├── COMMUNICATION (section label)
│   │   └── Messages (MessageSquare icon) ← ซ่อนถ้า !enabled_features.includes('messages')
│   ├── ASSETS (section label)
│   │   └── Media (Image icon)
│   └── SYSTEM (section label)
│       ├── Settings (Settings icon)
│       └── Analytics (BarChart icon) ← placeholder
└── [bottom]
    ├── user email + role badge
    └── Logout button
```

### Sidebar Component

```typescript
// src/components/layout/sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/app/(auth)/logout/actions'
// ... icons from lucide-react

type SidebarProps = {
  user: { email: string; role: string }
  enabledFeatures: string[]
  isSuperAdmin: boolean
}

export function Sidebar({ user, enabledFeatures, isSuperAdmin }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    {
      section: 'CONTENT',
      items: [
        { label: 'Projects', href: '/projects', icon: LayoutGrid,
          show: isSuperAdmin || enabledFeatures.includes('projects') },
        { label: 'Blog', href: '/blog', icon: FileText,
          show: isSuperAdmin || enabledFeatures.includes('blog') },
      ],
    },
    {
      section: 'COMMUNICATION',
      items: [
        { label: 'Messages', href: '/messages', icon: MessageSquare,
          show: isSuperAdmin || enabledFeatures.includes('messages') },
      ],
    },
    {
      section: 'ASSETS',
      items: [
        { label: 'Media', href: '/media', icon: ImageIcon, show: true },
      ],
    },
    {
      section: 'SYSTEM',
      items: [
        { label: 'Settings', href: '/settings', icon: Settings, show: true },
        { label: 'Analytics', href: '/analytics', icon: BarChart2, show: true },
      ],
    },
  ]

  return (
    <aside className={cn(
      'flex flex-col h-screen bg-sidebar-bg border-r border-sidebar-border transition-all duration-200',
      collapsed ? 'w-14' : 'w-60'
    )}>
      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((group) => {
          const visibleItems = group.items.filter((i) => i.show)
          if (visibleItems.length === 0) return null
          return (
            <div key={group.section} className="mb-4">
              {!collapsed && (
                <p className="px-3 mb-1 text-[11px] font-semibold tracking-widest text-sidebar-muted uppercase">
                  {group.section}
                </p>
              )}
              {visibleItems.map((item) => (
                <SidebarItem
                  key={item.href}
                  {...item}
                  active={pathname.startsWith(item.href)}
                  collapsed={collapsed}
                />
              ))}
            </div>
          )
        })}
      </nav>

      {/* User profile + logout */}
      <div className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <p className="text-xs text-sidebar-muted truncate mb-2">{user.email}</p>
        )}
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 w-full px-2 py-2 text-sidebar-text hover:text-sidebar-active rounded-md hover:bg-white/5 min-h-11"
            aria-label="ออกจากระบบ"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="text-sm">ออกจากระบบ</span>}
          </button>
        </form>
      </div>
    </aside>
  )
}
```

### (admin) Layout

```typescript
// src/app/(admin)/layout.tsx
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // ดึง user profile + tenant info
  const { data: profile } = await supabase
    .from('users')
    .select('role, tenant_id, tenants(enabled_features)')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = profile?.role === 'super_admin'
  const enabledFeatures = (profile?.tenants as any)?.enabled_features ?? []

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar — hidden บน mobile */}
      <div className="hidden md:flex">
        <Sidebar
          user={{ email: user.email!, role: profile?.role ?? 'editor' }}
          enabledFeatures={enabledFeatures}
          isSuperAdmin={isSuperAdmin}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
```

> **Note:** Mobile hamburger + Sheet overlay implement ใน Task 6 เป็น Client Component แยก

### PageHeader Component

```typescript
// src/components/layout/page-header.tsx
type Breadcrumb = { label: string; href?: string }

type PageHeaderProps = {
  title: string
  breadcrumbs?: Breadcrumb[]
  action?: React.ReactNode  // Primary action (1 ปุ่มเท่านั้น)
}

export function PageHeader({ title, breadcrumbs, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between px-8 pt-8 pb-4">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-foreground">{crumb.label}</Link>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
```

### Responsive Layout

**Tailwind breakpoints:**
```
mobile: < 768px  → sidebar ซ่อน + hamburger icon
tablet: md (768–1023px) → sidebar 56px icon-only
desktop: lg (≥1024px) → sidebar 240px full
```

**Mobile Sheet** (shadcn/ui):
```typescript
// src/components/layout/mobile-sidebar.tsx
'use client'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { Sidebar } from './sidebar'

export function MobileSidebar({ ...props }: SidebarProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="md:hidden p-2 min-h-11 min-w-11" aria-label="เปิดเมนู">
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-60 bg-sidebar-bg border-sidebar-border">
        <Sidebar {...props} />
      </SheetContent>
    </Sheet>
  )
}
```

### Skeleton Loading

```typescript
// src/components/layout/sidebar-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton'

export function SidebarSkeleton() {
  return (
    <aside className="w-60 h-screen bg-sidebar-bg border-r border-sidebar-border p-4">
      <Skeleton className="h-8 w-32 mb-8 bg-white/10" />
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-8 w-full mb-2 bg-white/10" />
      ))}
    </aside>
  )
}
```

### Feature-Flag Query

ดึง `enabled_features` จาก DB ใน layout server component:

```typescript
// tenant_id อาจเป็น null สำหรับ super_admin
const { data: profile } = await supabase
  .from('users')
  .select(`
    role,
    tenant_id,
    tenants (
      enabled_features,
      slug
    )
  `)
  .eq('id', user.id)
  .single()
```

> **สำหรับ super_admin:** `tenant_id = null` → `tenants` จะเป็น null → ให้ `enabledFeatures = []` แต่ `isSuperAdmin = true` → sidebar แสดง menu ทั้งหมด (Story 1.5 จะเพิ่ม tenant switcher สำหรับ super_admin เลือก tenant)

### สิ่งที่ Story นี้ไม่ทำ

- ❌ TenantSwitcher component → Story 1.5
- ❌ Dashboard content (stats cards, recent lists) → Story 1.5
- ❌ Dark mode toggle (optional Phase 2) — placeholder ได้แต่ไม่ต้อง implement
- ❌ Tiptap editor → Story 2.4
- ❌ Content form components → Story 2.x

### Key Learnings จาก Story 1.1–1.3

| ประเด็น | การจัดการ |
|---------|-----------|
| Route group เป็น `(admin)` แล้ว | `src/app/(admin)/layout.tsx` มีอยู่แล้ว |
| `logoutAction` อยู่ใน `src/app/(auth)/logout/actions.ts` | import ตรงๆ ในปุ่ม Logout |
| template ลบ `src/app/page.tsx` แล้ว | `src/app/(admin)/page.tsx` คือ root page |
| shadcn/ui initialized แล้ว | `npx shadcn@latest add <component>` ใช้ได้เลย |
| vitest@2.1.9 + happy-dom | unit test ใช้ pattern เดิม |
| Supabase client: ใช้ `createServerClient()` ใน layout | ไม่ใช้ `createPublicClient()` |

### References

- UX-DR1: CSS variables monochrome palette
- UX-DR2: Typography — Noto Sans Thai, type scale
- UX-DR3: Spacing system — base unit 4px
- UX-DR4: Sidebar component spec — dark #141414, 240px, collapsible 56px, hamburger mobile
- UX-DR6: PageHeader component — title + breadcrumb + 1 action
- UX-DR16: Skeleton loading states
- UX-DR20: Button hierarchy, icon-only ต้องมี aria-label
- UX-DR21: Responsive layout breakpoints
- UX-DR22: Accessibility WCAG 2.1 AA — contrast, focus ring, touch targets
- UX-DR23: Feature flag-aware sidebar
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Typography System]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `@base-ui/react` ใช้ `render` prop แทน `asChild` (Radix pattern) — แก้โดยใช้ `render={<button ... />}` บน `TooltipTrigger` และ `SheetTrigger`
- Tailwind v4 ใช้ `@theme inline` ใน CSS แทน `tailwind.config.ts` สำหรับ custom tokens
- `buildMenuSections` แยกออกไปที่ `src/lib/sidebar-menu.ts` เพื่อให้ test import ได้โดยไม่ต้อง mock Next.js client hooks

### Completion Notes List

- Task 1: เพิ่ม sidebar dark theme CSS variables ใน `globals.css` (`--sidebar-bg`, `--sidebar-text`, `--sidebar-active`, `--sidebar-muted`) และ map ใน `@theme inline`; ตั้ง Noto Sans Thai เป็น `--font-sans` ใน `layout.tsx`; เพิ่ม `TooltipProvider` ใน root layout
- Task 2+3: สร้าง `sidebar.tsx` + แยก logic ไปที่ `lib/sidebar-menu.ts`; feature flags filtering รวมอยู่ใน `buildMenuSections`; collapsed state ด้วย `useState`; tooltips ด้วย `TooltipTrigger render prop`
- Task 4: อัปเดต `(admin)/layout.tsx` ให้ดึง user profile + tenant `enabled_features` จาก Supabase; render Sidebar (desktop/tablet) + MobileSidebar (mobile topbar)
- Task 5: สร้าง `page-header.tsx` พร้อม breadcrumbs + action slot
- Task 6: สร้าง `mobile-sidebar.tsx` ใช้ `Sheet` จาก shadcn/ui; responsive breakpoints ใน admin layout
- Task 7: สร้าง `sidebar-skeleton.tsx` + `table-skeleton.tsx` + `loading.tsx`
- Task 8: ทุก interactive element มี `focus-visible:ring-2`, touch targets `min-h-11 min-w-11`, icon-only buttons มี `aria-label`
- Task 9: ติดตั้ง `tooltip` + `skeleton` (badge + sheet มีอยู่แล้ว)
- Tests: 17 unit tests สำหรับ `buildMenuSections` — ครอบคลุม super_admin, feature flags, section structure; 90/90 total tests pass

### File List

- `src/app/globals.css` — เพิ่ม sidebar dark tokens + `@theme inline` mapping
- `src/app/layout.tsx` — เปลี่ยนเป็น Noto Sans Thai, เพิ่ม TooltipProvider
- `src/app/(admin)/layout.tsx` — Server Component ใหม่: ดึง user+tenant, render Sidebar+MobileSidebar
- `src/app/(admin)/loading.tsx` — NEW: Skeleton-based admin content loading state
- `src/components/layout/sidebar.tsx` — NEW: Dark sidebar, collapse, feature flags, a11y
- `src/components/layout/mobile-sidebar.tsx` — NEW: Sheet-based mobile overlay
- `src/components/layout/page-header.tsx` — NEW: PageHeader component (title, breadcrumbs, action)
- `src/components/layout/sidebar-skeleton.tsx` — NEW: Sidebar placeholder skeleton
- `src/components/layout/table-skeleton.tsx` — NEW: Table rows skeleton
- `src/components/ui/tooltip.tsx` — NEW: shadcn/ui Tooltip (base-ui)
- `src/components/ui/skeleton.tsx` — NEW: shadcn/ui Skeleton
- `src/lib/sidebar-menu.ts` — NEW: buildMenuSections logic (pure, testable)
- `src/components/layout/sidebar.test.ts` — NEW: 17 unit tests for feature flag logic

### Change Log

- 2026-04-09: Story 1.4 implemented — Admin Shell design system, Sidebar, responsive layout, a11y
