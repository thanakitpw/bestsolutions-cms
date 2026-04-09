import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { getTenantId } from '@/lib/tenant'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/validations/media'

// GET /api/media — list media items (tenant-scoped, paginated)
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
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100)
  const offset = Number(searchParams.get('offset') ?? 0)

  const { data, error, count } = await supabase
    .from('media_items')
    .select('id, filename, storage_path, public_url, mime_type, size, width, height, alt_text, created_at', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch media', code: 'DB_ERROR', status: 500 },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0, limit, offset })
}

// POST /api/media — upload file to Supabase Storage + insert media_items row
export async function POST(request: NextRequest) {
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

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json(
      { error: 'No file provided', code: 'NO_FILE', status: 400 },
      { status: 400 }
    )
  }

  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: 'File type not allowed', code: 'INVALID_MIME', status: 422 },
      { status: 422 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File too large (max 10MB)', code: 'FILE_TOO_LARGE', status: 422 },
      { status: 422 }
    )
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const uuid = crypto.randomUUID()
  const storagePath = `${tenantId}/${uuid}.${ext}`

  // Upload to Supabase Storage using service role (bypass Storage RLS)
  const adminClient = createServiceRoleClient()
  const arrayBuffer = await file.arrayBuffer()
  const { error: storageError } = await adminClient.storage
    .from('media')
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })

  if (storageError) {
    return NextResponse.json(
      { error: 'Upload failed', code: 'STORAGE_ERROR', status: 500 },
      { status: 500 }
    )
  }

  const { data: { publicUrl } } = adminClient.storage
    .from('media')
    .getPublicUrl(storagePath)

  const { data: item, error: dbError } = await supabase
    .from('media_items')
    .insert({
      tenant_id: tenantId,
      filename: file.name,
      storage_path: storagePath,
      public_url: publicUrl,
      mime_type: file.type,
      size: file.size,
    })
    .select()
    .single()

  if (dbError) {
    // Cleanup: remove file from storage if DB insert fails
    await adminClient.storage.from('media').remove([storagePath])
    return NextResponse.json(
      { error: 'Failed to save media record', code: 'DB_ERROR', status: 500 },
      { status: 500 }
    )
  }

  return NextResponse.json(item, { status: 201 })
}
