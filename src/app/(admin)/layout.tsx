import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileSidebar } from '@/components/layout/mobile-sidebar'
import { TenantSwitcher } from '@/components/layout/tenant-switcher'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select(`
      role,
      tenant_id,
      tenants (
        name,
        enabled_features
      )
    `)
    .eq('id', user.id)
    .single()

  const isSuperAdmin = profile?.role === 'super_admin'
  const enabledFeatures =
    (profile?.tenants as { name: string; enabled_features: string[] } | null)
      ?.enabled_features ?? []
  const currentTenantName =
    (profile?.tenants as { name: string } | null)?.name

  // super_admin: active tenant จาก cookie
  const cookieStore = await cookies()
  const activeTenantId = cookieStore.get('active_tenant_id')?.value

  const tenantSwitcherSlot = (
    <TenantSwitcher
      isSuperAdmin={isSuperAdmin}
      activeTenantId={activeTenantId}
      currentTenantName={currentTenantName}
    />
  )

  const sidebarProps = {
    user: { email: user.email!, role: profile?.role ?? 'editor' },
    enabledFeatures,
    isSuperAdmin,
    tenantSwitcherSlot,
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop + Tablet sidebar (md and up) */}
      <div className="hidden md:flex shrink-0">
        <Sidebar {...sidebarProps} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex md:hidden items-center h-14 px-4 border-b border-border bg-background shrink-0">
          <MobileSidebar {...sidebarProps} />
          <span className="ml-3 text-sm font-semibold">Best Solutions</span>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
