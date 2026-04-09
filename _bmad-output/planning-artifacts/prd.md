---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation-skipped', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments: ['PROJECT_PLAN.md', 'brainstorming-session-2026-04-08-001.md', 'CLAUDE.md']
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 2
classification:
  projectType: 'saas_b2b'
  domain: 'content_management_agency_tools'
  complexity: 'medium'
  projectContext: 'brownfield'
---

# Product Requirements Document - Best Solutions CMS

**Author:** Thanakit
**Date:** 2026-04-08

## Executive Summary

Best Solutions CMS คือ Multi-tenant Headless CMS สำหรับ Best Solutions Agency ออกแบบมาเพื่อแก้ปัญหาที่ต้องสร้าง admin panel ใหม่ทุกครั้งที่รับลูกค้าใหม่ ระบบรวมการจัดการเนื้อหาของทุก client (Twodesk Studio, De Beau Clinic และอื่นๆ) ไว้ใน UI เดียว แต่ละ tenant มีข้อมูลแยกกันสนิทผ่าน Row-Level Security

ผู้ใช้หลักคือทีม Best Solutions (super_admin) และ admin/editor ของแต่ละ client ซึ่งเคยใช้ WordPress/Canva มาก่อน — ต้องการ CMS ที่ใช้ง่ายเพื่อแก้ content เล็กๆ น้อยๆ ด้วยตัวเอง (เปลี่ยนข้อความ เปลี่ยนรูป เพิ่ม blog post) โดยไม่ต้องรอทีม agency ขณะที่งาน MA เรื่องใหญ่ยังเป็นหน้าที่ของ Best Solutions

ระบบ replace WordPress ที่ลูกค้าใช้อยู่ โดย frontend ของแต่ละ client เป็น custom-coded แยก ดึงข้อมูลจาก CMS ผ่าน Public API

### สิ่งที่ทำให้พิเศษ

- **ลูกค้า self-service ได้ทันที** — แก้ content เล็กๆ เองไม่ต้องรอ ลดงานจุกจิกให้ทีม agency โฟกัสงาน MA ที่มีมูลค่าสูง
- **ระบบกลาง multi-client** — จัดการทุก client ในที่เดียว ไม่ต้องสร้าง admin panel ซ้ำทุกโปรเจค
- **เป็นเจ้าของทั้งหมด** — ไม่พึ่ง third-party CMS ปรับแต่งได้ไม่จำกัด ไม่มีค่า subscription มีศักยภาพทำเป็นผลิตภัณฑ์ขายในอนาคต

## Project Classification

| หัวข้อ | รายละเอียด |
|--------|------------|
| **Project Type** | SaaS B2B (Internal-first) — เริ่มใช้ภายใน มีแผนเปิดให้ภายนอกในอนาคต |
| **Domain** | Content Management / Agency Tools |
| **Complexity** | Medium — Multi-tenant RLS + i18n (JSONB locales) + UX ต้องง่ายกว่า WordPress |
| **Project Context** | Brownfield — มี PROJECT_PLAN.md, DB schema, architecture decisions ครบแล้ว |

## Success Criteria

### User Success

- **ทีม Best Solutions (ผู้ใช้หลัก):** จัดการ content ของทุก client จาก UI เดียว ไม่ต้อง login เข้า WordPress/แก้โค้ดแต่ละโปรเจคแยก
- **ลูกค้า (ผู้ใช้รอง):** แก้ content เล็กๆ น้อยๆ ได้เอง โดยไม่ต้องรอทีม agency — ใช้งานได้โดยไม่ต้องสอนนาน
- **สร้าง/แก้ content ได้ภายในไม่กี่คลิก** — UX ต้อง straightforward สำหรับคนระดับ WordPress/Canva

### Business Success

