import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export type UserRole = 'super_admin' | 'admin' | 'editor'

export async function requireAuth() {
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 },
        { status: 401 }
      ),
    }
  }
  return { user, response: null }
}

export async function requireRole(minimumRole: UserRole) {
  const { user, response } = await requireAuth()
  if (response) return { user: null, response }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user!.id)
    .single()

  if (error || !data) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN', status: 403 },
        { status: 403 }
      ),
    }
  }

  const roleHierarchy: UserRole[] = ['editor', 'admin', 'super_admin']
  const userRoleIndex = roleHierarchy.indexOf(data.role as UserRole)
  const requiredIndex = roleHierarchy.indexOf(minimumRole)

  if (userRoleIndex < requiredIndex) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Forbidden', code: 'INSUFFICIENT_ROLE', status: 403 },
        { status: 403 }
      ),
    }
  }

  return { user: { ...user!, role: data.role as UserRole }, response: null }
}

// ใช้ใน Server Component pages (redirect แทน return NextResponse)
// ห้ามแก้ไข requireRole() เดิม — ใช้ใน API routes
export async function assertRole(minimumRole: UserRole): Promise<void> {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const roleHierarchy: UserRole[] = ['editor', 'admin', 'super_admin']
  const userRoleIndex = roleHierarchy.indexOf(data?.role as UserRole ?? 'editor')
  const requiredIndex = roleHierarchy.indexOf(minimumRole)

  if (userRoleIndex < requiredIndex) {
    redirect('/')
  }
}
