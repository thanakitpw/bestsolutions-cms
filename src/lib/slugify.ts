// Thai-safe slug generation
// MVP: ลบ Thai chars โดยใช้ char code เป็น fallback

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // แปลง Thai characters โดยใช้ romanization map
    .replace(/[\u0E00-\u0E7F]+/g, (match) => thaiToRoman(match))
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// Simple Thai romanization map — ขยายตามต้องการ
function thaiToRoman(thai: string): string {
  const map: Record<string, string> = {
    'บ้าน': 'ban',
    'ริมน้ำ': 'rim-nam',
    'โปรเจค': 'project',
    'โปรเจกต์': 'project',
    'บล็อก': 'blog',
    'ข่าว': 'news',
    'สินค้า': 'product',
    'หน้าแรก': 'home',
    'เกี่ยวกับ': 'about',
    'ติดต่อ': 'contact',
  }
  if (map[thai]) return map[thai]
  // Fallback: แปลงเป็น alphanumeric จาก charCode
  return Array.from(thai)
    .map((c) => c.charCodeAt(0).toString(36))
    .join('')
}

export function generateSlug(title: string): string {
  const slug = slugify(title)
  // ถ้า slug ว่าง ใช้ timestamp เป็น fallback
  return slug || `item-${Date.now()}`
}