- **ลดเวลาจัดการ content** — จากต้องเข้า WordPress แต่ละเจ้าหรือแก้โค้ด เหลือทำจากที่เดียว
- **ลด onboard ลูกค้าใหม่** — ระบบ tenant พร้อมใช้ ไม่ต้องสร้าง admin panel ใหม่ทุกโปรเจค
- **Twodesk Studio เป็น client แรก** ที่ใช้งานจริง frontend ดึงข้อมูลผ่าน Public API สำเร็จ
- **มีศักยภาพ scale** — รองรับทีมเพิ่มหรือเปิดให้ภายนอกในอนาคตโดยไม่ต้อง rewrite

### Technical Success

- **Multi-tenant isolation** — ข้อมูลแต่ละ client แยกสนิทผ่าน RLS ไม่มี data leak ข้าม tenant
- **Public API พร้อมใช้** — Frontend ดึง content ผ่าน API ได้ มี pagination, CORS, rate limiting
- **Performance** — Admin UI โหลดเร็ว, API response time ต่ำ
- **Deploy บน Vercel** — CI/CD จาก GitHub, production-ready

### Measurable Outcomes

- Twodesk Studio ใช้ CMS จัดการ projects + blog + messages ได้จริง
- Twodesk frontend ดึงข้อมูลจาก Public API แสดงผลถูกต้อง
- เพิ่ม client ใหม่ (tenant) ได้ภายในไม่กี่นาที ไม่ต้องแก้โค้ด
- RLS tests ผ่าน — tenant A เห็นแค่ข้อมูลตัวเอง

## User Journeys

### Journey 1: Thanakit (Super Admin) — จัดการ content ให้ลูกค้า

**สถานการณ์:** Twodesk ส่งข้อความมาว่าอยากเพิ่ม project ใหม่ลงเว็บ พร้อมรูปและรายละเอียด

**Opening Scene:** Thanakit เปิด CMS login เข้าระบบ เห็น dashboard รวมทุก client — ไม่ต้อง login เข้า WordPress แยกอีกต่อไป

**Rising Action:**
1. เลือก tenant "Twodesk Studio" จาก sidebar
2. ไปที่ Projects → กด "สร้าง Project ใหม่"
3. กรอก title (th/en), description, เลือก category, ใส่ location/area/year
4. เปิด Tiptap editor เขียน content — ลาก drop รูปจาก Media Library
5. Upload รูป cover + gallery ผ่าน Media Library
6. ตั้งค่า SEO (title, description, keywords)
7. กด "Save as Draft" → preview → กด "Publish"

**Climax:** Project ใหม่ขึ้นเว็บ Twodesk ทันทีผ่าน Public API — ทำเสร็จภายไม่กี่นาที

**Resolution:** ทั้ง flow ใช้เวลาแค่ไม่กี่นาที ไม่ต้อง switch ระบบ ไม่ต้องแก้โค้ด

---

### Journey 2: Thanakit (Super Admin) — Onboard ลูกค้าใหม่

**สถานการณ์:** De Beau Clinic เป็นลูกค้าใหม่ เว็บ coded เสร็จแล้ว ต้อง setup CMS ให้

**Rising Action:**
1. เข้า Super Admin panel → สร้าง tenant ใหม่ "De Beau Clinic"
2. ตั้งค่า: slug "debeau", supported_locales ["th"], enabled_features ["blog", "messages"]
3. ระบบสร้าง site_settings row อัตโนมัติ
4. สร้าง user account สำหรับเจ้าของ De Beau (role: admin)
5. ตั้งค่า site settings เบื้องต้น — logo, contact info, social links
6. สร้าง categories สำหรับ blog
7. ส่ง login credentials ให้ลูกค้า

**Climax:** De Beau frontend เชื่อมต่อ Public API ได้ทันที — จาก tenant ใหม่สู่เว็บที่ใช้งานได้จริงภายในไม่กี่นาที

---

### Journey 3: คุณแพร (Client Admin, Twodesk) — แก้ content เอง

**สถานการณ์:** คุณแพร เจ้าของ Twodesk Studio เคยใช้ WordPress อยากแก้ข้อความ description ของ project ไม่อยากรอทีม Best Solutions

**Rising Action:**
1. เห็น dashboard — projects ล่าสุด, blog posts, messages ที่ยังไม่อ่าน
2. ไปที่ Projects → คลิก project ที่ต้องการแก้
3. แก้ description — Tiptap editor ใช้งานง่าย เหมือนพิมพ์ใน Google Docs
4. กด "Save" → ระบบบันทึก revision อัตโนมัติ

