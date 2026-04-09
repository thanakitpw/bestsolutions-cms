# CLAUDE.md — Best Solutions CMS

## ภาษา
- **ตอบเป็นภาษาไทยเสมอ**
- ยกเว้น code, ชื่อตัวแปร, technical terms

---

## ข้อมูลโปรเจค

**Best Solutions CMS** คือ Multi-tenant Headless CMS กลาง สำหรับ Best Solutions Agency
- จัดการเนื้อหาของหลาย client (Twodesk, De Beau, ฯลฯ) ผ่าน UI เดียว
- แต่ละ client (tenant) มีข้อมูลแยกกันสนิทผ่าน Row-Level Security

อ่านแผนโปรเจคฉบับเต็มที่ **`PROJECT_PLAN.md`** ก่อนทำงานทุกครั้ง

---

## Tech Stack
| Layer | เทคโนโลยี |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) + RLS |
| Auth | Supabase Auth |
| Rich Text | Tiptap |
| Email | Resend |
| Deploy | Vercel |

---

## โครงสร้าง Routes

```
/           → Dashboard (protected)
/login      → Login page
/projects   → Projects list + editor
/blog       → Blog list + editor
/messages   → Messages inbox
/media      → Media library
/pages      → Pages editor (Home/About/Contact per tenant)
/settings   → Site settings
/analytics  → Analytics (placeholder)
```

API Routes:
```
/api/projects/[id]
/api/articles/[id]
/api/messages/[id]
/api/media/[id]
/api/settings
/api/auth/logout
```

Auth middleware อยู่ที่ `src/middleware.ts` (เปลี่ยนชื่อจาก proxy.ts ให้ตรง Next.js convention)

---

## สถานะปัจจุบัน

> ⚠️ **Planning phase — ยังไม่มี codebase** (ไม่มี package.json, src/, หรือโค้ดใดๆ)

| Component | สถานะ |
|-----------|-------|
| Project Plan & Schema Design | ✅ |
| **Next.js project setup** | ❌ ยังไม่ได้สร้าง |
| **shadcn/ui + Tiptap** | ❌ |
| **Admin pages** | ❌ |
| **API routes** | ❌ |
| **Auth middleware** | ❌ |
| **Supabase DB + Migrations** | ❌ รอ credentials |
| **RLS Policies** | ❌ |
| **tenant_id logic + feature flags** | ❌ |
| **Categories per tenant** | ❌ |
| **Dynamic pages** | ❌ |
| **Public API (`/api/public/[tenant]/...`)** | ❌ |
| **Super Admin (จัดการ tenants)** | ❌ |
| **Deploy** | ❌ |

---

## สิ่งที่ต้องทำก่อนอื่นสุด

1. รอ Supabase credentials ใหม่จากผู้ใช้:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Supabase Project Ref (สำหรับ MCP)

2. รัน SQL migration ตาม schema ใน `PROJECT_PLAN.md`

3. แก้ทุก API route ให้:
   - ดึง `tenant_id` จาก user session
   - filter query ด้วย `tenant_id`

4. สร้าง tenant แรก (Twodesk) + seed ข้อมูล

---

## กฎสำคัญในการเขียนโค้ด

### Multi-tenant — ห้ามลืม tenant_id
```typescript
// ❌ ผิด — ดึงข้อมูลทุก tenant
const { data } = await supabaseAdmin.from('projects').select('*')

// ✅ ถูก — ดึงแค่ tenant ของ user นั้น
const tenantId = await getTenantId(request)
const { data } = await supabaseAdmin
  .from('projects')
  .select('*')
  .eq('tenant_id', tenantId)
```

### Helper function ที่ต้องสร้าง
```typescript
// src/lib/tenant.ts
export async function getTenantId(request: Request): Promise<string> {
  // ดึง user session → หา tenant_id จาก users table
}
```

### RLS เป็น safety net ไม่ใช่ทางหลัก
- เปิด RLS ไว้เสมอ
- แต่โค้ดต้องกรอง tenant_id เองด้วย (defense in depth)

---

## การใช้ Skills
- UI/UX: `ui-ux-pro-max`, `frontend-design`
- Database: `postgres-best-practices`, `postgresql`, `database-design`
- Supabase: `supabase-automation`
- API: `api-design-principles`
- Auth: `auth-implementation-patterns`
- Next.js: `nextjs-best-practices`, `nextjs-app-router-patterns`
- Deploy: `deployment-engineer`, `vercel-deployment`

---

## Supabase MCP
- Project ref: **รอ credentials ใหม่** (ยังไม่มี)
- เมื่อได้ credentials แล้ว อัปเดต `.mcp.json` และไฟล์นี้

---

## ผู้ดูแลโปรเจค
- **Best Solutions** — เจ้าของระบบ CMS
- Clients ที่จะใช้ระบบ: Twodesk Studio, De Beau Clinic, และอื่นๆ ในอนาคต
