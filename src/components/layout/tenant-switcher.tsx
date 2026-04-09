import { createServiceRoleClient } from '@/lib/supabase/admin'
import { TenantSwitcherUI } from './tenant-switcher-ui'

type Props = {
  isSuperAdmin: boolean
  activeTenantId?: string
  currentTenantName?: string
}

export async function TenantSwitcher({ isSuperAdmin, activeTenantId, currentTenantName }: Props) {
  if (!isSuperAdmin) {
    return (
      <div className="px-3 py-2">
        <p className="text-xs text-sidebar-muted uppercase tracking-widest mb-1">Tenant</p>
        <p className="text-sm font-medium text-sidebar-active truncate">
          {currentTenantName ?? 'Unknown'}
        </p>
      </div>
    )
  }

  const supabase = createServiceRoleClient()
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name')

  return (
    <TenantSwitcherUI
      tenants={tenants ?? []}
      activeTenantId={activeTenantId}
    />
  )
}
