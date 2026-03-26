import { prisma } from '@launchramp/db';
import { getProvider } from '../providers/provider-router';
import type { MessageDirection, MessageStatus, Message as DbMessage } from '@prisma/client';
import type { ChannelType } from '@launchramp/shared';
import type { MessageResponseDto } from '@launchramp/shared';

export function toMessageResponseDto(message: DbMessage): MessageResponseDto {
  return {
    id: message.id,
    conversationId: message.conversationId,
    body: message.body,
    direction: message.direction,
    channelType: message.channelType,
    status: message.status,
    providerMessageId: message.providerMessageId,
    mediaUrls: message.mediaUrls,
    createdAt: message.createdAt.toISOString(),
  };
}

export async function createMessage(params: {
  conversationId: string;
  body: string;
  direction: MessageDirection;
  channelType: ChannelType;
  providerMessageId?: string;
  mediaUrls?: string[];
  status?: MessageStatus;
}) {
  return prisma.message.create({
    data: {
      conversationId: params.conversationId,
      body: params.body,
      direction: params.direction,
      channelType: params.channelType,
      providerMessageId: params.providerMessageId,
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
  const from = config?.phoneNumber ?? conv.channelAccount.phoneNumber ?? '';

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
    providerMessageId: result.providerMessageId,
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
  providerMessageId: string,
  status: MessageStatus
) {
  return prisma.message.updateMany({
    where: { providerMessageId },
    data: { status },
  });
}
