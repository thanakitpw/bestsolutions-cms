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
