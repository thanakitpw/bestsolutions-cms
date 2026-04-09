'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/admin'

export async function switchTenantAction(tenantId: string) {
  await assertRole('super_admin')

  // Validate tenant exists + is active
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('id', tenantId)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    throw new Error('Invalid or inactive tenant')
  }

  const cookieStore = await cookies()
  cookieStore.set('active_tenant_id', tenantId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 วัน
    path: '/',
  })

  revalidatePath('/', 'layout')
}
