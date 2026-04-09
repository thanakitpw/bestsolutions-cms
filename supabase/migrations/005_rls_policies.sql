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
-- RLS: categories
-- ════════════════════════════════════════
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_tenant_isolation" ON categories
  FOR ALL USING (
    is_super_admin()
    OR tenant_id = get_user_tenant_id()
  );

-- ════════════════════════════════════════
-- RLS: projects
-- ════════════════════════════════════════
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_tenant_isolation" ON projects
  FOR ALL USING (
    is_super_admin()
    OR tenant_id = get_user_tenant_id()
  );

-- ════════════════════════════════════════
-- RLS: articles
-- ════════════════════════════════════════
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "articles_tenant_isolation" ON articles
  FOR ALL USING (
    is_super_admin()
    OR tenant_id = get_user_tenant_id()
  );

-- ════════════════════════════════════════
-- RLS: pages
-- ════════════════════════════════════════
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pages_tenant_isolation" ON pages
  FOR ALL USING (
    is_super_admin()
    OR tenant_id = get_user_tenant_id()
  );

-- ════════════════════════════════════════
-- RLS: messages
-- ════════════════════════════════════════
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

-- ════════════════════════════════════════
-- RLS: media_items
-- ════════════════════════════════════════
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_items_tenant_isolation" ON media_items
  FOR ALL USING (
    is_super_admin()
    OR tenant_id = get_user_tenant_id()
  );

-- ════════════════════════════════════════
-- RLS: revisions
-- ════════════════════════════════════════
ALTER TABLE revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revisions_tenant_isolation" ON revisions
  FOR ALL USING (
    is_super_admin()
    OR tenant_id = get_user_tenant_id()
  );

-- ════════════════════════════════════════
-- RLS: audit_logs
-- ════════════════════════════════════════
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_tenant_isolation" ON audit_logs
  FOR ALL USING (
    is_super_admin()
    OR tenant_id = get_user_tenant_id()
  );

-- Service role bypass: Supabase service role key bypass RLS อัตโนมัติ
-- ไม่ต้องสร้าง policy พิเศษสำหรับ service role