**Climax:** ข้อความใหม่ขึ้นเว็บทันที — แก้เองได้ภายในไม่ถึงนาที ไม่ต้องรอใคร

**Resolution:** CMS ใหม่ใช้ง่ายกว่า WordPress — แก้แค่จุดที่ต้องการ ไม่มี menu ที่ไม่เกี่ยวข้องมารกตา

---

### Journey 4: Frontend Developer — เชื่อมต่อ Public API

**สถานการณ์:** Thanakit (หรือ dev ในอนาคต) สร้าง frontend ใหม่ให้ client ต้องดึง content จาก CMS

**Rising Action:**
1. `GET /api/public/twodesk/projects` — list projects ที่ published พร้อม pagination
2. `GET /api/public/twodesk/projects/[slug]` — detail พร้อม Tiptap JSON content
3. `GET /api/public/twodesk/settings` — site name, logo, social links
4. `POST /api/public/twodesk/contact` — contact form พร้อม validation

**Climax:** Frontend แสดง content จาก CMS ครบ — ทุกอย่างจาก API เดียว เมื่อ content ถูกแก้ frontend อัปเดตทันที

---

### Journey 5: ผู้เยี่ยมชมเว็บ — ส่งข้อความผ่าน Contact Form

**Rising Action:**
1. กรอกชื่อ, email, เบอร์โทร, เลือกประเภท project, เขียนข้อความ
2. กด "ส่ง" → frontend เรียก `POST /api/public/twodesk/contact`
3. API validate input + rate limiting → บันทึก message
4. ระบบแจ้งเตือน admin ผ่าน LINE/Email ตาม tenant setting

**Climax:** ข้อความปรากฏใน CMS ทันที — Thanakit เห็นใน Messages inbox พร้อมจัดการ ทุกข้อความรวมในที่เดียว

### Journey Requirements Summary

| Journey | Capabilities ที่ต้องมี |
|---------|----------------------|
| Super Admin จัดการ content | Projects/Articles CRUD, Media Library, Tiptap Editor, SEO fields, tenant switching, publish/draft workflow |
| Onboard ลูกค้าใหม่ | Tenant management, user creation, site settings setup, categories management, feature flags |
| Client Admin แก้ content | Scoped access (RLS), simplified UI, content editing, auto-save revisions |
| Frontend Developer | Public API (GET/POST), pagination, CORS, rate limiting, Tiptap JSON content |
| ผู้เยี่ยมชมเว็บ | Contact form API, input validation, rate limiting, message inbox, notification |

## Domain-Specific Requirements

### Data Privacy & Tenant Isolation

- ทุก query กรอง `tenant_id` ทั้งระดับ application และ RLS (defense in depth)
- RLS tests บังคับตรวจสอบว่า tenant A เข้าถึงข้อมูล tenant B ไม่ได้
- ทุก destructive action บันทึกใน `audit_logs` — immutable ยกเว้น super_admin

### Content Ownership & Data Export

- เมื่อเลิกใช้บริการ ต้อง export ข้อมูลทั้งหมดของ tenant ออกได้ (JSON dump + media files)
- Super_admin ลบข้อมูล tenant ทั้งหมดได้ (hard delete) หลัง export

### Backup & Recovery

- Content revision auto-save ทุกครั้งที่แก้ไข เก็บสูงสุด 50 versions/entity ลบเก่าอัตโนมัติ (prune trigger)
- Restore content จาก revision ก่อนหน้าได้ กรณีลูกค้าแก้เองแล้วพัง
- Soft delete ด้วย `deleted_at` — กู้คืนได้ก่อน hard delete

## SaaS B2B Specific Requirements

### Multi-Tenancy Model

