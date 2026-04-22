import { prisma } from '@launchramp/db';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export const metadata = {
  title: 'Admin users | Launch Ramp',
};

async function getUsers(orgId: string) {
  return prisma.user.findMany({
    where: { organizationId: orgId },
    orderBy: [{ role: 'desc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      disabled: true,
      createdAt: true,
    },
  });
}

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const users = await getUsers(admin.organizationId);

  async function setRole(formData: FormData) {
    'use server';
    const admin = await requireAdmin();
    const userId = String(formData.get('userId') ?? '');
    const role = String(formData.get('role') ?? '');
    if (!userId || (role !== 'USER' && role !== 'ADMIN')) return;
    if (userId === admin.id) return;
    await prisma.user.update({
      where: { id: userId },
      data: { role: role as 'USER' | 'ADMIN' },
    });
    revalidatePath('/dashboard/admin/users');
  }

  async function toggleDisabled(formData: FormData) {
    'use server';
    const admin = await requireAdmin();
    const userId = String(formData.get('userId') ?? '');
    if (!userId) return;
    if (userId === admin.id) return;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.organizationId !== admin.organizationId) return;
    await prisma.user.update({
      where: { id: userId },
      data: { disabled: !user.disabled },
    });
    revalidatePath('/dashboard/admin/users');
  }

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage access for your organization.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <div className="col-span-5">User</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        <ul className="divide-y divide-slate-100">
          {users.map((u) => (
            <li key={u.id} className="grid grid-cols-12 items-center px-4 py-3">
              <div className="col-span-5 min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {u.name ?? u.email}
                </p>
                <p className="truncate text-xs text-slate-500">{u.email}</p>
              </div>

              <div className="col-span-2">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                  {u.role}
                </span>
              </div>

              <div className="col-span-2">
                <span
                  className={
                    u.disabled
                      ? 'inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700'
                      : 'inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700'
                  }
                >
                  {u.disabled ? 'Disabled' : 'Active'}
                </span>
              </div>

              <div className="col-span-3 flex justify-end gap-2">
                <form action={setRole}>
                  <input type="hidden" name="userId" value={u.id} />
                  <input type="hidden" name="role" value={u.role === 'ADMIN' ? 'USER' : 'ADMIN'} />
                  <button
                    type="submit"
                    disabled={u.id === admin.id}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Make {u.role === 'ADMIN' ? 'user' : 'admin'}
                  </button>
                </form>

                <form action={toggleDisabled}>
                  <input type="hidden" name="userId" value={u.id} />
                  <button
                    type="submit"
                    disabled={u.id === admin.id}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {u.disabled ? 'Enable' : 'Disable'}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

