import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session.user;
}

export async function getCurrentOrgId(): Promise<string> {
  const user = await requireUser();
  return user.organizationId;
}

export async function getCurrentUserId(): Promise<string> {
  const user = await requireUser();
  return user.id;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }
  return user;
}
