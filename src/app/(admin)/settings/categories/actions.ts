'use server'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/tenant'
import { assertRole } from '@/lib/auth'
import { CategorySchema, type CategoryInput } from '@/lib/validations/category'
import { generateSlug } from '@/lib/slugify'
import type { ActionResult } from '@/types/api'

export async function createCategoryAction(
  data: CategoryInput
): Promise<ActionResult<{ id: string }>> {
  await assertRole('admin')

  const result = CategorySchema.safeParse(data)
  if (!result.success) return { error: 'ข้อมูลไม่ถูกต้อง' }

  const supabase = createServerClient()
  const tenantId = await getTenantId()
  const { name, type, sort_order } = result.data
  const slug = result.data.slug || generateSlug(
    (name as any)?.th || (name as any)?.en || 'category'
  )

  // Get next sort_order
  const { data: maxRow } = await supabase
    .from('categories')
    .select('sort_order')
    .eq('tenant_id', tenantId)
    .eq('type', type)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextSortOrder = sort_order ?? (maxRow?.sort_order ?? -1) + 1

  const { data: created, error } = await supabase
    .from('categories')
    .insert({ tenant_id: tenantId, name, slug, type, sort_order: nextSortOrder })
    .select('id')
    .single()

  if (error) return { error: 'ไม่สามารถสร้าง category ได้' }

  revalidatePath('/settings/categories')
  return { data: { id: created.id } }
}

export async function updateCategoryAction(
  id: string,
  data: CategoryInput
): Promise<ActionResult<void>> {
  await assertRole('admin')

  const result = CategorySchema.safeParse(data)
  if (!result.success) return { error: 'ข้อมูลไม่ถูกต้อง' }

  const supabase = createServerClient()
  const tenantId = await getTenantId()
  const { name, slug, sort_order } = result.data

  // Only update name, slug, sort_order — type is immutable
  const { error } = await supabase
    .from('categories')
    .update({ name, slug, sort_order })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { error: 'ไม่สามารถแก้ไข category ได้' }

  revalidatePath('/settings/categories')
  return { data: undefined }
}

export async function deleteCategoryAction(
  id: string
): Promise<ActionResult<{ linkedCount: number }>> {
  await assertRole('admin')

  const supabase = createServerClient()
  const tenantId = await getTenantId()

  // Count linked content
  const [projectsRes, articlesRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)
      .is('deleted_at', null),
    supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)
      .is('deleted_at', null),
  ])

  const linkedCount = (projectsRes.count ?? 0) + (articlesRes.count ?? 0)

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { error: 'ไม่สามารถลบ category ได้' }

  revalidatePath('/settings/categories')
  return { data: { linkedCount } }
}

export async function reorderCategoryAction(
  id: string,
  direction: 'up' | 'down'
): Promise<ActionResult<void>> {
  await assertRole('admin')

  const supabase = createServerClient()
  const tenantId = await getTenantId()

  // Fetch current category
  const { data: current } = await supabase
    .from('categories')
    .select('id, sort_order, type')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!current) return { error: 'Category not found' }

  // Find adjacent row
  const { data: adjacent } = await supabase
    .from('categories')
    .select('id, sort_order')
    .eq('tenant_id', tenantId)
    .eq('type', current.type)
    .eq('sort_order', direction === 'up' ? current.sort_order - 1 : current.sort_order + 1)
    .single()

  if (!adjacent) return { data: undefined }  // already at boundary

  // Swap sort_order
  await Promise.all([
    supabase.from('categories').update({ sort_order: adjacent.sort_order }).eq('id', current.id),
    supabase.from('categories').update({ sort_order: current.sort_order }).eq('id', adjacent.id),
  ])

  revalidatePath('/settings/categories')
  return { data: undefined }
}
