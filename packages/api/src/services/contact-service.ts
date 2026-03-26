import { prisma } from '@launchramp/db';
import type { LifecycleStage } from '@prisma/client';
import type { ContactCreate, ContactUpdate } from '@launchramp/shared';

export async function findOrCreateContact(data: ContactCreate) {
  return upsertContactByPhone(data);
}

/**
 * Upsert a contact by `(organizationId, phone)` — used for inbound SMS so returning senders stay in sync.
 */
export async function upsertContactByPhone(data: ContactCreate) {
  return prisma.contact.upsert({
    where: {
      organizationId_phone: {
        organizationId: data.organizationId,
        phone: data.phone,
      },
    },
    create: {
      organizationId: data.organizationId,
      phone: data.phone,
      name: data.name,
      email: data.email,
    },
    update: {
      ...(data.name != null && data.name !== '' ? { name: data.name } : {}),
      ...(data.email != null && data.email !== '' ? { email: data.email } : {}),
    },
    include: {
      owner: true,
    },
  });
}

export async function getContactById(id: string, organizationId: string) {
  return prisma.contact.findFirst({
    where: { id, organizationId },
    include: {
      owner: true,
      _count: { select: { conversations: true } },
    },
  });
}

export async function updateContact(
  id: string,
  organizationId: string,
  data: ContactUpdate
) {
  return prisma.contact.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.stage !== undefined && { stage: data.stage }),
      ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
      ...(data.tags !== undefined && { tags: data.tags }),
    },
    include: {
      owner: true,
    },
  });
}

export async function listContacts(
  organizationId: string,
  opts?: {
    stage?: LifecycleStage;
    ownerId?: string | null;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  const where: Record<string, unknown> = { organizationId };

  if (opts?.stage) where.stage = opts.stage;
  if (opts?.ownerId !== undefined) where.ownerId = opts.ownerId;
  if (opts?.search) {
    where.OR = [
      { name: { contains: opts.search, mode: 'insensitive' } },
      { phone: { contains: opts.search } },
      { email: { contains: opts.search, mode: 'insensitive' } },
    ];
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: { owner: true },
      take: opts?.limit ?? 50,
      skip: opts?.offset ?? 0,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.contact.count({ where }),
  ]);

  return { contacts, total };
}
