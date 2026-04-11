import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { getTenantId } from '@/lib/tenant'
import { ProjectUpdateSchema } from '@/lib/validations/project'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
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

  const { id } = await params
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*, category:categories(id, name)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Project not found', code: 'NOT_FOUND' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

  const { id } = await params
  const body = await request.json()

  const parsed = ProjectUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const updateData = parsed.data
  const supabase = createServerClient()

  // Slug conflict check
  if (updateData.slug) {
    const { data: conflict } = await supabase
      .from('projects')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('slug', updateData.slug)
      .is('deleted_at', null)
      .neq('id', id)
      .maybeSingle()

    if (conflict) {
      return NextResponse.json(
        { error: 'Slug already exists', code: 'SLUG_CONFLICT' },
        { status: 409 }
      )
    }
  }

  // ถ้า status เปลี่ยนเป็น published → set published_at ถ้ายังไม่มี
  let autoPublishedAt: string | undefined
  if (updateData.status === 'published') {
    const { data: current } = await supabase
      .from('projects')
      .select('published_at')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()
    if (current && !current.published_at) {
      autoPublishedAt = new Date().toISOString()
    }
  }

  const { data, error } = await supabase
    .from('projects')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ ...updateData, ...(autoPublishedAt ? { published_at: autoPublishedAt } : {}) } as any)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Update failed', code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { response } = await requireRole('admin')
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

  const { id } = await params
  const supabase = createServerClient()

  const { error } = await supabase
    .from('projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    return NextResponse.json({ error: 'Delete failed', code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
