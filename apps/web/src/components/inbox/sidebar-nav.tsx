'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { InboxStats } from '@/types';

const views = [
  { label: 'All', href: '/inbox', params: {} },
  { label: 'Assigned to me', href: '/inbox', params: { assignedTo: 'me' } },
  { label: 'Unassigned', href: '/inbox', params: { unassigned: 'true' } },
];

export function SidebarNav({ unreadCount, stats }: { unreadCount?: number; stats?: InboxStats }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav className="flex flex-col gap-1 p-2">
      <h2 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Inbox
      </h2>
      {views.map((view) => {
        const currentParams = Object.fromEntries(searchParams.entries());
        const isActive =
          pathname === view.href &&
          Object.entries(view.params).every(
            ([k, v]) => currentParams[k] === String(v)
          );

        const params = Object.fromEntries(
          Object.entries(view.params).filter(
            (entry): entry is [string, string] =>
              entry[1] !== undefined && entry[1] !== ''
          )
        );
        const href =
          Object.keys(params).length > 0
            ? `${view.href}?${new URLSearchParams(params).toString()}`
            : view.href;

        return (
          <Link
            key={view.label}
            href={href}
            className={cn(
              'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-neutral-100 text-neutral-900'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            )}
          >
            {view.label}
            {view.label === 'All' && (unreadCount ?? 0) > 0 && (
              <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white">
                {unreadCount}
              </span>
            )}
          </Link>
        );
      })}
      {/* Quick stats */}
      {stats && (
        <div className="mt-4 border-t border-neutral-100 px-3 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Quick stats
          </p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Total</span>
              <span className="font-medium tabular-nums text-neutral-900">{stats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Unread</span>
              <span className="font-medium tabular-nums text-neutral-900">{stats.unread}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Unassigned</span>
              <span className="font-medium tabular-nums text-neutral-900">{stats.unassigned}</span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
