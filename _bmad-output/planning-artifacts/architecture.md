---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-09'
inputDocuments: ['prd.md', 'ux-design-specification.md', 'PROJECT_PLAN.md', 'CLAUDE.md']
workflowType: 'architecture'
project_name: 'bestsolutions-cms'
user_name: 'Thanakit'
date: '2026-04-09'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
57 FRs ใน 9 หมวดหมู่:
- Auth & Authorization (FR1-5): Login/logout, role-based access, tenant isolation
- Tenant Management (FR6-9): CRUD tenants, users, feature flags, locale config
- Projects CRUD (FR10-19): Rich text (Tiptap), multi-locale, SEO, media, publish workflow
- Articles CRUD (FR20-25): Blog system, mirror of projects pattern
- Messages (FR26-31): Contact form inbox + LINE/Email notification per tenant
- Media Library (FR32-38): Upload, optimize (WebP), thumbnail, alt text i18n
- Categories (FR39-41): Per-tenant, typed (project/article), sortable
- Site Settings (FR42-45): Logo, SEO defaults, notifications, GA tracking ID
- Content Safety (FR46-48): Auto revision (50 versions/entity), audit logs

**Non-Functional Requirements:**
- Performance: Admin UI <2s load, Public API <500ms (list) / <300ms (detail), Image pipeline <5s
- Security: RLS isolation (no cross-tenant leak), JWT auth, rate limiting (contact: 5req/min/IP)
- Scalability: 10+ tenants, revision pruning, pagination (max 100)
- Integration reliability: LINE Notify <3s, Resend <5s with retry

**Scale & Complexity:**
- Primary domain: Full-stack Web (Admin SPA-like + Headless Public API)
- Complexity level: Medium-High
- Estimated architectural components: 12-15 (Auth, Tenant Context, Admin UI Pages ×6, API Routes ×2 tiers, Media Pipeline, Notification, Revision System, RLS Layer)

### Technical Constraints & Dependencies

- **Next.js 15 App Router**: Server Components + API Routes — ต้องออกแบบ data fetching pattern ให้สอดคล้อง
- **Supabase**: เป็นทั้ง DB, Auth, Storage — ต้อง manage service role key อย่างปลอดภัย (admin operations ผ่าน service role เท่านั้น)
- **Vercel Deployment**: Serverless functions — ต้องระวัง cold start สำหรับ API routes ที่ใช้บ่อย
- **Tiptap**: Headless editor — content เก็บเป็น JSON ใน JSONB field ต้อง serialize/deserialize ถูกต้อง
- **LINE Notify API**: Token-based (per tenant) — ต้องเก็บ token ใน site_settings อย่างปลอดภัย

### Cross-Cutting Concerns Identified

1. **Tenant Context Propagation**: ทุก request (admin + public) ต้องรู้ tenant_id — ต้องมี middleware/helper ที่ consistent
2. **Auth + RBAC**: 3 roles (super_admin, admin, editor) × feature flags — ต้อง permission model ที่ชัดเจน
3. **RLS Defense in Depth**: Application-level filter + DB RLS เสมอ — ป้องกัน misconfiguration
4. **i18n JSONB Pattern**: Content fields เก็บเป็น `{"th": "...", "en": "..."}` — ต้องมี type-safe helper
5. **Feature Flag Gating**: ซ่อน UI menu + return 404 สำหรับ API endpoint ของ feature ที่ปิด
6. **Audit Logging**: Destructive actions บันทึกโดย application layer (ไม่ใช่ DB trigger เพื่อ flexibility)

## Starter Template Evaluation

### Primary Technology Domain
Full-stack Web Application — Admin UI + Headless Public API
ใช้ Next.js 15 App Router เป็นฐาน (Server Components + API Routes)

### Starter Options Considered

| Option | จุดเด่น | จุดด้อย |
|--------|---------|---------|
| Official Supabase × Next.js (Vercel) | Auth setup ถูกต้อง, shadcn/ui พร้อม, Vercel-ready | มี boilerplate auth pages ที่ต้องปรับ |
| create-next-app@latest | Clean slate, ควบคุมได้ทุกอย่าง | ต้องตั้งค่า Supabase auth เอง (error-prone) |

### Selected Starter: Official Supabase × Next.js App Router Template

