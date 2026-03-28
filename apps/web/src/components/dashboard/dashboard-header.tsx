'use client';

import Link from 'next/link';
import { IconBell } from './dashboard-icons';

export function DashboardHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-dashboard-navy px-4 md:px-6">
      <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 rounded border border-white/80 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
          LR
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold tracking-wide text-white">LAUNCH RAMP</p>
          <p className="hidden truncate text-[10px] font-medium uppercase tracking-[0.12em] text-white/60 sm:block">
            Customer service management
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative rounded-lg p-2 text-white/85 transition-colors hover:bg-white/10"
          aria-label="Notifications"
        >
          <IconBell className="h-5 w-5" />
          <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white">
            3
          </span>
        </button>
        <div className="h-8 w-px bg-white/15" aria-hidden />
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white ring-1 ring-white/20"
          aria-hidden
        >
          U
        </div>
      </div>
    </header>
  );
}
