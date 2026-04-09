# Best Solutions CMS — Project Plan

> Multi-tenant Headless CMS สำหรับ Best Solutions Agency
> อัปเดตล่าสุด: 2026-04-08
> ⚠️ **สถานะ: Planning phase — ยังไม่มี codebase** (ไม่มี package.json, src/, หรือโค้ดใดๆ)

---

## ภาพรวม

**Best Solutions CMS** คือระบบจัดการเนื้อหากลาง (Centralized CMS) ที่ออกแบบมาเพื่อรองรับหลาย client ในคราวเดียว แต่ละ client (tenant) มีข้อมูลแยกจากกันสนิท บริหารจัดการผ่าน UI เดียวกัน

### ปัญหาที่แก้
- ทุกโปรเจคลูกค้าต้องสร้าง admin panel ใหม่ทุกครั้ง → เสียเวลา
- แต่ละโปรเจคมี codebase แยก → maintain ยาก
- ไม่มี central place จัดการทุก client

### วิธีแก้
```
[bestsolutions-cms]  ← Admin UI + API (โปรเจคนี้)
         ↓ API
[Twodesk Frontend]   [De Beau Frontend]   [Client C Frontend]
```

---

## Tech Stack

| Layer | เทคโนโลยี | เหตุผล |
|-------|-----------|--------|
| Framework | Next.js 15 (App Router) | SSR + API Routes ในที่เดียว |
| Styling | Tailwind CSS + shadcn/ui | Design system พร้อมใช้ |
| Database | Supabase (PostgreSQL) | Auth + RLS built-in |
| Auth | Supabase Auth | JWT + session management |
| Storage | Supabase Storage | Media upload + RLS per tenant |
| Rich Text | Tiptap | Headless editor ยืดหยุ่นสูง |
| Email | Resend | Email notification |
| Deploy | Vercel | Auto deploy จาก GitHub |
| Migrations | Supabase CLI (`supabase/migrations/`) | Version-controlled schema changes |

---

## สถาปัตยกรรม Multi-Tenant

### Strategy: Row-Level Security (RLS)
- DB เดียว, schema เดียว
- ทุก table มี `tenant_id` column
- Supabase RLS บังคับให้ user เห็นแค่ข้อมูล tenant ของตัวเอง
- Super Admin (Best Solutions) เห็นได้ทุก tenant

### Feature Flags per Tenant
- แต่ละ tenant เปิด/ปิด feature ได้ เช่น projects, blog, messages
- Admin UI ซ่อน/แสดง menu ตาม `enabled_features`
- ภาษาที่รองรับกำหนดผ่าน `supported_locales` per tenant

### Subdomain Routing (อนาคต)
```
twodesk.cms.bestsolutions.co.th  → tenant: twodesk
debeau.cms.bestsolutions.co.th   → tenant: debeau
```

---

## Database Schema

> ⚠️ Schema ด้านล่างเป็น **design** ยังไม่ได้สร้างใน database จริง
> Migration files จะอยู่ที่ `supabase/migrations/` (ยังไม่ได้สร้าง)

### Enums
```sql
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'editor');
```

### Slug validation (ใช้กับทุก table ที่มี slug)
```sql
-- slug ต้องเป็น lowercase alphanumeric + hyphens, ความยาว 1-200 ตัวอักษร
-- ใช้เป็น CHECK constraint ในทุก table ที่มี slug column
-- Pattern: ^[a-z0-9]+(?:-[a-z0-9]+)*$
ALTER TABLE categories ADD CONSTRAINT chk_categories_slug
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 200);
ALTER TABLE projects ADD CONSTRAINT chk_projects_slug
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 200);
ALTER TABLE articles ADD CONSTRAINT chk_articles_slug
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 200);
ALTER TABLE pages ADD CONSTRAINT chk_pages_slug
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 200);
```
> **Slug generation:** Admin UI จะ auto-generate slug จาก title (th) ผ่าน transliterate → slugify แต่ user สามารถแก้เองได้ ต้อง validate ทั้ง client-side และ DB constraint