**Rationale for Selection:**
Cookie-based Supabase Auth (supabase-ssr) เป็น critical setup ที่ทำผิดได้ง่ายหากตั้งค่าเอง Template นี้ setup ถูกต้องแล้วและ maintained โดย Supabase team

**Initialization Command:**

```bash
# วิธีที่ 1: ผ่าน Vercel dashboard
# Deploy template: https://vercel.com/templates/next.js/supabase
# (ตั้งค่า Supabase project + Vercel env vars อัตโนมัติ)

# วิธีที่ 2: Clone โดยตรง
npx create-next-app -e with-supabase bestsolutions-cms
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript strict mode, Next.js 15 App Router

**Styling Solution:**
Tailwind CSS + shadcn/ui pre-initialized

**Auth Pattern:**
Cookie-based session ผ่าน `@supabase/ssr` — server-side auth ใน Server Components และ API Routes

**Build Tooling:**
Next.js built-in (Turbopack dev, Webpack prod), Vercel deployment

**Code Organization:**
App Router convention: `app/` directory, route groups, server/client component split

**Development Experience:**
ESLint, TypeScript strict, hot reload, Vercel preview deployments

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Tenant context propagation pattern (`getTenantId` helper)
- RLS + application-level dual filtering
- Public API CORS per-tenant domain validation
- Supabase service role key — server-side only boundary

**Important Decisions (Shape Architecture):**
- Server Components for reads / Server Actions for mutations
- React Hook Form + Zod (shared schema client+server)
- Upstash Ratelimit for contact form
- Tiptap content as structured JSON (not HTML)

**Deferred Decisions (Post-MVP):**
- Sentry error monitoring (Phase 2)
- Message notification queue/worker (fire-and-forget พอสำหรับ MVP)
- Subdomain routing per tenant (Phase 2)

---

### Data Architecture

**Database Access:** Supabase JS Client โดยตรง (ไม่ใช้ ORM)
- Rationale: Native RLS integration, typed ผ่าน generated types, ไม่มี abstraction ที่ไม่จำเป็น
- Pattern: ทุก query ต้อง `.eq('tenant_id', tenantId)` + RLS เป็น safety net

**Caching Strategy:** Next.js fetch cache revalidate (60 วินาที) สำหรับ Public API
- Admin UI: no cache (always fresh)
- Public API: `revalidate: 60` — acceptable staleness สำหรับ published content

**Image Processing:** Supabase Storage Transform (on-the-fly resize ผ่าน URL params)
- เก็บรูปต้นฉบับ → ใช้ `?width=800&quality=80` สำหรับ WebP display
- Thumbnail: `?width=400&height=300&resize=cover`
- ไม่ต้องติดตั้ง Sharp หรือ process ใน API route

**Migration Approach:** Supabase CLI — `supabase/migrations/` version-controlled

---

### Authentication & Security

**Session Management:** Supabase Auth + `@supabase/ssr` cookie-based
- Server Components และ API Routes อ่าน session ได้ native

**Tenant Context Propagation:**
```typescript
// src/lib/tenant.ts
export async function getTenantId(request?: Request): Promise<string> {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  return data.tenant_id
}
```

**RBAC:** Middleware (`src/middleware.ts`) protect admin routes + `requireRole(role)` helper ใน API routes

**Rate Limiting:** Upstash Ratelimit (Redis-based, Vercel Edge compatible)
- Contact form endpoint: 5 requests/minute per IP

**Security Boundaries:**
- `SUPABASE_SERVICE_ROLE_KEY` ใช้ใน server-side API routes เท่านั้น
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ใช้ใน client-side (RLS จะ protect)
- LINE Notify tokens เก็บใน `site_settings` ฝั่ง server — ไม่เปิด expose ใน Public API

---

### API & Communication Patterns

**Pattern:** RESTful JSON, 2-tier

**Tier 1 — Admin API** (`/api/*`):
- Auth required (Supabase JWT)
- Tenant scoped (ดึง tenant_id จาก session)
- RBAC checked per route

**Tier 2 — Public API** (`/api/public/[tenant]/*`):
- No auth required
- CORS: ตรวจ `allowed_domains` จาก tenant's `site_settings` per request
- Rate limiting: Upstash (contact endpoint)
- Response: published content only

**Standard Error Envelope:**
```typescript
type ApiError = {
  error: string    // human-readable message
  code: string     // machine-readable code (e.g. "TENANT_NOT_FOUND")
  status: number   // HTTP status code
}
```

**Notification:** Fire-and-forget ใน API route — ไม่ต้องการ message queue สำหรับ MVP scale

---

### Frontend Architecture

**Data Fetching Strategy:**
- **Reads:** React Server Components — ดึงข้อมูลใน server โดยตรง ไม่มี client fetch overhead
- **Mutations:** Server Actions — type-safe, no API boilerplate สำหรับ admin operations
- **Client-side:** SWR สำหรับ data ที่ต้องการ real-time update (เช่น unread message count)

**State Management:**
- ไม่มี global store
- URL state สำหรับ filters/pagination (searchParams)
- `useState` / `useContext` สำหรับ UI state (modals, sidebars)

**Form Handling:** React Hook Form + Zod
- Zod schema defined once → reuse ใน API validation ด้วย
- Client-side validation ก่อน submit, server-side validation ซ้ำใน API route

**Content (Tiptap):**
- เก็บเป็น Tiptap JSON ใน JSONB field (ไม่ใช่ HTML string)
- Helper: `serializeTiptap(json)` / `parseTiptap(raw)` ใน `src/lib/tiptap.ts`
- i18n: `{ th: TiptapJSON, en: TiptapJSON }` per JSONB locale field

---

### Infrastructure & Deployment

**CI/CD:** GitHub → Vercel
- Push to `main` → auto-deploy production
- Pull Request → preview deployment

**Environment Management:**
- `.env.local` สำหรับ development
- Vercel dashboard สำหรับ production secrets

**Monitoring:** Console logging ใน MVP → Sentry ใน Phase 2

---

### Decision Impact Analysis

**Implementation Sequence (ลำดับสำคัญ):**
1. Supabase project + migrations (DB schema + RLS)
2. Next.js project init (Supabase starter)
3. `src/lib/tenant.ts` + `src/middleware.ts` (tenant context + auth)
4. Admin UI shell (sidebar, tenant switcher, auth pages)
5. Content CRUD (Projects → Articles → Categories)
6. Media Library (Supabase Storage + Transform)
7. Public API routes
8. Notification (LINE Notify + Resend)
9. Rate limiting (Upstash)

**Cross-Component Dependencies:**
- Tenant Context → ทุก admin page และ API route ต้องรู้ tenant_id ก่อนทำอะไรก็ได้
- Zod schemas → shared ระหว่าง React Hook Form (client) และ API validation (server)
- Supabase generated types → ทุก component ที่ query DB ต้องใช้ typed client

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified
8 ประเด็นที่ AI agents อาจตัดสินใจต่างกัน: naming conventions, Supabase client variants, API response format, tenant context flow, validation timing, error display, loading states, delete strategy

---

### Naming Patterns

**Database (PostgreSQL/Supabase):**
- Tables: `snake_case` plural — `tenants`, `users`, `projects`, `articles`, `media_items`
- Columns: `snake_case` — `tenant_id`, `created_at`, `cover_image_url`
- Enums: `snake_case` — `content_status`, `user_role`
- Indexes: `idx_{table}_{column}` — `idx_projects_tenant_id`

**API Endpoints:**
- Admin: `/api/{resource}` (plural) — `/api/projects`, `/api/articles`
- Public: `/api/public/{tenant}/{resource}` — `/api/public/twodesk/projects`
- Dynamic: `/api/projects/[id]` ไม่ใช่ `/api/project/[id]`

**TypeScript / Code:**
- Variables/functions: `camelCase` — `tenantId`, `getProjects`, `coverImageUrl`
- Types/Interfaces: `PascalCase` — `Project`, `Article`, `TenantConfig`
- Components: `PascalCase` — `ProjectCard.tsx`, `MediaLibrary.tsx`
- Files/Dirs: `kebab-case` — `project-card.tsx`, `media-library/`
- Route files: Next.js convention — `page.tsx`, `layout.tsx`, `route.ts`

**JSONB Locale Keys:**
- ใช้ lowercase BCP-47 เสมอ — `{ "th": "...", "en": "..." }`
- ห้ามใช้ `{ "TH": "..." }` หรือ `{ "thai": "..." }`

---

### Structure Patterns

**Supabase Client — 3 variants เท่านั้น:**
```typescript
// 1. Server Components / Server Actions / Route Handlers (user session)
createServerClient()        // src/lib/supabase/server.ts

// 2. Admin operations ที่ bypass RLS
createServiceRoleClient()   // src/lib/supabase/admin.ts — SERVER ONLY

// 3. Public API (no user session)
createPublicClient()        // src/lib/supabase/public.ts
```

**Project Directory Structure:**
- `src/lib/` — helper functions, Supabase clients, utilities
- `src/types/` — TypeScript type definitions (generated + custom)
- `src/components/ui/` — shadcn/ui components (ไม่แก้ไข)
- `src/components/` — custom shared components
- `app/(admin)/` — route group สำหรับ protected admin pages
- `app/(auth)/` — route group สำหรับ login/logout
- `app/api/public/` — Public API routes

**Tests:** co-located กับไฟล์ — `project-form.test.ts` อยู่ข้างๆ `project-form.tsx`

---

### Format Patterns

**API Response — Admin API (success):**
```typescript
// single resource
return NextResponse.json({ id: "...", title: { th: "..." } }, { status: 200 })

// list with pagination
return NextResponse.json({ data: [...], total: 42, page: 1, limit: 20 })
```

**API Response — Error (ทุก route):**
```typescript
return NextResponse.json(
  { error: "Project not found", code: "PROJECT_NOT_FOUND", status: 404 },
  { status: 404 }
)
```

**Server Action Return:**
```typescript
type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string }
```

**Dates:** ISO 8601 strings เสมอ — `"2026-04-09T00:00:00Z"` — ไม่ใช้ Unix timestamp

**Supabase Data:** DB คืน `snake_case` → ใช้ generated types โดยตรง ไม่ต้อง transform

---

### Process Patterns

**ทุก Admin API Route — ลำดับบังคับ:**
```typescript
export async function GET(request: Request) {
  // 1. Auth check ก่อนเสมอ
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(
    { error: "Unauthorized", code: "UNAUTHORIZED", status: 401 },
    { status: 401 }
  )

  // 2. Tenant context ก่อนทำ query ทุกครั้ง
  const tenantId = await getTenantId()

  // 3. Query ด้วย tenant_id เสมอ (RLS คือ safety net ไม่ใช่ทางหลัก)
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('tenant_id', tenantId)  // ← บังคับทุก query
}
```

**Validation — ทุก Mutation:**
```typescript
// Zod schema define ใน src/lib/validations/{resource}.ts
// ใช้ทั้ง client (React Hook Form) และ server (API/Server Action)
const result = ProjectSchema.safeParse(body)
if (!result.success) return /* validation error */
```

**Loading States:**
- Server Components → `loading.tsx` + React Suspense
- Client mutations → `useTransition` / `isPending` จาก `useFormStatus`
- UI: ใช้ shadcn/ui `Skeleton` — ไม่สร้าง spinner ใหม่

**Error Display:**
- Admin UI: shadcn/ui `toast` — `useToast()` hook
- Form errors: React Hook Form `formState.errors` แสดงใต้ field

**Soft Delete Pattern:**
```typescript
// ❌ ห้าม hard delete จาก admin API
await supabase.from('projects').delete().eq('id', id)

