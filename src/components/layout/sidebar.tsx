'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/app/(auth)/logout/actions'
import { buildMenuSections } from '@/lib/sidebar-menu'

export type SidebarProps = {
  user: { email: string; role: string }
  enabledFeatures: string[]
  isSuperAdmin: boolean
  tenantSwitcherSlot?: React.ReactNode
}

const linkClasses = (active: boolean, collapsed: boolean) =>
  cn(
    'flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors min-h-11',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    collapsed && 'justify-center',
    active
      ? 'bg-white/10 text-sidebar-active font-medium'
      : 'text-sidebar-text hover:bg-white/5 hover:text-sidebar-active'
  )

type SidebarItemProps = {
  label: string
  href: string
  icon: React.ElementType
  active: boolean
  collapsed: boolean
}

function SidebarItem({
  label,
  href,
  icon: Icon,
  active,
  collapsed,
}: SidebarItemProps) {
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href={href}
              className={linkClasses(active, collapsed)}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
            />
          }
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Link
      href={href}
      className={linkClasses(active, false)}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  )
}

export function Sidebar({ user, enabledFeatures, isSuperAdmin, tenantSwitcherSlot }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const menuSections = buildMenuSections(enabledFeatures, isSuperAdmin)

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-sidebar-bg border-r border-sidebar-border transition-all duration-200',
        collapsed ? 'w-14' : 'w-60'
      )}
      aria-label="เมนูหลัก"
    >
      {/* Header / Logo */}
      <div
        className={cn(
          'flex items-center h-14 px-3 border-b border-sidebar-border shrink-0',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!collapsed && (
          <span className="text-sm font-semibold text-sidebar-active tracking-wide truncate">
            Best Solutions
          </span>
        )}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className={cn(
            'flex items-center justify-center rounded-md text-sidebar-muted hover:text-sidebar-active hover:bg-white/5 transition-colors min-h-11 min-w-11',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
          aria-label={collapsed ? 'ขยาย sidebar' : 'ย่อ sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Tenant Switcher Slot */}
      {tenantSwitcherSlot && (
        <div className="border-b border-sidebar-border shrink-0">
          {tenantSwitcherSlot}
        </div>
      )}

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-4 px-2" aria-label="เมนูนำทาง">
        {menuSections.map((group) => {
          const visibleItems = group.items.filter((i) => i.show)
          if (visibleItems.length === 0) return null
          return (
            <div key={group.section} className="mb-6">
              {!collapsed && (
                <p className="px-2 mb-1 text-[10px] font-semibold tracking-widest text-sidebar-muted uppercase select-none">
                  {group.section}
                </p>
              )}
              <ul className="space-y-0.5" role="list">
                {visibleItems.map((item) => (
                  <li key={item.href}>
                    <SidebarItem
                      label={item.label}
                      href={item.href}
                      icon={item.icon}
                      active={
                        item.href === '/'
                          ? pathname === '/'
                          : pathname.startsWith(item.href)
                      }
                      collapsed={collapsed}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* User profile + logout */}
      <div className="border-t border-sidebar-border p-2 shrink-0">
        {!collapsed && (
          <div className="px-2 py-1 mb-1">
            <p className="text-xs text-sidebar-text truncate">{user.email}</p>
            <Badge
              variant="outline"
              className="mt-1 text-[10px] text-sidebar-muted border-sidebar-border"
            >
              {user.role}
            </Badge>
          </div>
        )}
        <form action={logoutAction}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="submit"
                    className={cn(
                      'flex items-center justify-center w-full rounded-md px-2 py-2 text-sm',
                      'text-sidebar-text hover:text-sidebar-active hover:bg-white/5 transition-colors min-h-11',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    )}
                    aria-label="ออกจากระบบ"
                  />
                }
              >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent side="right">ออกจากระบบ</TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="submit"
              className={cn(
                'flex items-center gap-2 w-full rounded-md px-2 py-2 text-sm',
                'text-sidebar-text hover:text-sidebar-active hover:bg-white/5 transition-colors min-h-11',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
              aria-label="ออกจากระบบ"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>ออกจากระบบ</span>
            </button>
          )}
        </form>
      </div>
    </aside>
  )
}