### Auto-update trigger function (ใช้กับทุก table ที่มี updated_at)
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ตัวอย่างการผูก trigger (ต้องสร้างให้ทุก table ที่มี updated_at)
-- CREATE TRIGGER set_updated_at BEFORE UPDATE ON projects
--   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### tenants
```sql
CREATE TABLE tenants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,              -- "Twodesk Studio"
  slug              TEXT UNIQUE NOT NULL,       -- "twodesk"
  domain            TEXT,                       -- "twodesk.cms.bestsolutions.co.th"
  logo_url          TEXT,
  plan              TEXT DEFAULT 'standard',    -- standard | pro
  supported_locales TEXT[] DEFAULT '{th}',      -- {"th"} | {"th","en"}
  default_locale    TEXT DEFAULT 'th',
  enabled_features  TEXT[] DEFAULT '{projects,blog,messages}',
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### users
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  tenant_id   UUID REFERENCES tenants(id),     -- NULL = super_admin (ไม่ผูก tenant)
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        user_role DEFAULT 'editor', -- super_admin | admin | editor (ENUM บังคับค่าที่ถูกต้อง)
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### categories (per tenant — แต่ละ tenant กำหนดเอง)
```sql
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        JSONB NOT NULL,          -- {"th": "คาเฟ่", "en": "Cafe"}
  slug        TEXT NOT NULL,
  type        TEXT NOT NULL,           -- "project" | "article"
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug, type)
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### projects
```sql
CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  title           JSONB,                 -- {"th": "...", "en": "..."}
  slug            TEXT NOT NULL,
  description     JSONB,                 -- {"th": "...", "en": "..."}
  content         JSONB,                 -- {"th": {Tiptap JSON}, "en": {Tiptap JSON}}
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  location        JSONB,                 -- {"th": "...", "en": "..."}
  area            TEXT,
  year            INTEGER,
  cover_image     TEXT,
  gallery         TEXT[],
  status          content_status DEFAULT 'draft',
  seo_title       JSONB,                 -- {"th": "...", "en": "..."} ← JSONB multi-locale
  seo_description JSONB,                 -- {"th": "...", "en": "..."} ← JSONB multi-locale
  seo_keywords    JSONB,                 -- {"th": ["..."], "en": ["..."]}
  published_at    TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ,           -- soft delete (NULL = ยังอยู่)
  created_by      UUID REFERENCES users(id),
  updated_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug),
  CONSTRAINT chk_projects_content_size CHECK (pg_column_size(content) <= 5242880) -- max 5MB per content field
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### articles
```sql
CREATE TABLE articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  title           JSONB,                 -- {"th": "...", "en": "..."}
  slug            TEXT NOT NULL,
  excerpt         JSONB,                 -- {"th": "...", "en": "..."}
  content         JSONB,                 -- {"th": {Tiptap JSON}, "en": {Tiptap JSON}}
  cover_image     TEXT,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  status          content_status DEFAULT 'draft',
  seo_title       JSONB,                 -- {"th": "...", "en": "..."} ← JSONB multi-locale
  seo_description JSONB,                 -- {"th": "...", "en": "..."} ← JSONB multi-locale
  seo_keywords    JSONB,                 -- {"th": ["..."], "en": ["..."]}
  published_at    TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ,           -- soft delete (NULL = ยังอยู่)
  created_by      UUID REFERENCES users(id),
  updated_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug),
  CONSTRAINT chk_articles_content_size CHECK (pg_column_size(content) <= 5242880) -- max 5MB per content field
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### messages
```sql
CREATE TABLE messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT,
  message      TEXT NOT NULL,
  project_type TEXT,
  is_read      BOOLEAN DEFAULT false,
  is_archived  BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### media
```sql
CREATE TABLE media (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  filename     TEXT NOT NULL,
  storage_path TEXT NOT NULL,             -- path ใน Supabase Storage bucket เช่น "twodesk/images/abc.jpg"
  url          TEXT NOT NULL,             -- public URL (ใช้ Supabase Storage public bucket per tenant)
  mime_type    TEXT,
  size         INTEGER,
  alt_text     JSONB,                     -- {"th": "...", "en": "..."}
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```
> **Media URL strategy:** ใช้ Supabase Storage **public bucket** แยก folder per tenant (`{tenant_slug}/`)
> URL ที่เก็บเป็น public URL ถาวร — เหมาะกับ CMS ที่ต้อง serve รูปให้ frontend โดยตรง
> RLS ควบคุมการ upload/delete ผ่าน Storage policies, ไม่ใช่ผ่าน signed URL
> เมื่อลบ media record → ต้องลบไฟล์จาก Storage ด้วย (ผ่าน DB trigger หรือ application logic)

### media_usages (junction — ติดตามว่า media ใช้ที่ไหน)
```sql
CREATE TABLE media_usages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id    UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,            -- "project" | "article" | "page"
  entity_id   UUID NOT NULL,
  field       TEXT NOT NULL,            -- "cover_image" | "gallery" | "content"
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_usages_media ON media_usages(media_id);
CREATE INDEX idx_media_usages_entity ON media_usages(entity_type, entity_id);
```
> **Orphan cleanup:** เนื่องจาก `entity_id` เป็น polymorphic reference (ไม่มี FK จริง)
> ต้องสร้าง cleanup trigger บน projects/articles/pages — เมื่อ soft delete (set deleted_at) หรือ hard delete
> ให้ลบ media_usages ที่ reference entity นั้นด้วย
> ทำเป็น `AFTER UPDATE` trigger (เมื่อ deleted_at เปลี่ยนจาก NULL → มีค่า) + `AFTER DELETE` trigger
> หรือใช้ scheduled job cleanup orphans สัปดาห์ละครั้ง

### pages (dynamic — แต่ละ tenant สร้างได้ไม่จำกัด)
```sql
CREATE TABLE pages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  title           JSONB,                 -- {"th": "...", "en": "..."}
  slug            TEXT NOT NULL,         -- "home", "about", "services", etc.
  content         JSONB,                 -- {"th": {Tiptap JSON}, "en": {Tiptap JSON}}
  template_type   TEXT DEFAULT 'default', -- "default" | "home" | "contact"
  sort_order      INTEGER DEFAULT 0,
  status          content_status DEFAULT 'draft',
  seo_title       JSONB,                 -- {"th": "...", "en": "..."} ← JSONB multi-locale
  seo_description JSONB,                 -- {"th": "...", "en": "..."} ← JSONB multi-locale
  deleted_at      TIMESTAMPTZ,           -- soft delete (NULL = ยังอยู่)
  created_by      UUID REFERENCES users(id),
  updated_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug),
  CONSTRAINT chk_pages_content_size CHECK (pg_column_size(content) <= 5242880) -- max 5MB per content field
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### site_settings (structured JSONB แทน key-value)
```sql
CREATE TABLE site_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) UNIQUE, -- 1 row per tenant
  -- General
  site_name   JSONB,                    -- {"th": "...", "en": "..."}
  tagline     JSONB,                    -- {"th": "...", "en": "..."}
  logo_url    TEXT,
  favicon_url TEXT,
  -- Contact
  contact_email TEXT,
  contact_phone TEXT,
  address     JSONB,                    -- {"th": "...", "en": "..."}
  -- Social
  social_links JSONB DEFAULT '{}',      -- {"facebook": "...", "instagram": "..."}
  -- SEO defaults
  default_seo JSONB DEFAULT '{}',       -- {"title": {"th":"...","en":"..."}, "description": {...}}
  -- Custom (สำหรับ tenant-specific settings)
  custom      JSONB DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  UUID REFERENCES users(id)
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### content_revisions (audit trail + version history)
```sql
CREATE TABLE content_revisions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  entity_type TEXT NOT NULL,            -- "project" | "article" | "page"
  entity_id   UUID NOT NULL,
  action      TEXT NOT NULL DEFAULT 'update', -- "create" | "update" | "delete"
  data        JSONB NOT NULL,           -- snapshot ของ row ทั้งหมด ณ เวลานั้น
  changed_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_revisions_entity ON content_revisions(entity_type, entity_id, created_at DESC);
