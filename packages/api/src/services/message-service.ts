import { prisma } from '@launchramp/db';
import { getProvider } from '../providers/provider-router';
import type { MessageDirection } from '@prisma/client';
import type { ChannelType } from '@launchramp/shared';

export async function createMessage(params: {
  conversationId: string;
  body: string;
  direction: MessageDirection;
  channelType: ChannelType;
  externalId?: string;
  mediaUrls?: string[];
  status?: 'queued' | 'sent' | 'delivered' | 'failed';
}) {
  return prisma.message.create({
    data: {
      conversationId: params.conversationId,
      body: params.body,
      direction: params.direction,
      channelType: params.channelType,
      externalId: params.externalId,
      mediaUrls: params.mediaUrls ?? [],
      status: params.status ?? 'queued',
    },
  });
}

export async function sendOutboundMessage(params: {
  conversationId: string;
  body: string;
  mediaUrls?: string[];
}) {
  const conv = await prisma.conversation.findUnique({
    where: { id: params.conversationId },
    include: {
      contact: true,
      channelAccount: true,
    },
  });

  if (!conv) throw new Error('Conversation not found');

  const config = conv.channelAccount.config as { phoneNumber?: string } | null;
  const from = config?.phoneNumber ?? conv.channelAccount.phoneNumber;
  if (!from) throw new Error('No sender phone number configured');

  const provider = getProvider(conv.channelType);
  const result = await provider.sendMessage({
    to: conv.contact.phone,
    body: params.body,
    from,
    mediaUrls: params.mediaUrls,
  });

  const message = await createMessage({
    conversationId: params.conversationId,
    body: params.body,
    direction: 'outbound',
    channelType: conv.channelType,
    externalId: result.externalId,
    mediaUrls: params.mediaUrls,
    status: result.status,
  });

  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: {
      lastMessageAt: new Date(),
      isUnread: false,
    },
  });

  return message;
}

export async function updateMessageStatus(
  externalId: string,
  status: 'queued' | 'sent' | 'delivered' | 'failed'
) {
  return prisma.message.updateMany({
    where: { externalId },
    data: { status },
  });
}
