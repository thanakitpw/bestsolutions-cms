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
