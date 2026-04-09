'use client'

import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar, type SidebarProps } from './sidebar'

export function MobileSidebar(props: SidebarProps) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <button
            className="flex items-center justify-center rounded-md min-h-11 min-w-11 text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="เปิดเมนู"
          />
        }
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 w-60 bg-sidebar-bg border-sidebar-border"
      >
        <Sidebar {...props} />
      </SheetContent>
    </Sheet>
  )
}