- **Strategy:** Single database, Row-Level Security (RLS)
- **Isolation:** ทุก table มี `tenant_id`, RLS + application-level filtering (defense in depth)
- **Tenant config:** แต่ละ tenant กำหนด `supported_locales`, `enabled_features`, notification channels เอง
- **Subscription tiers:** ยังไม่จำเป็น — ใช้ภายในก่อน เพิ่มทีหลังเมื่อต้องการขาย

### Permission Model (RBAC)

| Role | สิทธิ์ |
|------|--------|
| **super_admin** | เข้าถึงทุก tenant, จัดการ tenants/users, ดู audit logs |
| **admin** | จัดการ content + settings + categories ของ tenant ตัวเอง, ลบ content ได้ |
| **editor** | สร้าง/แก้ไข content ของ tenant ตัวเอง, ลบไม่ได้ |

### Integrations

| Service | ใช้ทำอะไร | หมายเหตุ |
|---------|----------|---------|
| **Supabase** | Database + Auth + Storage | Core infrastructure |
| **Vercel** | Hosting + CI/CD | Auto deploy จาก GitHub |
| **Resend** | Email notification | แจ้ง admin เมื่อมี message ใหม่ (per tenant setting) |
| **LINE Notify** | LINE notification | แจ้ง admin เมื่อมี message ใหม่ (per tenant setting) |
| **Google Analytics** | Analytics tracking | เก็บ GA tracking ID ใน site_settings ให้ frontend ใช้ |

### Notification Settings (Per Tenant)

- แต่ละ tenant ตั้งค่าใน site_settings ว่ารับแจ้งเตือนผ่านช่องทางไหน
- **Email:** ระบุ email ที่ต้องการรับ notification (ผ่าน Resend)
- **LINE Notify:** ระบุ LINE Notify token ของ tenant
- **เปิด/ปิดได้อิสระ** — บางเจ้าใช้แค่ LINE, บางเจ้าใช้แค่ Email, บางเจ้าใช้ทั้งคู่
- **Trigger:** เมื่อมี message ใหม่จาก contact form

### Implementation Considerations

- **Tenant switching:** Super admin switch tenant ได้ง่ายผ่าน UI (dropdown หรือ sidebar)
- **Feature flags:** Admin UI ซ่อน/แสดง menu ตาม `enabled_features` ของ tenant
- **Locale handling:** JSONB pattern สำหรับ multi-locale content แต่ละ tenant กำหนด `supported_locales` เอง

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-solving MVP — Twodesk Studio เป็น client แรกที่ใช้งานจริง พิสูจน์ว่า CMS กลางแก้ปัญหาได้จริง
**Resource:** Thanakit คนเดียว + Claude Code ช่วย develop

### MVP Feature Set (Phase 1)

**Core User Journeys ที่รองรับ:**
- Journey 1: Super Admin จัดการ content ให้ลูกค้า
- Journey 3: Client Admin แก้ content เล็กๆ เอง
- Journey 4: Frontend Developer เชื่อมต่อ Public API
- Journey 5: ผู้เยี่ยมชมเว็บส่ง contact form

**Must-Have Capabilities:**
- Auth (login/logout) + middleware
- Projects CRUD + Blog/Articles CRUD
- Messages inbox (read/archive) + LINE/Email notification
- Media library (Supabase Storage) + image optimize + thumbnail
- Categories management per tenant
- Site settings (รวม GA tracking ID, notification channels)
- Tiptap rich text editor (multi-locale)
- Content revision history (auto-save, 50 versions/entity, auto-prune)
- SEO fields per content
- Public API (GET projects, articles, pages, settings + POST contact)
- Pagination, CORS, rate limiting
- RLS ทุก table + RLS tests
- Deploy บน Vercel
- Twodesk เป็น tenant แรก

### Phase 2 — Growth

- Super Admin panel จัดการ tenants (Journey 2: Onboard ลูกค้าใหม่)
- Pages editor (dynamic pages)
- User management per tenant (invite/remove)
- Content restore จาก revision UI
- Data export per tenant (JSON dump + media download)
- Dashboard analytics
- Subdomain routing per tenant

### Phase 3 — Expansion

