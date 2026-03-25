import { prisma } from '@launchramp/db';
import type { ActivityType } from '@prisma/client';

export async function createActivity(params: {
  organizationId: string;
  contactId: string;
  type: ActivityType;
  messageId?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.activity.create({
    data: {
      organizationId: params.organizationId,
      contactId: params.contactId,
      type: params.type,
      messageId: params.messageId,
      metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
    },
  });
}

export async function listActivities(
  contactId: string,
  organizationId: string,
  opts?: { limit?: number; offset?: number }
) {
  return prisma.activity.findMany({
    where: { contactId, organizationId },
    orderBy: { createdAt: 'desc' },
    take: opts?.limit ?? 50,
    skip: opts?.offset ?? 0,
  });
}
