import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { getTenantId } from '@/lib/tenant'
import { ProjectCreateSchema } from '@/lib/validations/project'

export async function GET(request: NextRequest) {
  const { response } = await requireRole('editor')
  if (response) return response

  let tenantId: string
  try {
    tenantId = await getTenantId()
  } catch {
    return NextResponse.json(
      { error: 'No tenant selected', code: 'TENANT_NOT_SELECTED' },
      { status: 400 }
    )
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.trim() ?? ''
  const categoryId = searchParams.get('category_id') ?? 'all'
  const status = searchParams.get('status') ?? 'all'
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = Math.min(Number(searchParams.get('limit') ?? 12), 50)
  const offset = (page - 1) * limit

  const supabase = createServerClient()

  let query = supabase
    .from('projects')
    .select(
      'id, title, slug, status, cover_image_url, created_at, published_at, category:categories(id, name)',
      { count: 'exact' }
    )
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(
      `slug.ilike.%${search}%,title->>th.ilike.%${search}%,title->>en.ilike.%${search}%`
    )
  }
  if (categoryId !== 'all') {
    query = query.eq('category_id', categoryId)
  }
  const validStatuses = ['draft', 'published', 'archived'] as const
  type ValidStatus = (typeof validStatuses)[number]
  if (status !== 'all' && validStatuses.includes(status as ValidStatus)) {
    query = query.eq('status', status as ValidStatus)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch projects', code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}

export async function POST(request: NextRequest) {
  const { response } = await requireRole('editor')
  if (response) return response

  let tenantId: string
  try {
    tenantId = await getTenantId()
  } catch {
    return NextResponse.json(
      { error: 'No tenant selected', code: 'TENANT_NOT_SELECTED' },
      { status: 400 }
    )
  }

  const body = await request.json()
  const parsed = ProjectCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { title, slug, category_id } = parsed.data
  const supabase = createServerClient()

  // Check slug uniqueness within tenant
  const { data: existing } = await supabase
    .from('projects')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'Slug already exists', code: 'SLUG_CONFLICT' },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      tenant_id: tenantId,
      title,
      slug,
      category_id: category_id ?? null,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create project', code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