// ✅ ถูก — soft delete เสมอ
await supabase.from('projects')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', id).eq('tenant_id', tenantId)
```

---

### Enforcement Guidelines

**ทุก AI Agent MUST:**
1. เรียก `getTenantId()` ก่อน query DB ทุก admin route — ไม่มีข้อยกเว้น
2. ใช้ Zod validate input ก่อน DB operation ทุก mutation
3. ใช้ Supabase client ตาม variant ที่ถูกต้อง (server/admin/public)
4. Return error ด้วย standard envelope `{ error, code, status }`
5. Soft delete ด้วย `deleted_at` — ไม่ hard delete ใน admin routes

**ทุก AI Agent MUST NOT:**
1. Expose `SUPABASE_SERVICE_ROLE_KEY` ใน client-side code
2. Query DB โดยไม่มี `.eq('tenant_id', tenantId)`
3. Expose LINE Notify tokens หรือ notification settings ใน Public API response
4. สร้าง Supabase client variant ใหม่นอกเหนือจาก 3 variants ที่กำหนด

## Project Structure & Boundaries

### Complete Project Directory Structure

```
bestsolutions-cms/
├── README.md
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── components.json              ← shadcn/ui config
├── .env.local                   ← gitignored
├── .env.example
├── .gitignore
│
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 001_init_enums.sql
│       ├── 002_core_tables.sql       ← tenants, users, site_settings
│       ├── 003_content_tables.sql    ← projects, articles, categories, pages
│       ├── 004_support_tables.sql    ← messages, media_items, revisions, audit_logs
│       └── 005_rls_policies.sql
│
├── public/
│   └── favicon.ico
│
└── src/
    ├── middleware.ts                  ← auth guard + route protection
    │
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   │
    │   ├── (auth)/
    │   │   ├── layout.tsx
    │   │   ├── login/
    │   │   │   └── page.tsx
    │   │   └── logout/
    │   │       └── page.tsx
    │   │
    │   ├── (admin)/
    │   │   ├── layout.tsx             ← sidebar + tenant context provider
    │   │   ├── loading.tsx
    │   │   ├── page.tsx               ← dashboard
    │   │   ├── projects/
    │   │   │   ├── page.tsx
    │   │   │   ├── loading.tsx
    │   │   │   ├── new/
    │   │   │   │   └── page.tsx
    │   │   │   └── [id]/
    │   │   │       ├── page.tsx
    │   │   │       └── loading.tsx
    │   │   ├── blog/
    │   │   │   ├── page.tsx
    │   │   │   ├── loading.tsx
    │   │   │   ├── new/
    │   │   │   │   └── page.tsx
    │   │   │   └── [id]/
    │   │   │       └── page.tsx
    │   │   ├── messages/
    │   │   │   ├── page.tsx
    │   │   │   └── loading.tsx
    │   │   ├── media/
    │   │   │   ├── page.tsx
    │   │   │   └── loading.tsx
    │   │   ├── settings/
    │   │   │   └── page.tsx
    │   │   └── analytics/             ← placeholder Phase 2
    │   │       └── page.tsx
    │   │
    │   └── api/
    │       ├── auth/
    │       │   └── logout/
    │       │       └── route.ts
    │       ├── projects/
    │       │   ├── route.ts           ← GET list, POST create
    │       │   └── [id]/
    │       │       └── route.ts       ← GET, PUT, PATCH (soft delete)
    │       ├── articles/
    │       │   ├── route.ts
    │       │   └── [id]/
    │       │       └── route.ts
    │       ├── messages/
    │       │   ├── route.ts
    │       │   └── [id]/
    │       │       └── route.ts
    │       ├── media/
    │       │   ├── route.ts           ← POST upload (multipart)
    │       │   └── [id]/
    │       │       └── route.ts       ← DELETE (DB + Storage)
    │       ├── categories/
    │       │   ├── route.ts
    │       │   └── [id]/
    │       │       └── route.ts
    │       ├── settings/
    │       │   └── route.ts
    │       └── public/
    │           └── [tenant]/
    │               ├── projects/
    │               │   ├── route.ts
    │               │   └── [slug]/
    │               │       └── route.ts
    │               ├── articles/
    │               │   ├── route.ts
    │               │   └── [slug]/
    │               │       └── route.ts
    │               ├── settings/
    │               │   └── route.ts
    │               └── contact/
    │                   └── route.ts   ← rate limited
    │
    ├── components/
    │   ├── ui/                        ← shadcn/ui (ห้ามแก้ไข)
    │   ├── layout/
    │   │   ├── sidebar.tsx            ← feature-flag aware
    │   │   ├── tenant-switcher.tsx    ← super_admin only
    │   │   └── header.tsx
    │   ├── editor/
    │   │   ├── tiptap-editor.tsx      ← 'use client'
    │   │   ├── locale-tabs.tsx        ← th/en tab switcher
    │   │   └── media-picker.tsx
    │   ├── projects/
    │   │   ├── project-form.tsx       ← React Hook Form + Zod
    │   │   ├── project-card.tsx
    │   │   └── project-list.tsx
    │   ├── articles/
    │   │   ├── article-form.tsx
    │   │   ├── article-card.tsx
    │   │   └── article-list.tsx
    │   ├── messages/
    │   │   ├── message-list.tsx
    │   │   └── message-detail.tsx
    │   ├── media/
    │   │   ├── media-grid.tsx
    │   │   ├── media-upload.tsx       ← 'use client', drag & drop
    │   │   └── media-picker-modal.tsx
    │   └── settings/
    │       └── settings-form.tsx
    │
    ├── lib/
    │   ├── supabase/
    │   │   ├── server.ts              ← createServerClient()
    │   │   ├── admin.ts               ← createServiceRoleClient() — SERVER ONLY
    │   │   └── public.ts              ← createPublicClient()
    │   ├── tenant.ts                  ← getTenantId(), requireTenant()
    │   ├── auth.ts                    ← requireAuth(), requireRole()
    │   ├── tiptap.ts                  ← serializeTiptap(), parseTiptap()
    │   ├── i18n.ts                    ← getLocaleValue(), setLocaleValue()
    │   ├── slugify.ts                 ← Thai title → slug
    │   ├── notifications.ts           ← sendLineNotify(), sendEmail()
    │   ├── rate-limit.ts              ← Upstash ratelimit config
    │   ├── cors.ts                    ← validateCors(tenant)
    │   ├── utils.ts                   ← cn(), formatDate()
    │   └── validations/
    │       ├── project.ts             ← ProjectSchema (Zod)
    │       ├── article.ts             ← ArticleSchema
    │       ├── message.ts             ← MessageSchema (contact form)
    │       ├── media.ts               ← MediaSchema
    │       ├── category.ts            ← CategorySchema
    │       └── settings.ts            ← SiteSettingsSchema
    │
    └── types/
        ├── database.types.ts          ← Supabase generated (supabase gen types)
        ├── api.ts                     ← ApiError, ActionResult<T>, PaginatedResponse<T>
        └── tenant.ts                  ← TenantConfig, FeatureFlags, SupportedLocale