```

#### Retention policy (บังคับ — ไม่ใช่แค่แนะนำ)
```sql
-- Trigger: หลัง INSERT revision ใหม่ → ลบ revision เก่าที่เกินลำดับที่ 50
CREATE OR REPLACE FUNCTION prune_old_revisions()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM content_revisions
  WHERE id IN (
    SELECT id FROM content_revisions
    WHERE entity_type = NEW.entity_type AND entity_id = NEW.entity_id
    ORDER BY created_at DESC
    OFFSET 50
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prune_revisions AFTER INSERT ON content_revisions
  FOR EACH ROW EXECUTE FUNCTION prune_old_revisions();
```

### audit_logs (สำหรับ destructive actions — แยกจาก content_revisions)
```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id),  -- NULL = system-level action
  user_id     UUID REFERENCES users(id),
  action      TEXT NOT NULL,                 -- "delete_project" | "delete_article" | "delete_media" | "update_role" | ...
  entity_type TEXT,                          -- "project" | "article" | "page" | "media" | "user"
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}',            -- รายละเอียดเพิ่มเติม เช่น title ที่ถูกลบ
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
```
> **audit_logs** เก็บ destructive/sensitive actions ทั้งหมด: delete, role changes, tenant management
> ไม่มีใครลบ audit_logs ได้ยกเว้น super_admin (RLS enforced) — เป็น immutable log

---

## RLS Policies

> ทุก table ที่มี `tenant_id` ต้องเปิด RLS และมี policy ครบทั้ง SELECT, INSERT, UPDATE, DELETE

### Helper function
```sql
-- ⚠️ Performance: ใช้ JWT claims แทน subquery เพื่อหลีกเลี่ยง per-row lookup
-- ตอน user login → set custom claims ใน JWT: { tenant_id, role }
-- ถ้ายังไม่ได้ set custom claims → fallback ไป query users table

