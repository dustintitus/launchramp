'use client';

import useSWR from 'swr';

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err?.error === 'string' ? err.error : 'Request failed');
  }
  return res.json();
}

type StaffRow = {
  id: string;
  name: string;
  role: string;
  license: string | null;
  availability: number | null;
  status: 'na' | 'pick_up' | 'available' | 'on_job';
};

function StaffStatusBadge({ status }: { status: StaffRow['status'] }) {
  const config: Record<
    StaffRow['status'],
    { label: string; className: string }
  > = {
    na: { label: 'N/A', className: 'bg-red-600 text-white' },
    pick_up: { label: 'PICK UP', className: 'bg-purple-600 text-white' },
    available: { label: 'AVAILABLE', className: 'bg-emerald-500 text-white' },
    on_job: { label: 'ON JOB', className: 'bg-dashboard-navy text-white' },
  };
  const c = config[status];
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${c.className}`}
    >
      {c.label}
    </span>
  );
}

export function StaffPageView() {
  const { data, error, isLoading } = useSWR<{ staff: StaffRow[] }>(
    '/api/dashboard/staff',
    fetchJSON
  );

  const staff = data?.staff ?? [];

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold tracking-tight text-dashboard-navy md:text-4xl">STAFF</h1>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error.message}</p>
      )}
      <div className="mt-8 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-6 py-4">Name</th>
              <th className="px-4 py-4">Role</th>
              <th className="px-4 py-4">License</th>
              <th className="px-4 py-4">Availability</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && !data ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : (
              staff.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-800">
                        {s.name.slice(0, 1)}
                      </span>
                      <span className="font-medium text-slate-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{s.role}</td>
                  <td className="px-4 py-4 font-medium text-slate-800">{s.license ?? '—'}</td>
                  <td className="px-4 py-4">
                    <span className="font-semibold text-dashboard-coral tabular-nums">
                      {s.availability != null ? s.availability : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StaffStatusBadge status={s.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!isLoading && staff.length === 0 && (
          <p className="px-6 py-12 text-center text-slate-500">No staff members yet.</p>
        )}
      </div>
    </div>
  );
}
