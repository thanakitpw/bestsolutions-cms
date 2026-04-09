'use client'

import { useTransition } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { switchTenantAction } from '@/app/(admin)/actions'

type Tenant = { id: string; name: string; slug: string }

type Props = {
  tenants: Tenant[]
  activeTenantId?: string
}

export function TenantSwitcherUI({ tenants, activeTenantId }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSelect(value: string | null) {
    if (!value) return
    startTransition(async () => {
      await switchTenantAction(value)
    })
  }

  return (
    <div className="px-3 py-2">
      <p className="text-xs text-sidebar-muted uppercase tracking-widest mb-1">Tenant</p>
      <Select
        value={activeTenantId ?? ''}
        onValueChange={handleSelect}
        disabled={isPending}
      >
        <SelectTrigger className="w-full h-8 text-sm bg-transparent border-sidebar-border text-sidebar-text focus:ring-0 focus:ring-offset-0">
          <SelectValue placeholder="เลือก Tenant..." />
        </SelectTrigger>
        <SelectContent>
          {tenants.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
              <span className="ml-1 text-xs text-muted-foreground">({t.slug})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
