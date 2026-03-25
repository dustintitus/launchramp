import { prisma } from '@launchramp/db';
import type { ChannelType } from '@prisma/client';

export async function listConversations(
  organizationId: string,
  opts?: {
    assignedToId?: string | null;
    unassignedOnly?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  const where: Record<string, unknown> = { organizationId };

  if (opts?.assignedToId !== undefined) {
    where.assignedToId = opts.assignedToId;
  }
  if (opts?.unassignedOnly) {
    where.assignedToId = null;
  }
  if (opts?.search) {
    where.contact = {
      OR: [
        { name: { contains: opts.search, mode: 'insensitive' } },
        { phone: { contains: opts.search } },
      ],
    };
  }

  const [conversations, total, unreadCount] = await Promise.all([
    prisma.conversation.findMany({
      where,
      include: {
        contact: { include: { owner: true } },
        assignedTo: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: opts?.limit ?? 50,
      skip: opts?.offset ?? 0,
    }),
    prisma.conversation.count({ where }),
    prisma.conversation.count({
      where: { ...where, isUnread: true },
    }),
  ]);

  return { conversations, total, unreadCount };
}

export async function getConversationById(
  id: string,
  organizationId: string
) {
  return prisma.conversation.findFirst({
    where: { id, organizationId },
    include: {
      contact: { include: { owner: true } },
      assignedTo: true,
      channelAccount: true,
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

export async function findOrCreateConversation(params: {
  organizationId: string;
  contactId: string;
  channelAccountId: string;
  channelType: ChannelType;
}) {
  const { organizationId, contactId, channelAccountId, channelType } = params;

  const existing = await prisma.conversation.findUnique({
    where: {
      organizationId_contactId_channelAccountId: {
        organizationId,
        contactId,
        channelAccountId,
      },
    },
    include: {
      contact: true,
      assignedTo: true,
      channelAccount: true,
    },
  });

  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      organizationId,
      contactId,
      channelAccountId,
      channelType,
    },
    include: {
      contact: true,
      assignedTo: true,
      channelAccount: true,
    },
  });
}

export async function assignConversation(
  id: string,
  organizationId: string,
  assignedToId: string | null
) {
  return prisma.conversation.update({
    where: { id },
    data: { assignedToId },
    include: {
      contact: true,
      assignedTo: true,
    },
  });
}

export async function markConversationRead(
  id: string,
  organizationId: string
) {
  return prisma.conversation.update({
    where: { id },
    data: { isUnread: false },
  });
}
