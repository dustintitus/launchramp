import type {
  MessagingProvider,
  SendMessageParams,
  SendMessageResult,
  InboundWebhookResult,
  StatusWebhookResult,
} from '@launchramp/shared';
import type { MessageStatus } from '@prisma/client';
import Twilio from 'twilio';

const TWILIO_STATUS_MAP: Record<string, MessageStatus> = {
  queued: 'queued',
  sent: 'sent',
  delivered: 'delivered',
  failed: 'failed',
  undelivered: 'failed',
};

export function createTwilioProvider(): MessagingProvider {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required');
  }

  const client = Twilio(accountSid, authToken);

  return {
    async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
      const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

      const messageParams = {
        to: params.to,
        body: params.body,
        from: messagingServiceSid ?? params.from,
        ...(params.mediaUrls?.length && { mediaUrl: params.mediaUrls }),
      };

      const message = await client.messages.create(messageParams);

      return {
        externalId: message.sid,
        status: (TWILIO_STATUS_MAP[message.status] ?? 'queued') as MessageStatus,
      };
    },

    parseInboundWebhook(payload: unknown): InboundWebhookResult {
      const p = payload as Record<string, string | undefined>;
      const from = p.From ?? p.from ?? '';
      const to = p.To ?? p.to ?? '';
      const body = p.Body ?? p.body ?? p.MessageBody ?? '';
      const sid = p.MessageSid ?? p.SmsSid ?? '';

      return {
        from,
        to,
        body,
        externalId: sid,
        mediaUrls: p.NumMedia ? [...Array(parseInt(p.NumMedia ?? '0', 10))].map((_, i) => p[`MediaUrl${i}`] ?? '').filter(Boolean) : undefined,
      };
    },

    parseStatusWebhook(payload: unknown): StatusWebhookResult {
      const p = payload as Record<string, string>;
      const sid = p.MessageSid ?? p.SmsSid ?? '';
      const status = p.MessageStatus ?? p.SmsStatus ?? 'queued';

      return {
        externalId: sid,
        status: (TWILIO_STATUS_MAP[status] ?? 'queued') as MessageStatus,
      };
    },
  };
}
