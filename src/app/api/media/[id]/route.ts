import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { getTenantId } from '@/lib/tenant'
import { logAuditEvent } from '@/lib/audit'
import { AltTextUpdateSchema } from '@/lib/validations/media'

// GET /api/media/[id] — get single media item (tenant-scoped)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params
  const { data: item, error } = await supabase
    .from('media_items')
    .select('id, filename, storage_path, public_url, mime_type, size, width, height, alt_text, created_at')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !item) {
    return NextResponse.json(
      { error: 'Not found', code: 'NOT_FOUND', status: 404 },
      { status: 404 }
    )
  }

  return NextResponse.json(item)
}

// PATCH /api/media/[id] — update alt_text
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params
  const body = await request.json()

  const result = AltTextUpdateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', status: 422 },
      { status: 422 }
    )
  }

  const { data: updated, error } = await supabase
    .from('media_items')
    .update({ alt_text: result.data.alt_text })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error || !updated) {
    return NextResponse.json(
      { error: 'Update failed', code: 'DB_ERROR', status: 500 },
      { status: 500 }
    )
  }

  return NextResponse.json(updated)
}

// DELETE /api/media/[id] — delete from Storage + media_items + audit log
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params

  // Fetch storage_path before deletion
  const { data: item } = await supabase
    .from('media_items')
    .select('id, filename, storage_path')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!item) {
    return NextResponse.json(
      { error: 'Not found', code: 'NOT_FOUND', status: 404 },
      { status: 404 }
    )
  }

  // Delete from Supabase Storage (service role to bypass Storage RLS)
  const adminClient = createServiceRoleClient()
  const { error: storageError } = await adminClient.storage
    .from('media')
    .remove([item.storage_path])

  if (storageError) {
    console.error('[Media] Storage delete failed:', storageError)
    // Continue — delete DB record even if storage fails
  }

  // Delete DB record
  await supabase
    .from('media_items')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  // Audit log — fire-and-forget
  logAuditEvent('delete', 'media', id, tenantId, user.id, { filename: item.filename })

  return NextResponse.json({ success: true })
}
