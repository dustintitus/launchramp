import { prisma } from '@launchramp/db';

export async function listUsersByOrganization(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId },
    orderBy: [{ name: 'asc' }, { email: 'asc' }],
    select: { id: true, name: true, email: true },
  });
}
