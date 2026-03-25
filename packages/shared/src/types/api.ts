import type {
  ChannelType,
  MessageDirection,
  MessageStatus,
  LifecycleStage,
  ActivityType,
} from './enums';

export interface ContactCreate {
  phone: string;
  name?: string;
  email?: string;
  organizationId: string;
}

export interface ContactUpdate {
  name?: string;
  email?: string;
  stage?: LifecycleStage;
  ownerId?: string | null;
  tags?: string[];
}

export interface MessageCreate {
  conversationId: string;
  body: string;
  direction: MessageDirection;
  channelType: ChannelType;
  externalId?: string;
  mediaUrls?: string[];
}

export interface MessageSendPayload {
  to: string;
  body: string;
  channelAccountId: string;
  mediaUrls?: string[];
}

export interface ActivityCreate {
  organizationId: string;
  contactId: string;
  type: ActivityType;
  metadata?: Record<string, unknown>;
  messageId?: string;
}

export interface InboundWebhookPayload {
  from: string;
  to: string;
  body: string;
  externalId: string;
  channelType: ChannelType;
  mediaUrls?: string[];
}

export interface StatusWebhookPayload {
  externalId: string;
  status: MessageStatus;
}
