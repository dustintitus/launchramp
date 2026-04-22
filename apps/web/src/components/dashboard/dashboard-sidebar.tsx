'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  IconAnchor,
  IconCalendar,
  IconCog,
  IconMessages,
  IconSearch,
  IconUserCircle,
  IconUsers,
} from './dashboard-icons';

const items = [
  { href: '/dashboard', label: 'Bookings', icon: IconCalendar, match: (p: string) => p === '/dashboard' },
  { href: '/dashboard/microsoft-search', label: 'Microsoft 365', icon: IconSearch, match: (p: string) => p.startsWith('/dashboard/microsoft-search') },
  { href: '/inbox', label: 'Messages', icon: IconMessages, match: (p: string) => p.startsWith('/inbox') },
  { href: '/dashboard/staff', label: 'Staff', icon: IconUsers, match: (p: string) => p.startsWith('/dashboard/staff') },
  { href: '/dashboard/vehicles', label: 'Service vehicles', icon: IconCog, match: (p: string) => p.startsWith('/dashboard/vehicles') },
  { href: '/dashboard/profile', label: 'Profile', icon: IconAnchor, match: (p: string) => p.startsWith('/dashboard/profile') },
  { href: '/contacts', label: 'Contacts', icon: IconUserCircle, match: (p: string) => p.startsWith('/contacts') },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data } = useSession();
  const isAdmin = data?.user?.role === 'ADMIN';

  return (
    <aside className="flex w-[72px] shrink-0 flex-col items-center border-r border-white/10 bg-dashboard-navy py-6">
      <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-full bg-sky-200/30 ring-2 ring-sky-300/40" aria-hidden>
        <span className="text-lg text-white/90">●</span>
      </div>
      <nav className="flex flex-1 flex-col items-center gap-1">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                'relative flex h-12 w-12 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white',
                active && 'bg-white/10 text-white'
              )}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r bg-dashboard-coral"
                  aria-hidden
                />
              )}
              <Icon className="h-6 w-6" />
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/dashboard/admin/users"
            title="Admin"
            className={cn(
              'relative flex h-12 w-12 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white',
              pathname.startsWith('/dashboard/admin') && 'bg-white/10 text-white'
            )}
          >
            {pathname.startsWith('/dashboard/admin') && (
              <span
                className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r bg-dashboard-coral"
                aria-hidden
              />
            )}
            <IconCog className="h-6 w-6" />
          </Link>
        )}
      </nav>
    </aside>
  );
}