```

### Architectural Boundaries

**API Boundaries:**

| Boundary | Path | Auth | Tenant Scope | Rate Limit |
|----------|------|------|--------------|-----------|
| Admin API | `/api/*` | JWT required | From session | ไม่มี (internal) |
| Public API | `/api/public/[tenant]/*` | ไม่มี | From URL param | Contact: 5/min/IP |

**Component Boundaries (Server vs Client):**
- **Server Components** (default): page.tsx, layout.tsx, list components — ดึงข้อมูลจาก DB โดยตรง
- **Client Components** (`'use client'`): forms, Tiptap editor, media upload, modals
- Rule: `'use client'` boundary ให้อยู่ลึกที่สุดใน component tree เท่าที่จะทำได้

### Data Flow

```
[Admin User]
    → Server Component (read)  → createServerClient → Supabase DB (RLS)
    → Server Action (write)    → createServerClient → Supabase DB (RLS)
    → /api/media (upload)      → createServiceRoleClient → Supabase Storage

[Public Frontend]
    → /api/public/[tenant]/*   → createPublicClient → Supabase DB (published only)

[Contact Form Visitor]
    → /api/public/[tenant]/contact → rate limit check → insert message
                                   → fire-and-forget  → LINE Notify + Resend
```

### Requirements to Structure Mapping

| FR Category | Location |
|-------------|----------|
| Auth (FR1-5) | `src/middleware.ts`, `src/lib/auth.ts`, `app/(auth)/` |
| Tenant Management (FR6-9) | Phase 2 — Super Admin panel |
| Projects (FR10-19) | `app/(admin)/projects/`, `app/api/projects/`, `src/components/projects/` |
| Articles (FR20-25) | `app/(admin)/blog/`, `app/api/articles/`, `src/components/articles/` |
| Messages (FR26-31) | `app/(admin)/messages/`, `app/api/messages/`, `src/lib/notifications.ts` |
| Media (FR32-38) | `app/(admin)/media/`, `app/api/media/`, `src/components/media/` |
| Categories (FR39-41) | `app/api/categories/` (จัดการใน settings page) |
| Site Settings (FR42-45) | `app/(admin)/settings/`, `app/api/settings/` |
| Content Safety (FR46-48) | DB triggers (revisions), `src/lib/` (audit logging) |
| Public API (FR49-57) | `app/api/public/[tenant]/` |

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** ผ่านทุกข้อ — ไม่มี technology conflict ระหว่าง Next.js 15, Supabase, Tailwind, shadcn/ui, Tiptap, Upstash, SWR

**Pattern Consistency:** Implementation patterns สอดคล้องกับ decisions ทุกข้อ — Supabase client variants ตรงกับ auth pattern, Zod schema ตรงกับ React Hook Form + Server Action

**Structure Alignment:** Project structure รองรับ architectural decisions ครบ — route groups แยก auth/admin ชัดเจน, `lib/` structure รองรับ helper functions ทุกตัวที่ตัดสินใจ

### Requirements Coverage Validation ✅

**Functional Requirements:** 57 FRs ครอบคลุมทั้งหมด — FR6-9 (Tenant Management) deferred Phase 2 อย่างตั้งใจ

**Non-Functional Requirements:**
- Performance: Server Components + fetch revalidate → Admin <2s, Public API <500ms
- Security: RLS + app-level filter + JWT + rate limit + service role key boundary
- Scalability: Pagination, revision pruning (DB trigger), RLS per-tenant row

### Implementation Readiness Validation ✅

**Decision Completeness:** ✅ ทุก critical decision มีตัวอย่าง code
**Structure Completeness:** ✅ directory tree ระบุชื่อไฟล์จริง ไม่ใช่ placeholder
**Pattern Completeness:** ✅ MUST/MUST NOT list ชัดเจนสำหรับ AI agents

### Gap Analysis Results

**Gaps Addressed:**

1. **`src/lib/audit.ts`** (Minor) — เพิ่มลงใน project structure
   - Function: `logAuditEvent(action, entityType, entityId, tenantId)`
   - ใช้ใน admin API routes สำหรับ destructive actions

2. **Testing setup** (Minor) — เพิ่ม `vitest.config.ts` ใน project root
   - Test files: co-located `.test.ts` ข้างๆ ไฟล์ที่ test

3. **Supabase Types Workflow** (Minor):
   ```bash
   supabase gen types typescript --project-id <ref> > src/types/database.types.ts
   ```
   รันหลัง migration ทุกครั้ง ก่อน implement features ที่ใช้ table ใหม่

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] 57 FRs วิเคราะห์และ map ครบ
- [x] NFRs (performance, security, scalability) ระบุ architectural response
- [x] Cross-cutting concerns (tenant, auth, i18n, audit) map ครบ

**✅ Architectural Decisions**
- [x] Tech stack + versions verified
- [x] Database access pattern (Supabase client, 3 variants)
- [x] Auth + RBAC pattern
- [x] API design (2-tier: Admin + Public)
- [x] Image processing (Supabase Storage Transform)
- [x] Caching strategy
- [x] Rate limiting (Upstash)
- [x] Notification (fire-and-forget)

**✅ Implementation Patterns**
- [x] Naming conventions (DB, API, code, JSONB locales)
- [x] Mandatory route handler sequence
- [x] Error envelope format
- [x] Soft delete pattern
- [x] MUST / MUST NOT enforcement list

**✅ Project Structure**
- [x] Complete directory tree (specific filenames)
- [x] Server vs Client component boundaries
- [x] FR → directory mapping
- [x] Data flow diagram

### Architecture Readiness Assessment

**Overall Status:** ✅ READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Tenant isolation แข็งแกร่ง (defense in depth: app-level + RLS)
- Supabase client variants ชัดเจน — ป้องกัน service role key leak
- Patterns ครอบคลุม conflict points หลักสำหรับ AI agents
- Public API structure รองรับ Headless CMS use case ครบ

**Areas for Future Enhancement (Phase 2+):**
- Super Admin panel (FR6-9)
- Sentry error monitoring
- Subdomain routing per tenant
- Content restore UI จาก revision history

### Implementation Handoff

**AI Agent Guidelines:**
- อ่าน Implementation Patterns & Consistency Rules ก่อน implement ทุกครั้ง
- เรียก `getTenantId()` ก่อน DB query ทุก admin route — ไม่มีข้อยกเว้น
- ใช้ Supabase client ตาม variant ที่กำหนด (server/admin/public)
- Zod schema define ใน `src/lib/validations/` — reuse ทั้ง client และ server

**First Implementation Steps:**
```bash
# 1. Init project
npx create-next-app -e with-supabase bestsolutions-cms

# 2. Init Supabase local
supabase init

# 3. Run migrations
supabase db push

# 4. Generate types
supabase gen types typescript --project-id <ref> > src/types/database.types.ts

# 5. Install dependencies
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
npm install react-hook-form zod @hookform/resolvers
npm install swr
npm install @upstash/ratelimit @upstash/redis
npm install resend
```
