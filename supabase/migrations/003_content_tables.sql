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