- เปิดให้ภายนอกสมัครใช้เอง (self-service onboarding)
- ทำเป็นผลิตภัณฑ์ขาย
- Tenant onboarding checklist
- Advanced analytics
- Subscription tiers / pricing plans

### Risk Mitigation Strategy

**Technical Risks:**
- Multi-tenant RLS ซับซ้อน → บังคับเขียน RLS tests ก่อน launch
- Tiptap + JSONB locales เพิ่มความซับซ้อน → เริ่มจาก single locale (th) ก่อน เพิ่ม en ทีหลัง

**Market Risks:**
- ลูกค้าอาจไม่ยอมเปลี่ยนจาก WordPress → เริ่มจาก Twodesk (client ที่ยอมแล้ว) เป็น proof of concept

**Resource Risks:**
- ทำคนเดียว → ใช้ Claude Code ช่วย, โฟกัส MVP แค่ features จำเป็น, ตัด scope เข้มงวด

## Functional Requirements

### Authentication & Authorization

- FR1: ผู้ใช้ login ด้วย email + password ได้
- FR2: ผู้ใช้ logout ได้
- FR3: ระบบ redirect ไปหน้า login เมื่อยังไม่ authenticate
- FR4: ระบบจำกัดการเข้าถึงตาม role (super_admin / admin / editor)
- FR5: ระบบจำกัดการเข้าถึงตาม tenant ของผู้ใช้ (RLS)

### Tenant Management

- FR6: Super admin สร้าง tenant ใหม่ได้ (ชื่อ, slug, locales, features)
- FR7: Super admin แก้ไขการตั้งค่า tenant ได้ (enabled_features, supported_locales)
- FR8: Super admin สร้าง user account สำหรับ tenant ได้
- FR9: Super admin switch ดูข้อมูลของ tenant ต่างๆ ได้

### Content Management — Projects

- FR10: ผู้ใช้สร้าง project ใหม่ได้ (title, description, content, category, location, area, year)
- FR11: ผู้ใช้แก้ไข project ที่มีอยู่ได้
- FR12: ผู้ใช้กรอก content แบบ rich text (Tiptap editor) ได้
- FR13: ผู้ใช้กรอก content หลายภาษาตาม supported_locales ของ tenant ได้
- FR14: ผู้ใช้ตั้งค่า SEO (title, description, keywords) per locale ได้
- FR15: ผู้ใช้ upload cover image และ gallery ได้
- FR16: ผู้ใช้เลือก category สำหรับ project ได้
- FR17: ผู้ใช้ตั้งสถานะ draft / published ได้
- FR18: Admin soft delete project ได้
- FR19: ระบบสร้าง slug อัตโนมัติจาก title ผู้ใช้แก้ไขเองได้

### Content Management — Articles

- FR20: ผู้ใช้สร้าง article ใหม่ได้ (title, excerpt, content, category, cover image)
- FR21: ผู้ใช้แก้ไข article ที่มีอยู่ได้
- FR22: ผู้ใช้กรอก content แบบ rich text หลายภาษาได้
- FR23: ผู้ใช้ตั้งค่า SEO per locale ได้
- FR24: ผู้ใช้ตั้งสถานะ draft / published ได้
- FR25: Admin soft delete article ได้

### Messages

- FR26: ระบบรับ message จาก contact form (ชื่อ, email, เบอร์โทร, ข้อความ, ประเภท project)
- FR27: ผู้ใช้ดู list messages ทั้งหมดของ tenant ได้
- FR28: ผู้ใช้ mark message เป็น read/unread ได้
- FR29: ผู้ใช้ archive message ได้
- FR30: ระบบแจ้งเตือนผ่าน LINE Notify เมื่อมี message ใหม่ (ตาม tenant setting)
- FR31: ระบบแจ้งเตือนผ่าน Email (Resend) เมื่อมี message ใหม่ (ตาม tenant setting)

### Media Library

