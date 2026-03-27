'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const primaryLinks = [
  { href: '/inbox', label: 'Inbox' },
  { href: '/contacts', label: 'Contacts' },
  { href: '/templates', label: 'Templates' },
  { href: '/settings', label: 'Settings' },
];

export function AppSidebar({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="flex h-14 items-center border-b border-neutral-200 px-4">
        <Link href="/" className="font-semibold text-neutral-900">
          LaunchRamp
        </Link>
      </div>
      <nav className="flex flex-col gap-0.5 p-2">
        {primaryLinks.map((link) => {
          const active =
            link.href === '/inbox'
              ? pathname.startsWith('/inbox')
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </aside>
  );
}
