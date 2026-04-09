---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
---

# bestsolutions-cms - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bestsolutions-cms, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Authentication & Authorization**
- FR1: ผู้ใช้ login ด้วย email + password ได้
- FR2: ผู้ใช้ logout ได้
- FR3: ระบบ redirect ไปหน้า login เมื่อยังไม่ authenticate
- FR4: ระบบจำกัดการเข้าถึงตาม role (super_admin / admin / editor)
- FR5: ระบบจำกัดการเข้าถึงตาม tenant ของผู้ใช้ (RLS)

**Tenant Management**
- FR6: Super admin สร้าง tenant ใหม่ได้ (ชื่อ, slug, locales, features)
- FR7: Super admin แก้ไขการตั้งค่า tenant ได้ (enabled_features, supported_locales)
- FR8: Super admin สร้าง user account สำหรับ tenant ได้
- FR9: Super admin switch ดูข้อมูลของ tenant ต่างๆ ได้

**Content Management — Projects**
- FR10: ผู้ใช้สร้าง project ใหม่ได้ (title, description, content, category, location, area, year)
- FR11: ผู้ใช้แก้ไข project ที่มีอยู่ได้
- FR12: ผู้ใช้กรอก content แบบ rich text (Tiptap editor) ได้
- FR13: ผู้ใช้กรอก content หลายภาษาตาม supported_locales ของ tenant ได้
- FR14: ผู้ใช้ตั้งค่า SEO (title, description, keywords) per locale ได้
- FR15: ผู้ใช้ upload cover image และ gallery ได้
- FR16: ผู้ใช้เลือก category สำหรับ project ได้
- FR17: ผู้ใช้ตั้งสถานะ draft / published ได้
- FR18: Admin soft delete project ได้
- FR19: ระบบสร้าง slug อัตโนมัติจาก title ผู้ใช้แก้ไขเองได้

**Content Management — Articles**
- FR20: ผู้ใช้สร้าง article ใหม่ได้ (title, excerpt, content, category, cover image)
- FR21: ผู้ใช้แก้ไข article ที่มีอยู่ได้
- FR22: ผู้ใช้กรอก content แบบ rich text หลายภาษาได้
- FR23: ผู้ใช้ตั้งค่า SEO per locale ได้
- FR24: ผู้ใช้ตั้งสถานะ draft / published ได้
- FR25: Admin soft delete article ได้

**Messages**
- FR26: ระบบรับ message จาก contact form (ชื่อ, email, เบอร์โทร, ข้อความ, ประเภท project)
- FR27: ผู้ใช้ดู list messages ทั้งหมดของ tenant ได้
- FR28: ผู้ใช้ mark message เป็น read/unread ได้
- FR29: ผู้ใช้ archive message ได้
- FR30: ระบบแจ้งเตือนผ่าน LINE Notify เมื่อมี message ใหม่ (ตาม tenant setting)
- FR31: ระบบแจ้งเตือนผ่าน Email (Resend) เมื่อมี message ใหม่ (ตาม tenant setting)

**Media Library**
- FR32: ผู้ใช้ upload รูปภาพได้
- FR33: ผู้ใช้ดู list media ทั้งหมดของ tenant ได้
- FR34: ผู้ใช้ลบ media ได้ (ลบทั้ง DB และ Supabase Storage)
- FR35: ผู้ใช้ตั้ง alt text หลายภาษาได้
- FR36: ผู้ใช้เลือกรูปจาก media library เข้า content editor ได้
- FR37: ระบบ optimize รูปภาพอัตโนมัติเมื่อ upload (แปลง WebP + ลดขนาด)
- FR38: ระบบสร้าง thumbnail อัตโนมัติเมื่อ upload

**Categories**
- FR39: ผู้ใช้สร้าง category ใหม่ได้ (ชื่อหลายภาษา, type: project/article)
- FR40: ผู้ใช้แก้ไข/ลบ category ได้
- FR41: ผู้ใช้จัดลำดับ category ได้ (sort_order)

**Site Settings**
- FR42: Admin ตั้งค่า site settings ได้ (site name, tagline, logo, favicon, contact info, social links)
- FR43: Admin ตั้งค่า default SEO ได้
- FR44: Admin ตั้งค่า notification channels ได้ (เลือก LINE / Email / ทั้งคู่)
- FR45: Admin ตั้งค่า GA tracking ID ได้

**Content History & Safety**
- FR46: ระบบบันทึก content revision อัตโนมัติทุกครั้งที่แก้ไข
- FR47: ระบบลบ revision เก่าอัตโนมัติเมื่อเกิน 50 versions ต่อ entity
- FR48: ระบบบันทึก audit log สำหรับ destructive actions (ลบ content, เปลี่ยน role)

**Public API**
- FR49: Frontend ดึง list projects ที่ published ของ tenant ได้ (พร้อม pagination)
- FR50: Frontend ดึง project detail ตาม slug ได้
- FR51: Frontend ดึง list articles ที่ published ของ tenant ได้ (พร้อม pagination)
- FR52: Frontend ดึง article detail ตาม slug ได้
- FR53: Frontend ดึง page ตาม slug ได้
- FR54: Frontend ดึง site settings ของ tenant ได้
- FR55: Frontend ส่ง contact form message ได้ (พร้อม input validation)
- FR56: ระบบ rate limit Public API (contact form: 5 req/min per IP)
- FR57: ระบบ CORS อนุญาตเฉพาะ domain ที่ลงทะเบียนใน tenant

### NonFunctional Requirements

**Performance**
- NFR1: Admin UI page load ภายใน 2 วินาที
- NFR2: Public API response time ภายใน 500ms (list), 300ms (detail)
- NFR3: Image upload + optimize + thumbnail เสร็จภายใน 5 วินาทีต่อรูป
- NFR4: Tiptap editor responsive ขณะพิมพ์ — ไม่มี input lag ที่รู้สึกได้

**Security**
- NFR5: ข้อมูลแต่ละ tenant แยกสนิทผ่าน RLS — ไม่มี data leak ข้าม tenant
- NFR6: Authentication ผ่าน Supabase Auth (JWT) — session จัดการฝั่ง server
- NFR7: API routes ทุกเส้นตรวจสอบ auth + tenant_id ก่อนดำเนินการ
- NFR8: Public API contact form มี rate limiting (5 req/min per IP) + input validation
- NFR9: Audit logs เป็น immutable — ลบไม่ได้ยกเว้น super_admin
- NFR10: Storage upload อนุญาตเฉพาะไฟล์รูปภาพ (JPEG, PNG, GIF, WebP)

**Scalability**
- NFR11: รองรับ 10+ tenants พร้อมกันโดยไม่กระทบ performance
- NFR12: Content revision pruning (50 versions/entity) ป้องกัน database เติบโตไม่จำกัด
- NFR13: Public API pagination (default 20, max 100) ป้องกัน large response payloads
- NFR14: เพิ่ม tenant ใหม่ได้โดยไม่ต้องแก้โค้ดหรือ restart

