import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/tenant'
import { requireRole } from '@/lib/auth'
import { CategorySchema } from '@/lib/validations/category'
import { generateSlug } from '@/lib/slugify'

// GET /api/categories?type=project|article
// RBAC: editor+ (any authenticated user)
export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 },
      { status: 401 }
    )
  }

  let tenantId: string
  try {
    tenantId = await getTenantId()
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  let query = supabase
    .from('categories')
    .select('id, name, slug, type, sort_order, created_at')
    .eq('tenant_id', tenantId)
    .order('sort_order', { ascending: true })

  if (type === 'project' || type === 'article') {
    query = query.eq('type', type)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch categories', code: 'DB_ERROR', status: 500 },
      { status: 500 }
    )
  }

  return NextResponse.json({ data })
}

// POST /api/categories
// RBAC: admin+
export async function POST(request: NextRequest) {
  const { user, response: authError } = await requireRole('admin')
  if (authError) return authError

  let tenantId: string
  try {
    tenantId = await getTenantId()
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 },
      { status: 401 }
    )
  }

  const body = await request.json()

  const result = CategorySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', status: 422, details: result.error.flatten() },
      { status: 422 }
    )
  }

  const supabase = createServerClient()
  const { name, type, sort_order } = result.data

  // Auto-generate slug if not provided
  const slug = result.data.slug || generateSlug(
    (name as any)?.th || (name as any)?.en || 'category'
  )

  // Check slug uniqueness per (tenant_id, slug, type)
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .eq('type', type)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: 'Slug already exists for this type', code: 'SLUG_EXISTS', status: 409 },
      { status: 409 }
    )
  }

  // sort_order = max + 1 if not specified
  let nextSortOrder = sort_order ?? 0
  if (!body.sort_order) {
    const { data: maxRow } = await supabase
      .from('categories')
      .select('sort_order')
      .eq('tenant_id', tenantId)
      .eq('type', type)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()
    nextSortOrder = (maxRow?.sort_order ?? -1) + 1
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({ tenant_id: tenantId, name, slug, type, sort_order: nextSortOrder })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create category', code: 'DB_ERROR', status: 500 },
      { status: 500 }
    )
  }

  return NextResponse.json(data, { status: 201 })
}
