import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function getTenantId(): Promise<string> {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized: No active session')
  }

  const { data, error } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    throw new Error('User profile not found')
  }

  if (data.role === 'super_admin') {
    // super_admin เลือก active tenant ผ่าน TenantSwitcher → เก็บใน cookie
    const cookieStore = await cookies()
    const activeTenantId = cookieStore.get('active_tenant_id')?.value
    if (!activeTenantId) {
      throw new Error('SUPER_ADMIN_NO_TENANT_SELECTED')
    }
    return activeTenantId
  }

  if (!data.tenant_id) {
    throw new Error('Super admin must specify tenant context')
  }

  return data.tenant_id
}

// ใช้ใน API routes แทน getTenantId() เพื่อ return NextResponse แทน throw
export async function requireTenant(): Promise<string | NextResponse> {
  try {
    return await getTenantId()
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    if (message === 'SUPER_ADMIN_NO_TENANT_SELECTED') {
      return NextResponse.json(
        { error: 'No tenant selected', code: 'TENANT_NOT_SELECTED', status: 400 },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 },
      { status: 401 }
    )
  }
}