**Integration**
- NFR15: Supabase — Database + Auth + Storage ทำงานเสถียร
- NFR16: LINE Notify API — ส่ง notification สำเร็จภายใน 3 วินาที มี error handling เมื่อ token ไม่ถูกต้อง
- NFR17: Resend API — ส่ง email notification สำเร็จภายใน 5 วินาที มี retry เมื่อ fail
- NFR18: CORS — อนุญาตเฉพาะ domain ที่ลงทะเบียน ถ้า tenant ไม่ได้ตั้ง domain ให้ deny ทั้งหมด

### Additional Requirements

**Starter Template (Architecture)**
- AR1: Project ต้อง initialize ด้วย Official Supabase × Next.js template: `npx create-next-app -e with-supabase bestsolutions-cms` — เป็น Story แรกสุดใน Epic 1
- AR2: Supabase local dev: `supabase init` + migrations 5 ไฟล์ (enums, core tables, content tables, support tables, RLS policies)
- AR3: Generate Supabase types หลังทุก migration: `supabase gen types typescript --project-id <ref> > src/types/database.types.ts`

**Infrastructure & Dependencies**
- AR4: ติดตั้ง dependencies หลัก: `@tiptap/react @tiptap/pm @tiptap/starter-kit`, `react-hook-form zod @hookform/resolvers`, `swr`, `@upstash/ratelimit @upstash/redis`, `resend`
- AR5: Setup Vitest สำหรับ testing — `vitest.config.ts` ใน project root, test files co-located กับ source files

**Core Helper Functions (ต้องสร้างก่อน feature ใดๆ)**
- AR6: `src/lib/supabase/server.ts` — `createServerClient()` สำหรับ Server Components / Server Actions
- AR7: `src/lib/supabase/admin.ts` — `createServiceRoleClient()` SERVER ONLY สำหรับ admin operations ที่ bypass RLS
- AR8: `src/lib/supabase/public.ts` — `createPublicClient()` สำหรับ Public API
- AR9: `src/lib/tenant.ts` — `getTenantId()`, `requireTenant()` ต้องเรียกก่อน query ทุก admin route
- AR10: `src/lib/auth.ts` — `requireAuth()`, `requireRole(role)` ใช้ใน API routes
- AR11: `src/lib/tiptap.ts` — `serializeTiptap()`, `parseTiptap()` จัดการ Tiptap JSON
- AR12: `src/lib/i18n.ts` — `getLocaleValue()`, `setLocaleValue()` จัดการ JSONB locale pattern
- AR13: `src/lib/slugify.ts` — แปลง Thai title → slug
- AR14: `src/lib/notifications.ts` — `sendLineNotify()`, `sendEmail()` ใช้ fire-and-forget pattern
- AR15: `src/lib/rate-limit.ts` — Upstash ratelimit config
- AR16: `src/lib/cors.ts` — `validateCors(tenant)` ตรวจสอบ allowed_domains
- AR17: `src/lib/audit.ts` — `logAuditEvent(action, entityType, entityId, tenantId)` ใช้ใน destructive actions

**Mandatory Patterns (ต้องปฏิบัติทุก route)**
- AR18: ทุก Admin API route ต้อง: (1) auth check, (2) getTenantId(), (3) query ด้วย `.eq('tenant_id', tenantId)` — ตามลำดับนี้เสมอ
- AR19: ทุก mutation ต้อง validate ด้วย Zod schema ก่อน DB operation
- AR20: Soft delete เท่านั้น — ใช้ `deleted_at` ไม่ hard delete ใน admin routes
- AR21: Error response format: `{ error: string, code: string, status: number }` ทุก route
- AR22: Zod schemas อยู่ใน `src/lib/validations/` — reuse ทั้ง client (React Hook Form) และ server
- AR23: Supabase Data เก็บ dates เป็น ISO 8601 strings เสมอ

**Data Seeding**
- AR24: Seed tenant แรก "Twodesk Studio" (slug: "twodesk") พร้อม user account super_admin
- AR25: Seed categories สำหรับ Twodesk (project types + article categories)

### UX Design Requirements

**Design System Setup**
- UX-DR1: Implement color token system ด้วย CSS variables (monochrome palette) ตาม spec: `--background`, `--foreground`, `--muted`, `--border`, `--primary`, `--sidebar-bg: #141414`, `--sidebar-text`, `--sidebar-active`, `--destructive`
- UX-DR2: Typography setup — Font: `Noto Sans Thai` + `Noto Sans`, Type scale: h1(30px/600), h2(24px/600), h3(20px/500), body(14px/400), small(12px/400), mono(13px) — letter-spacing: -0.02em สำหรับ heading
- UX-DR3: Spacing system — Base unit 4px, tokens: xs(4px), sm(8px), md(12px), lg(16px), xl(24px), 2xl(32px), 3xl(48px) — generous whitespace principle

