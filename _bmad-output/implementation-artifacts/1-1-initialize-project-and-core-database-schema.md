# Story 1.1: Initialize Project & Core Database Schema

Status: review

## Story

As a developer,
I want a working Next.js project initialized with the Supabase starter template and core database schema,
so that I have a secure, properly configured foundation to build all CMS features on.

## Acceptance Criteria

1. **โปรเจค initialized:**
   - รัน `npx create-next-app -e with-supabase bestsolutions-cms` สำเร็จ
   - ได้ Next.js 15 App Router + TypeScript strict + Tailwind CSS + shadcn/ui
   - `.env.local` มี `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

2. **Supabase local + core migrations:**
   - รัน `supabase init` สำเร็จ
   - มีไฟล์ `supabase/migrations/001_init_enums.sql` (enums: content_status, user_role)
   - มีไฟล์ `supabase/migrations/002_core_tables.sql` (tables: tenants, users, site_settings พร้อม triggers + seed data)
   - รัน migrations สำเร็จ (local หรือ remote)
   - `supabase gen types typescript` สร้าง `src/types/database.types.ts` ถูกต้อง

3. **Dependencies + testing:**
   - `@tiptap/react @tiptap/pm @tiptap/starter-kit`, `react-hook-form zod @hookform/resolvers`, `swr`, `@upstash/ratelimit @upstash/redis`, `resend` ติดตั้งสำเร็จ
   - `vitest.config.ts` ถูก setup ที่ root, `npm test` รันได้ไม่มี error

## Tasks / Subtasks

- [x] Task 1: Initialize Next.js project with Supabase starter (AC: #1)
  - [x] รัน `npx create-next-app -e with-supabase bestsolutions-cms` ใน parent directory (ไม่ใช่ภายใน bestsolutions-cms/)
  - [x] ตรวจสอบว่ามี `package.json`, `app/`, `src/` หรือ `components/` (ตาม template structure)
  - [x] copy `.env.local` จาก `.env.example` แล้วกรอก Supabase credentials 3 ค่า
  - [x] สร้าง `.env.example` ที่มี placeholder ครบ 6 ค่า (Supabase + Upstash + Resend)

- [x] Task 2: Reorganize project structure ให้ตรง architecture (AC: #1)
  - [x] ตรวจสอบว่า template สร้าง directory structure อย่างไร
  - [x] สร้าง `src/` directory structure ตาม architecture ถ้า template ไม่ได้สร้างให้:
    - `src/lib/`, `src/lib/supabase/`, `src/lib/validations/`
    - `src/types/`
    - `src/components/ui/`, `src/components/layout/`, `src/components/editor/`
  - [x] ตั้งค่า `tsconfig.json` ให้ `paths` map `@/*` → `./src/*`

- [x] Task 3: Create Supabase migration 001_init_enums.sql (AC: #2)
  - [x] รัน `supabase init` (ถ้ายังไม่มี `supabase/` directory)
  - [x] สร้าง `supabase/migrations/001_init_enums.sql` ตาม spec ในส่วน Dev Notes

- [x] Task 4: Create Supabase migration 002_core_tables.sql (AC: #2)
  - [x] สร้าง `supabase/migrations/002_core_tables.sql` ตาม spec ในส่วน Dev Notes
  - [x] ไฟล์นี้ต้องมี: `update_updated_at()` function, tables (tenants, users, site_settings), triggers, indexes, และ seed data สำหรับ Twodesk

- [x] Task 5: Apply migrations และ generate types (AC: #2)
  - [x] รัน `supabase db push` (remote) หรือ `supabase start && supabase db reset` (local)
  - [x] รัน `supabase gen types typescript --project-id <ref> > src/types/database.types.ts`
    - ถ้าใช้ local: `supabase gen types typescript --local > src/types/database.types.ts`
  - [x] ตรวจสอบว่า `src/types/database.types.ts` มี `tenants`, `users`, `site_settings` tables

- [x] Task 6: Install all dependencies (AC: #3)
  - [x] รัน install commands ตาม Dev Notes
  - [x] ตรวจสอบ `package.json` ว่ามี dependencies ครบ

- [x] Task 7: Setup Vitest (AC: #3)
  - [x] สร้าง `vitest.config.ts` ที่ root ตาม spec ในส่วน Dev Notes
  - [x] รัน `npm test` ครั้งแรก — ต้องไม่มี compilation error (แม้จะยังไม่มี test files)
  - [x] เพิ่ม test script ใน `package.json` ถ้ายังไม่มี

- [x] Task 8: Create remaining type files (AC: #1, #2)
  - [x] สร้าง `src/types/api.ts` (ApiError, ActionResult, PaginatedResponse)
  - [x] สร้าง `src/types/tenant.ts` (TenantConfig, FeatureFlags, SupportedLocale)

## Dev Notes

### Critical: Template Structure Verification

Template `with-supabase` อาจสร้าง structure แตกต่างจาก architecture spec ตรวจสอบก่อน:
```bash
# หลัง npx create-next-app ดู structure
ls -la bestsolutions-cms/
```
Template นี้มักสร้าง `app/` ที่ root (ไม่ใช่ `src/app/`) — ต้องตรวจสอบและปรับให้ตรงกับ architecture ที่กำหนด ซึ่งใช้ `src/` layout

### Environment Variables

**.env.local** (gitignored — ใส่ค่าจริง):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**.env.example** (commit ลง git — ใส่ placeholder เท่านั้น):
```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Upstash Redis (Required for rate limiting — Epic 6)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Resend (Required for email notifications — Epic 4)
RESEND_API_KEY=re_xxxx
```

> ⚠️ **NEVER commit .env.local** — ตรวจสอบ `.gitignore` ว่ามี `.env.local` อยู่แล้ว

### Migration: 001_init_enums.sql

```sql
-- supabase/migrations/001_init_enums.sql
-- Enums used across all content tables

CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'editor');
```

### Migration: 002_core_tables.sql

```sql
-- supabase/migrations/002_core_tables.sql
-- Core tables: tenants, users, site_settings
-- Includes: trigger function, triggers, indexes, and Twodesk seed data

-- ════════════════════════════════════════
-- TRIGGER FUNCTION (shared by all tables)
-- ════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════
-- TABLE: tenants
-- ════════════════════════════════════════
CREATE TABLE tenants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  domain            TEXT,
  logo_url          TEXT,
  plan              TEXT DEFAULT 'standard',
  supported_locales TEXT[] DEFAULT '{th}',
  default_locale    TEXT DEFAULT 'th',
  enabled_features  TEXT[] DEFAULT '{projects,blog,messages}',
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);

CREATE TRIGGER set_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════
-- TABLE: users
-- ════════════════════════════════════════
-- References auth.users (Supabase Auth) — same UUID
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE SET NULL,  -- NULL = super_admin
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        user_role DEFAULT 'editor',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════
-- TABLE: site_settings
-- ════════════════════════════════════════
-- One row per tenant (UNIQUE constraint enforced)
CREATE TABLE site_settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  site_name             JSONB,                 -- {"th": "Twodesk Studio", "en": "..."}
  tagline               JSONB,
  logo_url              TEXT,
  favicon_url           TEXT,
  contact_email         TEXT,
  contact_phone         TEXT,
  contact_address       JSONB,                 -- {"th": "...", "en": "..."}
  social_links          JSONB,                 -- {"facebook": "...", "instagram": "...", "line": "..."}
  seo_title             JSONB,                 -- {"th": "...", "en": "..."}
  seo_description       JSONB,
  seo_keywords          JSONB,                 -- {"th": ["..."], "en": ["..."]}
  ga_tracking_id        TEXT,
  allowed_domains       TEXT[],                -- CORS whitelist สำหรับ Public API
  notify_email          TEXT,                  -- รับ notification ผ่าน Email (Resend)
  notify_email_enabled  BOOLEAN DEFAULT false,
  notify_line_token     TEXT,                  -- LINE Notify token (server-side only — ห้าม expose ใน Public API)
  notify_line_enabled   BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_site_settings_tenant_id ON site_settings(tenant_id);

CREATE TRIGGER set_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════
-- SEED DATA: Twodesk Studio (AR24)
-- ════════════════════════════════════════
-- Insert tenant "Twodesk Studio" เป็น tenant แรก
-- enabled_features: projects + messages (ไม่มี blog ตาม Story 1.5 AC)
INSERT INTO tenants (name, slug, supported_locales, default_locale, enabled_features)
VALUES (
  'Twodesk Studio',
  'twodesk',
  '{th,en}',
  'th',
  '{projects,messages}'
);

-- Insert empty site_settings row สำหรับ Twodesk (จะกรอกรายละเอียดใน Epic 5)
INSERT INTO site_settings (tenant_id, site_name)
SELECT id, '{"th": "Twodesk Studio", "en": "Twodesk Studio"}'::jsonb
FROM tenants WHERE slug = 'twodesk';

-- ════════════════════════════════════════
-- NOTE: Super Admin user (AR24)
-- ════════════════════════════════════════
-- Super admin user ต้องสร้างผ่าน Supabase Auth Dashboard หรือ Admin API
-- ไม่สามารถ INSERT ลง auth.users โดยตรงใน migration
-- หลัง migration รันแล้ว:
-- 1. สร้าง user ผ่าน Supabase Dashboard → Authentication → Users
-- 2. Copy UUID → INSERT ลง public.users:
--
-- INSERT INTO users (id, email, full_name, role, tenant_id)
-- VALUES ('<auth-user-uuid>', 'admin@bestsolutions.co.th', 'Best Solutions Admin', 'super_admin', NULL);
--
-- tenant_id = NULL สำหรับ super_admin (ไม่ผูกกับ tenant ใดๆ)
```

### Dependencies Installation

รันตามลำดับนี้:
```bash
# 1. Tiptap rich text editor
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-placeholder

# 2. Form handling + validation
npm install react-hook-form zod @hookform/resolvers

# 3. Client-side data fetching (real-time unread counts)
npm install swr

# 4. Rate limiting (Vercel Edge compatible)
npm install @upstash/ratelimit @upstash/redis

# 5. Email notifications
npm install resend

# 6. Testing framework
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

> หากใช้ pnpm หรือ yarn ให้เปลี่ยน `npm install` เป็น command ของ package manager นั้นๆ

### Vitest Configuration

สร้าง `vitest.config.ts` ที่ root ของโปรเจค (ข้างๆ `package.json`):

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

สร้าง `src/test/setup.ts`:
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
```

เพิ่ม script ใน `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### TypeScript Type Files

สร้าง `src/types/api.ts`:
```typescript
// src/types/api.ts
export type ApiError = {
  error: string
  code: string
  status: number
}

export type ActionResult<T> =
  | { data: T; error?: never }
  | { data?: never; error: string }

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
}
```

สร้าง `src/types/tenant.ts`:
```typescript
// src/types/tenant.ts
export type SupportedLocale = 'th' | 'en'

export type FeatureFlag = 'projects' | 'blog' | 'messages'

export type TenantConfig = {
  id: string
  name: string
  slug: string
  supported_locales: SupportedLocale[]
  default_locale: SupportedLocale
  enabled_features: FeatureFlag[]
}

export type LocaleContent<T = string> = {
  [K in SupportedLocale]?: T
}
```

### Project Structure Notes

- **Template ออกมาแล้วอาจแตกต่างจาก architecture** — template `with-supabase` มักวาง `utils/supabase/` ที่ root แทน `src/lib/supabase/`. Developer ต้อง move/rename ให้ตรงตาม:
  - `utils/supabase/client.ts` → `src/lib/supabase/` (จะสร้างใน Story 1.2)
  - ยังไม่ต้อง implement lib files ในนี้ — Story 1.2 จะครอบคลุม
- **ห้าม modify `src/components/ui/`** (shadcn/ui) — ต้อง install components ผ่าน CLI: `npx shadcn@latest add <component>`
- **Supabase local dev:** ถ้ายังไม่มี remote credentials ให้ใช้ `supabase start` สร้าง local instance แทน
- **migrations ต้องใช้ชื่อ `001_`, `002_`** ตาม architecture — ห้ามใช้ timestamp format ของ Supabase default

### Supabase Commands Reference

```bash
# Local development
supabase start                          # start local Supabase
supabase db reset                       # apply all migrations + seed
supabase stop                           # stop local Supabase

# Remote (ถ้ามี credentials แล้ว)
supabase db push                        # push migrations to remote
supabase gen types typescript \
  --project-id <project-ref> \
  > src/types/database.types.ts         # generate TypeScript types

# Local type generation
supabase gen types typescript \
  --local \
  > src/types/database.types.ts
```

### References

- AR1: Architecture → "Selected Starter: Official Supabase × Next.js App Router Template"
- AR2: Architecture → "Supabase local dev: supabase init + migrations 5 ไฟล์"
- AR3: Architecture → "Generate Supabase types หลังทุก migration"
- AR4: Architecture → "ติดตั้ง dependencies หลัก"
- AR5: Architecture → "Setup Vitest"
- AR24: Epics → "Seed tenant แรก Twodesk Studio (slug: twodesk) พร้อม user account super_admin"
- AR25: Epics → "Seed categories สำหรับ Twodesk" ← **NOTE: categories table จะสร้างใน Story 2.1 — AR25 จะ seed ใน Story 2.2**
- Schema: PROJECT_PLAN.md → tenants, users, site_settings table definitions
- Enums: PROJECT_PLAN.md → content_status, user_role ENUM
- Structure: architecture.md → "Complete Project Directory Structure"
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- [Source: PROJECT_PLAN.md#Enums], [Source: PROJECT_PLAN.md#tenants], [Source: PROJECT_PLAN.md#users], [Source: PROJECT_PLAN.md#site_settings]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

| # | ปัญหา | วิธีแก้ |
|---|-------|---------|
| 1 | `create-next-app` ล้มเหลวเพราะ directory มีไฟล์อยู่แล้ว | สร้างใน /tmp/bestsolutions-temp แล้ว rsync กลับมา |
| 2 | `.next/types/validator.ts` error หลัง move app/ → src/app/ | ลบ `.next/` cache แล้ว tsc ผ่านสะอาด |
| 3 | vitest@4 ต้องการ Node >=20.19.0 (มี 20.12.2) + rolldown binding missing | downgrade เป็น vitest@2.1.9 |
| 4 | jsdom ESM compat error กับ @exodus/bytes | เปลี่ยน environment เป็น happy-dom |
| 5 | Template ใช้ `PUBLISHABLE_KEY` แต่ story spec ใช้ `ANON_KEY` | ตั้งทั้งสองตัวใน .env.local; Story 1.2 จะ consolidate ใน lib/supabase/ |

### Completion Notes List

- Story 1.1 ครอบคลุม AR1–AR5, AR24 (partial: tenant + site_settings seed เท่านั้น)
- AR24 super_admin user ต้องสร้างหลัง migration ผ่าน Supabase Dashboard (ดู migration comment)
- AR25 (categories seed) เลื่อนไปที่ Story 2.2 เพราะ categories table จะสร้างใน Story 2.1
- AR6–AR17 (lib helpers) อยู่ใน Story 1.2
- Categories table schema (003_content_tables.sql) อยู่ใน Story 2.1
- Migrations applied ผ่าน Supabase MCP (project: pogjddbskyjukjnpndqx.supabase.co)
- Types generated ผ่าน MCP; tenants, users, site_settings, content_status, user_role ครบ
- vitest ใช้ happy-dom (ไม่ใช่ jsdom) เพราะ Node 20.12.x compat
- SUPABASE_SERVICE_ROLE_KEY ยังเป็น placeholder — ต้องกรอกจาก Dashboard ก่อน deploy
- 20 unit tests pass: database.types (8), api types (4), tenant types (8)

### File List

- .env.example
- .env.local (gitignored — ต้องกรอก SUPABASE_SERVICE_ROLE_KEY)
- .gitignore
- package.json
- package-lock.json
- tsconfig.json
- vitest.config.ts
- next.config.ts
- tailwind.config.ts
- postcss.config.mjs
- eslint.config.mjs
- components.json
- src/middleware.ts
- src/app/ (template files: layout.tsx, page.tsx, globals.css, auth/*, protected/*)
- src/components/ (template components + ui/)
- src/lib/ (template lib: supabase/, utils.ts)
- src/lib/validations/ (empty — Story 1.2)
- src/types/database.types.ts
- src/types/api.ts
- src/types/tenant.ts
- src/test/setup.ts
- src/test/types/database.types.test.ts
- src/test/types/api.test.ts
- src/test/types/tenant.test.ts
- supabase/config.toml
- supabase/migrations/001_init_enums.sql
- supabase/migrations/002_core_tables.sql

## Change Log

| วันที่ | การเปลี่ยนแปลง |
|--------|---------------|
| 2026-04-09 | Story 1.1 implement เสร็จ — Next.js init, src/ restructure, Supabase migrations, type generation, dependencies, Vitest setup, type files; 20 tests pass |
