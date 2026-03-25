import type { MessageStatus } from './enums';

export interface MessagingProvider {
  sendMessage(params: SendMessageParams): Promise<SendMessageResult>;
  parseInboundWebhook(payload: unknown): InboundWebhookResult;
  parseStatusWebhook(payload: unknown): StatusWebhookResult;
}

export interface SendMessageParams {
  to: string;
  body: string;
  from: string;
  mediaUrls?: string[];
}

export interface SendMessageResult {
  externalId: string;
  status: MessageStatus;
}

export interface InboundWebhookResult {
  from: string;
  to: string;
  body: string;
  externalId: string;
  mediaUrls?: string[];
}

export interface StatusWebhookResult {
  externalId: string;
  status: MessageStatus;
}