**Layout Components**
- UX-DR4: Sidebar component — Dark (#141414), 240px fixed, collapsible เป็น 56px icon-only บน tablet, hamburger overlay บน mobile; grouped sections: Content / Communication / Assets / System; user profile + dark mode toggle ด้านล่าง; section labels ALL CAPS
- UX-DR5: TenantSwitcher component — อยู่ด้านบน sidebar, เห็นเฉพาะ super_admin; Anatomy: tenant avatar + name + chevron → Dropdown list; States: active (highlighted), hover, loading
- UX-DR6: PageHeader component — Standard header: title + breadcrumb `[Tenant] > [Section] > [Item]` + action buttons; Variants: List page (มี +สร้างใหม่), Detail page (มี Save/Publish); primary action 1 ปุ่มเท่านั้น วางขวาบน
- UX-DR7: Dashboard layout — 4-column stats cards row (projects, articles, unread messages, etc.) + 2-column grid ด้านล่าง (Projects list + Messages list)

**Editor Components**
- UX-DR8: TiptapEditor component — Rich text editor, slash command `/` เพิ่ม blocks, drag & drop image จาก Media Library, toolbar ด้านบน, รับ `locale` prop; States: editing, readonly, loading
- UX-DR9: LocaleTabGroup component — Tabs (th/en) เหนือ editor fields, เปลี่ยน tab = เปลี่ยน content ทุก field พร้อมกัน, ซ่อนถ้า tenant มีแค่ 1 locale
- UX-DR10: AutoSaveIndicator component — Position top-right ของ editor topbar; States: idle / `● Saving...` (animated) / `✓ Saved` / `⚠ ไม่สามารถบันทึกได้`; auto-save trigger ทุก 3 วินาที

**Media Components**
- UX-DR11: MediaPicker component — Grid thumbnails + Upload button + Search; ใช้ได้ทั้งใน TiptapEditor (drag & drop insert) และ cover image field; trigger upload modal หรือ select existing
- UX-DR12: MediaUpload component — Drag & drop zone full-width; progress bar ขณะ upload; thumbnail แสดงทันทีหลัง upload สำเร็จ

**Status & Feedback Components**
- UX-DR13: ContentStatusBadge component — Variants: `published` (เขียวอ่อน), `draft` (เทา), `archived` (เทาเข้ม); แสดงใน list และ editor header
- UX-DR14: EmptyState component — ทุก empty state ต้องมี: Icon + Heading + Description + CTA button; 4 variants: Projects ว่าง, Media ว่าง, Messages ว่าง, Articles ว่าง
- UX-DR15: Toast notification system — Success/Error ด้านบนขวา, อยู่ 4 วินาทีแล้วหาย; Delete toast: มีปุ่ม "เลิกทำ" 5 วินาทีเพื่อ restore; error message ภาษาคนไม่ใช่ technical code

**Interaction Patterns**
- UX-DR16: Skeleton loading states — ใช้ shadcn/ui `Skeleton` แทน spinner ทุกที่; รูปร่างต้อง match content จริง; Topbar + Sidebar โหลดก่อน content
- UX-DR17: Confirmation Dialog pattern — ใช้เฉพาะ Publish และ Hard delete เท่านั้น; ไม่ confirm actions อื่น เพื่อไม่ให้ friction เกิน
- UX-DR18: Soft delete + undo pattern — กด "ลบ" → Dialog → soft delete (deleted_at) → Toast "ลบแล้ว" + ปุ่ม "เลิกทำ" 5 วิ → ถ้าไม่กด = ย้ายไป trash
- UX-DR19: Inline form validation — Error แสดงใต้ field ทันที ไม่รอกด Submit; Label อยู่เหนือ field เสมอ; slug field auto-generate + editable + preview URL
- UX-DR20: Button hierarchy — Primary (1 ปุ่ม/หน้า, dark bg), Secondary (outline), Ghost (cancel/back), Destructive (ลบ); Icon-only ต้องมี Tooltip + aria-label เสมอ

**Responsive & Accessibility**
- UX-DR21: Responsive layout — Desktop 1024px+: sidebar 240px; Tablet 768-1023px: sidebar collapse 56px icon-only; Mobile <768px: hamburger overlay, simplified Tiptap toolbar
- UX-DR22: Accessibility WCAG 2.1 AA — Contrast ≥7:1 AA (ข้อความหลัก 19.5:1 AAA); Focus ring ชัดเจนทุก interactive element; touch targets min 44×44px; semantic HTML + ARIA labels สำหรับ icon-only buttons; alt text บังคับทุกรูป

**Feature Flag UI**
- UX-DR23: Feature flag-aware sidebar — ซ่อน menu items ของ features ที่ tenant ไม่ได้เปิดใน `enabled_features`; ทำให้ UI ของแต่ละ client มีแค่ sections ที่เกี่ยวข้อง

### FR Coverage Map

- FR1: Epic 1 — Login ด้วย email + password
- FR2: Epic 1 — Logout
- FR3: Epic 1 — Redirect ไป login เมื่อยังไม่ authenticate
- FR4: Epic 1 — RBAC (super_admin / admin / editor)
- FR5: Epic 1 — Tenant isolation ผ่าน RLS
- FR6: Phase 2 — Super Admin สร้าง tenant ใหม่ (deferred)
- FR7: Phase 2 — Super Admin แก้ tenant settings (deferred)
- FR8: Phase 2 — Super Admin สร้าง user account (deferred)
- FR9: Epic 1 — Tenant switcher สำหรับ super_admin
- FR10: Epic 2 — สร้าง project ใหม่
- FR11: Epic 2 — แก้ไข project ที่มีอยู่
- FR12: Epic 2 — Rich text editor (Tiptap)
- FR13: Epic 2 — Multi-locale content (JSONB)
- FR14: Epic 2 — SEO fields per locale
- FR15: Epic 2 — Upload cover image + gallery
- FR16: Epic 2 — เลือก category สำหรับ project
- FR17: Epic 2 — Draft / Published status
- FR18: Epic 2 — Soft delete project
- FR19: Epic 2 — Auto-generate slug จาก title
- FR20: Epic 3 — สร้าง article ใหม่
- FR21: Epic 3 — แก้ไข article
- FR22: Epic 3 — Rich text หลายภาษาสำหรับ article
- FR23: Epic 3 — SEO per locale สำหรับ article
- FR24: Epic 3 — Draft / Published สำหรับ article
- FR25: Epic 3 — Soft delete article
- FR26: Epic 4 — รับ message จาก contact form
- FR27: Epic 4 — ดู list messages ของ tenant
- FR28: Epic 4 — Mark read/unread
- FR29: Epic 4 — Archive message
- FR30: Epic 4 — LINE Notify notification
- FR31: Epic 4 — Email (Resend) notification
- FR32: Epic 2 — Upload รูปภาพ
- FR33: Epic 2 — ดู list media ของ tenant
- FR34: Epic 2 — ลบ media (DB + Storage)
- FR35: Epic 2 — Alt text หลายภาษา
- FR36: Epic 2 — เลือกรูปจาก media library เข้า editor
- FR37: Epic 2 — Auto optimize รูปภาพ (WebP)
- FR38: Epic 2 — Auto thumbnail
- FR39: Epic 2 — สร้าง category
- FR40: Epic 2 — แก้ไข/ลบ category
- FR41: Epic 2 — จัดลำดับ category (sort_order)
- FR42: Epic 5 — Site settings (name, logo, contact, social)
- FR43: Epic 5 — Default SEO settings
- FR44: Epic 5 — Notification channels (LINE/Email)
- FR45: Epic 5 — GA tracking ID
- FR46: Epic 2 — Auto-save content revision
- FR47: Epic 2 — Auto-prune revision เกิน 50 versions
- FR48: Epic 2 — Audit log สำหรับ destructive actions
- FR49: Epic 6 — Public API: list projects (paginated)
- FR50: Epic 6 — Public API: project detail by slug
- FR51: Epic 6 — Public API: list articles (paginated)
- FR52: Epic 6 — Public API: article detail by slug
- FR53: Epic 6 — Public API: page by slug
- FR54: Epic 6 — Public API: site settings
- FR55: Epic 6 — Public API: contact form POST
- FR56: Epic 6 — Rate limiting (contact: 5 req/min/IP)
- FR57: Epic 6 — CORS per tenant domain

## Epic List

### Epic 1: Foundation — Project Setup, Auth & Admin Shell
Admin สามารถ login เข้าระบบได้ เห็น dashboard professional พร้อม sidebar ที่ feature-flag aware และ tenant switcher สำหรับ super_admin — ระบบพร้อมรับ feature ใหม่ทุกอย่าง
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR9
**ARs covered:** AR1–AR17, AR24, AR25
**UX-DRs covered:** UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR7, UX-DR16, UX-DR20, UX-DR21, UX-DR22, UX-DR23

## Epic 1: Foundation — Project Setup, Auth & Admin Shell

Admin สามารถ login เข้าระบบได้ เห็น dashboard professional พร้อม sidebar ที่ feature-flag aware และ tenant switcher สำหรับ super_admin — ระบบพร้อมรับ feature ใหม่ทุกอย่าง

### Story 1.1: Initialize Project & Core Database Schema

As a developer,
I want a working Next.js project initialized with the Supabase starter template and core database schema,
So that I have a secure, properly configured foundation to build all CMS features on.

**Acceptance Criteria:**

**Given** ยังไม่มี codebase
**When** developer รัน `npx create-next-app -e with-supabase bestsolutions-cms`
**Then** ได้โปรเจค Next.js 15 App Router พร้อม TypeScript strict, Tailwind CSS, shadcn/ui initialized
**And** `.env.local` มี `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**Given** โปรเจคถูก initialize แล้ว
**When** developer รัน `supabase init` และ migrations สำหรับ core tables
**Then** มี migration ไฟล์ `001_init_enums.sql` (content_status, user_role enums) และ `002_core_tables.sql` (tenants, users, site_settings tables พร้อม indexes)
**And** `supabase gen types typescript` สร้าง `src/types/database.types.ts` ที่ถูกต้อง

**Given** โปรเจคพร้อมใช้
**When** developer ติดตั้ง dependencies ทั้งหมด
**Then** `@tiptap/react @tiptap/pm @tiptap/starter-kit`, `react-hook-form zod @hookform/resolvers`, `swr`, `@upstash/ratelimit @upstash/redis`, `resend` ติดตั้งสำเร็จ
**And** `vitest.config.ts` ถูก setup พร้อมรัน test ได้

### Story 1.2: Core Library Infrastructure

As a developer,
I want all core helper functions and Supabase client variants implemented,
So that every future feature can consistently handle auth, tenant context, and data access patterns without duplication.

**Acceptance Criteria:**

**Given** โปรเจค initialized แล้ว
**When** developer สร้าง Supabase client files
**Then** มี `createServerClient()` ใน `src/lib/supabase/server.ts`, `createServiceRoleClient()` ใน `src/lib/supabase/admin.ts` (server-only), `createPublicClient()` ใน `src/lib/supabase/public.ts`
**And** `createServiceRoleClient()` ไม่สามารถ import ได้จาก client-side code (type error)

**Given** user session มีอยู่
**When** code เรียก `getTenantId()` จาก `src/lib/tenant.ts`
**Then** function คืน `tenant_id` string ที่ถูกต้องของ user นั้น
**And** ถ้าไม่มี session หรือ user ไม่มี tenant ให้ throw error

**Given** helper functions ครบแล้ว
**When** developer ตรวจสอบ lib structure
**Then** มีไฟล์: `auth.ts` (requireAuth, requireRole), `tiptap.ts` (serialize/parse), `i18n.ts` (getLocaleValue, setLocaleValue), `slugify.ts`, `notifications.ts`, `rate-limit.ts`, `cors.ts`, `audit.ts`, `utils.ts`
**And** `src/lib/validations/` มี `project.ts`, `article.ts`, `message.ts`, `media.ts`, `category.ts`, `settings.ts` (Zod schemas)

### Story 1.3: Login, Logout & Auth Middleware

As an admin,
I want to log in with email and password, be protected by auth middleware, and log out securely,
So that only authenticated users can access the CMS.

**Acceptance Criteria:**

**Given** user ยังไม่ได้ login
**When** user เข้าถึง URL ใดๆ ใน admin routes
**Then** middleware redirect ไปหน้า `/login` อัตโนมัติ
**And** URL ที่ user พยายามเข้าถูกเก็บไว้เพื่อ redirect หลัง login สำเร็จ

**Given** user อยู่ที่หน้า `/login`
**When** กรอก email + password ที่ถูกต้องแล้วกด Login
**Then** ระบบ authenticate ผ่าน Supabase Auth และ redirect ไป dashboard
**And** session ถูกเก็บเป็น cookie-based ผ่าน `@supabase/ssr`

**Given** user กรอก email หรือ password ผิด
**When** กด Login
**Then** แสดง error message "อีเมลหรือรหัสผ่านไม่ถูกต้อง" ใต้ form
**And** password field ถูก clear อัตโนมัติ

**Given** user login อยู่แล้ว
**When** กด Logout
**Then** session ถูก invalidate และ redirect ไปหน้า `/login`
**And** กด Back button แล้วไม่สามารถกลับเข้า admin ได้

### Story 1.4: Admin Shell — Design System & Sidebar Layout

As an admin,
I want a professional admin shell with dark sidebar, consistent design system, and responsive layout,
So that I can navigate the CMS efficiently on any device.

**Acceptance Criteria:**

**Given** admin login สำเร็จ
**When** เปิด browser ที่ขนาด desktop (1024px+)
**Then** เห็น sidebar ดำ (#141414) ความกว้าง 240px ซ้ายมือ พร้อม grouped sections: CONTENT (Projects, Blog), COMMUNICATION (Messages), ASSETS (Media), SYSTEM (Settings, Analytics)
**And** CSS variables ครบ: `--background`, `--foreground`, `--muted`, `--border`, `--primary`, `--sidebar-bg`, `--sidebar-text`, `--sidebar-active`, `--destructive`
**And** Font `Noto Sans Thai` โหลดสำเร็จ, heading ใช้ letter-spacing -0.02em

**Given** browser ที่ขนาด tablet (768–1023px)
**When** โหลดหน้า admin
**Then** sidebar collapse เป็น icon-only 56px
**And** hover บน icon แสดง tooltip ชื่อ menu item

**Given** browser ที่ขนาด mobile (<768px)
**When** โหลดหน้า admin
**Then** sidebar ซ่อน แสดง hamburger menu icon บน topbar
**And** กด hamburger เปิด sidebar overlay ได้

**Given** user tab ผ่าน interactive elements
**When** ทดสอบ keyboard navigation
**Then** ทุก element มี focus ring ดำชัดเจน (`--ring`)
**And** touch targets ทุกปุ่มมีขนาด min 44×44px

**Given** sidebar โหลด
**When** content ยังไม่พร้อม
**Then** แสดง Skeleton loading แทน spinner
**And** topbar + sidebar โหลดก่อน content เสมอ

### Story 1.5: Dashboard, RBAC & Tenant Switcher

As a super_admin,
I want a dashboard with key stats, role-based access control, and a tenant switcher,
So that I can oversee all clients at a glance and manage multiple tenants from one place.

**Acceptance Criteria:**

**Given** Twodesk tenant ถูก seed ในฐานข้อมูลแล้ว (slug: "twodesk")
**When** super_admin login และเข้า dashboard
**Then** เห็น TenantSwitcher ด้านบน sidebar แสดง tenant name + avatar + chevron
**And** คลิก TenantSwitcher แล้วเห็น dropdown list ของ tenants ทั้งหมด

**Given** admin (ไม่ใช่ super_admin) login
**When** ดู sidebar
**Then** TenantSwitcher ไม่ปรากฏ — เห็นแค่ชื่อ tenant ของตัวเองเท่านั้น

**Given** tenant "twodesk" มี enabled_features: ["projects", "messages"]
**When** admin ของ twodesk ดู sidebar
**Then** เห็นแค่ menu: Projects, Messages, Media, Settings — ไม่เห็น Blog
**And** พยายามเข้า `/blog` โดยตรงก็ถูก redirect กลับ dashboard

**Given** admin login เข้าระบบ
**When** เปิด dashboard
**Then** เห็น 4 stats cards: จำนวน Projects, Articles, Unread Messages, Media files ของ tenant นั้น
**And** เห็น 2-column grid ด้านล่าง: Projects list ล่าสุด 5 รายการ + Messages ล่าสุด 5 รายการ

**Given** editor role login เข้าระบบ
**When** พยายามเข้าหน้าที่ต้องการ admin/super_admin
**Then** ได้รับ 403 Forbidden response และ redirect กลับ dashboard

### Epic 2: Projects Content Management
Admin สามารถสร้าง แก้ไข และ publish โปรเจคพร้อม rich text editor, multi-locale, SEO fields, media library, categories, auto-save และ revision history ครบสมบูรณ์
**FRs covered:** FR10–FR19, FR32–FR41, FR46–FR48
**UX-DRs covered:** UX-DR8, UX-DR9, UX-DR10, UX-DR11, UX-DR12, UX-DR13, UX-DR14, UX-DR15, UX-DR17, UX-DR18, UX-DR19

## Epic 2: Projects Content Management

Admin สามารถสร้าง แก้ไข และ publish โปรเจคพร้อม rich text editor, multi-locale, SEO fields, media library, categories, auto-save และ revision history ครบสมบูรณ์

### Story 2.1: Content Database Schema & RLS Policies

As a developer,
I want the content, media, and revision database schema with RLS policies applied,
So that all content features have a secure, isolated data foundation per tenant.

**Acceptance Criteria:**

**Given** core tables จาก Story 1.1 มีอยู่แล้ว
**When** developer รัน migrations ชุดต่อไป
**Then** มี `003_content_tables.sql` สร้าง tables: `projects`, `articles`, `categories`, `pages` — ทุก table มี `tenant_id`, `deleted_at`, `created_at`, `updated_at`
**And** มี `004_support_tables.sql` สร้าง: `media_items`, `content_revisions`, `audit_logs`, `messages`

**Given** migrations รันแล้ว
**When** developer รัน `005_rls_policies.sql`
**Then** RLS เปิดในทุก table — user เห็นแค่ rows ที่ `tenant_id` ตรงกับ tenant ของตัวเอง
**And** anon user เห็นเฉพาะ published content (`status = 'published'` และ `deleted_at IS NULL`)

**Given** RLS policies ใช้งานอยู่
**When** รัน RLS isolation tests
**Then** tenant A ไม่สามารถ query ข้อมูลของ tenant B ได้ในทุกกรณี
**And** `supabase gen types typescript` อัปเดต `database.types.ts` ครบทุก table ใหม่

### Story 2.2: Categories Management

As an admin,
I want to create, edit, reorder, and delete categories for projects and articles,
So that content can be organized meaningfully per tenant.

**Acceptance Criteria:**

**Given** admin อยู่ที่ Settings หรือ dedicated Categories page
**When** สร้าง category ใหม่ (ชื่อภาษาไทย, ประเภท: project/article)
**Then** category ถูกสร้างพร้อม `tenant_id` ของ admin นั้น และปรากฏใน list ทันที
**And** ถ้า tenant รองรับหลายภาษา — สามารถกรอกชื่อ per locale ได้

**Given** มี categories อยู่แล้ว
**When** admin แก้ `sort_order` ของ category
**Then** order ถูกบันทึกและ Public API คืน categories ตาม sort_order นั้น

**Given** admin ลบ category ที่มี content ผูกอยู่
**When** กด Delete
**Then** แสดง confirmation dialog และ error ว่า "category นี้มี X projects ผูกอยู่ — ไม่สามารถลบได้"
**And** category ที่ไม่มี content ผูกลบได้ทันทีหลัง confirm

### Story 2.3: Media Library — Upload, View & Delete

As an admin,
I want to upload, view, and delete images in a media library,
So that all tenant media is organized and reusable across content.

**Acceptance Criteria:**

**Given** admin อยู่ที่หน้า Media
**When** ลาก drop ไฟล์รูปภาพลงใน upload zone หรือกด Browse
**Then** ระบบ validate ว่าเป็น JPEG, PNG, GIF, หรือ WebP เท่านั้น — ไฟล์ประเภทอื่น reject พร้อม error
**And** progress bar แสดงระหว่าง upload และ thumbnail แสดงทันทีหลัง upload สำเร็จภายใน 5 วินาที

**Given** รูปถูก upload สำเร็จ
**When** ระบบจัดเก็บ
**Then** รูปต้นฉบับถูกเก็บใน Supabase Storage — URL สำหรับ display ใช้ `?width=800&quality=80` (WebP)
**And** thumbnail URL ใช้ `?width=400&height=300&resize=cover`
**And** DB record มี `tenant_id`, `file_name`, `url`, `thumbnail_url`, `mime_type`, `size_bytes`, `alt_text` (JSONB: `{"th": "...", "en": "..."}`)

**Given** admin คลิกแก้ alt text บนรูปใน media grid
**When** กรอก alt text per locale แล้ว save
**Then** `alt_text` JSONB อัปเดตใน DB และ Public API คืน alt_text ตาม locale ที่ request

**Given** admin เปิดหน้า Media
**When** โหลด media list
**Then** เห็น grid ของ thumbnails ทั้งหมดของ tenant นั้น (แค่ของตัวเอง ไม่ข้าม tenant)
**And** ถ้ายังไม่มีรูป แสดง EmptyState: "ยังไม่มีไฟล์" + ปุ่ม "Upload รูปภาพ"

**Given** admin กด Delete บนรูปที่ไม่ต้องการ
**When** confirm แล้ว
**Then** ลบทั้ง DB record และ Supabase Storage file
**And** แสดง Toast "ลบแล้ว" พร้อมปุ่ม "เลิกทำ" 5 วินาที — ถ้ากด restore กลับมา ถ้าไม่กด = ลบจริง

### Story 2.4: TiptapEditor with Multi-locale & Auto-save

As an admin,
I want a rich text editor with slash commands, locale switching, and auto-save,
So that creating and editing multi-language content is fast and worry-free.

**Acceptance Criteria:**

**Given** admin เปิด editor สำหรับ content ที่ tenant รองรับ 2 ภาษา
**When** editor โหลด
**Then** เห็น LocaleTabGroup ด้านบน: แท็บ `🇹🇭 ภาษาไทย` | `🇬🇧 English`
**And** สลับแท็บทำให้ content fields (title, description, editor content) เปลี่ยนตาม locale ทันที
**And** ถ้า tenant มีแค่ 1 locale, LocaleTabGroup ไม่ปรากฏ

**Given** admin พิมพ์ `/` ใน Tiptap editor
**When** slash menu ปรากฏ
**Then** เห็น block options: Heading 1, Heading 2, Paragraph, Bullet List, Numbered List, Image
**And** เลือก option ได้ด้วย keyboard (↑↓ Enter) หรือ click

**Given** admin กำลัง edit content
**When** ผ่านไป 3 วินาทีหลังแก้ล่าสุด
**Then** AutoSaveIndicator แสดง `● Saving...` แล้วเปลี่ยนเป็น `✓ Saved`
**And** revision ใหม่ถูกบันทึกใน `content_revisions` table

**Given** auto-save ล้มเหลว (เช่น network error)
**When** ระบบพยายาม save
**Then** AutoSaveIndicator แสดง `⚠ ไม่สามารถบันทึกได้` พร้อม retry
**And** content ที่พิมพ์ไม่หาย

### Story 2.5: MediaPicker — Connect Editor to Media Library

As an admin,
I want to pick images from the media library directly within the editor and cover image field,
So that inserting images into content is seamless without leaving the editor.

**Acceptance Criteria:**

**Given** admin คลิก Image ใน slash menu หรือ toolbar ของ Tiptap
**When** MediaPicker modal เปิด
**Then** เห็น grid thumbnails ของ media ทั้งหมดของ tenant พร้อม search field
**And** เลือกรูปแล้ว image ถูก insert ลง editor ณ ตำแหน่ง cursor

**Given** admin drag & drop ไฟล์รูปลง editor โดยตรง
**When** drop
**Then** รูปถูก upload ไป Supabase Storage อัตโนมัติ แล้ว insert ลง editor ทันทีเมื่อ upload เสร็จ
**And** แสดง placeholder/spinner ระหว่าง upload

**Given** admin อยู่ที่ cover image field ของ project form
**When** กด "เลือกจาก Media Library"
**Then** MediaPicker modal เปิดพร้อม grid thumbnails
**And** เลือกรูปแล้ว cover image preview แสดงใน form ทันที

### Story 2.6: Projects List & Create

As an admin,
I want to view all projects in a list and create new projects,
So that I can manage client project portfolios efficiently.

**Acceptance Criteria:**

**Given** admin คลิก Projects ใน sidebar
**When** หน้า Projects โหลด
**Then** เห็น table list: ชื่อ project (ภาษาหลักของ tenant), category, status badge (Published/Draft), วันที่แก้ล่าสุด
**And** ถ้าไม่มี project แสดง EmptyState: "ยังไม่มี Project" + ปุ่ม "สร้าง Project แรก"
**And** PageHeader แสดง breadcrumb: `[Tenant Name] > Projects` + ปุ่ม "+ สร้าง Project"

**Given** admin กด "+ สร้าง Project"
**When** กรอก title ภาษาไทย
**Then** slug auto-generate จาก title ทันที (เช่น "บ้านริมน้ำ" → "ban-rim-nam")
**And** admin แก้ slug เองได้ใน editable field ด้านล่าง พร้อม preview URL

**Given** admin กรอกข้อมูลหลัก (title, category, location, area, year)
**When** กด "บันทึก Draft"
**Then** project ถูกสร้างด้วย status = 'draft' และ `tenant_id` ของ admin นั้น
**And** redirect ไปหน้า edit project ที่สร้างแล้ว
**And** form validation แสดง error ใต้ field ทันที (inline) ไม่รอกด submit

### Story 2.7: Projects Edit, SEO, Publish & Delete

As an admin,
I want to edit a project with full rich text, SEO fields, images, and publish or delete it,
So that project content is complete, discoverable, and can be lifecycle-managed.

**Acceptance Criteria:**

**Given** admin เปิด project ที่มีอยู่เพื่อแก้ไข
**When** editor โหลด
**Then** เห็น form sections: ข้อมูลหลัก / Content (Tiptap) / รูปภาพ (cover + gallery) / SEO
**And** AutoSaveIndicator ทำงานอัตโนมัติทุก 3 วินาที

**Given** admin กรอก SEO fields (title, description, keywords) ใน locale tab
**When** บันทึก
**Then** SEO data เก็บใน JSONB locale format: `{"th": {...}, "en": {...}}`
**And** Public API คืน SEO data ตาม locale ที่ frontend request

**Given** admin พร้อม publish project
**When** กด "เผยแพร่"
**Then** confirmation dialog ปรากฏ: "แน่ใจที่จะเผยแพร่ project นี้?"
**And** กด "ยืนยัน" → status เปลี่ยนเป็น `published`, toast "เผยแพร่แล้ว", ContentStatusBadge เปลี่ยนสีทันที

**Given** admin soft delete project
**When** กด "ลบ" + confirm
**Then** `deleted_at` ถูก set (ไม่ hard delete), project หายจาก list
**And** toast "ลบแล้ว" พร้อมปุ่ม "เลิกทำ" 5 วินาที — กดได้เพื่อ restore
**And** `audit_logs` บันทึก: action="delete", entity_type="project", entity_id, tenant_id, user_id

**Given** admin แก้ content และ save
**When** ระบบ save revision
**Then** `content_revisions` บันทึก revision ใหม่
**And** ถ้า revision เกิน 50 รายการต่อ project, ระบบ auto-prune revision เก่าสุดออก

### Epic 3: Articles (Blog) Content Management
Admin สามารถสร้าง แก้ไข และ publish บทความ blog พร้อม rich text, multi-locale และ SEO — ใช้ editor และ media library ที่สร้างแล้วใน Epic 2
**FRs covered:** FR20–FR25

## Epic 3: Articles (Blog) Content Management

Admin สามารถสร้าง แก้ไข และ publish บทความ blog พร้อม rich text, multi-locale และ SEO — ใช้ editor และ media library ที่สร้างแล้วใน Epic 2

### Story 3.1: Articles List & Create

As an admin,
I want to view all articles in a list and create new articles,
So that I can manage the client's blog content efficiently.

**Acceptance Criteria:**

**Given** admin คลิก Blog ใน sidebar (เฉพาะ tenant ที่เปิด feature "blog")
**When** หน้า Blog โหลด
**Then** เห็น table list: ชื่อ article, category, status badge (Published/Draft), วันที่แก้ล่าสุด
**And** ถ้าไม่มี article แสดง EmptyState: "ยังไม่มีบทความ" + ปุ่ม "สร้างบทความแรก"
**And** PageHeader: `[Tenant] > Blog` + ปุ่ม "+ สร้างบทความ"

**Given** admin กด "+ สร้างบทความ"
**When** กรอก title และ excerpt
**Then** slug auto-generate จาก title ทันที พร้อม editable field
**And** กด "บันทึก Draft" → article สร้างด้วย status = 'draft', tenant_id ถูกต้อง และ redirect ไปหน้า edit

### Story 3.2: Articles Edit, SEO & Cover Image

As an admin,
I want to write and edit article content with rich text, cover image, excerpt, and SEO fields per locale,
So that blog posts are complete and optimized for search engines.

**Acceptance Criteria:**

**Given** admin เปิด article เพื่อแก้ไข
**When** editor โหลด
**Then** เห็น form sections: ข้อมูลหลัก (title, excerpt, category) / Cover Image / Content (Tiptap) / SEO
**And** AutoSaveIndicator ทำงานทุก 3 วินาทีเหมือน projects
**And** LocaleTabGroup ปรากฏถ้า tenant รองรับหลายภาษา

**Given** admin กรอก excerpt per locale
**When** บันทึก
**Then** excerpt เก็บใน JSONB: `{"th": "...", "en": "..."}` และ Public API คืน excerpt ตาม locale

**Given** admin เลือก cover image
**When** กด "เลือกจาก Media Library"
**Then** MediaPicker เปิด และเลือกรูปได้ — reuse component เดิมจาก Epic 2 โดยไม่แก้โค้ด

### Story 3.3: Articles Publish & Delete

As an admin,
I want to publish and delete articles with proper confirmation and audit trail,
So that blog content lifecycle is controlled and safe.

**Acceptance Criteria:**

**Given** admin พร้อม publish article
**When** กด "เผยแพร่"
**Then** confirmation dialog ปรากฏ → กด "ยืนยัน" → status = `published`, toast "เผยแพร่แล้ว", badge เปลี่ยนสีทันที

**Given** admin soft delete article
**When** กด "ลบ" + confirm
**Then** `deleted_at` ถูก set, article หายจาก list
**And** toast "ลบแล้ว" + ปุ่ม "เลิกทำ" 5 วินาที
**And** `audit_logs` บันทึก action="delete", entity_type="article"

**Given** article ถูก publish
**When** admin เปลี่ยนกลับเป็น draft
**Then** status เปลี่ยนเป็น `draft` โดยไม่ต้อง confirm
**And** article หายจาก Public API list ทันที

## Epic 4: Messages Inbox & Contact Notifications

ผู้เยี่ยมชมส่ง contact form ได้ → Admin รับแจ้งเตือนผ่าน LINE/Email ทันที → Admin จัดการ inbox อ่าน archive ได้อย่างเป็นระบบ

### Story 4.1: Contact Form API Endpoint

As a website visitor,
I want to submit a contact form through the public API,
So that I can reach the business without leaving their website.

**Acceptance Criteria:**

**Given** visitor ส่ง POST request ไปที่ `/api/public/twodesk/contact`
**When** request มี name, email, phone, message, project_type ครบถ้วนและถูกต้อง
**Then** ระบบ validate ด้วย Zod schema → บันทึก message ใน DB พร้อม `tenant_id` ถูกต้อง → return 201
**And** message ที่บันทึกมี status = 'unread'

**Given** visitor ส่ง request ที่ข้อมูลไม่ครบหรือ email format ผิด
**When** API รับ request
**Then** return 400 พร้อม error envelope: `{ error: "...", code: "VALIDATION_ERROR", status: 400 }`

**Given** visitor ส่ง request เกิน 5 ครั้งต่อนาทีจาก IP เดียวกัน
**When** API ตรวจสอบ rate limit ผ่าน Upstash
**Then** return 429 Too Many Requests
**And** IP อื่นๆ ยังใช้ API ได้ปกติ

### Story 4.2: Notification on New Message

As an admin,
I want to receive instant notifications via LINE and/or Email when a new contact message arrives,
So that I can respond to leads quickly without checking the CMS constantly.

**Acceptance Criteria:**

**Given** tenant มี notification setting: LINE Notify token ตั้งค่าไว้
**When** มี message ใหม่เข้ามา
**Then** ระบบส่ง LINE Notify message ที่มี: ชื่อผู้ส่ง, email, เบอร์โทร, ข้อความย่อ ภายใน 3 วินาที
**And** ถ้า token ไม่ถูกต้อง ระบบ log error แต่ไม่ทำให้ contact form fail

**Given** tenant มี notification setting: Email (Resend) ตั้งค่าไว้
**When** มี message ใหม่เข้ามา
**Then** ระบบส่ง email notification ผ่าน Resend ภายใน 5 วินาที มี retry เมื่อ fail
**And** notification ทำงานแบบ fire-and-forget ไม่ block response ของ contact form API

**Given** tenant ตั้งค่าทั้ง LINE และ Email
**When** มี message ใหม่
**Then** ระบบส่งทั้งสองช่องทางพร้อมกัน

### Story 4.3: Messages Inbox Management

As an admin,
I want to view, read, and archive messages in an organized inbox,
So that no customer inquiry is missed or lost.

**Acceptance Criteria:**

**Given** admin คลิก Messages ใน sidebar
**When** หน้า Messages โหลด
**Then** เห็น list messages ของ tenant นั้น: ชื่อ, email, ข้อความย่อ, วันที่, status badge (ใหม่/อ่านแล้ว)
**And** unread messages แสดง badge จำนวนใน sidebar icon
**And** ถ้าไม่มี message แสดง EmptyState: "ยังไม่มีข้อความ"

**Given** admin คลิก message ใน list
**When** เปิด message detail
**Then** เห็น: ชื่อ, email, เบอร์โทร, ประเภท project, ข้อความเต็ม, วันเวลาที่ส่ง
**And** status เปลี่ยนเป็น 'read' อัตโนมัติ และ unread badge ลดลง

**Given** admin ดู message แล้ว
**When** กด "Archive"
**Then** message ย้ายออกจาก inbox ไป archived view
**And** admin ยังดู archived messages ได้ผ่าน filter

## Epic 5: Site Settings & Configuration

Admin ตั้งค่า site identity, SEO defaults, notification channels และ GA tracking ID ได้ครบใน settings page เดียว

### Story 5.1: Site Identity & SEO Settings

As an admin,
I want to configure site name, logo, contact info, social links, and default SEO,
So that the tenant's public-facing identity is complete and consistent.

**Acceptance Criteria:**

**Given** admin เข้าหน้า Settings
**When** หน้าโหลด
**Then** เห็น form sections: Site Identity (name, tagline, logo, favicon, contact info, social links) และ Default SEO (title, description, keywords per locale)

**Given** admin อัปโหลด logo ผ่าน MediaPicker
**When** เลือกรูปแล้ว save
**Then** logo URL บันทึกใน `site_settings` ของ tenant นั้น
**And** Public API `/api/public/[tenant]/settings` คืน logo URL ใหม่ทันที

**Given** admin กรอก default SEO fields
**When** save
**Then** SEO data เก็บใน JSONB locale format และ Public API คืนถูกต้อง

### Story 5.2: Notification Channels & GA Configuration

As an admin,
I want to configure notification channels (LINE/Email) and Google Analytics tracking ID,
So that the business receives alerts and analytics work for their frontend.

**Acceptance Criteria:**

**Given** admin อยู่ที่ Settings → Notifications
**When** กรอก LINE Notify token และ toggle เปิด LINE notifications
**Then** token บันทึกใน `site_settings` ฝั่ง server — ไม่ expose ใน Public API response
**And** ส่ง test notification ได้เพื่อยืนยันว่า token ถูกต้อง

**Given** admin กรอก email รับ notification และ toggle เปิด Email
**When** save
**Then** email บันทึกและ Resend ใช้ email นี้สำหรับ notification ของ tenant นี้

**Given** admin กรอก GA Measurement ID (เช่น G-XXXXXXXX)
**When** save
**Then** GA ID บันทึกใน `site_settings` และ Public API `/api/public/[tenant]/settings` คืน GA ID ให้ frontend ใช้

## Epic 6: Public Headless API

Frontend developer ดึง published content ผ่าน REST API ที่ secure มี CORS validation per tenant, rate limiting และ pagination — เชื่อมต่อ Twodesk frontend ได้ทันที

### Story 6.1: Projects & Articles Public Endpoints

As a frontend developer,
I want to fetch published projects and articles via public API with pagination,
So that the client's website can display up-to-date content from the CMS.

**Acceptance Criteria:**

**Given** frontend ส่ง `GET /api/public/twodesk/projects`
**When** request มี valid CORS origin
**Then** return JSON: `{ data: [...], total: N, page: 1, limit: 20 }` — เฉพาะ projects ที่ `status = 'published'` และ `deleted_at IS NULL`
**And** รองรับ query params: `?page=2&limit=10&category=slug`

**Given** frontend ส่ง `GET /api/public/twodesk/projects/[slug]`
**When** slug ตรงกับ published project
**Then** return project detail พร้อม Tiptap JSON content, SEO fields, cover image URL, gallery, categories
**And** ถ้า slug ไม่พบ return 404 พร้อม error envelope

**Given** frontend ส่ง `GET /api/public/twodesk/articles` และ `GET /api/public/twodesk/articles/[slug]`
**When** request ถูกต้อง
**Then** ทำงานเหมือน projects endpoints — published only, pagination, detail with Tiptap JSON

**Given** frontend ส่ง `GET /api/public/twodesk/pages/[slug]`
**When** slug ตรงกับ page ที่มีอยู่ใน DB
**Then** return page content: title, content (Tiptap JSON), SEO fields — ทั้งหมด per locale
**And** ถ้า slug ไม่พบ return 404 พร้อม error envelope `{ error: "Page not found", code: "PAGE_NOT_FOUND", status: 404 }`

### Story 6.2: Settings & CORS Validation

As a frontend developer,
I want to fetch site settings and have CORS enforced per tenant domain,
So that only authorized frontends can access the API.

**Acceptance Criteria:**

**Given** frontend ส่ง `GET /api/public/twodesk/settings`
**When** request ถูกต้อง
**Then** return: site name, tagline, logo URL, favicon URL, contact info, social links, GA tracking ID, supported locales
**And** LINE Notify token และ notification email ไม่ปรากฏใน response

**Given** tenant "twodesk" มี `allowed_domains: ["twodesk.com", "www.twodesk.com"]`
**When** frontend จาก `https://twodesk.com` ส่ง request
**Then** CORS header อนุญาต: `Access-Control-Allow-Origin: https://twodesk.com`

**Given** request มาจาก domain ที่ไม่ได้ลงทะเบียน
**When** CORS validation ทำงาน
**Then** return 403 Forbidden — ไม่มี CORS header
**And** ถ้า tenant ไม่ได้ตั้ง `allowed_domains` เลย deny ทุก cross-origin request

### Story 6.3: Contact Form & Response Caching

As a frontend developer,
I want a working contact form endpoint and cached API responses,
So that form submissions work reliably and the site loads fast.

**Acceptance Criteria:**

**Given** frontend ส่ง `POST /api/public/twodesk/contact`
**When** request ผ่าน rate limit และ validation
**Then** message บันทึก, notifications ส่ง, return 201 — เหมือน Story 4.1 แต่ทดสอบจาก public domain

**Given** frontend ดึง `GET /api/public/twodesk/projects`
**When** Next.js cache ทำงาน
**Then** response ถูก cache ด้วย `revalidate: 60` — stale content สูงสุด 60 วินาที
**And** admin publish project ใหม่ → frontend เห็นภายใน 60 วินาที โดยไม่ต้อง manual revalidate

## Epic 7: Production Go-Live

Best Solutions CMS deploy บน Vercel พร้อมใช้งานจริง — Twodesk Studio เป็น tenant แรก, RLS isolation ผ่าน tests ทั้งหมด, CI/CD จาก GitHub ทำงานอัตโนมัติ

### Story 7.1: RLS Isolation Test Suite

As a developer,
I want a comprehensive RLS test suite that proves tenant data isolation,
So that we can confidently deploy knowing no data leaks between tenants.

**Acceptance Criteria:**

**Given** มี 2 tenants ใน test database (twodesk, debeau-test)
**When** รัน RLS test suite ด้วย Vitest
**Then** ทุก test ผ่าน: tenant A ไม่สามารถ SELECT/INSERT/UPDATE/DELETE ข้อมูลของ tenant B ได้ในทุก table
**And** anon user เห็นเฉพาะ published content, ไม่เห็น draft หรือ deleted
**And** test coverage ครอบคลุม: projects, articles, categories, media_items, messages, site_settings, content_revisions, audit_logs

### Story 7.2: Vercel Deployment & Environment Setup

As a developer,
I want the CMS deployed to Vercel with proper environment variables and CI/CD,
So that the production system is live and auto-deploys on every push to main.

**Acceptance Criteria:**

**Given** GitHub repository เชื่อมต่อ Vercel แล้ว
**When** push commit ไปที่ branch `main`
**Then** Vercel auto-deploy production build สำเร็จภายใน 5 นาที
**And** Pull Request ใดๆ สร้าง preview deployment URL อัตโนมัติ

**Given** production environment บน Vercel
**When** ตรวจสอบ environment variables
**Then** มี: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RESEND_API_KEY`
**And** `SUPABASE_SERVICE_ROLE_KEY` ไม่ expose ใน client-side bundle

### Story 7.3: Performance Validation & Go-Live

As a developer,
I want to validate performance metrics and officially go live with Twodesk as first tenant,
So that the CMS meets all non-functional requirements in production.

**Acceptance Criteria:**

**Given** production deployment พร้อมแล้ว
**When** ทดสอบ Admin UI page load
**Then** Lighthouse / manual test: หน้า dashboard และ projects list โหลดภายใน 2 วินาที บน 4G connection

**Given** Twodesk frontend เชื่อมต่อ Public API
**When** ส่ง request ต่างๆ
**Then** `GET /projects` response time < 500ms, `GET /projects/[slug]` < 300ms
**And** Twodesk frontend แสดง projects และ articles จาก CMS ได้ถูกต้อง

**Given** ระบบ go-live
**When** admin ของ Twodesk (คุณแพร) login ครั้งแรก
**Then** login สำเร็จ เห็นแค่ข้อมูลของ Twodesk เท่านั้น ไม่เห็น tenant อื่น
**And** สามารถแก้ไข project และเห็นผลบนเว็บ Twodesk ภายใน 60 วินาที
