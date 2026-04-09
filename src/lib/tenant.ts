import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function getTenantId(): Promise<string> {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized: No active session')
  }

  // super_admin มี tenant_id = NULL — ต้อง handle แยก
  const { data, error } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    throw new Error('User profile not found')
  }

  // super_admin ไม่มี tenant — caller ต้อง handle กรณีนี้เอง
  if (!data.tenant_id) {
    throw new Error('Super admin must specify tenant context')
  }

  return data.tenant_id
}

// ใช้ใน API routes แทน getTenantId() เพื่อ return NextResponse แทน throw
export async function requireTenant(): Promise<string | NextResponse> {
  try {
    return await getTenantId()
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 },
      { status: 401 }
    )
  }
}
