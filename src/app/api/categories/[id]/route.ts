import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/tenant'
import { requireRole } from '@/lib/auth'
import { CategorySchema } from '@/lib/validations/category'

type Params = { params: { id: string } }

// GET /api/categories/[id]
// RBAC: editor+ (any authenticated user)
export async function GET(request: NextRequest, { params }: Params) {
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

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, type, sort_order, created_at')
    .eq('id', params.id)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: 'Category not found', code: 'NOT_FOUND', status: 404 },
      { status: 404 }
    )
  }

  return NextResponse.json({ data })
}

// PUT /api/categories/[id]
// RBAC: admin+
// Note: type field is immutable after creation
export async function PUT(request: NextRequest, { params }: Params) {
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

  // Verify category belongs to this tenant
  const { data: existing } = await supabase
    .from('categories')
    .select('id, type')
    .eq('id', params.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!existing) {
    return NextResponse.json(
      { error: 'Category not found', code: 'NOT_FOUND', status: 404 },
      { status: 404 }
    )
  }

  // Only update name, slug, sort_order — type is immutable
  const { name, slug, sort_order } = result.data
  const { data, error } = await supabase
    .from('categories')
    .update({ name, slug, sort_order })
    .eq('id', params.id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: 'Failed to update category', code: 'DB_ERROR', status: 500 },
      { status: 500 }
    )
  }

  return NextResponse.json({ data })
}

// DELETE /api/categories/[id]
// RBAC: admin+
// Returns linkedCount (projects + articles using this category)
// FK ON DELETE SET NULL handles unlinking automatically
export async function DELETE(request: NextRequest, { params }: Params) {
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

  const supabase = createServerClient()

  // Verify category belongs to this tenant
  const { data: cat } = await supabase
    .from('categories')
    .select('id, type')
    .eq('id', params.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!cat) {
    return NextResponse.json(
      { error: 'Category not found', code: 'NOT_FOUND', status: 404 },
      { status: 404 }
    )
  }

  // Count linked content
  const [projectsRes, articlesRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', params.id)
      .is('deleted_at', null),
    supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', params.id)
      .is('deleted_at', null),
  ])

  const linkedCount = (projectsRes.count ?? 0) + (articlesRes.count ?? 0)

  // Delete — FK ON DELETE SET NULL clears category_id in projects/articles automatically
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', params.id)
    .eq('tenant_id', tenantId)

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete category', code: 'DB_ERROR', status: 500 },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, linkedCount })
}
