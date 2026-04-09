---
stepsCompleted: [1]
inputDocuments: ['CLAUDE.md', 'PROJECT_PLAN.md']
session_topic: 'วิเคราะห์และปรับปรุง Architecture ของ Best Solutions CMS'
session_goals: 'ตรวจสอบว่า CLAUDE.md และ PROJECT_PLAN.md ตรงกับความต้องการจริง และตัดสินใจเรื่อง architecture ที่ยังค้างอยู่'
selected_approach: 'AI-guided analysis and decision making'
techniques_used: ['document-analysis', 'gap-analysis', 'decision-matrix']
ideas_generated: ['jsonb-locales', 'categories-per-tenant', 'feature-flags', 'dynamic-pages', 'supabase-storage']
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Thanakit
**Date:** 2026-04-08

---

## Session Overview

**Topic:** วิเคราะห์และปรับปรุง Architecture ของ Best Solutions CMS
**Goals:** ตรวจสอบว่าไฟล์ CLAUDE.md และ PROJECT_PLAN.md ที่ Claude อีกตัวเขียนให้ ตรงกับความต้องการจริงหรือไม่ และตัดสินใจเรื่องที่ยังค้างอยู่

---

## การวิเคราะห์

### จุดแข็งของแผนเดิม
- โครงสร้าง CLAUDE.md ชัดเจน มี code example ทั้ง ❌ และ ✅
- Defense in depth concept (RLS + application-level filtering) ดี
- Database schema ออกแบบมีทั้ง bilingual fields, SEO fields, Tiptap JSON
- Phase 1-5 แบ่งงานเป็นขั้นตอนชัดเจน

### ปัญหาที่พบ
- Schema ถูกออกแบบตาม Twodesk เป็นหลัก ไม่ flexible พอสำหรับ client ที่ต่างกัน
- Categories ใช้ ENUM fix ค่า (`commercial, cafe, residential, others`) — ใช้ได้แค่ Twodesk
- Bilingual hardcode เป็น `_en`/`_th` columns — ไม่ยืดหยุ่น
- Pages fix แค่ 3 หน้า (Home/About/Contact)
- Storage ยังไม่ตัดสินใจ
- Skill names ใน CLAUDE.md บางตัวไม่มีอยู่จริงในระบบ
- ใช้ Next.js 14 ทั้งที่ 15 ออกแล้ว

---

## คำถามและการตัดสินใจ

### 1. Next.js Version
- **คำถาม:** ใช้ 14 ตั้งใจหรือแค่ตอนเริ่มโปรเจค?
- **ตัดสินใจ:** ใช้ **Next.js 15** ล่าสุด

### 2. Bilingual Support
- **คำถาม:** ทุก client ต้องสองภาษาจริงไหม?
- **ตัดสินใจ:** ใช้ **JSONB locale pattern** — แต่ละ tenant กำหนด `supported_locales` เอง
- **รูปแบบ:** `title: {"th": "...", "en": "..."}` แทน `title_en`, `title_th`

### 3. Categories
- **คำถาม:** แต่ละ client ใช้ categories เดียวกันไหม?
- **ตัดสินใจ:** สร้าง **`categories` table** per tenant — แต่ละ client กำหนดเอง
- **เพิ่มเติม:** ต้องทำ guidebook ไว้ด้วยตอนเสร็จ

### 4. Storage
- **คำถาม:** Supabase Storage หรือ Cloudinary?
- **ตัดสินใจ:** **Supabase Storage** — ราคารวมใน plan, ใช้ SDK ตัวเดียวกัน, RLS ใช้ได้เลย

### 5. Pages
- **คำถาม:** Fix แค่ 3 หน้าหรือให้สร้างเองได้?
- **ตัดสินใจ:** **Dynamic pages** — แต่ละ tenant สร้างได้ไม่จำกัด

### 6. Content Types per Tenant
- **คำถาม:** ทุก tenant ต้องมี projects, articles, messages เหมือนกัน?
- **ตัดสินใจ:** ใช้ **`enabled_features`** array per tenant — บาง client ไม่ต้องการ projects

### 7. Permissions
- **คำถาม:** ต้องการ permissions ละเอียดแค่ไหน?
- **ตัดสินใจ:** **`super_admin | admin | editor`** เพียงพอ

### 8. Middleware Naming
- **คำถาม:** `src/proxy.ts` ชื่อ confusing ไหม?
- **ตัดสินใจ:** เปลี่ยนเป็น **`src/middleware.ts`** ตาม Next.js convention

---

## สรุปการเปลี่ยนแปลง Schema

| เรื่อง | เดิม | ใหม่ |
|--------|------|------|
| Next.js | 14 | **15** |
| Bilingual fields | `title_en`, `title_th` แยก column | **JSONB** `title: {"th":..., "en":...}` |
| Categories | ENUM fix 4 ค่า | **`categories` table** per tenant |
| Storage | ยังไม่ตัดสินใจ | **Supabase Storage** |
| Pages | Fix 3 หน้า | **`pages` table** ไม่จำกัด |
| Content types | ทุก tenant เหมือนกัน | **`enabled_features`** per tenant |
| Middleware | `src/proxy.ts` | **`src/middleware.ts`** |

---

## ไฟล์ที่อัปเดตแล้ว

- `PROJECT_PLAN.md` — อัปเดต schema, tech stack, สถานะ, phases
- `CLAUDE.md` — อัปเดต version, สถานะ, skills (ใช้ชื่อที่มีจริงในระบบ)

---

## Skills ที่แก้ไข

Skills ที่ไม่มีอยู่จริงถูกแทนที่ด้วยชื่อที่ถูกต้อง:

| เดิม (ไม่มีจริง) | ใหม่ (มีจริง) |
|-------------------|---------------|
| `supabase-postgres-best-practices` | `postgres-best-practices`, `postgresql`, `supabase-automation` |

เพิ่ม skills ใหม่: `database-design`, `auth-implementation-patterns`, `vercel-deployment`
