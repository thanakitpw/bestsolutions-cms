'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState } from 'react';

interface NavItem {
  name: string;
  href: string;
  badge?: boolean;
  unread?: boolean;
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'General',
    items: [
      { name: 'Dashboard', href: '/' },
      { name: 'Analytics', href: '/analytics' },
    ],
  },
  {
    label: 'Content',
    items: [
      { name: 'Projects', href: '/projects', badge: true },
      { name: 'Blog', href: '/blog', badge: true },
      { name: 'Media', href: '/media' },
      { name: 'Pages', href: '/pages' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { name: 'Messages', href: '/messages', unread: true },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'Settings', href: '/settings' },
      { name: 'Team', href: '/settings/team' },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore network errors — proceed to redirect
    } finally {
      router.push('/login');
    }
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col justify-between bg-[#1A1A1A] px-5 py-7">
      <div className="flex flex-col gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white">
            <span className="text-[11px] font-bold text-[#1A1A1A]">TD</span>
          </div>
          <span className="text-base font-bold tracking-[0.04em]" style={{ color: '#fff' }}>
            TWO DESK
          </span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.06] px-3 py-2">
          <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Search...</span>
          <span className="ml-auto text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>⌘K</span>
        </div>

        {/* Nav sections */}
        <nav className="flex flex-col gap-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="flex flex-col gap-0.5">
              <span className="mb-1.5 px-2 text-[10px] uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {section.label}
              </span>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-[13px] transition-colors ${
                    isActive(item.href)
                      ? 'bg-white/[0.08]'
                      : 'hover:bg-white/[0.04]'
                  }`}
                  style={{ color: isActive(item.href) ? '#ffffff' : '#b0b0b0' }}
                >
                  {item.name}
                  {item.unread && (
                    <span className="rounded bg-[#C0392B] px-1.5 py-0.5 text-[10px]" style={{ color: '#fff' }}>
                      3
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </div>

      {/* User + Logout */}
      <div className="flex flex-col gap-2 border-t border-white/[0.08] pt-3">
        <div className="flex items-center gap-2.5 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-white/[0.12] text-xs font-bold" style={{ color: '#fff' }}>
              N
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-[13px]" style={{ color: '#fff' }}>Nut</span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Admin</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center rounded-lg px-3 py-2 text-[13px] transition-colors hover:bg-white/[0.04] disabled:opacity-50"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          {loggingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