- FR32: ผู้ใช้ upload รูปภาพได้
- FR33: ผู้ใช้ดู list media ทั้งหมดของ tenant ได้
- FR34: ผู้ใช้ลบ media ได้ (ลบทั้ง DB และ Supabase Storage)
- FR35: ผู้ใช้ตั้ง alt text หลายภาษาได้
- FR36: ผู้ใช้เลือกรูปจาก media library เข้า content editor ได้
- FR37: ระบบ optimize รูปภาพอัตโนมัติเมื่อ upload (แปลง WebP + ลดขนาด)
- FR38: ระบบสร้าง thumbnail อัตโนมัติเมื่อ upload

### Categories

- FR39: ผู้ใช้สร้าง category ใหม่ได้ (ชื่อหลายภาษา, type: project/article)
- FR40: ผู้ใช้แก้ไข/ลบ category ได้
- FR41: ผู้ใช้จัดลำดับ category ได้ (sort_order)

### Site Settings

- FR42: Admin ตั้งค่า site settings ได้ (site name, tagline, logo, favicon, contact info, social links)
- FR43: Admin ตั้งค่า default SEO ได้
- FR44: Admin ตั้งค่า notification channels ได้ (เลือก LINE / Email / ทั้งคู่)
- FR45: Admin ตั้งค่า GA tracking ID ได้

### Content History & Safety

- FR46: ระบบบันทึก content revision อัตโนมัติทุกครั้งที่แก้ไข
- FR47: ระบบลบ revision เก่าอัตโนมัติเมื่อเกิน 50 versions ต่อ entity
- FR48: ระบบบันทึก audit log สำหรับ destructive actions (ลบ content, เปลี่ยน role)

### Public API

- FR49: Frontend ดึง list projects ที่ published ของ tenant ได้ (พร้อม pagination)
- FR50: Frontend ดึง project detail ตาม slug ได้
- FR51: Frontend ดึง list articles ที่ published ของ tenant ได้ (พร้อม pagination)
- FR52: Frontend ดึง article detail ตาม slug ได้
- FR53: Frontend ดึง page ตาม slug ได้
- FR54: Frontend ดึง site settings ของ tenant ได้
- FR55: Frontend ส่ง contact form message ได้ (พร้อม input validation)
- FR56: ระบบ rate limit Public API (contact form: 5 req/min per IP)
- FR57: ระบบ CORS อนุญาตเฉพาะ domain ที่ลงทะเบียนใน tenant

## Non-Functional Requirements

### Performance

- Admin UI page load ภายใน 2 วินาที
- Public API response time ภายใน 500ms (list), 300ms (detail)
- Image upload + optimize + thumbnail เสร็จภายใน 5 วินาทีต่อรูป
- Tiptap editor responsive ขณะพิมพ์ — ไม่มี input lag ที่รู้สึกได้

### Security

- ข้อมูลแต่ละ tenant แยกสนิทผ่าน RLS — ไม่มี data leak ข้าม tenant
- Authentication ผ่าน Supabase Auth (JWT) — session จัดการฝั่ง server
- API routes ทุกเส้นตรวจสอบ auth + tenant_id ก่อนดำเนินการ
- Public API contact form มี rate limiting (5 req/min per IP) + input validation
- Audit logs เป็น immutable — ลบไม่ได้ยกเว้น super_admin
- Storage upload อนุญาตเฉพาะไฟล์รูปภาพ (JPEG, PNG, GIF, WebP)

### Scalability

- รองรับ 10+ tenants พร้อมกันโดยไม่กระทบ performance
- Content revision pruning (50 versions/entity) ป้องกัน database เติบโตไม่จำกัด
- Public API pagination (default 20, max 100) ป้องกัน large response payloads
- เพิ่ม tenant ใหม่ได้โดยไม่ต้องแก้โค้ดหรือ restart

### Integration

- **Supabase:** Database + Auth + Storage ทำงานเสถียร
- **LINE Notify API:** ส่ง notification สำเร็จภายใน 3 วินาที มี error handling เมื่อ token ไม่ถูกต้อง
- **Resend API:** ส่ง email notification สำเร็จภายใน 5 วินาที มี retry เมื่อ fail
- **CORS:** อนุญาตเฉพาะ domain ที่ลงทะเบียน ถ้า tenant ไม่ได้ตั้ง domain ให้ deny ทั้งหมด
