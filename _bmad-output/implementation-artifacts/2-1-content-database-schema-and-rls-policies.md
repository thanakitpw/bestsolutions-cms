# Story 2.1: Content Database Schema and RLS Policies

Status: review

## Story

As a developer,
I want the content tables (projects, articles, categories, pages, messages, media_items, revisions, audit_logs) created with proper indexes, triggers, and RLS policies,
so that all subsequent CRUD stories can query data with tenant isolation guaranteed at the DB layer.

## Acceptance Criteria

1. **Migration 003 — Content tables:**
   - `categories` table: per-tenant, typed (`project | article`), sortable
   - `projects` table: multi-locale fields (th/en), Tiptap JSONB, SEO, gallery array, soft delete (`deleted_at`)
   - `articles` table: mirror pattern ของ projects, category as TEXT (FK → categories)
   - `pages` table: per-tenant static pages (home/about/contact), JSONB content locale fields

2. **Migration 004 — Support tables:**
   - `messages` table: contact form submissions, `is_read`, `is_archived`
   - `media_items` table: Supabase Storage metadata, alt_text JSONB (th/en)
   - `revisions` table: auto-revision สำหรับ projects/articles (50 versions per entity)
   - `audit_logs` table: destructive action logging (delete, publish, unpublish)

3. **Migration 005 — RLS Policies:**
   - เปิด RLS บน **ทุก** table ใหม่ (migration 003+004)
   - Policy template ต้องครอบคลุม: SELECT, INSERT, UPDATE, DELETE
   - super_admin (role = 'super_admin') → เข้าถึงได้ทุก tenant
   - admin/editor → เฉพาะ tenant ของตัวเอง
   - `site_settings` ที่สร้างใน migration 002 ต้องเพิ่ม RLS ในที่นี้ด้วย (ยังไม่มีใน migration เดิม)

4. **Migration 006 — Indexes:**
   - Indexes สำหรับ FK columns ที่ query บ่อย: `tenant_id`, `status`, `deleted_at`, `created_at`
   - Composite index สำหรับ list queries: `(tenant_id, status, deleted_at)` บน projects/articles

5. **Revision trigger:**
   - DB trigger บน `projects` และ `articles`: `AFTER UPDATE` → INSERT ลง `revisions`
   - Prune อัตโนมัติ: ถ้า revision count > 50 → ลบเก่าสุดออก

6. **Supabase TypeScript types:**
   - รัน `supabase gen types typescript --project-id pogjddbskyjukjnpndqx > src/types/database.types.ts`
   - อัปเดต `src/types/tenant.ts` ให้ export types ที่ใช้บ่อย

7. **Tests:**
   - ทดสอบ migration ผ่าน SQL รัน + verify table structure (ผ่าน Supabase MCP)
   - Unit test สำหรับ helper type functions (ถ้ามี)

## Tasks / Subtasks

