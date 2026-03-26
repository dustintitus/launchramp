import type { MessageStatus } from './enums';

export interface MessagingProvider {
  sendMessage(params: SendMessageParams): Promise<SendMessageResult>;
  parseInboundWebhook(payload: unknown): InboundWebhookResult;
  parseStatusWebhook(payload: unknown): StatusWebhookResult;
}

export interface SendMessageParams {
  to: string;
  body: string;
  /** E.164 sender when not using a Twilio Messaging Service */
  from: string;
  mediaUrls?: string[];
}

export interface SendMessageResult {
  providerMessageId: string;
  status: MessageStatus;
}

export interface InboundWebhookResult {
  from: string;
  to: string;
  body: string;
  providerMessageId: string;
  mediaUrls?: string[];
}

export interface StatusWebhookResult {
  providerMessageId: string;
  status: MessageStatus;
}
