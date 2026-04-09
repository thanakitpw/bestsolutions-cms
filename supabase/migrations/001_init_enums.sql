-- supabase/migrations/001_init_enums.sql
-- Enums used across all content tables

CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'editor');