-- ดึง tenant_id ของ user ปัจจุบัน (NULL = super_admin)
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  -- ลอง JWT claim ก่อน (เร็ว — ไม่ต้อง query)
  IF current_setting('request.jwt.claims', true)::jsonb ? 'tenant_id' THEN
    RETURN (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid;
  END IF;
  -- Fallback: query users table
  RETURN (SELECT tenant_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- เช็คว่า user เป็น super_admin หรือไม่
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- ลอง JWT claim ก่อน
  IF current_setting('request.jwt.claims', true)::jsonb ? 'role' THEN
    RETURN (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'super_admin';
  END IF;
  -- Fallback: query users table
  RETURN EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```
> **Custom JWT Claims:** ต้องสร้าง Supabase hook (หรือ trigger on auth.users) ที่ set `tenant_id` + `role`
> ลงใน `raw_app_meta_data` → Supabase จะใส่ใน JWT claims อัตโนมัติ
> ทำให้ RLS ไม่ต้อง query `users` table ทุก row — ดีขึ้นมากใน large datasets

### ตัวอย่าง policy ครบชุด (ใช้ pattern เดียวกันกับทุก table)
```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- SELECT: เห็นแค่ tenant ตัวเอง หรือทั้งหมดถ้าเป็น super_admin
CREATE POLICY "tenant_select" ON projects FOR SELECT
  USING (
    is_super_admin() OR tenant_id = get_user_tenant_id()
  );

-- INSERT: สร้างได้เฉพาะใน tenant ตัวเอง
CREATE POLICY "tenant_insert" ON projects FOR INSERT
  WITH CHECK (
    is_super_admin() OR tenant_id = get_user_tenant_id()
  );

-- UPDATE: แก้ได้เฉพาะใน tenant ตัวเอง
CREATE POLICY "tenant_update" ON projects FOR UPDATE
  USING (
    is_super_admin() OR tenant_id = get_user_tenant_id()
  )
  WITH CHECK (
    is_super_admin() OR tenant_id = get_user_tenant_id()
  );

-- DELETE: ลบได้เฉพาะ admin ขึ้นไป + tenant ตัวเอง
CREATE POLICY "tenant_delete" ON projects FOR DELETE
  USING (
    is_super_admin() OR (
      tenant_id = get_user_tenant_id()
      AND (current_setting('request.jwt.claims', true)::jsonb ->> 'role') IN ('admin', 'super_admin')
    )
  );
```

### Tables ที่ต้องมี RLS (ทั้งหมด)
| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| tenants | super_admin only | super_admin only | super_admin only | super_admin only |
| users | tenant + super_admin | admin + super_admin | own row + admin | super_admin only |
| categories | tenant + super_admin | tenant + super_admin | tenant + super_admin | tenant admin + super_admin |
| projects | tenant + super_admin | tenant + super_admin | tenant + super_admin | tenant admin + super_admin |
| articles | tenant + super_admin | tenant + super_admin | tenant + super_admin | tenant admin + super_admin |
| messages | tenant + super_admin | **public** (contact form) | tenant + super_admin | tenant admin + super_admin |
| media | tenant + super_admin | tenant + super_admin | tenant + super_admin | tenant admin + super_admin |
| media_usages | tenant + super_admin | tenant + super_admin | tenant + super_admin | tenant + super_admin |
| pages | tenant + super_admin | tenant + super_admin | tenant + super_admin | tenant admin + super_admin |
| site_settings | tenant + super_admin | super_admin only | tenant admin + super_admin | super_admin only |
| content_revisions | tenant + super_admin | tenant + super_admin | ❌ immutable | super_admin only |
| audit_logs | tenant + super_admin | system only (via service_role) | ❌ immutable | super_admin only |

> **Soft delete:** tables ที่มี `deleted_at` (projects, articles, pages) — RLS SELECT policy ต้องเพิ่มเงื่อนไข `deleted_at IS NULL`
> เพื่อซ่อน soft-deleted records จาก normal queries Admin สามารถ query รวม deleted ได้ผ่าน explicit filter

---

## โครงสร้างโปรเจค (แผน — ยังไม่ได้สร้าง)

```
bestsolutions-cms/
├── supabase/
│   ├── migrations/              # Version-controlled SQL migrations
│   │   ├── 00001_create_enums.sql
│   │   ├── 00002_create_tenants.sql
│   │   ├── 00003_create_users.sql
│   │   ├── 00004_create_content_tables.sql
│   │   ├── 00005_create_media_tables.sql
│   │   ├── 00006_create_settings.sql
│   │   ├── 00007_create_revisions.sql
│   │   ├── 00008_create_triggers.sql
│   │   ├── 00009_enable_rls.sql
│   │   ├── 00010_create_audit_logs.sql
│   │   └── 00011_create_slug_constraints.sql
│   ├── seed.sql                 # Dev/staging seed data (Twodesk tenant + admin user)
│   ├── seed.prod.sql            # Production seed (tenant เท่านั้น, ไม่มี test data)
│   └── config.toml
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # Protected pages (มี sidebar)
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── layout.tsx
│   │   │   ├── projects/
│   │   │   ├── blog/
│   │   │   ├── messages/
│   │   │   ├── media/
│   │   │   ├── pages/
│   │   │   ├── settings/
│   │   │   └── analytics/
│   │   ├── login/                # Login page
│   │   ├── api/                  # Admin API routes (auth required)
│   │   │   ├── projects/
│   │   │   ├── articles/
│   │   │   ├── messages/
│   │   │   ├── media/
│   │   │   ├── settings/
│   │   │   └── auth/
│   │   ├── api/public/           # Public API (rate-limited)
│   │   │   └── [tenant]/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── admin/               # Sidebar, TopBar, etc.
│   │   └── ui/                  # shadcn components
│   ├── lib/
│   │   ├── supabase/            # client, server, admin
│   │   ├── tenant.ts            # getTenantId() helper
│   │   ├── rate-limit.ts        # Rate limiter (Upstash/in-memory)
│   │   ├── audit.ts             # logAudit() helper — เขียน audit_logs
│   │   └── slugify.ts           # Thai-safe slug generation
│   └── middleware.ts             # Auth middleware + admin rate limiting
├── __tests__/
│   ├── rls/                     # RLS policy tests (ต้องมี — ป้องกัน data leak ข้าม tenant)
│   ├── api/                     # API route tests
│   └── lib/                     # Unit tests for helpers
├── package.json
├── .env.local.example
└── CLAUDE.md
```

---

## Features ที่ต้องสร้าง

### MVP Definition — "ถ้ามีแค่นี้ก็ launch ได้"
> Twodesk Studio ใช้ CMS จัดการ projects + blog + messages ผ่าน admin UI ได้
> และ Twodesk frontend ดึงข้อมูลผ่าน Public API ได้

MVP ต้องมี: Phase 1 + Phase 2 (Projects, Blog, Messages, Media) + Phase 4 (Public API GET + contact) + Deploy
MVP ไม่ต้องมี: Multi-tenant management UI, Pages editor, Analytics, Subdomain routing

---

### Phase 1: Project Setup + DB Foundation ⏱ ~3 วัน
**Blocks:** ทุก Phase อื่น
**Deliverable:** Next.js project ที่ build ได้ + Supabase DB พร้อม schema + RLS tests ผ่าน

- [ ] `npx create-next-app@latest` + ติดตั้ง dependencies ทั้งหมด
- [ ] ตั้งค่า Tailwind CSS + shadcn/ui + Tiptap
- [ ] ตั้งค่า testing framework (Vitest + @supabase/supabase-js สำหรับ RLS tests)
- [ ] สร้าง Supabase project ใหม่ (แยกจาก Twodesk)
- [ ] สร้าง `supabase/migrations/` — SQL migration files ทั้งหมด
- [ ] รัน migrations สร้าง schema
- [ ] สร้าง `update_updated_at()` trigger function + ผูกทุก table
- [ ] สร้าง `prune_old_revisions()` trigger function สำหรับ retention policy
- [ ] เปิด RLS ทุก table + สร้าง policies ครบ (SELECT/INSERT/UPDATE/DELETE)
- [ ] สร้าง `get_user_tenant_id()` + `is_super_admin()` helper functions ใน DB (JWT claims optimized)
- [ ] Set up Supabase Auth hook สำหรับ custom JWT claims (`tenant_id`, `role`)
- [ ] สร้าง `audit_logs` table + RLS
- [ ] Seed: tenant "Twodesk Studio" + Super Admin user (ใน `seed.sql` แยกจาก migrations)
- [ ] **เขียน RLS tests:** ทดสอบว่า tenant A เห็นแค่ข้อมูลตัวเอง, ไม่เห็นของ tenant B
- [ ] **เขียน RLS tests:** ทดสอบ soft delete — deleted records ไม่โชว์ใน normal SELECT

### Phase 2: Admin UI ⏱ ~8 วัน
**Blocks:** Phase 4 (API design จะใช้ร่วมกัน)
**Depends on:** Phase 1

- [ ] Auth middleware (`src/middleware.ts`) + admin API rate limiting (100 req/min per user)
- [ ] Login page
- [ ] `getTenantId()` TypeScript helper
- [ ] `logAudit()` helper — เขียน audit_logs สำหรับ destructive actions
- [ ] `slugify()` helper — Thai-safe slug generation + validation
- [ ] Dashboard — stats + recent activity
- [ ] Projects CRUD (+ created_by/updated_by tracking + soft delete + audit log on delete)
- [ ] Blog/Articles CRUD (+ soft delete + audit log on delete)
- [ ] Messages inbox (read/archive)
- [ ] Media library (Supabase Storage + media_usages tracking + cleanup on delete)
- [ ] Categories management per tenant
- [ ] Content revision saving (auto-save snapshot ก่อน update, บันทึก action type: create/update/delete)
- [ ] Site settings page (structured form, ไม่ใช่ key-value)
- [ ] Pages editor (dynamic) — **ไม่อยู่ใน MVP แต่ทำถ้ามีเวลา**
- [ ] **เขียน API tests:** CRUD operations, permission checks, soft delete behavior

### Phase 3: Multi-Tenant Management ⏱ ~3 วัน
**Depends on:** Phase 2
**ไม่ block MVP** — Twodesk เป็น tenant เดียวตอน launch

- [ ] Super Admin page — จัดการ tenants ทั้งหมด
- [ ] เพิ่ม/ลบ tenant + auto-create site_settings row
- [ ] User management per tenant (invite/remove)
- [ ] Tenant onboarding checklist (required settings ที่ต้องตั้งค่า)
- [ ] Subdomain routing (อนาคต — ไม่ทำใน Phase นี้)

### Phase 4: Public API ⏱ ~3 วัน
**Depends on:** Phase 1 (DB), Phase 2 (API patterns)
**Deliverable:** Frontend ของ Twodesk เรียก API ได้

- [ ] `GET /api/public/[tenant]/projects` — list + detail, filter by status=published
- [ ] `GET /api/public/[tenant]/articles` — list + detail
- [ ] `GET /api/public/[tenant]/pages/[slug]` — single page
- [ ] `GET /api/public/[tenant]/settings` — site metadata
- [ ] `POST /api/public/[tenant]/contact` — **ต้องมี:**
  - Rate limiting (เช่น 5 req/min per IP via Upstash Redis หรือ in-memory)
  - Input validation (zod schema: name, email, message required)
  - Email format validation
  - Message length limit (max 5000 chars)
  - Optional: CAPTCHA integration (Turnstile/reCAPTCHA)
- [ ] **Pagination (ทุก list endpoint):**
  - Cursor-based pagination (ใช้ `created_at` + `id` เป็น cursor)
  - Default limit: 20, max limit: 100
  - Response format: `{ data: [...], next_cursor: "...", has_more: true }`
- [ ] Response caching strategy: `Cache-Control` headers + ISR/SWR
- [ ] **CORS configuration:**
  - อนุญาตเฉพาะ domain ที่ลงทะเบียนใน `tenants.domain`
  - ถ้า `tenants.domain` เป็น NULL → **deny CORS** (ไม่ allow all)
  - Tenant ต้องตั้งค่า domain ก่อนถึงจะเรียก Public API ข้าม origin ได้
  - Same-origin requests (SSR) ไม่ได้รับผลกระทบ
- [ ] **เขียน Public API tests:** pagination, CORS, rate limiting, contact validation

### Phase 5: Data Migration + Deploy ⏱ ~3 วัน
**Depends on:** Phase 2 + Phase 4

#### Data Migration Plan (Twodesk)
- [ ] Document Twodesk current DB schema (source)
- [ ] สร้าง migration script: `scripts/migrate-twodesk.ts`
  - Map flat TEXT fields → JSONB `{"th": "..."}` (ข้อมูลเดิมเป็นภาษาไทยทั้งหมด)
  - Map old category IDs → new UUIDs
  - Map old image URLs → Supabase Storage URLs (หรือ keep external URLs ชั่วคราว)
  - SEO fields: wrap existing TEXT → JSONB `{"th": "..."}`
- [ ] Dry-run migration ใน staging environment
- [ ] Rollback plan: export Twodesk data ก่อน migrate, keep old DB read-only 7 วัน

#### Deploy
- [ ] Deploy Vercel
- [ ] ตั้งค่า environment variables
- [ ] ตั้งค่า custom domain
- [ ] แก้ Twodesk frontend ให้ดึงจาก CMS Public API
- [ ] Verify: Twodesk frontend ทำงานได้ปกติ
- [ ] ตั้งค่า Supabase daily backup (Pro plan) + verify restore ทำงาน

---

### Phase Dependency Graph
```
Phase 1 (Setup + DB)          ~3 วัน
  ├── Phase 2 (Admin UI)      ~8 วัน
  │     ├── Phase 3 (Multi-tenant mgmt) ~3 วัน — ไม่ block MVP
  │     └── Phase 5 (Migration + Deploy) ~3 วัน
  └── Phase 4 (Public API)    ~3 วัน
        └── Phase 5 (Migration + Deploy)

MVP = Phase 1 → Phase 2 (core) + Phase 4 → Phase 5
รวม MVP: ~17 วันทำการ (มี buffer สำหรับ bugs + integration issues)
รวมทั้งหมด: ~20 วันทำการ (รวม Phase 3)
```

---

## Testing Strategy

> ⚠️ RLS ผิดแม้ตัวเดียว = data leak ข้าม tenant — **ต้องมี automated tests**

### ระดับ Testing

| ระดับ | เครื่องมือ | ขอบเขต | เมื่อไหร่ |
|-------|-----------|--------|----------|
| **RLS Integration Tests** | Vitest + Supabase JS client | ทุก table: tenant isolation, role-based access, soft delete visibility | Phase 1 — **ก่อนเขียน app code** |
| **API Route Tests** | Vitest + supertest/fetch | Admin CRUD + Public API: auth, validation, pagination, rate limiting | Phase 2 + Phase 4 |
| **Unit Tests** | Vitest | Helpers: slugify, getTenantId, audit logger | Phase 2 |
| **E2E Tests (optional, post-MVP)** | Playwright | Critical flows: login → create project → publish → verify via Public API | หลัง Deploy |

### RLS Test Pattern
```typescript
// ตัวอย่าง: ทดสอบ tenant isolation
describe('projects RLS', () => {
  it('tenant A ไม่เห็นข้อมูล tenant B', async () => {
    const clientA = createClient(SUPABASE_URL, ANON_KEY, { /* user A token */ });
    const clientB = createClient(SUPABASE_URL, ANON_KEY, { /* user B token */ });

    // User A สร้าง project
    await clientA.from('projects').insert({ tenant_id: tenantA_id, ... });

    // User B query → ต้องไม่เห็น
    const { data } = await clientB.from('projects').select('*');
    expect(data?.filter(p => p.tenant_id === tenantA_id)).toHaveLength(0);
  });

  it('soft deleted records ไม่โชว์ใน normal SELECT', async () => {
    // ...
  });
});
```

### Test Database
- ใช้ Supabase local dev (`supabase start`) สำหรับ test
- สร้าง test tenants + test users ใน `supabase/seed.sql`
- รัน migrations → seed → test → reset ก่อนทุก test suite

---

## Backup & Disaster Recovery

### Supabase Backup
- **Daily automated backups:** เปิดใช้งาน Supabase Pro plan daily backup (Point-in-Time Recovery)
- **Manual backup ก่อน deploy/migration:** `pg_dump` ผ่าน Supabase CLI ก่อนรัน migration ทุกครั้ง
- **Supabase Storage:** Media files ไม่ได้ backup อัตโนมัติ — ต้องสร้าง script sync ไป external storage (S3/R2) สัปดาห์ละครั้ง (post-MVP)

### Recovery Plan
| สถานการณ์ | วิธีกู้ | RTO |
|-----------|---------|-----|
| Accidental data deletion (single tenant) | Restore จาก content_revisions (update/create) หรือ audit_logs (delete metadata) | < 1 ชม. |
| Database corruption / full loss | Supabase Point-in-Time Recovery | < 4 ชม. |
| Supabase outage | รอ Supabase recover (ไม่มี hot standby ใน MVP) — พิจารณา read replica ในอนาคต | ขึ้นกับ Supabase |
| Media storage loss | Re-upload จาก external backup (post-MVP) หรือ original sources | 1-2 วัน |

### สิ่งที่ต้องทำ
- [ ] เปิด Supabase Pro plan daily backup
- [ ] สร้าง `scripts/backup.sh` — manual pg_dump script
- [ ] ทดสอบ restore procedure อย่างน้อย 1 ครั้งก่อน production launch
- [ ] (Post-MVP) สร้าง media sync script ไป external storage

---

## สถานะปัจจุบัน (2026-04-08)

> ⚠️ **โปรเจคอยู่ใน Planning phase — ยังไม่มีโค้ด**
> Directory มีเฉพาะไฟล์วางแผน: CLAUDE.md, PROJECT_PLAN.md

| Component | สถานะ | หมายเหตุ |
|-----------|-------|----------|
| Project Plan & Schema Design | ✅ | เอกสารนี้ |
| **Next.js project setup** | ❌ ยังไม่ได้สร้าง | ไม่มี package.json |
| **shadcn/ui + Tiptap** | ❌ ยังไม่ได้ติดตั้ง | |
| **Admin pages** | ❌ ยังไม่มี src/ | |
| **API routes** | ❌ | |
| **Auth middleware** | ❌ | |
| **Supabase DB** | ❌ รอ credentials | |
| **Migration files** | ❌ ยังไม่ได้สร้าง | |
| **RLS Policies** | ❌ | |
| **Multi-tenant logic** | ❌ | |
| **Public API** | ❌ | |
| **Deploy** | ❌ | |

---

## สิ่งที่ต้องทำก่อนอื่น

1. **สร้าง Supabase project ใหม่** (เจ้าของทำ)
2. แชร์ credentials มาให้:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Project ref (สำหรับ MCP)
3. `npx create-next-app@latest` — สร้าง Next.js project จริง
4. สร้าง `supabase/migrations/` — SQL migration files
5. รัน migrations + seed tenant "Twodesk" + admin user
6. เริ่ม Phase 2: Admin UI

---

## Client ที่จะใช้ระบบนี้ (แผน)

| Client | Status |
|--------|--------|
| Twodesk Studio | แผน — migrate จาก DB เดิม |
| De Beau Clinic | แผน |
| อื่นๆ | TBD |
