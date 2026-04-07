# Best Solutions CMS — Project Plan

> Multi-tenant Headless CMS สำหรับ Best Solutions Agency
> อัปเดตล่าสุด: 2026-04-07

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
| Framework | Next.js 14 (App Router) | SSR + API Routes ในที่เดียว |
| Styling | Tailwind CSS + shadcn/ui | Design system พร้อมใช้ |
| Database | Supabase (PostgreSQL) | Auth + RLS built-in |
| Auth | Supabase Auth | JWT + session management |
| Storage | Supabase Storage หรือ Cloudinary | Media upload |
| Rich Text | Tiptap | Headless editor ยืดหยุ่นสูง |
| Email | Resend | Email notification |
| Deploy | Vercel | Auto deploy จาก GitHub |

---

## สถาปัตยกรรม Multi-Tenant

### Strategy: Row-Level Security (RLS)
- DB เดียว, schema เดียว
- ทุก table มี `tenant_id` column
- Supabase RLS บังคับให้ user เห็นแค่ข้อมูล tenant ของตัวเอง
- Super Admin (Best Solutions) เห็นได้ทุก tenant

### Subdomain Routing (อนาคต)
```
twodesk.cms.bestsolutions.co.th  → tenant: twodesk
debeau.cms.bestsolutions.co.th   → tenant: debeau
```

---

## Database Schema

### tenants
```sql
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,           -- "Twodesk Studio"
  slug        TEXT UNIQUE NOT NULL,    -- "twodesk"
  domain      TEXT,                    -- "twodesk.cms.bestsolutions.co.th"
  logo_url    TEXT,
  plan        TEXT DEFAULT 'standard', -- standard | pro
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### users
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  tenant_id   UUID REFERENCES tenants(id),
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT DEFAULT 'editor',   -- super_admin | admin | editor
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### projects
```sql
CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  title_en        TEXT,
  title_th        TEXT,
  slug            TEXT NOT NULL,
  description_en  TEXT,
  description_th  TEXT,
  content_en      JSONB,               -- Tiptap JSON
  content_th      JSONB,
  category        project_category,    -- commercial | cafe | residential | others
  location_en     TEXT,
  location_th     TEXT,
  area            TEXT,
  year            INTEGER,
  cover_image     TEXT,
  gallery         TEXT[],
  status          content_status DEFAULT 'draft',
  seo_title       TEXT,
  seo_description TEXT,
  seo_keywords    TEXT[],
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);
```

### articles
```sql
CREATE TABLE articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  title_en        TEXT,
  title_th        TEXT,
  slug            TEXT NOT NULL,
  excerpt_en      TEXT,
  excerpt_th      TEXT,
  content_en      JSONB,
  content_th      JSONB,
  cover_image     TEXT,
  category        TEXT,
  status          content_status DEFAULT 'draft',
  seo_title       TEXT,
  seo_description TEXT,
  seo_keywords    TEXT[],
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);
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
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  filename    TEXT NOT NULL,
  url         TEXT NOT NULL,
  mime_type   TEXT,
  size        INTEGER,
  alt_text    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### site_settings
```sql
CREATE TABLE site_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  key         TEXT NOT NULL,
  value       TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, key)
);
```

### Enums
```sql
CREATE TYPE project_category AS ENUM ('commercial', 'cafe', 'residential', 'others');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
```

### RLS Policies (ตัวอย่าง)
```sql
-- projects: user เห็นแค่ tenant ตัวเอง
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON projects
  USING (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );
```

---

## โครงสร้างโปรเจค

```
bestsolutions-cms/
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
│   │   ├── api/                  # API routes
│   │   │   ├── projects/
│   │   │   ├── articles/
│   │   │   ├── messages/
│   │   │   ├── media/
│   │   │   ├── settings/
│   │   │   └── auth/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── admin/               # Sidebar, TopBar, etc.
│   │   └── ui/                  # shadcn components
│   ├── lib/
│   │   └── supabase/            # client, server, admin
│   └── proxy.ts                 # Auth middleware
```

---

## Features ที่ต้องสร้าง

### Phase 1: Foundation (DB + Auth)
- [ ] สร้าง Supabase project ใหม่ (แยกจาก Twodesk)
- [ ] สร้าง schema ตาม design ด้านบน
- [ ] เปิด RLS ทุก table
- [ ] สร้าง tenant แรก: Twodesk Studio
- [ ] สร้าง Super Admin user (Best Solutions)
- [ ] Seed ข้อมูล Twodesk ที่มีอยู่แล้ว

### Phase 2: Admin UI
- [ ] Login page (ทำแล้ว — แก้ให้ต่อ DB ใหม่)
- [ ] Dashboard — stats + recent activity
- [ ] Projects CRUD
- [ ] Blog CRUD
- [ ] Messages inbox
- [ ] Media library
- [ ] Site settings
- [ ] Pages editor (Home, About, Contact)

### Phase 3: Multi-Tenant Features
- [ ] Super Admin page — จัดการ tenants ทั้งหมด
- [ ] เพิ่ม/ลบ tenant
- [ ] User management per tenant
- [ ] Subdomain routing

### Phase 4: Public API
- [ ] Public API endpoints (ไม่ต้อง auth)
- [ ] `GET /api/[tenant]/projects`
- [ ] `GET /api/[tenant]/articles`
- [ ] `POST /api/[tenant]/contact`
- [ ] ทุก frontend เรียกผ่าน API นี้

### Phase 5: Deploy + Client Onboarding
- [ ] Deploy Vercel
- [ ] ตั้งค่า custom domain
- [ ] Migrate Twodesk data เข้า DB ใหม่
- [ ] แก้ Twodesk frontend ให้ดึงจาก CMS API

---

## สถานะปัจจุบัน (2026-04-07)

| สิ่งที่ทำแล้ว | สถานะ |
|--------------|-------|
| สร้าง Next.js project | ✅ |
| ติดตั้ง shadcn/ui + Tiptap | ✅ |
| Migrate admin pages จาก Twodesk | ✅ (แต่ยังผูกกับ DB เดิม) |
| Migrate API routes | ✅ (แต่ยังผูกกับ DB เดิม) |
| Auth middleware | ✅ |
| Build ผ่าน | ✅ |
| **DB ใหม่ (multi-tenant)** | ❌ รอสร้าง |
| **RLS Policies** | ❌ |
| **Multi-tenant logic** | ❌ |
| **Public API** | ❌ |
| **Deploy** | ❌ |

---

## สิ่งที่ต้องทำก่อนอื่น

1. **สร้าง Supabase project ใหม่** (ลูกค้าจะทำ)
2. แชร์ credentials มาให้:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Project ref (สำหรับ MCP)
3. รัน migration script สร้าง schema
4. Seed tenants + admin user
5. แก้โค้ดให้ต่อ DB ใหม่ + เพิ่ม tenant_id logic

---

## Client ที่จะใช้ระบบนี้ (แผน)

| Client | Status |
|--------|--------|
| Twodesk Studio | แผน — migrate จาก DB เดิม |
| De Beau Clinic | แผน |
| อื่นๆ | TBD |
