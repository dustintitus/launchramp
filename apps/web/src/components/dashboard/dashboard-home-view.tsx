'use client';

import Link from 'next/link';
import useSWR from 'swr';

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err?.error === 'string' ? err.error : 'Request failed');
  }
  return res.json();
}

type Summary = { marinaName: string; newBookingsCount: number };
type BookingRow = {
  id: string;
  orderNumber: string;
  service: string;
  scheduledAt: string;
  status: 'pending' | 'ready' | 'complete';
};
type StaffRow = {
  id: string;
  name: string;
  role: string;
  status: 'na' | 'pick_up' | 'available' | 'on_job';
};
type Breakdown = { service: string; count: number }[];

function BookingStatusBadge({ status }: { status: BookingRow['status'] }) {
  const styles: Record<BookingRow['status'], string> = {
    pending: 'bg-[#8e44ad] text-white',
    ready: 'bg-[#2ecc71] text-white',
    complete: 'bg-dashboard-navy text-white',
  };
  const labels: Record<BookingRow['status'], string> = {
    pending: 'PENDING',
    ready: 'READY',
    complete: 'COMPLETE',
  };
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function StaffStatusDot({ status }: { status: StaffRow['status'] }) {
  if (status === 'available') {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600" title="Available">
        ✓
      </span>
    );
  }
  if (status === 'na' || status === 'pick_up' || status === 'on_job') {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-red-600" title="Busy">
        !
      </span>
    );
  }
  return null;
}

function ServiceDonut({ breakdown }: { breakdown: Breakdown }) {
  const total = breakdown.reduce((s, x) => s + x.count, 0) || 1;
  const palette = ['#0f766e', '#2dd4bf', '#94a3b8'];
  let acc = 0;
  const parts = breakdown.map((b, i) => {
    const pct = (b.count / total) * 100;
    const from = acc;
    acc += pct;
    return `${palette[i % palette.length]} ${from}% ${acc}%`;
  });
  const gradient = `conic-gradient(${parts.join(', ')})`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative h-36 w-36 rounded-full"
        style={{ background: gradient }}
      >
        <div className="absolute inset-[22%] rounded-full bg-app-canvas" />
      </div>
      <ul className="w-full space-y-2 text-sm text-slate-700">
        {breakdown.map((b, i) => (
          <li key={b.service} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: palette[i % palette.length] }}
              />
              {b.service}
            </span>
            <span className="tabular-nums font-medium">{b.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DashboardHomeView() {
  const { data: summary, error: summaryErr } = useSWR<Summary>(
    '/api/dashboard/summary',
    fetchJSON
  );
  const { data: bookingsData } = useSWR<{ bookings: BookingRow[] }>(
    '/api/dashboard/bookings?limit=8',
    fetchJSON
  );
  const { data: staffData } = useSWR<{ staff: StaffRow[] }>(
    '/api/dashboard/staff',
    fetchJSON
  );
  const { data: breakdownData } = useSWR<{ breakdown: Breakdown }>(
    '/api/dashboard/service-breakdown',
    fetchJSON
  );

  const bookings = bookingsData?.bookings ?? [];
  const staff = (staffData?.staff ?? []).slice(0, 5);
  const breakdown = breakdownData?.breakdown ?? [];

  const formatWhen = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    };
  };

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-dashboard-navy md:text-4xl">
          DASHBOARD
        </h1>
        {summaryErr ? (
          <p className="mt-2 text-sm text-red-600">Could not load marina name.</p>
        ) : (
          <p className="mt-2 text-slate-600">
            Welcome back{' '}
            <span className="font-semibold text-dashboard-navy">{summary?.marinaName ?? '…'}</span>
            , you have{' '}
            <span className="font-semibold text-teal-600">
              {summary?.newBookingsCount ?? 0} new booking
              {(summary?.newBookingsCount ?? 0) === 1 ? '' : 's'}!
            </span>
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Bookings
            </h2>
            <Link
              href="/dashboard"
              className="text-xs font-semibold uppercase tracking-wide text-teal-700 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4">Order number</th>
                  <th className="pb-3 pr-4">Service</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Time</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const { date, time } = formatWhen(b.scheduledAt);
                  return (
                    <tr key={b.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-slate-800">{b.orderNumber}</td>
                      <td className="py-3 pr-4 text-slate-700">{b.service}</td>
                      <td className="py-3 pr-4 text-slate-600">{date}</td>
                      <td className="py-3 pr-4 text-slate-600">{time}</td>
                      <td className="py-3">
                        <BookingStatusBadge status={b.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {bookings.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">No bookings yet.</p>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Staff
            </h2>
            <ul className="space-y-4">
              {staff.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.role}</p>
                  </div>
                  <StaffStatusDot status={s.status} />
                </li>
              ))}
            </ul>
            {staff.length === 0 && (
              <p className="text-sm text-slate-500">No staff yet.</p>
            )}
            <Link
              href="/dashboard/staff"
              className="mt-4 inline-block text-xs font-semibold uppercase tracking-wide text-teal-700 hover:underline"
            >
              View staff
            </Link>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Service mix
            </h2>
            {breakdown.length > 0 ? (
              <ServiceDonut breakdown={breakdown} />
            ) : (
              <p className="text-sm text-slate-500">No data yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
