-- supabase/migrations/004_support_tables.sql
-- Support tables: messages, media_items, revisions, audit_logs
-- Includes: revision trigger function + auto-prune

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
-- TRIGGER: Auto-revision สำหรับ projects และ articles
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

-- Trigger บน projects (เฉพาะเมื่อ content เปลี่ยน)
CREATE TRIGGER projects_revision
  AFTER UPDATE ON projects
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content)
  EXECUTE FUNCTION create_revision('project');

-- Trigger บน articles (เฉพาะเมื่อ content เปลี่ยน)
CREATE TRIGGER articles_revision
  AFTER UPDATE ON articles
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content)
  EXECUTE FUNCTION create_revision('article');