- [x] Task 1: สร้าง migration 003 — content tables (AC: #1)
  - [x] สร้าง `supabase/migrations/003_content_tables.sql`
  - [x] `categories` table พร้อม sort_order + type enum
  - [x] `projects` table พร้อม soft delete, JSONB content, gallery TEXT[]
  - [x] `articles` table พร้อม soft delete, excerpt fields, category_id FK → categories
  - [x] `pages` table: 3 page types per tenant (home/about/contact)
  - [x] Triggers `update_updated_at()` สำหรับทุก table (ใช้ function เดิมจาก migration 002)
  - [x] Indexes: FK columns + (tenant_id, status, deleted_at) composite

- [x] Task 2: สร้าง migration 004 — support tables (AC: #2)
  - [x] สร้าง `supabase/migrations/004_support_tables.sql`
  - [x] `messages` table
  - [x] `media_items` table: alt_text JSONB
  - [x] `revisions` table: entity_type TEXT, entity_id UUID, content JSONB, version INT
  - [x] `audit_logs` table: action TEXT, entity_type TEXT, entity_id UUID, user_id UUID, metadata JSONB

- [x] Task 3: สร้าง revision trigger (AC: #5)
  - [x] เพิ่ม trigger function `create_revision()` ใน migration 004
  - [x] Trigger บน `projects` AFTER UPDATE
  - [x] Trigger บน `articles` AFTER UPDATE
  - [x] Prune function: ลบ revision เก่าสุดถ้า count > 50

- [x] Task 4: สร้าง migration 005 — RLS policies (AC: #3)
  - [x] สร้าง `supabase/migrations/005_rls_policies.sql`
  - [x] Helper function: `get_user_tenant_id()` + `is_super_admin()` → Supabase security definer functions
  - [x] เปิด RLS + สร้าง policies ทุก table (categories, projects, articles, pages, messages, media_items, revisions, audit_logs, site_settings)
  - [x] Policy pattern ตาม spec ด้านล่าง (tenant isolation + super_admin bypass)

- [x] Task 5: สร้าง migration 006 — indexes เพิ่มเติม (AC: #4)
  - [x] สร้าง `supabase/migrations/006_indexes.sql`
  - [x] Composite indexes สำหรับ list queries ที่พบบ่อย
  - [x] Partial indexes สำหรับ soft-delete queries

- [x] Task 6: รัน migrations บน Supabase (AC: #1–#5)
  - [x] รัน migration 003–006 ผ่าน Supabase MCP: `mcp__supabase__apply_migration`
  - [x] Verify tables สร้างสำเร็จผ่าน `mcp__supabase__list_tables`

- [x] Task 7: Generate TypeScript types (AC: #6)
  - [x] รัน `supabase gen types typescript --project-id pogjddbskyjukjnpndqx > src/types/database.types.ts`
  - [x] อัปเดต `src/types/tenant.ts`: export `ContentStatus`, `UserRole`, `PageType`, `CategoryType`

- [x] Task 8: Tests (AC: #7)
  - [x] ตรวจสอบ table structure ผ่าน SQL query (ใช้ Supabase MCP)
  - [x] ตรวจสอบ RLS policies active ผ่าน `mcp__supabase__execute_sql`

## Dev Notes

### Migration 003 — Content Tables

```sql
-- supabase/migrations/003_content_tables.sql
-- Content tables: categories, projects, articles, pages

-- ════════════════════════════════════════
-- ENUM: category_type
-- ════════════════════════════════════════
-- แยก enum ออกมาเพื่อให้ query filter ได้ชัดเจน
CREATE TYPE category_type AS ENUM ('project', 'article');

-- ════════════════════════════════════════
-- TABLE: categories
-- ════════════════════════════════════════
-- Per-tenant, typed (project|article), sortable
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        JSONB NOT NULL,             -- {"th": "เชิงพาณิชย์", "en": "Commercial"}
  slug        TEXT NOT NULL,
  type        category_type NOT NULL,     -- 'project' | 'article'
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug, type)
);

CREATE INDEX idx_categories_tenant_id ON categories(tenant_id);
CREATE INDEX idx_categories_type ON categories(type);

CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════
-- TABLE: projects
-- ════════════════════════════════════════
CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  title           JSONB,                  -- {"th": "...", "en": "..."}
  slug            TEXT NOT NULL,
  description     JSONB,                  -- {"th": "...", "en": "..."}
  content         JSONB,                  -- {"th": <TiptapJSON>, "en": <TiptapJSON>}
  location        JSONB,                  -- {"th": "...", "en": "..."}
  area            TEXT,
  year            INTEGER,
  cover_image_url TEXT,
  gallery_urls    TEXT[] DEFAULT '{}',
  status          content_status DEFAULT 'draft',
  seo_title       JSONB,                  -- {"th": "...", "en": "..."}
  seo_description JSONB,
  seo_keywords    JSONB,                  -- {"th": ["..."], "en": ["..."]}
  published_at    TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ,            -- soft delete
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at);
-- Composite: list query (tenant + active + published)
CREATE INDEX idx_projects_tenant_status_deleted
  ON projects(tenant_id, status, deleted_at);

CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════
-- TABLE: articles
-- ════════════════════════════════════════
CREATE TABLE articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  title           JSONB,                  -- {"th": "...", "en": "..."}
  slug            TEXT NOT NULL,
  excerpt         JSONB,                  -- {"th": "...", "en": "..."}
  content         JSONB,                  -- {"th": <TiptapJSON>, "en": <TiptapJSON>}
  cover_image_url TEXT,
  status          content_status DEFAULT 'draft',
  seo_title       JSONB,
  seo_description JSONB,
  seo_keywords    JSONB,                  -- {"th": ["..."], "en": ["..."]}
  published_at    TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ,            -- soft delete
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_articles_tenant_id ON articles(tenant_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_deleted_at ON articles(deleted_at);
CREATE INDEX idx_articles_tenant_status_deleted
  ON articles(tenant_id, status, deleted_at);

CREATE TRIGGER set_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════
-- TABLE: pages
-- ════════════════════════════════════════
-- Static pages ต่อ tenant: home, about, contact
-- 1 row per (tenant_id, page_type) — enforce ด้วย UNIQUE
CREATE TYPE page_type AS ENUM ('home', 'about', 'contact');

CREATE TABLE pages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  page_type   page_type NOT NULL,
  title       JSONB,                      -- {"th": "...", "en": "..."}
  content     JSONB,                      -- {"th": <TiptapJSON>, "en": <TiptapJSON>}
  seo_title   JSONB,
  seo_description JSONB,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, page_type)
);

CREATE INDEX idx_pages_tenant_id ON pages(tenant_id);

CREATE TRIGGER set_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════
-- SEED: Twodesk categories (AR25)
-- ════════════════════════════════════════
-- Project categories สำหรับ Twodesk Studio
INSERT INTO categories (tenant_id, name, slug, type, sort_order)
SELECT
  t.id,
  cat.name,
  cat.slug,
  'project'::category_type,
  cat.sort_order
FROM tenants t,
  (VALUES
    ('{"th":"เชิงพาณิชย์","en":"Commercial"}'::jsonb, 'commercial', 0),
    ('{"th":"คาเฟ่","en":"Cafe"}'::jsonb,              'cafe',       1),
    ('{"th":"ที่พักอาศัย","en":"Residential"}'::jsonb, 'residential',2),
    ('{"th":"อื่นๆ","en":"Others"}'::jsonb,            'others',     3)
  ) AS cat(name, slug, sort_order)
WHERE t.slug = 'twodesk';

-- Seed 3 empty pages สำหรับ Twodesk
INSERT INTO pages (tenant_id, page_type, title)
SELECT t.id, p.page_type::page_type, p.title
FROM tenants t,
  (VALUES
    ('home',    '{"th":"หน้าแรก","en":"Home"}'::jsonb),
    ('about',   '{"th":"เกี่ยวกับเรา","en":"About Us"}'::jsonb),
    ('contact', '{"th":"ติดต่อเรา","en":"Contact Us"}'::jsonb)
  ) AS p(page_type, title)
WHERE t.slug = 'twodesk';
```

### Migration 004 — Support Tables + Revision Trigger

```sql
-- supabase/migrations/004_support_tables.sql
-- Support tables: messages, media_items, revisions, audit_logs

-- ════════════════════════════════════════
-- TABLE: messages
-- ════════════════════════════════════════
CREATE TABLE messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT,
  message      TEXT NOT NULL,
  project_type TEXT,
  is_read      BOOLEAN DEFAULT false,
  is_archived  BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_tenant_id ON messages(tenant_id);
CREATE INDEX idx_messages_is_read ON messages(is_read) WHERE is_read = false;
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- ════════════════════════════════════════
-- TABLE: media_items
-- ════════════════════════════════════════
-- เก็บ metadata ของไฟล์ที่ upload ไว้ใน Supabase Storage
CREATE TABLE media_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  filename      TEXT NOT NULL,
  storage_path  TEXT NOT NULL,            -- path ใน Supabase Storage bucket
  public_url    TEXT NOT NULL,
  mime_type     TEXT NOT NULL,
  size          INTEGER NOT NULL,         -- bytes
  width         INTEGER,                  -- ถ้าเป็นรูปภาพ
  height        INTEGER,
  alt_text      JSONB,                    -- {"th": "...", "en": "..."}
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_items_tenant_id ON media_items(tenant_id);
CREATE INDEX idx_media_items_created_at ON media_items(created_at DESC);

-- ════════════════════════════════════════
-- TABLE: revisions
-- ════════════════════════════════════════
-- Auto-revision สำหรับ projects และ articles
-- เก็บ snapshot ของ content ก่อน UPDATE
CREATE TABLE revisions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  TEXT NOT NULL,             -- 'project' | 'article'
  entity_id    UUID NOT NULL,
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  version      INTEGER NOT NULL,
  content      JSONB NOT NULL,            -- snapshot ของ row ทั้งหมด
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_revisions_entity ON revisions(entity_type, entity_id);
CREATE INDEX idx_revisions_created_at ON revisions(created_at DESC);

-- ════════════════════════════════════════
-- TABLE: audit_logs
-- ════════════════════════════════════════
-- บันทึก destructive actions: delete, publish, unpublish
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,              -- 'delete' | 'publish' | 'unpublish' | 'archive'
  entity_type TEXT NOT NULL,             -- 'project' | 'article' | 'media' | 'message'
  entity_id   UUID,
  metadata    JSONB,                      -- เพิ่มเติม (เช่น title ตอน delete)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ════════════════════════════════════════
-- TRIGGER: Auto-revision สำหรับ projects
-- ════════════════════════════════════════
CREATE OR REPLACE FUNCTION create_revision()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
  max_revisions CONSTANT INTEGER := 50;
BEGIN
  -- หา version ถัดไป
  SELECT COALESCE(MAX(version), 0) + 1
  INTO next_version
  FROM revisions
  WHERE entity_id = OLD.id AND entity_type = TG_ARGV[0];

  -- Insert revision (snapshot ของ row ก่อน update)
  INSERT INTO revisions (entity_type, entity_id, tenant_id, version, content)
  VALUES (
    TG_ARGV[0],
    OLD.id,
    OLD.tenant_id,
    next_version,
    row_to_json(OLD)::jsonb
  );

  -- Prune: ลบ revision เก่าสุดถ้า count เกิน max_revisions
  DELETE FROM revisions
  WHERE entity_id = OLD.id
    AND entity_type = TG_ARGV[0]
    AND version <= (next_version - max_revisions);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger บน projects
CREATE TRIGGER projects_revision
  AFTER UPDATE ON projects
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content)  -- เฉพาะเมื่อ content เปลี่ยน
  EXECUTE FUNCTION create_revision('project');

-- Trigger บน articles
CREATE TRIGGER articles_revision
  AFTER UPDATE ON articles
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content)
  EXECUTE FUNCTION create_revision('article');
```

### Migration 005 — RLS Policies

```sql
-- supabase/migrations/005_rls_policies.sql
-- RLS Policies สำหรับ ทุก table (core + content + support)

-- ════════════════════════════════════════
-- HELPER FUNCTIONS (security definer)
-- ════════════════════════════════════════
-- ใช้ SECURITY DEFINER เพื่อให้ query users table ได้โดยไม่ต้อง recursive RLS
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ════════════════════════════════════════
-- RLS: tenants (migration 002 — เพิ่ม RLS)
-- ════════════════════════════════════════
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_select" ON tenants
  FOR SELECT USING (
    is_super_admin()
    OR id = get_user_tenant_id()
  );

CREATE POLICY "tenants_super_admin_all" ON tenants
  FOR ALL USING (is_super_admin());

-- ════════════════════════════════════════
-- RLS: users (migration 002)
-- ════════════════════════════════════════
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- user เห็นตัวเองเสมอ
CREATE POLICY "users_select_self" ON users
  FOR SELECT USING (id = auth.uid());

-- super_admin เห็นทุกคน
CREATE POLICY "users_super_admin_all" ON users
  FOR ALL USING (is_super_admin());

-- admin เห็น users ใน tenant เดียวกัน
CREATE POLICY "users_select_same_tenant" ON users
  FOR SELECT USING (
    tenant_id = get_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ════════════════════════════════════════
-- RLS: site_settings (migration 002)
-- ════════════════════════════════════════
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings_tenant_isolation" ON site_settings
  FOR ALL USING (
    is_super_admin()
    OR tenant_id = get_user_tenant_id()
  );

-- ════════════════════════════════════════
-- MACRO PATTERN สำหรับ content tables
-- ════════════════════════════════════════
-- Pattern เดียวกันใช้กับ: categories, projects, articles, pages, messages, media_items

-- categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_tenant_isolation" ON categories
  FOR ALL USING (
    is_super_admin()
    OR tenant_id = get_user_tenant_id()
  );

-- projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_tenant_isolation" ON projects
  FOR ALL USING (
    is_super_admin()
    OR tenant_id = get_user_tenant_id()
  );

-- articles
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "articles_tenant_isolation" ON articles
  FOR ALL USING (
    is_super_admin()
    OR tenant_id = get_user_tenant_id()
  );

-- pages
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pages_tenant_isolation" ON pages
  FOR ALL USING (
    is_super_admin()
    OR tenant_id = get_user_tenant_id()
  );

-- messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_tenant_isolation" ON messages
  FOR ALL USING (
    is_super_admin()
    OR tenant_id = get_user_tenant_id()
  );

-- PUBLIC INSERT: contact form endpoint เขียน messages ได้โดยไม่ต้อง auth
-- (anon role จาก Supabase public client)
CREATE POLICY "messages_public_insert" ON messages
  FOR INSERT WITH CHECK (true);

-- media_items
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_items_tenant_isolation" ON media_items
  FOR ALL USING (
    is_super_admin()
    OR tenant_id = get_user_tenant_id()
  );

-- revisions
ALTER TABLE revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revisions_tenant_isolation" ON revisions
  FOR ALL USING (
    is_super_admin()
    OR tenant_id = get_user_tenant_id()
  );

-- audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_tenant_isolation" ON audit_logs
  FOR ALL USING (
    is_super_admin()
    OR tenant_id = get_user_tenant_id()
  );

-- Service role bypass: Supabase service role key bypass RLS อัตโนมัติ
-- ไม่ต้องสร้าง policy พิเศษสำหรับ service role
```

### Migration 006 — เพิ่มเติม Indexes

```sql
-- supabase/migrations/006_indexes.sql
-- Performance indexes สำหรับ query patterns ที่ใช้บ่อย

-- Partial index: list projects ที่ไม่ถูก soft delete
CREATE INDEX idx_projects_active
  ON projects(tenant_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_articles_active
  ON articles(tenant_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Partial index: published content สำหรับ Public API
CREATE INDEX idx_projects_published
  ON projects(tenant_id, published_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;

CREATE INDEX idx_articles_published
  ON articles(tenant_id, published_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;

-- Messages unread count (dashboard stats)
CREATE INDEX idx_messages_unread
  ON messages(tenant_id)
  WHERE is_read = false;

-- Slug lookups (Public API: GET /api/public/[tenant]/projects/[slug])
CREATE INDEX idx_projects_slug ON projects(tenant_id, slug);
CREATE INDEX idx_articles_slug ON articles(tenant_id, slug);
```

### โครงสร้าง JSONB Multi-locale

Story 2.1 เปลี่ยน schema จาก `title_th` / `title_en` (flat columns) เป็น JSONB locale object:

```
-- ❌ แบบเดิม (PROJECT_PLAN.md — เก่า)
title_th TEXT,
title_en TEXT,

-- ✅ แบบใหม่ (architecture.md — ถูกต้อง)
title JSONB,   -- {"th": "...", "en": "..."}
```

**เหตุผล:**
- รองรับ locale เพิ่มในอนาคตได้โดยไม่ต้อง migrate schema
- Consistent กับ `name`, `content`, `seo_title` ที่เป็น JSONB อยู่แล้ว
- `src/lib/i18n.ts` helper `getLocaleValue(field, locale)` ทำงานกับ pattern นี้

### Public API RLS — `messages_public_insert`

```
ข้อควรระวัง: messages table มี 2 policies:
1. "messages_tenant_isolation" — FOR ALL: admin/editor เห็นแค่ tenant ตัวเอง
2. "messages_public_insert" — FOR INSERT WITH CHECK (true): anon user เพิ่มได้

Policy 2 ทำให้ contact form endpoint เขียน messages ได้โดยไม่ต้องมี auth session
แต่ SELECT/UPDATE/DELETE ยังถูก protect ด้วย Policy 1
```

### Generate TypeScript Types

หลัง migration รันแล้ว:

```bash
# Project ref: pogjddbskyjukjnpndqx
npx supabase gen types typescript \
  --project-id pogjddbskyjukjnpndqx \
  > src/types/database.types.ts
```

จากนั้นอัปเดต `src/types/tenant.ts`:

```typescript
// src/types/tenant.ts
export type ContentStatus = 'draft' | 'published' | 'archived'
export type UserRole = 'super_admin' | 'admin' | 'editor'
export type CategoryType = 'project' | 'article'
export type PageType = 'home' | 'about' | 'contact'
export type SupportedLocale = 'th' | 'en'

export type LocaleContent = Partial<Record<SupportedLocale, string>>
export type LocaleJsonContent = Partial<Record<SupportedLocale, Record<string, unknown>>>  // Tiptap JSON

export type FeatureFlags = {
  projects?: boolean
  blog?: boolean
  messages?: boolean
}
```

### ข้อควรระวังสำหรับ Dev Agent

#### 1. `update_updated_at` function มีอยู่แล้ว
Migration 002 สร้าง `update_updated_at()` function ไว้แล้ว  
→ Migration 003/004 ใช้ function นี้ได้เลย **ห้ามสร้างใหม่ซ้ำ** (จะ error)

#### 2. content_status enum มีอยู่แล้ว
Migration 001 สร้าง `content_status` enum ไว้แล้ว  
→ Migration 003 ใช้ `content_status` ได้เลย ห้าม `CREATE TYPE` ซ้ำ

#### 3. Supabase RLS + service role
`createServiceRoleClient()` bypass RLS อัตโนมัติ → ไม่ต้องสร้าง special policy สำหรับ service role  
RLS เป็น safety net สำหรับ `createServerClient()` (user session)

#### 4. Schema naming: title JSONB ไม่ใช่ title_th / title_en
architecture.md ใช้ JSONB locale pattern → story นี้ตามนั้น  
Dashboard query ใน Story 1.5 (`title_th`, `title_en`) **ต้องแก้ด้วย** เป็น `title->>'th'` หรือแก้ select เป็น `title`

#### 5. Supabase project ref
`pogjddbskyjukjnpndqx` — ใช้สำหรับ gen types และ MCP operations

#### 6. `messages_public_insert` policy
Policy นี้ allow anonymous insert → **จำเป็น** สำหรับ contact form public endpoint (Epic 4)  
ต้องระวังว่าไม่ expose sensitive fields ใน SELECT policy ผ่าน Public API

### Key Learnings จาก Story 1.x

| ประเด็น | การจัดการ |
|---------|-----------|
| vitest@2.1.9 + happy-dom | Unit tests ยังใช้ pattern เดิม |
| cookies() ใน Next.js 15 | `await cookies()` (async) |
| Migration รันผ่าน Supabase MCP | `mcp__supabase__apply_migration` |
| dashboard stats แสดง `—` | ตาราง projects/articles/messages ยังไม่มีจนกว่า story นี้จะ done |

### References

- FR-CONTENT-1 to FR-19: Projects CRUD requirements
- FR-CONTENT-20 to FR-25: Articles requirements
- FR-26 to FR-31: Messages requirements
- FR-32 to FR-38: Media Library requirements
- FR-39 to FR-41: Categories requirements
- FR-46 to FR-48: Content Safety (revisions, audit logs)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure]
- [Source: PROJECT_PLAN.md#Database Schema]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `npx supabase gen types` ต้องการ access token — ใช้ `mcp__supabase__generate_typescript_types` แทน
- `src/lib/audit.ts` ใช้ `metadata?: Record<string, unknown>` ไม่ตรงกับ `Json` type ใหม่ — แก้เป็น `metadata?: Json`
- TypeScript errors ที่เหลือ (resend, upstash, supabaseAdmin) เป็น pre-existing จาก stories ก่อนหน้า ไม่ใช่จาก story นี้

### Completion Notes List

- ✅ Migration 003: สร้าง categories, projects, articles, pages + enums (category_type, page_type) + triggers + indexes + Twodesk seed data (4 categories, 3 pages)
- ✅ Migration 004: สร้าง messages, media_items, revisions, audit_logs + create_revision() trigger function พร้อม auto-prune (max 50 versions)
- ✅ Migration 005: RLS บน 11 tables ครบ — helper functions get_user_tenant_id() + is_super_admin() ด้วย SECURITY DEFINER; messages มี 2 policies (tenant isolation + public insert สำหรับ contact form)
- ✅ Migration 006: Partial indexes สำหรับ soft-delete, published content, unread messages + slug lookup indexes
- ✅ Migrations รันผ่าน Supabase MCP สำเร็จทั้ง 4 migrations; verified tables 11 tables พร้อม RLS
- ✅ database.types.ts generated ผ่าน MCP พร้อม Constants ครบทุก enum
- ✅ tenant.ts: export ContentStatus, UserRole, CategoryType, PageType, LocaleContent, LocaleJsonContent, FeatureFlags
- ✅ audit.ts: แก้ metadata type จาก Record<string, unknown> เป็น Json
- ✅ 126 tests pass (14 files) — เพิ่ม 20 tests ใหม่สำหรับ new types

### File List

- `supabase/migrations/003_content_tables.sql` (new)
- `supabase/migrations/004_support_tables.sql` (new)
- `supabase/migrations/005_rls_policies.sql` (new)
- `supabase/migrations/006_indexes.sql` (new)
- `src/types/database.types.ts` (modified — full regeneration with new tables)
- `src/types/tenant.ts` (modified — added ContentStatus, UserRole, CategoryType, PageType, LocaleJsonContent, FeatureFlags)
- `src/lib/audit.ts` (modified — metadata type fix: Record<string,unknown> → Json)
- `src/test/types/database.types.test.ts` (modified — added tests for category_type, page_type enums)
- `src/test/types/tenant.test.ts` (modified — added tests for new exported types)

### Change Log

- 2026-04-09: Story 2.1 implemented — migrations 003-006 รันบน Supabase; TypeScript types regenerated; tenant types updated; 126 tests pass
